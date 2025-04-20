import json
import redis
from sentence_transformers import SentenceTransformer, util
from fuzzywuzzy import fuzz
import re
import string
import numpy as np
import time
import os

class SearchIntelligence:
    def __init__(self):
        redis_host = os.getenv("REDIS_HOST", "localhost")
        redis_port = int(os.getenv("REDIS_PORT", 6379))
        self.redis = redis.Redis(
            host=redis_host,
            port=redis_port,
            db=0,
            decode_responses=True,
        )
    # ---------------------- Text Normalization & Cleaning ---------------------- #
    def normalize_text(text):
        """Lowercase and remove punctuation and extra spaces."""
        translator = str.maketrans('', '', string.punctuation)
        return text.lower().translate(translator).strip()

    def remove_quantity_info(text):
        """Remove quantity/unit information like '1 ltr', '500 ml', 'pack of 3', etc."""
        text = re.sub(r'\d+\s*(ltr|ml|g|kg|litre|milliliter|pieces|piece|x\s*\d+)', '', text)
        text = re.sub(r'\b\d+\b', '', text)
        return text

    def synonym_replace(text):
        """Replace or remove domain-specific synonyms and filler words."""
        remove_terms = [
            "homogenised", "homogenized", "pasteurised", "pasteurized",
            "uht", "tetra pack", "tetra", "carton", "value pack", "fresh",
            "standardised", "standardized"
        ]
        for term in remove_terms:
            text = re.sub(r'\b' + re.escape(term) + r'\b', '', text)
        return text

    def clean_product_name(name):
        """Cleans a product name by normalizing text, removing quantity/unit info, and applying synonym replacement."""
        name = normalize_text(name)
        name = remove_quantity_info(name)
        name = synonym_replace(name)
        return re.sub(r'\s+', ' ', name).strip()

    def composite_text(product):
        """Build composite text for matching by combining the cleaned product name and its MRP."""
        cleaned_name = clean_product_name(product['name'])
        return f"{cleaned_name} {product['mrp']}"

    # ------------------------- Matching Helpers ------------------------- #
    def mrp_match(a, b, error=4):
        """Check if two MRPs are within a small tolerance or an integer multiple."""
        if abs(a - b) <= error:
            return True
        smaller = min(a, b)
        larger = max(a, b)
        if smaller == 0:
            return False
        candidate_multiple = round(larger / smaller)
        if abs(candidate_multiple * smaller - larger) <= error:
            return True
        return False

    def fuzzy_brand_match(brand1, brand2, threshold=70):
        """Returns True if fuzzy matching score between two brand names is at least 'threshold'."""
        score = fuzz.token_set_ratio(brand1, brand2)
        return score >= threshold

    # ------------------------- Semantic Matching ------------------------- #
    def map_unmapped_products(unmapped_products, similarity_threshold=0.75):
        """Match unmapped products against each other using semantic similarity."""
        if len(unmapped_products) < 2:
            print("Not enough unmapped products to match (need at least 2).")
            return []

        model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')
        unmapped_texts = [composite_text(prod) for prod in unmapped_products]
        embeddings = model.encode(unmapped_texts, convert_to_tensor=True)

        mappings = []
        for i, prod1 in enumerate(unmapped_products):
            for j, prod2 in enumerate(unmapped_products[i+1:], start=i+1):
                if prod1['prices'][0]['source'] == prod2['prices'][0]['source']:
                    continue

                if not fuzzy_brand_match(prod1['brand'], prod2['brand']) or not mrp_match(prod1['mrp'], prod2['mrp']):
                    continue

                embedding1 = embeddings[i:i+1]
                embedding2 = embeddings[j:j+1]
                cosine_score = util.cos_sim(embedding1, embedding2)[0][0].item()

                if cosine_score >= similarity_threshold:
                    # Extract variant details (assuming first variant is representative)
                    prod1_variant = prod1['prices'][0]['variants'][0]
                    prod2_variant = prod2['prices'][0]['variants'][0]
                    
                    mappings.append({
                        "source": {
                            "id": prod1['id'],
                            "name": prod1['name'],
                            "brand": prod1['brand'],
                            "mrp": prod1['mrp'],
                            "source": prod1['prices'][0]['source'],
                            "weight": prod1_variant['weight'],
                            "deeplink": prod1_variant['deeplink'],
                            "image_url": prod1_variant.get('image_url', '')  # Add image_url, default to empty string if missing
                        },
                        "match": {
                            "id": prod2['id'],
                            "name": prod2['name'],
                            "brand": prod2['brand'],
                            "mrp": prod2['mrp'],
                            "source": prod2['prices'][0]['source'],
                            "weight": prod2_variant['weight'],
                            "deeplink": prod2_variant['deeplink'],
                            "image_url": prod2_variant.get('image_url', '')  # Add image_url, default to empty string if missing
                        },
                        "similarity": round(cosine_score, 4)
                    })

        return mappings

    # ------------------------- Worker Logic ------------------------- #
    def process_unmapped_from_redis(input_query):

        # Process each Redis key matching 'unmapped:*'
        for key in self.redis.keys("unmapped:*"):
            query = key.split(":", 1)[1]  # Extract query from key (e.g., "kurkure")
            if query != input_query:
                print(f"Elig1: No mappings found for query '{query}'")
                continue

            unmapped_json = self.redis.get(key)
            if not unmapped_json:
                continue

            unmapped_products = json.loads(unmapped_json)
            print(f"Processing {len(unmapped_products)} unmapped products for query '{query}'")

            # Run semantic matching on unmapped products
            mappings = map_unmapped_products(unmapped_products)

            if mappings:
                # Wrap mappings in a top-level structure with query
                result = {
                    "query": query,
                    "mappings": mappings
                }
                mappings_json = json.dumps(result)
                redis_key = f"pending_mappings:{query}"
                self.redis.set(redis_key, mappings_json, ex=24*3600)  # 24-hour expiration
                print(f"Stored {len(mappings)} mappings for query '{query}' in Redis under '{redis_key}'")
                # Do NOT delete the unmapped key to preserve it
            else:
                print(f"Elig2: No mappings found for query '{query}'")
                
search_intelligence = SearchIntelligence()