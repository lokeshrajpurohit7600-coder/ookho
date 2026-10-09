import os
import sys
from pathlib import Path
from app.forensics import analyze_image_parameters, CALIBRATED_THRESHOLDS

TEST_DIR = Path(__file__).resolve().parent.parent / "test-images"

def run_calibration_and_evaluation():
    print("=" * 80)
    print("CALIBRATING AND TESTING FORENSIC PIPELINE ON BENCHMARK DATASET")
    print(f"Per-Signal Thresholds: {CALIBRATED_THRESHOLDS}")
    print("Multi-Signal Agreement: >= 2 Signals Required for 'Likely AI/Edited'")
    print("=" * 80)

    categories = {
        "Real Camera Photos": TEST_DIR / "real" / "camera",
        "Real Social Media Reshared": TEST_DIR / "real" / "social_media",
        "AI: Stable Diffusion": TEST_DIR / "fake" / "sd",
        "AI: Midjourney": TEST_DIR / "fake" / "midjourney",
        "AI: Composite / Inpainting": TEST_DIR / "fake" / "composite_inpainting"
    }

    results_summary = {}

    for cat_name, cat_dir in categories.items():
        if not cat_dir.exists():
            continue
        
        files = [f for f in cat_dir.iterdir() if f.is_file() and f.suffix.lower() in [".jpg", ".jpeg", ".png", ".webp"]]
        if not files:
            continue

        is_real_category = "real" in str(cat_dir).lower()
        correct_count = 0
        total_count = len(files)

        print(f"\nEvaluating Category: {cat_name} ({total_count} files)")
        print("-" * 80)

        for img_path in files:
            res = analyze_image_parameters(img_path, img_path.name, upload_id="bench-" + img_path.stem)
            raw = res["metadata_findings"]["raw_scores"]
            verdict = res["verdict"]
            triggered = res["metadata_findings"]["triggered_count"]

            print(f"  File: {img_path.name}")
            print(f"    Raw Scores -> ELA: {raw['ela']:4.1f}% | Metadata: {raw['metadata']:4.1f}% | Freq: {raw['frequency']:4.1f}% | Spatial: {raw['spatial']:4.1f}%")
            print(f"    Triggered: {triggered}/4 | Overall AI Confidence: {res['ai_confidence']}% | Verdict: {verdict.upper()}")

            # Check correctness
            if is_real_category:
                # Correct if verdict is authentic or inconclusive (not falsely flagged as likely_ai)
                if verdict in ["authentic", "inconclusive"]:
                    correct_count += 1
                else:
                    print(f"    [FALSE POSITIVE] Expected real, but flagged as {verdict}")
            else:
                # Fake category: correct if verdict is likely_ai
                if verdict == "likely_ai":
                    correct_count += 1
                else:
                    print(f"    [MISSED / INCONCLUSIVE] Expected fake, got {verdict}")

        accuracy = (correct_count / total_count) * 100.0 if total_count > 0 else 0.0
        results_summary[cat_name] = {
            "total": total_count,
            "correct": correct_count,
            "accuracy": accuracy
        }

    print("\n" + "=" * 80)
    print("FINAL ACCURACY REPORT PER CATEGORY")
    print("=" * 80)
    print(f"{'Category':<32} | {'Tested':<8} | {'Correct':<8} | {'Accuracy':<10}")
    print("-" * 80)
    for cat_name, stats in results_summary.items():
        print(f"{cat_name:<32} | {stats['total']:<8} | {stats['correct']:<8} | {stats['accuracy']:5.1f}%")
    print("=" * 80)

if __name__ == "__main__":
    run_calibration_and_evaluation()
