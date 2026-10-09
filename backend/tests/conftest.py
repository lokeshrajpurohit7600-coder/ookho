import pytest
from app.rate_limiter import limiter

@pytest.fixture(autouse=True)
def reset_rate_limiter():
    """Ensure in-memory rate limit buckets are cleared between individual tests."""
    limiter.reset()
    yield
    limiter.reset()
