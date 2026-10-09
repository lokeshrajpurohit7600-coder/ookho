# Aookho (आँखो) — AI-Generated & Deepfake Content Detection Platform

Aookho is a synthetic media forensics and deepfake intelligence web application built with **Next.js + Tailwind CSS** on the frontend, **FastAPI** on the backend, **PostgreSQL** for data persistence, and **S3-compatible storage** for uploaded media.

---

## Architecture & Features

1. **Multi-Modal Upload Widget**:
   - Drag-and-drop support for images (`JPG`, `PNG`, `WEBP`) and videos (`MP4`, `MOV`, `WEBM`).
   - Dedicated synthetic text detector tab with live sample generator.
   - Zero-retention audit mode and instant thumbnail preview.

2. **Forensic Report & Visualizer**:
   - **Radial AI-Confidence Gauge**: Visualizing 0–100% estimated likelihood of AI generation/editing alongside a tool/edit confidence sub-meter.
   - **Interactive Spatial Heatmap & Bounding Boxes**: HTML5 Canvas gradient heatmap overlaid on uploaded media with toggleable bounding boxes, hover anomaly tooltips, and opacity slider.
   - **Detected Synthesis Techniques**: Detailed categorization of identified manipulation methods (FaceForensics, GAN spectral noise, corneal specular highlights, missing camera sensor signatures).
   - **Plain-Language Summary & Audio Voice Assistant**: Human-readable narrative explanation with built-in speech synthesis (`window.speechSynthesis`) and animated waveform equalizer.
   - **Forensic Metadata & Model Audit Trail**: Full EXIF inspection and detector version auditability logs.

3. **Backend & Database**:
   - FastAPI REST API with endpoints `POST /api/uploads`, `GET /api/reports/{upload_id}`, and `GET /api/health`.
   - Exact PostgreSQL schema compliance: `users`, `uploads`, `detection_reports`, `voice_sessions`.
   - Boto3 S3-compatible storage with transparent local disk fallback (`backend/storage/uploads`).
   - SQLite auto-fallback when running locally without a live PostgreSQL instance.

---

## Exact PostgreSQL Schema

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  file_type TEXT CHECK (file_type IN ('image','video','text')),
  file_url TEXT,
  original_filename TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT now(),
  status TEXT DEFAULT 'pending' -- pending | processing | done | failed
);

CREATE TABLE detection_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  upload_id UUID REFERENCES uploads(id),
  ai_confidence NUMERIC,        -- 0-100 estimated likelihood AI-generated/edited
  edit_confidence NUMERIC,      -- 0-100 estimated likelihood of manual/AI editing
  edited_regions JSONB,         -- bounding boxes / heatmap coordinates
  detected_techniques JSONB,    -- e.g. ["face-swap","gan-artifact","clone-stamp"]
  metadata_findings JSONB,      -- EXIF anomalies, missing camera data, etc.
  model_versions JSONB,         -- which detectors/APIs contributed, for auditability
  summary_text TEXT,            -- human-readable explanation for voice assistant to read
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE voice_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  upload_id UUID REFERENCES uploads(id),
  transcript JSONB,  -- array of {speaker, text, timestamp}
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## Quick Start (Local Development)

### 1. Backend Setup

```bash
cd backend
python -m venv venv
.\venv\Scripts\activate  # Windows (or source venv/bin/activate on Linux/Mac)
pip install -r requirements.txt

# Run FastAPI backend
python run.py
```
Backend runs at `http://localhost:8000` (API docs at `http://localhost:8000/docs`).

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```
Frontend runs at `http://localhost:3000`.

### 3. Optional: Running PostgreSQL & MinIO via Docker Compose

```bash
docker-compose up -d
```
Set in `.env`:
```env
DATABASE_URL=postgresql://aookho_user:aookho_password@localhost:5432/aookho
S3_ENDPOINT_URL=http://localhost:9000
S3_BUCKET_NAME=aookho-uploads
AWS_ACCESS_KEY_ID=aookho_admin
AWS_SECRET_ACCESS_KEY=aookho_secret_password
```

---

## Running Automated Tests

```bash
cd backend
.\venv\Scripts\pytest -v
```
