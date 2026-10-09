import re
import io
import uuid
from pathlib import Path
from typing import Tuple
from fastapi import UploadFile, HTTPException
from PIL import Image
from app.config import settings

# Configure Pillow to protect against decompression bombs
Image.MAX_IMAGE_PIXELS = settings.MAX_IMAGE_PIXELS

ALLOWED_IMAGE_TYPES = {
    "image/jpeg": [".jpg", ".jpeg"],
    "image/png": [".png"],
    "image/webp": [".webp"],
    "image/gif": [".gif"]
}

ALLOWED_VIDEO_TYPES = {
    "video/mp4": [".mp4"],
    "video/quicktime": [".mov"],
    "video/webm": [".webm"]
}

def sanitize_filename(filename: str | None) -> str:
    """
    Sanitizes user-provided filename by removing path traversal characters,
    null bytes, control characters, and limiting length.
    """
    if not filename:
        return "uploaded_file"
    
    # Strip null bytes and directory components
    name = Path(filename).name
    name = name.replace("\x00", "")
    
    # Replace dangerous or traversal characters
    name = re.sub(r"[^\w\.\-\_]", "_", name)
    name = re.sub(r"\.{2,}", ".", name)  # No consecutive dots
    name = name.strip(" ._")
    
    if not name:
        return f"file_{uuid.uuid4().hex[:8]}"
    
    # Limit length
    if len(name) > 100:
        stem = Path(name).stem[:90]
        ext = Path(name).suffix[:10]
        name = f"{stem}{ext}"
        
    return name

def detect_file_signature(header: bytes) -> Tuple[str, str] | None:
    """
    Inspects magic bytes / file signature to determine true MIME type and extension.
    Returns (mime_type, canonical_extension) or None if unsupported.
    """
    if len(header) < 3:
        return None

    # JPEG
    if header.startswith(b"\xff\xd8\xff"):
        return "image/jpeg", ".jpg"

    # PNG
    if len(header) >= 8 and header.startswith(b"\x89PNG\r\n\x1a\n"):
        return "image/png", ".png"

    # GIF
    if len(header) >= 6 and (header.startswith(b"GIF87a") or header.startswith(b"GIF89a")):
        return "image/gif", ".gif"

    # WebM / MKV (EBML signature 1A 45 DF A3)
    if len(header) >= 4 and header.startswith(b"\x1a\x45\xdf\xa3"):
        return "video/webm", ".webm"

    # WebP (RIFF....WEBP)
    if len(header) >= 12 and header.startswith(b"RIFF") and header[8:12] == b"WEBP":
        return "image/webp", ".webp"

    # MP4 / MOV (ISO Base Media or QuickTime container: 'ftyp' or 'moov' at offset 4)
    if len(header) >= 12 and (header[4:8] in [b"ftyp", b"moov", b"mdat", b"wide"]):
        # Check brand
        brand = header[8:12]
        if brand in [b"qt  "]:
            return "video/quicktime", ".mov"
        return "video/mp4", ".mp4"

    return None

async def validate_and_read_upload(
    file: UploadFile,
    expected_category: str | None = None
) -> Tuple[bytes, str, str, str]:
    """
    Validates upload stream:
    1. Reads in 64KB chunks to prevent memory-exhaustion DoS
    2. Enforces maximum size limits
    3. Validates true magic-byte signature (ignoring client Content-Type)
    4. For images, verifies dimensions and protects against decompression bombs
    
    Returns: (content_bytes, file_type, mime_type, safe_ext)
    """
    chunks = []
    total_bytes = 0
    max_allowed = settings.MAX_VIDEO_SIZE_BYTES  # Absolute ceiling
    
    # Read first chunk to inspect header
    first_chunk = await file.read(65536)
    if not first_chunk:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")
    
    chunks.append(first_chunk)
    total_bytes += len(first_chunk)
    
    sig = detect_file_signature(first_chunk)
    if not sig:
        raise HTTPException(
            status_code=415,
            detail="Unsupported file format. Please upload a valid JPG, PNG, WEBP, MP4, MOV, or WEBM file."
        )
    
    mime_type, safe_ext = sig
    if mime_type.startswith("image/"):
        file_type = "image"
        max_size = settings.MAX_IMAGE_SIZE_BYTES
    elif mime_type.startswith("video/"):
        file_type = "video"
        max_size = settings.MAX_VIDEO_SIZE_BYTES
    else:
        raise HTTPException(status_code=415, detail="Unsupported media type.")
        
    # Read remaining chunks while enforcing size limit
    while True:
        chunk = await file.read(65536)
        if not chunk:
            break
        total_bytes += len(chunk)
        if total_bytes > max_size:
            raise HTTPException(
                status_code=413,
                detail=f"File exceeds maximum allowed size of {max_size // (1024 * 1024)}MB."
            )
        chunks.append(chunk)

    content = b"".join(chunks)

    # For images, perform decompression bomb and dimension check
    if file_type == "image":
        try:
            with Image.open(io.BytesIO(content)) as img:
                w, h = img.size
                if w > settings.MAX_IMAGE_DIMENSION or h > settings.MAX_IMAGE_DIMENSION:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Image dimensions ({w}x{h}) exceed maximum allowed {settings.MAX_IMAGE_DIMENSION}px."
                    )
        except Image.DecompressionBombError:
            raise HTTPException(status_code=400, detail="Image pixel count exceeds decompression safety limits.")
        except Exception as e:
            if isinstance(e, HTTPException):
                raise e
            raise HTTPException(status_code=400, detail=f"Corrupted or malformed image data: {str(e)}")

    return content, file_type, mime_type, safe_ext
