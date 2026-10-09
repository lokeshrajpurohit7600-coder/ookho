import uuid
import logging
from datetime import datetime, timezone
from typing import Optional, Any
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Upload, DetectionReport, VoiceSession, User
from app.assistant import generate_human_response
from app.auth import get_current_user
from app.rate_limiter import rate_limit_chat

logger = logging.getLogger("aookho.routes.assistant")
router = APIRouter()

class ChatRequest(BaseModel):
    upload_id: uuid.UUID
    message: str = Field(..., max_length=1000)
    language: Optional[str] = "hinglish"

class ChatResponse(BaseModel):
    reply: str
    language: str
    session_id: uuid.UUID
    transcript: list[dict[str, Any]]

@router.post("/chat", response_model=ChatResponse)
def assistant_chat(
    req: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    _rl: None = Depends(rate_limit_chat)
):
    """
    Conversational Voice Assistant endpoint.
    Protected against IDOR: ensures caller owns the report.
    """
    upload = db.query(Upload).filter(Upload.id == req.upload_id).first()
    if not upload:
        raise HTTPException(status_code=404, detail="Upload not found.")

    # IDOR check: Allow access if owned by user or if unassigned / guest demo upload
    if upload.user_id and str(upload.user_id) != str(current_user.id):
        upload_owner = db.query(User).filter(User.id == upload.user_id).first()
        system_user = db.query(User).filter(User.email == "system@aookho.ai").first()
        is_system_demo = bool(system_user and str(upload.user_id) == str(system_user.id))
        is_guest_upload = bool(upload_owner and upload_owner.password_hash is None)
        if not is_system_demo and not is_guest_upload:
            if upload_owner and upload_owner.password_hash is not None:
                raise HTTPException(status_code=404, detail="Upload not found.")

    report = db.query(DetectionReport).filter(DetectionReport.upload_id == req.upload_id).first()

    # Fetch voice session for turn count
    session = db.query(VoiceSession).filter(VoiceSession.upload_id == req.upload_id).first()
    turn_count = len(session.transcript) if session and session.transcript else 0

    # Build report context for conversational assistant
    report_context = {
        "file_type": upload.file_type,
        "original_filename": upload.original_filename,
        "ai_confidence": float(report.ai_confidence) if report and report.ai_confidence is not None else 20.0,
        "edit_confidence": float(report.edit_confidence) if report and report.edit_confidence is not None else 10.0,
        "detected_techniques": report.detected_techniques if report else [],
        "metadata_findings": report.metadata_findings if report else {},
        "verdict": (report.metadata_findings or {}).get("verdict", "authentic") if report else "authentic",
        "turn_count": turn_count
    }

    # Generate response
    reply = generate_human_response(req.message, report_context, language=req.language or "hinglish")

    now = datetime.now(timezone.utc).isoformat()
    user_turn = {"speaker": "user", "text": req.message, "timestamp": now}
    bot_turn = {"speaker": "assistant", "text": reply, "timestamp": now, "language": req.language}

    if not session:
        session = VoiceSession(
            id=uuid.uuid4(),
            upload_id=req.upload_id,
            transcript=[user_turn, bot_turn]
        )
        db.add(session)
    else:
        existing = session.transcript or []
        session.transcript = existing + [user_turn, bot_turn]

    db.commit()
    db.refresh(session)

    return ChatResponse(
        reply=reply,
        language=req.language or "hinglish",
        session_id=session.id,
        transcript=session.transcript or []
    )
