import uuid
from datetime import datetime, timezone
from typing import Any

def generate_stub_report(upload_id: uuid.UUID, file_type: str = "image") -> dict[str, Any]:
    """
    Generates realistic detection report stub data matching the database schema.
    """
    now = datetime.now(timezone.utc)

    if file_type == "video":
        return {
            "id": uuid.uuid4(),
            "upload_id": upload_id,
            "ai_confidence": 91.2,
            "edit_confidence": 82.0,
            "edited_regions": [
                {
                    "id": "reg-vid-1",
                    "type": "box",
                    "label": "Lip-Sync & Jaw Reenactment",
                    "confidence": 94.5,
                    "box": {"x": 34.0, "y": 42.0, "width": 32.0, "height": 28.0},
                    "description": "Temporal incoherence in oral cavity textures during phoneme articulation."
                },
                {
                    "id": "reg-vid-2",
                    "type": "box",
                    "label": "Blink Frequency & Eyeblink Discontinuity",
                    "confidence": 87.8,
                    "box": {"x": 38.0, "y": 26.0, "width": 24.0, "height": 14.0},
                    "description": "Abnormal inter-blink interval (<1.2s) and unnatural eyelid boundary warping."
                },
                {
                    "type": "heatmap",
                    "points": [
                        {"x": 48.0, "y": 50.0, "intensity": 0.96, "radius": 42},
                        {"x": 44.0, "y": 32.0, "intensity": 0.85, "radius": 36},
                        {"x": 56.0, "y": 32.0, "intensity": 0.82, "radius": 36}
                    ]
                }
            ],
            "detected_techniques": [
                "Neural Head Reenactment (LivePortrait / FOMM)",
                "Audio-to-Video Lip-Sync Synthesis (Wav2Lip)",
                "Temporal Photometric Inconsistency",
                "Frame-to-Frame Landmark Jitter"
            ],
            "metadata_findings": {
                "container_format": "MP4 (ISO Base Media)",
                "fps_stability": "Variable frame rate detected (jitter: 42ms)",
                "codec_signature": "Lavf59.27.100 (FFmpeg synthetic mux)",
                "missing_camera_gyro": True,
                "c2pa_manifest": "No cryptographic provenance manifest detected"
            },
            "model_versions": {
                "temporal_analyzer": "Aookho-SeqForensics-v2.1",
                "audio_visual_sync": "SyncNet-LipMatch-v1.4",
                "face_landmark_tracker": "MediaPipe-Dense3D-v3.0",
                "codec_auditor": "Aookho-StreamAudit-v1.2"
            },
            "summary_text": "Video analysis detected a 91.2% likelihood of deepfake manipulation. Oral cavity micro-movements and temporal lip-sync coherence show significant deviation from natural human speech, accompanied by frame-to-frame landmark jitter around the jawline and unnatural blink intervals.",
            "created_at": now
        }
    elif file_type == "text":
        return {
            "id": uuid.uuid4(),
            "upload_id": upload_id,
            "ai_confidence": 84.7,
            "edit_confidence": 45.0,
            "edited_regions": [
                {
                    "id": "reg-txt-1",
                    "type": "text_span",
                    "label": "Low Perplexity Cluster",
                    "confidence": 91.0,
                    "span": {"start": 0, "end": 140},
                    "description": "Unusually predictable token distribution indicative of autoregressive language generation."
                },
                {
                    "id": "reg-txt-2",
                    "type": "text_span",
                    "label": "Synthetic Rhetorical Pattern",
                    "confidence": 82.5,
                    "span": {"start": 210, "end": 380},
                    "description": "Repetitive tripartite balance clauses and lack of human burstiness in clause lengths."
                }
            ],
            "detected_techniques": [
                "Autoregressive Sequence Predictability",
                "Low Burstiness Across Sentence Lengths",
                "Hallmark Transition Phrasing (e.g. 'It is important to note')",
                "Uniform Syntactic Clause Distribution"
            ],
            "metadata_findings": {
                "reading_grade_level": "College Undergrad (Flesch-Kincaid: 11.4)",
                "burstiness_index": "0.18 (Highly Uniform)",
                "perplexity_score": "16.8 (Consistent with GPT-4 / Claude models)",
                "lexical_diversity": "TTR 0.58 (Repetitive structure)"
            },
            "model_versions": {
                "linguistic_forensics": "Aookho-TextPerplex-v3.0",
                "burstiness_evaluator": "Aookho-BurstMetric-v1.2",
                "stylometric_classifier": "DeBERTa-v3-SyntheticText"
            },
            "summary_text": "Textual analysis reveals an 84.7% probability of synthetic LLM authorship. The text displays uniform sentence burstiness, unusually low perplexity across clauses, and formulaic transitional rhetoric strongly associated with generative language models.",
            "created_at": now
        }
    else:
        # Default: image
        return {
            "id": uuid.uuid4(),
            "upload_id": upload_id,
            "ai_confidence": 88.5,
            "edit_confidence": 74.2,
            "edited_regions": [
                {
                    "id": "reg-img-1",
                    "type": "box",
                    "label": "Facial Boundary Warping",
                    "confidence": 92.4,
                    "box": {"x": 32.0, "y": 20.0, "width": 36.0, "height": 38.0},
                    "description": "High-frequency phase discontinuity along jawline and hairline consistent with synthetic latent diffusion insertion."
                },
                {
                    "id": "reg-img-2",
                    "type": "box",
                    "label": "Iris & Corneal Asymmetry",
                    "confidence": 85.0,
                    "box": {"x": 42.0, "y": 30.0, "width": 16.0, "height": 10.0},
                    "description": "Pupillary corneal reflection direction does not match key light vector in surrounding scene."
                },
                {
                    "id": "reg-img-3",
                    "type": "box",
                    "label": "Fine Texture Inpainting Blend",
                    "confidence": 78.5,
                    "box": {"x": 60.0, "y": 55.0, "width": 18.0, "height": 22.0},
                    "description": "Loss of natural skin pore structure and unnatural gradient smoothing along collar."
                },
                {
                    "type": "heatmap",
                    "points": [
                        {"x": 46.0, "y": 34.0, "intensity": 0.95, "radius": 45},
                        {"x": 54.0, "y": 33.0, "intensity": 0.88, "radius": 40},
                        {"x": 50.0, "y": 48.0, "intensity": 0.72, "radius": 50},
                        {"x": 68.0, "y": 62.0, "intensity": 0.65, "radius": 35}
                    ]
                }
            ],
            "detected_techniques": [
                "Deepfake Face-Swap (InSwap-1024 / SimSwap)",
                "GAN Artifacts & Spectral Checkerboard Noise",
                "Corneal Specular Highlight Asymmetry",
                "Missing C2PA Camera Hardware Signature"
            ],
            "metadata_findings": {
                "exif_status": "Stripped / Altered Metadata",
                "camera_make": None,
                "camera_model": None,
                "software_signature": "Synthetic Media Generator / Stable Diffusion v1.5",
                "color_space_anomaly": True,
                "c2pa_provenance": "Not detected / No hardware root of trust",
                "compression_artifact": "Double JPEG grid misalignment detected"
            },
            "model_versions": {
                "spatial_detector": "EfficientNet-B7-v2.1",
                "frequency_detector": "DCT-ResNet50-v1.4",
                "face_forensics": "FaceForensics++-Xception-v3",
                "metadata_auditor": "Aookho-MetaCheck-v1.0"
            },
            "summary_text": "Analysis indicates an 88.5% likelihood of AI synthesis, with primary indicators around the facial region showing facial boundary warping and high-frequency noise variance typical of latent diffusion face-swapping algorithms. Corneal reflections in the eyes also exhibit directional inconsistencies.",
            "created_at": now
        }
