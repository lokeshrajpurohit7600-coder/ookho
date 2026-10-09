import os
import uuid
import logging
from pathlib import Path
import boto3
from botocore.exceptions import BotoCoreError, ClientError
from botocore.config import Config
from app.config import settings

logger = logging.getLogger("aookho.storage")

class StorageService:
    def __init__(self):
        self.provider = settings.STORAGE_PROVIDER
        self.s3_client = None

        if self.provider in ["s3", "r2", "minio"]:
            if not settings.AWS_ACCESS_KEY_ID or not settings.AWS_SECRET_ACCESS_KEY:
                if settings.ENVIRONMENT == "production":
                    raise RuntimeError(f"Credentials missing for storage provider: {self.provider}")
                logger.warning(f"Credentials missing for {self.provider}. Local storage used in dev.")
                self.provider = "local"
            else:
                try:
                    boto_config = Config(
                        signature_version="s3v4",
                        retries={"max_attempts": 3, "mode": "standard"}
                    )
                    self.s3_client = boto3.client(
                        "s3",
                        endpoint_url=settings.S3_ENDPOINT_URL,
                        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                        region_name=settings.AWS_REGION,
                        config=boto_config
                    )
                    logger.info(f"Initialized {self.provider.upper()} storage client for bucket: {settings.S3_BUCKET_NAME}")
                except Exception as e:
                    if settings.ENVIRONMENT == "production":
                        raise RuntimeError(f"Failed to initialize production storage {self.provider}: {e}")
                    logger.error(f"Failed to initialize {self.provider}: {e}. Falling back to local.")
                    self.provider = "local"

        if self.provider == "local":
            settings.STORAGE_DIR.mkdir(parents=True, exist_ok=True)
            logger.info(f"Using local file storage at {settings.STORAGE_DIR}")

    def get_object_key(self, user_id: str, upload_id: str, safe_ext: str) -> str:
        """
        Builds a safe, non-user-controlled object key structure:
        uploads/<user_id>/<upload_id>/original.<safe_ext>
        """
        clean_ext = safe_ext.lstrip(".")
        return f"uploads/{user_id}/{upload_id}/original.{clean_ext}"

    def save_file(
        self,
        content: bytes,
        user_id: str,
        upload_id: str,
        safe_ext: str,
        content_type: str = "application/octet-stream"
    ) -> tuple[str, str]:
        """
        Saves content using configured storage provider.
        Never uses client-controlled filenames.
        Returns: (accessible_url, object_key)
        """
        object_key = self.get_object_key(user_id, upload_id, safe_ext)

        # Cloud Object Storage (S3 / Cloudflare R2 / MinIO)
        if self.provider in ["s3", "r2", "minio"] and self.s3_client:
            try:
                self.s3_client.put_object(
                    Bucket=settings.S3_BUCKET_NAME,
                    Key=object_key,
                    Body=content,
                    ContentType=content_type
                )
                clean_ext = safe_ext.lstrip(".")
                disposition = (
                    f'inline; filename="media_{upload_id}.{clean_ext}"'
                    if content_type.startswith("image/")
                    else f'attachment; filename="media_{upload_id}.{clean_ext}"'
                )
                # Generate a secure short-lived presigned URL (private bucket, 10 min TTL)
                presigned_url = self.s3_client.generate_presigned_url(
                    "get_object",
                    Params={
                        "Bucket": settings.S3_BUCKET_NAME,
                        "Key": object_key,
                        "ResponseContentType": content_type,
                        "ResponseContentDisposition": disposition
                    },
                    ExpiresIn=settings.PRESIGNED_URL_EXPIRATION_SECONDS
                )
                return presigned_url, object_key
            except (BotoCoreError, ClientError) as e:
                logger.error(f"Upload failed to {self.provider}: {e}")
                if settings.ENVIRONMENT == "production":
                    raise RuntimeError(f"Storage upload failed to {self.provider}: {e}")
                # In non-production only, fallback
                logger.warning("Falling back to local storage in development mode.")

        # Local Filesystem Storage
        safe_local_path = (settings.STORAGE_DIR / object_key).resolve()
        # Path traversal guard
        if not str(safe_local_path).startswith(str(settings.STORAGE_DIR.resolve())):
            raise ValueError("Path traversal attempt detected in storage key.")

        safe_local_path.parent.mkdir(parents=True, exist_ok=True)
        safe_local_path.write_bytes(content)
        
        file_url = f"{settings.BASE_URL.rstrip('/')}/uploads/{object_key}"
        return file_url, object_key

    def save_text(self, text_content: str, user_id: str, upload_id: str) -> tuple[str, str]:
        """
        Saves text snippet to storage.
        """
        return self.save_file(
            content=text_content.encode("utf-8"),
            user_id=user_id,
            upload_id=upload_id,
            safe_ext="txt",
            content_type="text/plain; charset=utf-8"
        )

    def get_local_path_for_analysis(self, object_key: str, content: bytes | None = None) -> Path:
        """
        Ensures a local file exists for forensics / OpenCV / Pillow analysis.
        If local storage, returns the direct path.
        If cloud storage, downloads into a safe cache directory.
        """
        local_path = (settings.STORAGE_DIR / object_key).resolve()
        if not str(local_path).startswith(str(settings.STORAGE_DIR.resolve())):
            raise ValueError("Path traversal attempt detected.")

        if local_path.exists():
            return local_path

        # If not on disk (e.g. S3 upload), write/cache from memory or download
        local_path.parent.mkdir(parents=True, exist_ok=True)
        if content:
            local_path.write_bytes(content)
            return local_path

        if self.s3_client:
            self.s3_client.download_file(settings.S3_BUCKET_NAME, object_key, str(local_path))
            return local_path

        raise FileNotFoundError(f"Object {object_key} could not be retrieved for forensic analysis.")

    def delete_file(self, object_key: str) -> bool:
        """
        Deletes object from storage.
        """
        if self.provider in ["s3", "r2", "minio"] and self.s3_client:
            try:
                self.s3_client.delete_object(Bucket=settings.S3_BUCKET_NAME, Key=object_key)
            except Exception as e:
                logger.error(f"Failed to delete {object_key} from {self.provider}: {e}")

        local_path = (settings.STORAGE_DIR / object_key).resolve()
        if str(local_path).startswith(str(settings.STORAGE_DIR.resolve())) and local_path.exists():
            try:
                local_path.unlink()
                return True
            except Exception as e:
                logger.error(f"Failed to delete local file {local_path}: {e}")
        return False

storage_service = StorageService()
