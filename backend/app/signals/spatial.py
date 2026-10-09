from pathlib import Path
from typing import Any
from PIL import Image
import numpy as np

def compute_spatial_signal(image_path: Path) -> dict[str, Any]:
    """
    Computes spatial visual and texture consistency signal.
    Evaluates sensor noise distribution (PRNU consistency) and gradient roughness.
    """
    try:
        with Image.open(image_path) as img:
            rgb = np.array(img.convert("RGB"), dtype=float)
            
            # Channel-wise gradient analysis
            grad_y = np.abs(rgb[1:, :, :] - rgb[:-1, :, :])
            grad_x = np.abs(rgb[:, 1:, :] - rgb[:, :-1, :])
            
            # Optical roughness
            roughness = float((grad_y.std() + grad_x.std()) / 2.0)
            
            # Channel noise balance: In physical sensors, R, G, B noise levels are closely coupled
            std_r = float(rgb[:, :, 0].std())
            std_g = float(rgb[:, :, 1].std())
            std_b = float(rgb[:, :, 2].std())
            channel_variance_ratio = max(std_r, std_g, std_b) / (min(std_r, std_g, std_b) + 1e-4)

            # High-pass residual noise estimation (Laplacian kernel)
            gray = np.array(img.convert("L"), dtype=float)
            laplacian = (
                gray[:-2, 1:-1] + gray[2:, 1:-1] +
                gray[1:-1, :-2] + gray[1:-1, 2:] -
                4 * gray[1:-1, 1:-1]
            )
            noise_residual_std = float(laplacian.std())

            # Corner / border background sensor noise estimation
            ch, cw, _ = rgb.shape
            bh = min(50, ch // 8)
            bw = min(50, cw // 8)
            if bh > 4 and bw > 4:
                c1 = float(rgb[:bh, :bw, :].std())
                c2 = float(rgb[:bh, -bw:, :].std())
                c3 = float(rgb[-bh:, :bw, :].std())
                c4 = float(rgb[-bh:, -bw:, :].std())
                min_corner_noise = min(c1, c2, c3, c4)
            else:
                min_corner_noise = 10.0

            # Evaluate score
            if roughness < 6.0 and noise_residual_std < 8.0:
                # Highly smoothed / plastic appearance typical of synthetic renders
                spatial_score = 75.0 + max(0.0, 6.0 - roughness) * 3.0
                note = f"Unnaturally low optical roughness ({roughness:.2f}) and suppressed sensor noise residual ({noise_residual_std:.2f}). Surface smoothing typical of generative models."
            elif min_corner_noise < 2.5 and roughness > 8.0:
                # High foreground edge detail coupled with flat artificial background void (characteristic of diffusion/3D canvas)
                spatial_score = 78.0
                note = f"Discontinuous optical noise: High edge gradient ({roughness:.2f}) over an artificial digital canvas void (corner noise std: {min_corner_noise:.2f}). Typical of diffusion/neural rendering."
            elif channel_variance_ratio > 2.2:
                spatial_score = 62.0
                note = f"Chrominance channel noise imbalance (ratio: {channel_variance_ratio:.2f})."
            elif roughness > 12.0 and noise_residual_std > 12.0:
                # Strong natural optical texture and camera sensor noise
                spatial_score = max(10.0, min(28.0, 35.0 - (roughness - 12.0)))
                note = f"Consistent physical sensor noise and natural optical texture roughness ({roughness:.2f}, residual: {noise_residual_std:.2f})."
            else:
                spatial_score = 42.0
                note = f"Standard optical texture balance (roughness: {roughness:.2f}, residual: {noise_residual_std:.2f})."

            return {
                "score": round(spatial_score, 2),
                "roughness": round(roughness, 2),
                "noise_residual_std": round(noise_residual_std, 2),
                "channel_variance_ratio": round(channel_variance_ratio, 2),
                "note": note
            }

    except Exception as e:
        return {
            "score": 35.0,
            "error": str(e),
            "note": f"Spatial texture analysis error: {e}"
        }
