import uuid
import logging
from datetime import datetime, timezone
from typing import Optional
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from app.database import get_db, SessionLocal
from app.models import Upload, User, DetectionReport
from app.schemas import UploadResponse
from app.storage import storage_service
from app.stubs import generate_stub_report
from app.security import validate_and_read_upload, sanitize_filename
from app.auth import get_current_user, verify_upload_ownership
from app.config import settings
from app.rate_limiter import rate_limit_upload

logger = logging.getLogger("aookho.routes.uploads")
router = APIRouter()

def process_upload_forensics(upload_id: uuid.UUID, file_type: str, object_key: str, original_filename: str):
    """
    Background forensic analysis worker.
    Processes image/video through multi-signal detectors and updates DB record.
    Guarantees idempotency and safe concurrency handling.
    """
    db: Session = SessionLocal()
    temp_local_path: Optional[Path] = None
    try:
        upload = db.query(Upload).filter(Upload.id == upload_id).first()
        if not upload:
            logger.info(f"Upload {upload_id} was removed prior to processing. Aborting worker.")
            return

        # Concurrency / Idempotency check: prevent duplicate report generation
        existing_report = db.query(DetectionReport).filter(DetectionReport.upload_id == upload_id).first()
        if existing_report:
            logger.info(f"Report already exists for upload {upload_id}. Skipping duplicate processing.")
            return

        # Retrieve file locally for analysis
        temp_local_path = storage_service.get_local_path_for_analysis(object_key)

        if file_type == "image":
            from app.forensics import analyze_image_parameters
            param_data = analyze_image_parameters(temp_local_path, original_filename, upload_id=str(upload_id))
            report_data = {
                "id": uuid.uuid4(),
                "upload_id": upload_id,
                "ai_confidence": param_data["ai_confidence"],
                "edit_confidence": param_data["edit_confidence"],
                "edited_regions": param_data["edited_regions"],
                "detected_techniques": param_data["detected_techniques"],
                "metadata_findings": param_data["metadata_findings"],
                "model_versions": {
                    "exif_metadata_scanner": "Aookho-EXIF-v2.1",
                    "sensor_noise_prnu": "Aookho-NoiseFilter-v1.4",
                    "compression_analyzer": "DCT-QuantCheck-v2.0",
                    "synthesis_detector": "Aookho-VisionAudit-v1.2"
                },
                "summary_text": param_data["summary_text"],
                "created_at": param_data["created_at"]
            }
        elif file_type == "video":
            from app.video_forensics import analyze_video_parameters
            param_data = analyze_video_parameters(temp_local_path, original_filename, upload_id=str(upload_id))
            report_data = {
                "id": uuid.uuid4(),
                "upload_id": upload_id,
                "ai_confidence": param_data["ai_confidence"],
                "edit_confidence": param_data["edit_confidence"],
                "edited_regions": param_data["edited_regions"],
                "detected_techniques": param_data["detected_techniques"],
                "metadata_findings": param_data["metadata_findings"],
                "model_versions": {
                    "temporal_analyzer": "Aookho-SeqForensics-v2.1",
                    "video_metadata_scanner": "Aookho-StreamAudit-v1.2",
                    "audio_visual_sync": "SyncNet-LipMatch-v1.4",
                    "codec_inspector": "DCT-QuantCheck-v2.0"
                },
                "summary_text": param_data["summary_text"],
                "created_at": param_data["created_at"]
            }
        else:
            report_data = generate_stub_report(upload_id, file_type)

        created_at_val = report_data.get("created_at")
        if isinstance(created_at_val, str):
            try:
                created_at_val = datetime.fromisoformat(created_at_val)
            except Exception:
                created_at_val = datetime.now(timezone.utc)
        elif not isinstance(created_at_val, datetime):
            created_at_val = datetime.now(timezone.utc)

        report = DetectionReport(
            id=report_data.get("id") or uuid.uuid4(),
            upload_id=upload_id,
            ai_confidence=report_data["ai_confidence"],
            edit_confidence=report_data["edit_confidence"],
            edited_regions=report_data["edited_regions"],
            detected_techniques=report_data["detected_techniques"],
            metadata_findings=report_data["metadata_findings"],
            model_versions=report_data.get("model_versions", {}),
            summary_text=report_data["summary_text"],
            created_at=created_at_val
        )
        # Check again if upload was deleted concurrently while processing
        upload = db.query(Upload).filter(Upload.id == upload_id).first()
        if not upload:
            logger.info(f"Upload {upload_id} was deleted during forensic processing. Aborting report commit.")
            return

        db.add(report)
        upload.status = "done"
        db.commit()
        logger.info(f"Forensic report created successfully for upload {upload_id}")

    except Exception as e:
        logger.error(f"Error processing detection report for {upload_id}: {e}", exc_info=True)
        db.rollback()
        try:
            upload = db.query(Upload).filter(Upload.id == upload_id).first()
            if upload:
                upload.status = "failed"
                db.commit()
        except Exception:
            db.rollback()
    finally:
        db.close()


