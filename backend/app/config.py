import os
import logging
from pathlib import Path
from typing import List, Literal
from pydantic_settings import BaseSettings

logger = logging.getLogger("aookho.config")

BASE_DIR = Path(__file__).resolve().parent.parent

class Settings(BaseSettings):
    PROJECT_NAME: str = "Aookho Deepfake & AI Detection Platform"
    API_V1_STR: str = "/api"
    ENVIRONMENT: Literal["development", "testing", "production"] = os.getenv("ENVIRONMENT", "development") # type: ignore
    
    # Database Settings
    DATABASE_URL: str = (
        "sqlite:////tmp/aookho.db"
        if os.getenv("VERCEL") and (not os.getenv("DATABASE_URL") or os.getenv("DATABASE_URL", "").startswith("sqlite:///"))
        else os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR / 'aookho.db'}")
    )
    
    # Authentication & Security
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "dev-secret-key-change-in-production-aookho-2026")
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    PBKDF2_ITERATIONS: int = int(os.getenv("PBKDF2_ITERATIONS", "600000"))
    
    # Storage Configuration (Explicit provider required)
    STORAGE_PROVIDER: Literal["local", "s3", "r2", "minio"] = os.getenv("STORAGE_PROVIDER", "local") # type: ignore
    STORAGE_DIR: Path = Path("/tmp/storage") if os.getenv("VERCEL") else BASE_DIR / "storage" / "uploads"
    BASE_URL: str = os.getenv("BASE_URL", "http://localhost:8000")
    
    # S3 / MinIO / Cloudflare R2 Credentials
    S3_ENDPOINT_URL: str | None = os.getenv("S3_ENDPOINT_URL", None)
    S3_BUCKET_NAME: str = os.getenv("S3_BUCKET_NAME", "aookho-uploads")
    AWS_ACCESS_KEY_ID: str | None = os.getenv("AWS_ACCESS_KEY_ID", None)
    AWS_SECRET_ACCESS_KEY: str | None = os.getenv("AWS_SECRET_ACCESS_KEY", None)
    AWS_REGION: str = os.getenv("AWS_REGION", "us-east-1")
    PRESIGNED_URL_EXPIRATION_SECONDS: int = int(os.getenv("PRESIGNED_URL_EXPIRATION_SECONDS", "600"))  # 10 minutes max for sensitive forensic assets
    
    # Upload Size Limits
    MAX_IMAGE_SIZE_BYTES: int = 15 * 1024 * 1024      # 15 MB
    MAX_VIDEO_SIZE_BYTES: int = 100 * 1024 * 1024     # 100 MB
    MAX_TEXT_SIZE_BYTES: int = 50 * 1024             # 50 KB
    
    # Decompression Bomb & Resolution Limits
    MAX_IMAGE_PIXELS: int = 50_000_000               # 50 Megapixels
    MAX_IMAGE_DIMENSION: int = 8192                  # Max width or height
    
    # Video Forensic Processing Limits
    MAX_VIDEO_DURATION_SECONDS: int = 120            # 2 minutes max
    MAX_VIDEO_FRAMES_TO_ANALYZE: int = 20           # Uniform sampling
    FRAME_SAMPLE_RATE: int = 1                       # Sampling frequency
    MAX_FACES_PER_FRAME: int = 5                     # Max faces per frame
    PROCESSING_TIMEOUT_SECONDS: int = 60             # 60s max per task
    
    # Dedicated Rate Limits (Requests per 60 seconds)
    RATE_LIMIT_LOGIN: int = int(os.getenv("RATE_LIMIT_LOGIN", "10"))
    RATE_LIMIT_REGISTER: int = int(os.getenv("RATE_LIMIT_REGISTER", "5"))
    RATE_LIMIT_UPLOAD: int = int(os.getenv("RATE_LIMIT_UPLOAD", "15"))
    RATE_LIMIT_CHAT: int = int(os.getenv("RATE_LIMIT_CHAT", "30"))
    RATE_LIMIT_REPORTS: int = int(os.getenv("RATE_LIMIT_REPORTS", "60"))
    RATE_LIMIT_GENERAL: int = int(os.getenv("RATE_LIMIT_GENERAL", "120"))
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]

    model_config = {
        "env_file": ".env",
        "extra": "ignore"
    }

    def validate_production_readiness(self):
        """
        Fails fast if production environment has insecure configurations.
        """
        if self.ENVIRONMENT == "production":
            if self.STORAGE_PROVIDER == "local":
                raise RuntimeError(
                    "FATAL SECURITY CONFIGURATION: In production environment, STORAGE_PROVIDER cannot be 'local'. "
                    "Must be 's3', 'r2', or 'minio'."
                )
            if "dev-secret" in self.JWT_SECRET_KEY or len(self.JWT_SECRET_KEY) < 32:
                raise RuntimeError(
                    "FATAL SECURITY CONFIGURATION: In production environment, JWT_SECRET_KEY must be a cryptographically "
                    "secure string of at least 32 characters."
                )
            if "*" in self.CORS_ORIGINS:
                raise RuntimeError(
                    "FATAL SECURITY CONFIGURATION: Wildcard CORS '*' cannot be used in production with credentials."
                )

settings = Settings()
settings.validate_production_readiness()
