# Production Dockerfile for Aookho FastAPI Backend
# Hardened minimal Python 3.13 image with non-root security context

FROM python:3.13-slim-bookworm AS base

# Install system dependencies required for OpenCV headless, Pillow, and health checks
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app

WORKDIR /app

# Create unprivileged application user
RUN groupadd -g 10001 aookho && \
    useradd -u 10001 -g aookho -s /bin/bash -m aookho

# Install python dependencies in cached layer
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source code
COPY --chown=aookho:aookho . /app

# Create storage directory with appropriate permissions
RUN mkdir -p /app/storage/uploads && \
    chown -R aookho:aookho /app/storage

# Switch to unprivileged user
USER aookho

# Expose backend API port
EXPOSE 8000

# Docker healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8000/api/health || exit 1

# Production ASGI server command
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2", "--proxy-headers", "--forwarded-allow-ips", "*"]
