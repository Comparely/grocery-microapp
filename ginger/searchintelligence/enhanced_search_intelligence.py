import json
import redis
import time
import hashlib
import re
import string
from datetime import datetime, timedelta
from typing import Dict, List, Set, Optional, Tuple
from dataclasses import dataclass, asdict
from collections import defaultdict
from sentence_transformers import SentenceTransformer, util
from fuzzywuzzy import fuzz
import numpy as np
import os

@dataclass
class PendingMappingItem:
    id: str
    name: str
    brand: str
    mrp: float
    source: str
    weight: str
    deeplink: str
    image_url: str

@dataclass
class ProductMapping:
    source: PendingMappingItem
    match: PendingMappingItem
    similarity: float
    timestamp: str

@dataclass
class ProductCache:
    """Enhanced structure for product-level caching"""
    product_key: str  # productName:source
    mapped_products: List[dict]  # Store as dict for JSON serialization
    last_updated: str
    mapping_count: int
    queries_used_in: List[str]  # Track which queries this mapping appeared in

class TextUtils:
    """Enhanced text processing utilities for robust product matching"""
    
    @staticmethod
    def normalize_text(text: str) -> str:
        """Enhanced text normalization with better handling of special cases"""
        if not text:
            return ""
        # Convert to lowercase and remove extra whitespace
        text = text.lower().strip()
        # Remove punctuation but preserve spaces
        translator = str.maketrans('', '', string.punctuation)
        text = text.translate(translator)
        # Normalize multiple spaces to single space
        text = re.sub(r'\s+', ' ', text)
        return text
    
    @staticmethod
    def clean_product_name(name: str) -> str:
        """Clean product name for consistent matching"""
        name = TextUtils.normalize_text(name)
        # Remove common filler words and quantity info
        remove_patterns = [
            r'\d+\s*(ltr|ml|g|kg|litre|milliliter|pieces|piece|x\s*\d+)',
            r'\b\d+\b',
            r'\b(homogenised|homogenized|pasteurised|pasteurized)\b',
            r'\b(uht|tetra pack|tetra|carton|value pack|fresh)\b',
            r'\b(standardised|standardized)\b'
        ]
        
        for pattern in remove_patterns:
            name = re.sub(pattern, '', name)
        
        return re.sub(r'\s+', ' ', name).strip()
    
    @staticmethod
    def generate_product_key(name: str, source: str) -> str:
        """Generate consistent key for product-level caching"""
        cleaned_name = TextUtils.clean_product_name(name)
        # Create a hash for very long names to keep keys manageable
        if len(cleaned_name) > 50:
            name_hash = hashlib.md5(cleaned_name.encode()).hexdigest()[:8]
            cleaned_name = cleaned_name[:42] + name_hash
        return f"product:{cleaned_name}:{source}"