@router.post("/uploads", response_model=UploadResponse)
async def create_upload(
    background_tasks: BackgroundTasks,
    file: Optional[UploadFile] = File(None),
    text_content: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    _rl: None = Depends(rate_limit_upload)
):
    """
    Accepts media upload (image/video) or text snippet.
    1. Validates magic bytes, size limits, and filename sanitization.
    2. Stores content with structured, non-user-controlled object keys.
    3. Queues asynchronous forensic pipeline in background task.
    """
    if not file and not text_content:
        raise HTTPException(
            status_code=400,
            detail="Either a media file (image/video) or text_content must be provided."
        )

    upload_id = uuid.uuid4()
    original_filename = "content"
    file_type = "image"
    file_url = ""
    object_key = ""

    # 1. Handle file upload with security validation
    if file:
        content, file_type, mime_type, safe_ext = await validate_and_read_upload(file)
        original_filename = sanitize_filename(file.filename)
        file_url, object_key = storage_service.save_file(
            content=content,
            user_id=str(current_user.id),
            upload_id=str(upload_id),
            safe_ext=safe_ext,
            content_type=mime_type
        )

    # 2. Handle text content upload
    elif text_content:
        if len(text_content.encode("utf-8")) > settings.MAX_TEXT_SIZE_BYTES:
            raise HTTPException(
                status_code=413,
                detail=f"Text snippet exceeds maximum allowed size of {settings.MAX_TEXT_SIZE_BYTES // 1024}KB."
            )
        file_type = "text"
        original_filename = "pasted_text.txt"
        file_url, object_key = storage_service.save_text(
            text_content=text_content,
            user_id=str(current_user.id),
            upload_id=str(upload_id)
        )

    # 3. Save Upload row into database
    new_upload = Upload(
        id=upload_id,
        user_id=current_user.id,
        file_type=file_type,
        file_url=file_url,
        original_filename=original_filename,
        uploaded_at=datetime.now(timezone.utc),
        status="processing"
    )
    db.add(new_upload)
    db.commit()
    db.refresh(new_upload)

    # 4. Queue background forensic analysis
    background_tasks.add_task(
        process_upload_forensics,
        upload_id,
        file_type,
        object_key,
        original_filename
    )

    return UploadResponse(
        id=new_upload.id,
        user_id=new_upload.user_id,
        file_type=new_upload.file_type,
        file_url=new_upload.file_url,
        original_filename=new_upload.original_filename,
        uploaded_at=new_upload.uploaded_at,
        status=new_upload.status
    )

@router.get("/uploads/{upload_id}", response_model=UploadResponse)
def get_upload_by_id(
    upload_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieves upload record by ID.
    IDOR / BOLA Protected: verifies current user ownership.
    """
    upload = db.query(Upload).filter(Upload.id == upload_id).first()
    if not upload:
        raise HTTPException(status_code=404, detail="Upload not found.")

    verify_upload_ownership(upload, current_user)
    return upload

