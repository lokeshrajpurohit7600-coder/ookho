import sqlite3
import uuid
import random
import json
from datetime import datetime, timedelta

DB_PATH = "e:/ookho/backend/aookho.db"

def populate():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    current_count = c.execute("SELECT COUNT(*) FROM uploads").fetchone()[0]
    print(f"Current count: {current_count}")
    target_count = 215

    if current_count >= target_count:
        print(f"Already have {current_count} items (>= {target_count}).")
        conn.close()
        return

    items_to_add = target_count - current_count
    print(f"Adding {items_to_add} realistic forensic history samples...")

    sample_images = [
        "portrait_midjourney_v6.png",
        "deepfake_news_anchor.mp4",
        "instagram_influencer_portrait.jpg",
        "sdxl_cyberpunk_cityscape.webp",
        "cctv_security_footage_cam2.mp4",
        "nikon_d850_landscape_raw.jpg",
        "whatsapp_viral_video_claim.mp4",
        "synthetic_speech_transcript.txt",
        "flux_photoreal_human_face.png",
        "drone_aerial_survey_042.jpg",
        "ai_generated_passport_photo.png",
        "conference_keynote_speech.txt",
        "tiktok_dance_swap_deepfake.mp4",
        "canon_eos_r5_wildlife.jpg",
        "stable_diffusion_inpainting_edit.png",
        "press_conference_audio_leak.mp4",
        "academic_paper_abstract.txt",
        "dalle3_illustration_concept.png",
        "satellite_imagery_urban_scan.jpg",
        "financial_report_statement.txt"
    ]

    techniques_pool = [
        ["Deepfake Face-Swap (InSwap-1024)", "GAN Artifacts & Spectral Checkerboard"],
        ["Latent Diffusion Texture Smoothing", "Missing C2PA Camera Signature"],
        ["Natural Sensor PRNU Pattern", "Valid Hardware Root of Trust"],
        ["DCT Frequency Anomalies", "Corneal Specular Highlight Asymmetry"],
        ["Temporal Inter-frame Jitter", "Optical Flow Discontinuity"],
        ["Linguistic Stylometry Uniformity", "Low Burstiness Index"]
    ]

    base_time = datetime.now()

    for i in range(items_to_add):
        upload_id = uuid.uuid4().hex
        user_id = "68696756163d41e6837608923b26e772"
        filename = random.choice(sample_images)
        ext = filename.split(".")[-1]
        
        if ext in ["mp4", "mov"]:
            file_type = "video"
        elif ext in ["txt"]:
            file_type = "text"
        else:
            file_type = "image"

        file_url = f"http://localhost:8000/uploads/{upload_id[:16]}.{ext}"
        
        # Stagger time: from 10 minutes ago down to 30 days ago
        time_offset_minutes = random.randint(15, 60 * 24 * 30)
        uploaded_at = (base_time - timedelta(minutes=time_offset_minutes)).isoformat()
        status = "done"

        # Forensic findings
        is_ai = random.random() > 0.45
        if is_ai:
            ai_conf = round(random.uniform(72.0, 99.2), 1)
            edit_conf = round(random.uniform(65.0, 95.0), 1)
            verdict = "synthetic"
            verdict_label = "HIGH RISK (SYNTHETIC MEDIA)"
            summary = f"Forensic analysis detected strong mathematical artifacts consistent with generative AI diffusion pipelines ({ai_conf}% likelihood). Multiple anomalies flagged in spectral domain and spatial textures."
        else:
            ai_conf = round(random.uniform(4.0, 32.0), 1)
            edit_conf = round(random.uniform(2.0, 25.0), 1)
            verdict = "authentic"
            verdict_label = "AUTHENTIC (NATURAL SENSOR MEDIA)"
            summary = f"Natural physical camera sensor noise and consistent frequency spectrum verified ({100 - ai_conf}% authentic confidence). No synthetic generative signatures detected."

        meta_findings = {
            "verdict": verdict,
            "verdict_label": verdict_label,
            "exif_status": "Valid EXIF Header" if not is_ai else "Altered / Incomplete EXIF",
            "c2pa_provenance": "Hardware Validated" if not is_ai else "No C2PA Provenance"
        }

        # Insert upload
        c.execute("""
            INSERT INTO uploads (id, user_id, file_type, file_url, original_filename, uploaded_at, status)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (upload_id, user_id, file_type, file_url, f"{upload_id[:4]}_{filename}", uploaded_at, status))

        # Insert detection_report
        report_id = uuid.uuid4().hex
        techs = json.dumps(random.choice(techniques_pool))
        c.execute("""
            INSERT INTO detection_reports (id, upload_id, ai_confidence, edit_confidence, edited_regions, detected_techniques, metadata_findings, model_versions, summary_text, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            report_id,
            upload_id,
            ai_conf,
            edit_conf,
            "[]",
            techs,
            json.dumps(meta_findings),
            json.dumps({"pipeline": "Aookho-Ensemble-v2"}),
            summary,
            uploaded_at
        ))

    conn.commit()
    final_count = c.execute("SELECT COUNT(*) FROM uploads").fetchone()[0]
    print(f"Done! Database now has {final_count} uploads and reports.")
    conn.close()

if __name__ == "__main__":
    populate()
