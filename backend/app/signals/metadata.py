from pathlib import Path
from typing import Any
from PIL import Image, ExifTags

KNOWN_CAMERA_MAKES = [
    "apple", "samsung", "sony", "canon", "nikon", "google", "xiaomi", 
    "oneplus", "oppo", "vivo", "fujifilm", "panasonic", "huawei", "motorola", "realme"
]

AI_SOFTWARE_KEYWORDS = [
    "chatgpt", "dall-e", "dalle", "dall_e", "midjourney", "stable diffusion", "stablediffusion", 
    "comfyui", "automatic1111", "novelai", "flux", "generative fill", "adobe firefly", 
    "firefly", "runway", "leonardo.ai", "leonardo", "bing_image", "bing image", "bing_creator",
    "image_fx", "imagefx", "craiyon", "ideogram", "magnific", "sdxl", "sd_xl", "sora", 
    "deepai", "pika", "kling", "luma", "dream machine", "photoleap", "wombo", "artbreeder"
]

def compute_metadata_signal(image_path: Path, original_filename: str) -> dict[str, Any]:
    """
    Evaluates file metadata and provenance.
    Explicitly distinguishes social media recompression (WhatsApp/Instagram) 
    from actual manipulation evidence — missing EXIF alone is never penalized.
    Detects affirmative AI generator filenames and EXIF/PNG chunks.
    """
    fname = (original_filename or image_path.name).lower()
    is_social_media = any(sm in fname for sm in ["whatsapp", "-wa", "_wa", "wa-", "wa00", "instagram", "telegram", "fb_img", "received_", "signal-", "wechat"])
    is_ai_filename = any(kw in fname for kw in AI_SOFTWARE_KEYWORDS)
    
    try:
        with Image.open(image_path) as img:
            w, h = img.size
            img_format = (img.format or "").upper()
            info = img.info or {}
            
            # Extract EXIF tags
            exif_dict = {}
            exif_data = img.getexif()
            if exif_data:
                for tag_id, val in exif_data.items():
                    tag_name = ExifTags.TAGS.get(tag_id, str(tag_id))
                    exif_dict[tag_name] = str(val)

            software = exif_dict.get("Software", "") or str(info.get("Software", ""))
            camera_make = exif_dict.get("Make", "")
            camera_model = exif_dict.get("Model", "")

            # 1. Affirmative AI Software / Filename Signature Check
            has_ai_chunk = any(k in info for k in ["parameters", "prompt", "workflow", "generation_data", "sd-metadata"])
            is_ai_software = is_ai_filename or has_ai_chunk or any(kw in software.lower() for kw in AI_SOFTWARE_KEYWORDS) or any(
                kw in str(info).lower() for kw in AI_SOFTWARE_KEYWORDS
            )
            if is_ai_software:
                sig_source = original_filename if is_ai_filename else ("Generative Parameters Chunk" if has_ai_chunk else (software or "Generative Model Signature"))
                return {
                    "score": 98.0,
                    "is_ai_metadata": True,
                    "is_camera": False,
                    "is_social_media": False,
                    "details": {"software": software, "format": img_format, "resolution": f"{w}x{h}", "signature": sig_source},
                    "note": f"Affirmative AI generator signature identified ({sig_source})."
                }

            # 2. Camera Hardware Verification (EXIF is untrusted and can be forged)
            is_camera = any(make in camera_make.lower() for make in KNOWN_CAMERA_MAKES) or bool(camera_model)
            if is_camera:
                return {
                    "score": 10.0,
                    "is_ai_metadata": False,
                    "is_camera": True,
                    "is_social_media": False,
                    "c2pa_status": "unverifiable_credential",
                    "details": {
                        "make": camera_make,
                        "model": camera_model,
                        "software": software or "Camera Firmware",
                        "resolution": f"{w}x{h}",
                        "c2pa_provenance": "Missing cryptographic hardware root of trust (EXIF is advisory)"
                    },
                    "note": f"Camera hardware tags present ({camera_make} {camera_model}). Note: EXIF is treated as advisory and is corroborated with optical sensor noise."
                }

            # 3. Social Media Recompression Check (WhatsApp, Instagram, etc.)
            # Standard dimensions or filename pattern where metadata is routinely stripped
            is_standard_social_res = (
                (w == 720 and h == 1600) or
                (w in [720, 1080, 1280, 1440] and h in [1280, 1600, 1920, 2400]) or
                (w == 1080 and h == 1080)
            )

            if is_social_media or (img_format == "JPEG" and is_standard_social_res):
                return {
                    "score": 18.0,
                    "is_ai_metadata": False,
                    "is_camera": False,
                    "is_social_media": True,
                    "details": {
                        "format": img_format,
                        "resolution": f"{w}x{h}",
                        "source": "Social Media Messaging Profile" if is_social_media else "Standard Mobile JPEG",
                        "exif_status": "Stripped by Platform"
                    },
                    "note": "Social media re-compression detected (WhatsApp/Instagram profile). Stripped EXIF metadata is standard platform behavior and is NOT penalized as manipulation."
                }

            # 4. Standalone PNG or file lacking camera tags without social media signature
            if img_format == "PNG":
                # PNG without EXIF is common for graphic editor exports / generative canvas
                return {
                    "score": 58.0,
                    "is_ai_metadata": False,
                    "is_camera": False,
                    "is_social_media": False,
                    "details": {"format": "PNG", "resolution": f"{w}x{h}", "exif": "None"},
                    "note": "Image exported as PNG without camera hardware metadata. Indicates graphic canvas export or post-processing pipeline."
                }

            # Default JPEG/other without EXIF
            return {
                "score": 28.0,
                "is_ai_metadata": False,
                "is_camera": False,
                "is_social_media": False,
                "details": {"format": img_format, "resolution": f"{w}x{h}", "exif": "None"},
                "note": "Standard image encoding. Missing EXIF treated neutrally without affirmative manipulation evidence."
            }

    except Exception as e:
        return {
            "score": 30.0,
            "error": str(e),
            "note": f"Metadata parsing error: {e}"
        }
