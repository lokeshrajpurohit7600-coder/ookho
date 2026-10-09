import io
from pathlib import Path
from typing import Any
from PIL import Image, ImageChops
import numpy as np

def compute_ela_signal(image_path: Path) -> dict[str, Any]:
    """
    Computes Error Level Analysis (ELA) and regional compression variance.
    Detects composite modifications, inpainting seams, and background replacement.
    """
    try:
        with Image.open(image_path) as orig_img:
            img = orig_img.convert("RGB")
            w, h = img.size

            # Re-save at fixed 90% quality
            buf = io.BytesIO()
            img.save(buf, "JPEG", quality=90)
            buf.seek(0)
            resaved = Image.open(buf)

            # Calculate difference
            diff = ImageChops.difference(img, resaved)
            diff_arr = np.array(diff, dtype=float)

            global_mean = float(diff_arr.mean())
            global_std = float(diff_arr.std())

            # Regional segmentation: Background margins vs Foreground center
            margin_y = int(h * 0.25)
            margin_x = int(w * 0.20)

            # Top background and side background
            bg_top = diff_arr[:margin_y, :, :]
            bg_left = diff_arr[margin_y:h - margin_y, :margin_x, :]
            bg_right = diff_arr[margin_y:h - margin_y, w - margin_x:, :]

            bg_pixels = np.concatenate([
                bg_top.reshape(-1, 3),
                bg_left.reshape(-1, 3),
                bg_right.reshape(-1, 3)
            ], axis=0)
            bg_mean = float(bg_pixels.mean())

            # Foreground center
            fg_region = diff_arr[margin_y:h - margin_y, margin_x:w - margin_x, :]
            fg_mean = float(fg_region.mean())

            # Ratio and disparity
            ratio = max(bg_mean, fg_mean) / (min(bg_mean, fg_mean) + 1e-4)
            diff_ratio = abs(bg_mean - fg_mean)

            flagged_regions = []

            # Scoring based on regional compression error disparity
            if ratio > 2.2 and diff_ratio > 1.2:
                # Strong regional inpainting / background composite disparity
                ela_score = min(92.0, 55.0 + (ratio - 2.0) * 20.0)
                note = f"High regional compression disparity (ratio: {ratio:.2f}). Error levels between subject and background indicate composite inpainting or generative fill."
                
                # Flag background region
                flagged_regions.append({
                    "id": "reg-ela-bg",
                    "type": "box",
                    "label": "AI Background Inpainting Disparity",
                    "confidence": round(ela_score, 1),
                    "box": {"x": 5.0, "y": 5.0, "width": 90.0, "height": 30.0},
                    "description": "Compression error level variance in background perimeter deviates significantly from foreground subject."
                })
            elif ratio > 1.6 and diff_ratio > 0.8:
                ela_score = 58.0 + (ratio - 1.5) * 15.0
                note = f"Moderate compression error discrepancy between regions (ratio: {ratio:.2f}). Possible local editing."
                flagged_regions.append({
                    "id": "reg-ela-mod",
                    "type": "box",
                    "label": "Localized Error Inconsistency",
                    "confidence": round(ela_score, 1),
                    "box": {"x": 10.0, "y": 8.0, "width": 80.0, "height": 25.0},
                    "description": "Noticeable variance in compression error response."
                })
            else:
                # Uniform compression across entire frame (authentic camera or uniform recompression)
                ela_score = max(12.0, min(35.0, global_std * 6.0))
                note = f"Uniform compression error profile across all regions (ratio: {ratio:.2f}). No regional inpainting boundaries detected."

            return {
                "score": round(ela_score, 2),
                "global_mean": round(global_mean, 2),
                "global_std": round(global_std, 2),
                "bg_mean": round(bg_mean, 2),
                "fg_mean": round(fg_mean, 2),
                "ratio": round(ratio, 2),
                "note": note,
                "flagged_regions": flagged_regions
            }

    except Exception as e:
        return {
            "score": 30.0,
            "error": str(e),
            "note": f"ELA computation exception: {e}",
            "flagged_regions": []
        }
