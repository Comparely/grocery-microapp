from .enhanced_search_intelligence import (
    search_intelligence,
)

def process_unmapped_from_redis(query):
    return search_intelligence.process_unmapped_from_redis(query)

__all__ = [
    "process_unmapped_from_redis",
    "search_intelligence",
]