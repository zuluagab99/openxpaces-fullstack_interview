"""
Lightweight in-memory TTL cache.
No Redis required — suitable for single-process dev/assessment usage.
"""
import time
from typing import Any

_store: dict[str, tuple[float, Any]] = {}
TTL = 60  # seconds


def cache_get(key: str) -> Any | None:
    entry = _store.get(key)
    if entry is None:
        return None
    ts, value = entry
    if time.time() - ts > TTL:
        del _store[key]
        return None
    return value


def cache_set(key: str, value: Any) -> None:
    _store[key] = (time.time(), value)


def cache_invalidate(prefix: str = "") -> None:
    """Remove all keys that start with prefix (or everything if prefix='')."""
    keys = [k for k in _store if k.startswith(prefix)]
    for k in keys:
        del _store[k]