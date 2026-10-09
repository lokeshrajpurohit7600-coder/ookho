import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Numeric, ForeignKey, CheckConstraint, Boolean, Index
from sqlalchemy.types import Uuid, JSON
from sqlalchemy.orm import relationship
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    uploads = relationship("Upload", back_populates="user", cascade="all, delete-orphan")


class Upload(Base):
    __tablename__ = "uploads"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    user_id = Column(Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    file_type = Column(String, nullable=False)
    file_url = Column(String, nullable=False)
    original_filename = Column(String, nullable=False, default="uploaded_media")
    uploaded_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False, index=True)
    status = Column(String, default="pending", nullable=False, index=True)  # pending | processing | done | failed

    __table_args__ = (
        CheckConstraint("file_type IN ('image', 'video', 'text')", name="check_file_type"),
        CheckConstraint("status IN ('pending', 'processing', 'done', 'failed')", name="check_upload_status"),
        Index("ix_uploads_user_date", "user_id", "uploaded_at"),
    )

    user = relationship("User", back_populates="uploads")
    detection_report = relationship("DetectionReport", back_populates="upload", uselist=False, cascade="all, delete-orphan")
    voice_sessions = relationship("VoiceSession", back_populates="upload", cascade="all, delete-orphan")


class DetectionReport(Base):
    __tablename__ = "detection_reports"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    upload_id = Column(Uuid, ForeignKey("uploads.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    ai_confidence = Column(Numeric(5, 2), nullable=True)     # 0-100 estimated likelihood AI-generated/edited
    edit_confidence = Column(Numeric(5, 2), nullable=True)   # 0-100 estimated likelihood of manual/AI editing
    edited_regions = Column(JSON, nullable=True)             # bounding boxes / heatmap coordinates
    detected_techniques = Column(JSON, nullable=True)        # e.g. ["face-swap","gan-artifact","clone-stamp"]
    metadata_findings = Column(JSON, nullable=True)          # EXIF anomalies, missing camera data, etc.
    model_versions = Column(JSON, nullable=True)             # which detectors/APIs contributed, for auditability
    summary_text = Column(String, nullable=True)             # human-readable explanation for voice assistant
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        CheckConstraint("ai_confidence >= 0 AND ai_confidence <= 100", name="check_ai_confidence_range"),
        CheckConstraint("edit_confidence >= 0 AND edit_confidence <= 100", name="check_edit_confidence_range"),
    )

    upload = relationship("Upload", back_populates="detection_report")


class VoiceSession(Base):
    __tablename__ = "voice_sessions"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    upload_id = Column(Uuid, ForeignKey("uploads.id", ondelete="CASCADE"), nullable=False, index=True)
    transcript = Column(JSON, nullable=True)                 # array of {speaker, text, timestamp}
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    upload = relationship("Upload", back_populates="voice_sessions")
