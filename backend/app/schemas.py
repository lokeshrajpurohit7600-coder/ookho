import uuid
from datetime import datetime
from typing import Any, Optional
from pydantic import BaseModel, ConfigDict, Field

class UploadResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    upload_id: uuid.UUID = Field(..., alias="id")
    user_id: Optional[uuid.UUID] = None
    file_type: Optional[str] = None
    file_url: Optional[str] = None
    original_filename: Optional[str] = None
    uploaded_at: Optional[datetime] = None
    status: str

class DetectionReportResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: Optional[uuid.UUID] = None
    upload_id: uuid.UUID
    status: str
    file_type: Optional[str] = None
    file_url: Optional[str] = None
    original_filename: Optional[str] = None
    ai_confidence: Optional[float] = None
    edit_confidence: Optional[float] = None
    edited_regions: Optional[Any] = None
    detected_techniques: Optional[list[str]] = None
    metadata_findings: Optional[dict[str, Any]] = None
    model_versions: Optional[dict[str, Any]] = None
    summary_text: Optional[str] = None
    created_at: Optional[datetime] = None

class VoiceSessionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    upload_id: uuid.UUID
    transcript: Optional[list[dict[str, Any]]] = None
    created_at: datetime
