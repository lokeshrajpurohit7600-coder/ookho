from pathlib import Path
from typing import Any
from PIL import Image
import numpy as np

def compute_frequency_signal(image_path: Path) -> dict[str, Any]:
    """
    Computes 2D Fast Fourier Transform (FFT) frequency-domain signal.
    Detects periodic lattice spikes and checkerboard artifacts from generative upsamplers.
    """
    try:
        with Image.open(image_path) as img:
            # Convert to grayscale and resize to standard 512x512 for FFT uniformity
            gray = np.array(img.convert("L").resize((512, 512), Image.Resampling.BILINEAR), dtype=float)

            # 2D FFT and shift zero-frequency component to center
            f_transform = np.fft.fft2(gray)
            f_shift = np.fft.fftshift(f_transform)
            magnitude_spectrum = np.abs(f_shift)

            # Log scale magnitude
            log_mag = np.log(magnitude_spectrum + 1e-6)

            h, w = log_mag.shape
            center_y, center_x = h // 2, w // 2

            # Create concentric distance matrix from center
            y_coords, x_coords = np.ogrid[:h, :w]
            dist_from_center = np.sqrt((y_coords - center_y) ** 2 + (x_coords - center_x) ** 2)

            # High-frequency band: radius between 120 and 240 pixels
            high_freq_mask = (dist_from_center >= 120) & (dist_from_center <= 240)
            high_freq_vals = log_mag[high_freq_mask]

            # In natural camera images, high frequencies decay smoothly.
            # In synthetic images, periodic grid artifacts create sharp isolated spikes (high PAPR).
            hf_mean = float(np.mean(high_freq_vals))
            hf_std = float(np.std(high_freq_vals))
            hf_max = float(np.max(high_freq_vals))
            papr = float((hf_max - hf_mean) / (hf_std + 1e-5))

            # Azimuthal symmetry / directional energy variance
            # Synthetic generators often show 4-fold or 8-fold cross patterns in FFT
            cross_mask = (np.abs(y_coords - center_y) <= 4) | (np.abs(x_coords - center_x) <= 4)
            cross_energy = float(np.mean(log_mag[cross_mask & (dist_from_center > 40)]))
            non_cross_energy = float(np.mean(log_mag[(~cross_mask) & (dist_from_center > 40)]))
            directional_spike = cross_energy - non_cross_energy

            # Frequency score calculation
            # Periodic deconvolution / checkerboard artifacts create sharp high-frequency spikes (high PAPR)
            if papr > 4.6:
                freq_score = min(92.0, 60.0 + (papr - 4.6) * 15.0)
                note = f"High-frequency periodic spectral spikes detected (PAPR: {papr:.2f}). Characteristic of generative convolution upsampling."
            elif papr > 3.8 and directional_spike > 2.4:
                freq_score = 52.0 + (papr - 3.8) * 8.0
                note = f"Elevated frequency domain peak ratio (PAPR: {papr:.2f}, directional delta: {directional_spike:.2f})."
            elif papr > 3.4:
                freq_score = 30.0 + (papr - 3.4) * 12.0
                note = f"Moderate frequency distribution with standard natural variance (PAPR: {papr:.2f})."
            else:
                freq_score = max(10.0, min(28.0, papr * 7.0))
                note = f"Natural 1/f² monotonic power decay in frequency spectra (PAPR: {papr:.2f}). No periodic generative grid artifacts."

            return {
                "score": round(freq_score, 2),
                "papr": round(papr, 2),
                "directional_spike": round(directional_spike, 2),
                "hf_mean": round(hf_mean, 2),
                "note": note
            }

    except Exception as e:
        return {
            "score": 30.0,
            "error": str(e),
            "note": f"Frequency analysis error: {e}"
        }
