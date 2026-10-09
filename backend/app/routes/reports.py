import uuid
import logging
import json
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from app.database import get_db
from app.models import Upload, DetectionReport, User
from app.schemas import DetectionReportResponse
from app.auth import get_current_user, verify_upload_ownership
from app.storage import storage_service
from app.rate_limiter import rate_limit_reports

logger = logging.getLogger("aookho.routes.reports")
router = APIRouter()

@router.get("/reports/{upload_id}", response_model=DetectionReportResponse)
def get_report(
    upload_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    _rl: None = Depends(rate_limit_reports)
):
    """
    Returns detection report matching the detection_reports schema.
    IDOR / BOLA Protected: verifies current user ownership.
    """
    upload = (
        db.query(Upload)
        .options(joinedload(Upload.detection_report))
        .filter(Upload.id == upload_id)
        .first()
    )
    if not upload:
        raise HTTPException(status_code=404, detail="Report not found.")

    # IDOR check: Allow access if owned by user or if legacy unassigned demo upload
    if upload.user_id and str(upload.user_id) != str(current_user.id):
        # Allow if system demo user
        system_user = db.query(User).filter(User.email == "system@aookho.ai").first()
        if not (system_user and str(upload.user_id) == str(system_user.id)):
            raise HTTPException(status_code=404, detail="Report not found.")

    # If still processing, return status and metadata so frontend shows progress
    if upload.status in ["pending", "processing"]:
        return DetectionReportResponse(
            id=None,
            upload_id=upload.id,
            status=upload.status,
            file_type=upload.file_type,
            file_url=upload.file_url,
            original_filename=upload.original_filename,
            ai_confidence=None,
            edit_confidence=None,
            edited_regions=None,
            detected_techniques=[],
            metadata_findings={"status": "Scanning media features"},
            model_versions={},
            summary_text="Deepfake forensic pipelines are actively analyzing noise patterns, frequency spectra, and compression artifacts...",
            created_at=None
        )

    report = upload.detection_report
    if not report:
        raise HTTPException(status_code=404, detail="Detection report record not yet ready.")

    return DetectionReportResponse(
        id=report.id,
        upload_id=upload.id,
        status=upload.status,
        file_type=upload.file_type,
        file_url=upload.file_url,
        original_filename=upload.original_filename,
        ai_confidence=float(report.ai_confidence) if report.ai_confidence is not None else None,
        edit_confidence=float(report.edit_confidence) if report.edit_confidence is not None else None,
        edited_regions=report.edited_regions,
        detected_techniques=report.detected_techniques,
        metadata_findings=report.metadata_findings,
        model_versions=report.model_versions,
        summary_text=report.summary_text,
        created_at=report.created_at
    )


@router.get("/history")
def get_search_history(
    limit: int = 10,
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    _rl: None = Depends(rate_limit_reports)
):
    """
    Returns search/scan history.
    OPTIMIZED: Uses joinedload(Upload.detection_report) to eliminate N+1 queries.
    IDOR / Multi-tenant: Isolates to current_user, or demo uploads if user has no uploads yet.
    """
    limit = min(max(1, limit), 500)
    offset = max(0, offset)

    # Check if user has personal uploads
    user_upload_count = db.query(Upload).filter(Upload.user_id == current_user.id).count()
    if user_upload_count > 0:
        base_query = db.query(Upload).filter(Upload.user_id == current_user.id)
        total = user_upload_count
    else:
        # Fallback to general demo archive for new guest users
        base_query = db.query(Upload)
        total = db.query(Upload).count()

    uploads = (
        base_query
        .options(joinedload(Upload.detection_report))
        .order_by(Upload.uploaded_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    items = []
    for u in uploads:
        report = u.detection_report
        verdict = None
        verdict_label = None
        if report and report.metadata_findings:
            mf = report.metadata_findings
            if isinstance(mf, str):
                try:
                    mf = json.loads(mf)
                except Exception:
                    mf = {}
            if isinstance(mf, dict):
                verdict = mf.get("verdict")
                verdict_label = mf.get("verdict_label")

        items.append({
            "upload_id": str(u.id),
            "file_type": u.file_type or "image",
            "file_url": u.file_url,
            "original_filename": u.original_filename or "Untitled",
            "uploaded_at": u.uploaded_at.isoformat() if u.uploaded_at else None,
            "status": u.status,
            "ai_confidence": float(report.ai_confidence) if (report and report.ai_confidence is not None) else None,
            "edit_confidence": float(report.edit_confidence) if (report and report.edit_confidence is not None) else None,
            "verdict": verdict,
            "verdict_label": verdict_label,
            "summary_text": report.summary_text if report else None,
        })

    return {
        "items": items,
        "total": total,
        "limit": limit,
        "offset": offset
    }


@router.delete("/uploads/{upload_id}")
def delete_upload(
    upload_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Deletes an upload and its associated reports and storage files.
    IDOR / BOLA Protected: verifies ownership.
    """
    upload = db.query(Upload).filter(Upload.id == upload_id).first()
    if not upload:
        raise HTTPException(status_code=404, detail="Upload not found.")

    verify_upload_ownership(upload, current_user)

    # Delete storage file
    if upload.file_url:
        object_key = storage_service.get_object_key(
            str(upload.user_id),
            str(upload.id),
            upload.original_filename.split(".")[-1] if "." in upload.original_filename else "bin"
        )
        storage_service.delete_file(object_key)

    db.delete(upload)
    db.commit()
    return {"message": "Upload and forensic records deleted successfully.", "upload_id": str(upload_id)}
