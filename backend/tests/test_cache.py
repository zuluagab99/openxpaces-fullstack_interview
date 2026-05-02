
"""
Unit tests for the TTL cache.
"""
import time
from app.services.cache import cache_get, cache_set, cache_invalidate


def test_set_and_get():
    cache_set("test:key", {"value": 42})
    result = cache_get("test:key")
    assert result == {"value": 42}

def test_missing_key_returns_none():
    assert cache_get("test:nonexistent") is None

def test_invalidate_by_prefix():
    cache_set("market:austin:tx", {"count": 5})
    cache_set("market:miami:fl",  {"count": 3})
    cache_set("other:key",        {"count": 9})
    cache_invalidate("market:")
    assert cache_get("market:austin:tx") is None
    assert cache_get("market:miami:fl")  is None
    assert cache_get("other:key") == {"count": 9}

def test_invalidate_all():
    cache_set("a", 1)
    cache_set("b", 2)
    cache_invalidate()
    assert cache_get("a") is None
    assert cache_get("b") is None