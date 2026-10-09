import os
import sys
import io
import shutil
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter
import numpy as np

BASE_DIR = Path(__file__).resolve().parent
TEST_DIR = BASE_DIR.parent / "test-images"

def populate_test_images():
    """Populates test-images directory with categorized test cases if missing."""
    camera_dir = TEST_DIR / "real" / "camera"
    social_dir = TEST_DIR / "real" / "social_media"
    sd_dir = TEST_DIR / "fake" / "sd"
    mj_dir = TEST_DIR / "fake" / "midjourney"
    comp_dir = TEST_DIR / "fake" / "composite_inpainting"

    for d in [camera_dir, social_dir, sd_dir, mj_dir, comp_dir]:
        d.mkdir(parents=True, exist_ok=True)

    # 1. Existing user uploads
    stored_uploads = BASE_DIR / "storage" / "uploads"
    whatsapp_img = stored_uploads / "41a0f775c0bf4d32a5ef0e0c9b11bc44.jpeg"
    composite_img = stored_uploads / "e53ad3c545c14472806f3f44bba14064.png"

    if whatsapp_img.exists():
        shutil.copy(whatsapp_img, social_dir / "whatsapp_ganesha_idol.jpeg")
    if composite_img.exists():
        shutil.copy(composite_img, comp_dir / "ganesha_ai_background.png")

    # 2. Synthetic camera image with camera EXIF tags
    cam_file = camera_dir / "nikon_d850_outdoor.jpg"
    if not cam_file.exists():
        arr = np.random.normal(128, 25, (800, 800, 3)).astype(np.uint8)
        img = Image.fromarray(arr)
        exif = img.getexif()
        exif[271] = "Nikon"           # Make
        exif[272] = "D850"            # Model
        exif[305] = "NIKON D850 Ver.1.20"  # Software
        img.save(cam_file, "JPEG", exif=exif, quality=95)

    # 3. Additional social media re-saved image (no EXIF, natural noise)
    insta_file = social_dir / "instagram_street_resaved.jpg"
    if not insta_file.exists():
        arr = np.random.normal(120, 20, (1080, 1080, 3)).astype(np.uint8)
        img = Image.fromarray(arr)
        img.save(insta_file, "JPEG", quality=82)

    # 4. Stable Diffusion test image (with SD metadata and periodic grid artifacts)
    sd_file = sd_dir / "sd_v15_portrait.png"
    if not sd_file.exists():
        # Add periodic high-frequency checkerboard pattern
        x = np.linspace(0, 50, 512)
        y = np.linspace(0, 50, 512)
        xx, yy = np.meshgrid(x, y)
        grid = (np.sin(xx * 8) * np.cos(yy * 8) * 30).astype(np.int16)
        base = np.full((512, 512, 3), 130, dtype=np.int16)
        sd_arr = np.clip(base + grid[:, :, None], 0, 255).astype(np.uint8)
        img = Image.fromarray(sd_arr)
        from PIL import PngImagePlugin
        meta = PngImagePlugin.PngInfo()
        meta.add_text("Software", "Stable Diffusion v1.5 / Automatic1111")
        meta.add_text("parameters", "photorealistic portrait, high quality, 8k")
        img.save(sd_file, "PNG", pnginfo=meta)

    # 5. Midjourney test image (smoothed skin + frequency spikes)
    mj_file = mj_dir / "midjourney_v6_scenery.png"
    if not mj_file.exists():
        arr = np.zeros((600, 600, 3), dtype=np.uint8)
        arr[:, :] = [140, 160, 200]
        # create subtle grid
        for i in range(0, 600, 8):
            arr[i, :, :] = np.clip(arr[i, :, :] + 15, 0, 255)
        img = Image.fromarray(arr).filter(ImageFilter.GaussianBlur(radius=1.5))
        img.save(mj_file, "PNG")

    # 6. Composite inpainting test image (smooth background + noisy foreground)
    comp2_file = comp_dir / "composite_subject_ai_bg.png"
    if not comp2_file.exists():
        bg = np.full((600, 600, 3), 180, dtype=np.uint8) # smooth background
        fg = np.random.normal(100, 35, (300, 300, 3)).astype(np.uint8) # textured foreground
        bg[150:450, 150:450, :] = fg
        img = Image.fromarray(bg)
        img.save(comp2_file, "PNG")

if __name__ == "__main__":
    populate_test_images()
    print("Test images populated successfully.")
