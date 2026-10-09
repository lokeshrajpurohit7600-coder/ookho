import time
import logging
from typing import Dict, List, Tuple
from fastapi import Request, HTTPException, status
from app.config import settings

logger = logging.getLogger("aookho.rate_limiter")

class SlidingWindowRateLimiter:
    """
    In-memory sliding-window rate limiter.
    Tracks request timestamps per client key and purges expired entries.
    """
    def __init__(self):
        self._buckets: Dict[str, List[float]] = {}
        self._last_cleanup = time.time()
        self.enabled = True

    def _cleanup_old_entries(self, now: float, max_age: float = 300.0):
        """Purges buckets with no recent requests to prevent memory growth."""
        if now - self._last_cleanup < 60.0:
            return
        
        expired_keys = []
        for key, timestamps in self._buckets.items():
            valid_ts = [t for t in timestamps if now - t < max_age]
            if not valid_ts:
                expired_keys.append(key)
            else:
                self._buckets[key] = valid_ts
                
        for k in expired_keys:
            del self._buckets[k]
        self._last_cleanup = now

    def check(self, key: str, max_requests: int, window_seconds: int = 60) -> Tuple[bool, int]:
        """
        Evaluates whether a request from `key` is allowed under `max_requests` per `window_seconds`.
        Returns (is_limited, retry_after_seconds).
        """
        if not self.enabled:
            return False, 0

        now = time.time()
        self._cleanup_old_entries(now)

        window_start = now - window_seconds
        timestamps = self._buckets.setdefault(key, [])
        # Keep only timestamps within current window
        valid_timestamps = [t for t in timestamps if t > window_start]
        self._buckets[key] = valid_timestamps

        if len(valid_timestamps) >= max_requests:
            earliest_in_window = valid_timestamps[0]
            retry_after = max(1, int(window_seconds - (now - earliest_in_window)))
            return True, retry_after

        valid_timestamps.append(now)
        return False, 0

    def reset(self):
        """Clears all rate limit buckets (useful for test suites)."""
        self._buckets.clear()

limiter = SlidingWindowRateLimiter()

def get_client_identifier(request: Request, category: str = "general") -> str:
    """Extracts client IP or session/token identifier for rate limit tracking."""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        client_ip = forwarded.split(",")[0].strip()
    else:
        client_ip = request.client.host if request.client else "unknown_client"

    # For authentication endpoints, strictly rate limit by IP to defeat cookie-rotation brute-force attacks
    if category in ["login", "register"]:
        return client_ip

    # For session endpoints, isolate by user token or session
    auth_header = request.headers.get("Authorization")
    if auth_header and "Bearer " in auth_header:
        token_snippet = auth_header.split("Bearer ")[-1][:16]
        return f"{client_ip}:{token_snippet}"

    session_id = (
        request.headers.get("X-Session-ID")
        or request.cookies.get("aookho_session")
        or getattr(request.state, "session_id", None)
    )
    if session_id:
        return f"{client_ip}:{session_id[:16]}"

    return client_ip

def apply_rate_limit(request: Request, category: str, limit: int, window: int = 60):
    client_id = get_client_identifier(request, category)
    bucket_key = f"{category}:{client_id}"
    is_limited, retry_after = limiter.check(bucket_key, max_requests=limit, window_seconds=window)

    if is_limited:
        logger.warning(f"Rate limit exceeded for key={bucket_key} category={category} retry_after={retry_after}s")
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Rate limit exceeded for {category}. Please wait {retry_after} seconds before retrying.",
            headers={"Retry-After": str(retry_after)}
        )

# FastAPI route dependencies
async def rate_limit_login(request: Request):
    apply_rate_limit(request, "login", settings.RATE_LIMIT_LOGIN)

async def rate_limit_register(request: Request):
    apply_rate_limit(request, "register", settings.RATE_LIMIT_REGISTER)

async def rate_limit_upload(request: Request):
    apply_rate_limit(request, "upload", settings.RATE_LIMIT_UPLOAD)

async def rate_limit_chat(request: Request):
    apply_rate_limit(request, "assistant_chat", settings.RATE_LIMIT_CHAT)

async def rate_limit_reports(request: Request):
    apply_rate_limit(request, "reports", settings.RATE_LIMIT_REPORTS)