class EnhancedSearchIntelligence:
    """Improved search intelligence with product-level caching and cross-query reusability"""
    
    def __init__(self):
        redis_host = os.getenv("REDIS_HOST", "localhost")
        redis_port = int(os.getenv("REDIS_PORT", 6379))
        self.redis = redis.Redis(
            host=redis_host,
            port=redis_port,
            db=0,
            decode_responses=True,
        )
        self.model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')
        
        # Cache keys
        self.UNMAPPED_KEY_PREFIX = "unmapped:"
        self.PRODUCT_MAPPING_PREFIX = "product_mapping:"
        self.QUERY_MAPPING_PREFIX = "pending_mappings:"
        self.SIMILARITY_CACHE_PREFIX = "similarity:"
        
        # Configuration
        self.SIMILARITY_THRESHOLD = 0.75
        self.CACHE_EXPIRY = 7 * 24 * 3600  # 7 days
        self.MAX_MAPPINGS_PER_PRODUCT = 5

    # ---------------------- Text Normalization & Cleaning ---------------------- #
    def normalize_text(self, text):
        """Lowercase and remove punctuation and extra spaces."""
        return TextUtils.normalize_text(text)

    def remove_quantity_info(self, text):
        """Remove quantity/unit information like '1 ltr', '500 ml', 'pack of 3', etc."""
        text = re.sub(r'\d+\s*(ltr|ml|g|kg|litre|milliliter|pieces|piece|x\s*\d+)', '', text)
        text = re.sub(r'\b\d+\b', '', text)
        return text

    def synonym_replace(self, text):
        """Replace or remove domain-specific synonyms and filler words."""
        remove_terms = [
            "homogenised", "homogenized", "pasteurised", "pasteurized",
            "uht", "tetra pack", "tetra", "carton", "value pack", "fresh",
            "standardised", "standardized"
        ]
        for term in remove_terms:
            text = re.sub(r'\b' + re.escape(term) + r'\b', '', text)
        return text

    def clean_product_name(self, name):
        """Cleans a product name by normalizing text, removing quantity/unit info, and applying synonym replacement."""
        return TextUtils.clean_product_name(name)

    def composite_text(self, product):
        """Build composite text for matching by combining the cleaned product name and its MRP."""
        cleaned_name = self.clean_product_name(product['name'])
        return f"{cleaned_name} {product['mrp']}"

    # ------------------------- Enhanced Matching Helpers ------------------------- #
    def mrp_match(self, a: float, b: float, error: float = 4) -> bool:
        """Enhanced MRP matching with better tolerance handling"""
        if abs(a - b) <= error:
            return True
        smaller, larger = min(a, b), max(a, b)
        if smaller == 0:
            return False
        candidate_multiple = round(larger / smaller)
        return abs(candidate_multiple * smaller - larger) <= error

    def fuzzy_brand_match(self, brand1: str, brand2: str, threshold: int = 70) -> bool:
        """Enhanced brand matching with better normalization"""
        if not brand1 or not brand2:
            return False
        
        # Normalize brands
        b1 = TextUtils.normalize_text(brand1)
        b2 = TextUtils.normalize_text(brand2)
        
        # Check exact match first
        if b1 == b2:
            return True
            
        # Check if one brand is contained in another (for cases like "Amul" vs "Amul Dairy")
        if b1 in b2 or b2 in b1:
            return True
            
        # Fuzzy match
        score = fuzz.token_set_ratio(b1, b2)
        return score >= threshold

    # ------------------------- Product-Level Caching ------------------------- #
    def store_product_mapping(self, product_item: dict, mapped_items: List[dict], query: str):
        """Store product mapping at product level for cross-query reusability"""
        product_key = TextUtils.generate_product_key(product_item['name'], product_item['source'])
        
        # Get existing mappings
        existing_data = self.redis.get(self.PRODUCT_MAPPING_PREFIX + product_key)
        if existing_data:
            existing_cache = json.loads(existing_data)
        else:
            existing_cache = {
                'product_key': product_key,
                'mapped_products': [],
                'last_updated': datetime.now().isoformat(),
                'mapping_count': 0,
                'queries_used_in': []
            }
        
        # Add new mappings (avoid duplicates)
        existing_deeplinks = {item['deeplink'] for item in existing_cache['mapped_products']}
        new_items = [item for item in mapped_items if item['deeplink'] not in existing_deeplinks]
        
        if new_items:
            existing_cache['mapped_products'].extend(new_items)
            existing_cache['last_updated'] = datetime.now().isoformat()
            existing_cache['mapping_count'] += len(new_items)
            if query not in existing_cache['queries_used_in']:
                existing_cache['queries_used_in'].append(query)
            
            # Limit mappings to prevent unbounded growth
            if len(existing_cache['mapped_products']) > self.MAX_MAPPINGS_PER_PRODUCT:
                existing_cache['mapped_products'] = existing_cache['mapped_products'][-self.MAX_MAPPINGS_PER_PRODUCT:]
            
            # Store back to Redis
            self.redis.setex(
                self.PRODUCT_MAPPING_PREFIX + product_key,
                self.CACHE_EXPIRY,
                json.dumps(existing_cache)
            )
            
            print(f"📦 Stored {len(new_items)} new mappings for {product_key}")

    def get_product_mappings(self, product_name: str, source: str) -> List[dict]:
        """Retrieve existing mappings for a product from cache"""
        product_key = TextUtils.generate_product_key(product_name, source)
        cached_data = self.redis.get(self.PRODUCT_MAPPING_PREFIX + product_key)
        
        if cached_data:
            cache = json.loads(cached_data)
            return cache['mapped_products']
        return []

    def get_cross_query_mappings(self, products: List[dict]) -> Dict[str, List[dict]]:
        """Get mappings for products from existing cache (cross-query optimization)"""
        mappings = {}
        
        for product in products:
            if len(product.get('prices', [])) == 1:  # Only unmapped products
                source = product['prices'][0]['source']
                cached_mappings = self.get_product_mappings(product['name'], source)
                
                if cached_mappings:
                    key = f"{product['name']}:{source}"
                    mappings[key] = cached_mappings
                    print(f"🔄 Found {len(cached_mappings)} cached mappings for {product['name']} from {source}")
        
        return mappings

    # ------------------------- Enhanced Semantic Matching ------------------------- #
    def map_unmapped_products(self, unmapped_products: List[dict], query: str) -> List[dict]:
        """Enhanced product mapping with cross-query optimization"""
        if len(unmapped_products) < 2:
            print("Not enough unmapped products to match (need at least 2).")
            return []
        
        # First, check for existing mappings from cache
        cross_query_mappings = self.get_cross_query_mappings(unmapped_products)
        cached_mappings = []
        
        # Convert cached mappings to standard format
        for product in unmapped_products:
            if len(product.get('prices', [])) == 1:
                source = product['prices'][0]['source']
                key = f"{product['name']}:{source}"
                
                if key in cross_query_mappings:
                    for mapped_item in cross_query_mappings[key]:
                        # Create a mapping from cache
                        prod_variant = product['prices'][0]['variants'][0]
                        
                        cached_mapping = {
                            "source": {
                                "id": product['id'],
                                "name": product['name'],
                                "brand": product['brand'],
                                "mrp": product['mrp'],
                                "source": source,
                                "weight": prod_variant['weight'],
                                "deeplink": prod_variant['deeplink'],
                                "image_url": prod_variant.get('image_url', '')
                            },
                            "match": mapped_item,
                            "similarity": 0.9  # High confidence for cached mappings
                        }
                        cached_mappings.append(cached_mapping)
        
        print(f"🔄 Found {len(cached_mappings)} cached mappings for reuse")
        
        # Now do semantic matching for remaining unmapped products
        semantic_mappings = self._perform_semantic_matching(unmapped_products, query)
        
        # Combine cached and new mappings
        all_mappings = cached_mappings + semantic_mappings
        
        # Store new mappings at product level for future reuse
        self._store_new_mappings_for_reuse(semantic_mappings, query)
        
        return all_mappings

    def _perform_semantic_matching(self, unmapped_products: List[dict], query: str) -> List[dict]:
        """Perform semantic matching on products"""
        mappings = []
        processed_pairs = set()
        
        # Pre-compute embeddings for efficiency
        if len(unmapped_products) > 0:
            unmapped_texts = [self.composite_text(prod) for prod in unmapped_products]
            embeddings = self.model.encode(unmapped_texts, convert_to_tensor=True)
        
        for i, prod1 in enumerate(unmapped_products):
            for j, prod2 in enumerate(unmapped_products[i+1:], start=i+1):
                # Skip if same source
                if prod1['prices'][0]['source'] == prod2['prices'][0]['source']:
                    continue
                
                # Create pair key to avoid duplicate processing
                pair_key = tuple(sorted([prod1['id'], prod2['id']]))
                if pair_key in processed_pairs:
                    continue
                processed_pairs.add(pair_key)
                
                # Check brand and MRP compatibility
                if not self.fuzzy_brand_match(prod1['brand'], prod2['brand']):
                    continue
                    
                if not self.mrp_match(prod1['mrp'], prod2['mrp']):
                    continue
                
                # Calculate semantic similarity
                embedding1 = embeddings[i:i+1]
                embedding2 = embeddings[j:j+1]
                cosine_score = util.cos_sim(embedding1, embedding2)[0][0].item()
                
                if cosine_score >= self.SIMILARITY_THRESHOLD:
                    # Create mapping
                    prod1_variant = prod1['prices'][0]['variants'][0]
                    prod2_variant = prod2['prices'][0]['variants'][0]
                    
                    mapping = {
                        "source": {
                            "id": prod1['id'],
                            "name": prod1['name'],
                            "brand": prod1['brand'],
                            "mrp": prod1['mrp'],
                            "source": prod1['prices'][0]['source'],
                            "weight": prod1_variant['weight'],
                            "deeplink": prod1_variant['deeplink'],
                            "image_url": prod1_variant.get('image_url', '')
                        },
                        "match": {
                            "id": prod2['id'],
                            "name": prod2['name'],
                            "brand": prod2['brand'],
                            "mrp": prod2['mrp'],
                            "source": prod2['prices'][0]['source'],
                            "weight": prod2_variant['weight'],
                            "deeplink": prod2_variant['deeplink'],
                            "image_url": prod2_variant.get('image_url', '')
                        },
                        "similarity": round(cosine_score, 4)
                    }
                    
                    mappings.append(mapping)
        
        print(f"🔍 Generated {len(mappings)} new semantic mappings")
        return mappings

    def _store_new_mappings_for_reuse(self, mappings: List[dict], query: str):
        """Store new mappings at product level for future reuse"""
        for mapping in mappings:
            # Store mapping for source product
            self.store_product_mapping(mapping['source'], [mapping['match']], query)
            # Store reverse mapping for match product  
            self.store_product_mapping(mapping['match'], [mapping['source']], query)

    # ------------------------- Enhanced Worker Logic ------------------------- #
    def process_unmapped_from_redis(self, target_query: str) -> bool:
        """Enhanced processing with better error handling and statistics"""
        start_time = time.time()
        
        try:
            # Process the specific query
            unmapped_key = self.UNMAPPED_KEY_PREFIX + target_query
            unmapped_json = self.redis.get(unmapped_key)
            
            if not unmapped_json:
                print(f"❌ No unmapped products found for query '{target_query}'")
                return False
            
            unmapped_products = json.loads(unmapped_json)
            print(f"📥 Processing {len(unmapped_products)} unmapped products for query '{target_query}'")
            
            # Perform enhanced mapping
            mappings = self.map_unmapped_products(unmapped_products, target_query)
            
            if mappings:
                # Store in traditional format for backward compatibility
                query_mappings = {
                    "query": target_query,
                    "mappings": mappings
                }
                
                query_key = self.QUERY_MAPPING_PREFIX + target_query
                self.redis.setex(
                    query_key,
                    self.CACHE_EXPIRY,
                    json.dumps(query_mappings)
                )
                
                total_mappings = len(mappings)
                
                print(f"✅ Stored {total_mappings} mappings for query '{target_query}'")
                
                # Generate statistics
                cached_count = sum(1 for m in mappings if m['similarity'] == 0.9)
                semantic_count = total_mappings - cached_count
                
                print(f"📊 Mapping Statistics:")
                print(f"   • Cached mappings reused: {cached_count}")
                print(f"   • New semantic mappings: {semantic_count}")
                print(f"   • Processing time: {time.time() - start_time:.2f}s")
                
                return True
            else:
                print(f"ℹ️ No mappings found for query '{target_query}'")
                return False
                
        except Exception as e:
            print(f"❌ Error processing query '{target_query}': {str(e)}")
            return False

    def cleanup_old_mappings(self, max_age_days: int = 30):
        """Clean up old product mappings to prevent unbounded growth"""
        cutoff_date = datetime.now() - timedelta(days=max_age_days)
        pattern = self.PRODUCT_MAPPING_PREFIX + "*"
        
        cleaned_count = 0
        for key in self.redis.scan_iter(match=pattern):
            data = self.redis.get(key)
            if data:
                cache = json.loads(data)
                last_updated = datetime.fromisoformat(cache['last_updated'])
                
                if last_updated < cutoff_date:
                    self.redis.delete(key)
                    cleaned_count += 1
        
        print(f"🧹 Cleaned up {cleaned_count} old product mappings")

# Create the enhanced search intelligence instance
search_intelligence = EnhancedSearchIntelligence()
