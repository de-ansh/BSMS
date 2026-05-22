import time
from collections import defaultdict

from fastapi import HTTPException, status

_attempts: dict[str, list[float]] = defaultdict(list)


def check_login_rate_limit(key: str, *, max_attempts: int, window_seconds: int) -> None:
    now = time.time()
    recent = [t for t in _attempts[key] if now - t < window_seconds]
    _attempts[key] = recent
    if len(recent) >= max_attempts:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many login attempts. Please try again later.",
        )


def record_failed_login(key: str) -> None:
    _attempts[key].append(time.time())


def clear_login_attempts(key: str) -> None:
    _attempts.pop(key, None)
