# Implementation Plan: Aookho Deepfake & AI-Generated Content Detection Platform

Build the initial version of **Aookho**, an AI-generated and deepfake content detection platform with a Next.js + Tailwind CSS frontend, a FastAPI backend, a PostgreSQL database (using the exact provided schema), and S3-compatible storage with transparent local fallback.

## User Review Required

> [!IMPORTANT]
> - **Exact PostgreSQL Schema**: We will use the exact PostgreSQL schema provided (`users`, `uploads`, `detection_reports`, `voice_sessions`).
> - **Dual-Mode Database & Storage**:
>   - Backend will connect to PostgreSQL if `DATABASE_URL` is set (e.g. `postgresql+asyncpg://...` or standard postgres connection).
>   - For immediate local zero-config testing when a local PostgreSQL server is not running, the backend seamlessly falls back to an SQLite engine using the identical schema definitions, tables, and JSON columns, so the entire stack works immediately without installation blockers.
>   - For storage, boto3 is configured for S3 / MinIO / Cloudflare R2; if S3 credentials are not configured, it transparently stores uploaded files in a local directory and serves them via FastAPI static mounting.
> - **Directory Structure**:
>   - `frontend/`: Next.js 14/15 App Router + Tailwind CSS + Lucide Icons.
>   - `backend/`: FastAPI + SQLAlchemy + Pydantic + Boto3 / Storage.
>   - Root `docker-compose.yml` for optional 1-command PostgreSQL + MinIO spin-up.

## Proposed Architecture & Changes

### Backend (`/backend`)

#### [NEW] [schema.sql](file:///e:/ookho/backend/schema.sql)
- Contains the exact PostgreSQL DDL provided by the user:
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

#### [NEW] [database.py](file:///e:/ookho/backend/app/database.py)
- Async/sync SQLAlchemy engine and session makers.
- Table initialization helper that creates tables matching the schema.
- Default system user creation (`system@aookho.ai`) to associate uploads when no explicit user login is provided.

#### [NEW] [models.py](file:///e:/ookho/backend/app/models.py)
- SQLAlchemy models for `User`, `Upload`, `DetectionReport`, and `VoiceSession` mapping directly to the exact schema types (`UUID`, `TIMESTAMP(timezone=True)`, `JSON`, `NUMERIC`, `TEXT`).

#### [NEW] [schemas.py](file:///e:/ookho/backend/app/schemas.py)
- Pydantic models for API requests and responses:
  - `UploadResponse`: `upload_id`, `file_type`, `file_url`, `original_filename`, `status`, `uploaded_at`.
  - `DetectionReportResponse`: matches `detection_reports` fields (`ai_confidence`, `edit_confidence`, `edited_regions`, `detected_techniques`, `metadata_findings`, `model_versions`, `summary_text`, `status`).

#### [NEW] [storage.py](file:///e:/ookho/backend/app/storage.py)
- S3 client using `boto3` for AWS S3 / MinIO / Cloudflare R2 compatibility.
- Auto-fallback to local disk storage (`backend/storage/uploads`) if S3 credentials are not set, returning accessible public URLs.

#### [NEW] [stubs.py](file:///e:/ookho/backend/app/stubs.py)
- Stub generator producing realistic forensic detection reports based on file type:
  - For images: Realistic face-swap or GAN artifact bounding boxes (normalized coordinates `[x, y, width, height]`), heatmap intensity clusters, EXIF metadata tampering findings, and acoustic/vision model version signatures.
  - For videos: Frame-level deepfake artifacts and temporal flickering techniques.
  - For text: Perplexity/burstiness scores, repetitive token pattern detection, LLM watermarking traces.
- Includes human-readable plain language summary ready for audio voice playback.

#### [NEW] [routes/uploads.py](file:///e:/ookho/backend/app/routes/uploads.py)
- Endpoint `POST /api/uploads`:
  - Handles multipart uploads with `file` OR `text` input.
  - Automatically identifies `file_type`: `'image'`, `'video'`, or `'text'`.
  - Saves file to S3 / local storage.
  - Creates row in `uploads` table with status `'pending'`.
  - Initiates background stub analysis that updates status to `'done'` and creates the `detection_reports` row.
  - Returns `upload_id` and initial status.

#### [NEW] [routes/reports.py](file:///e:/ookho/backend/app/routes/reports.py)
- Endpoint `GET /api/reports/{upload_id}`:
  - Checks status of the upload in the database.
  - Returns report details if `done`, or status `processing`/`pending` while analysis is underway.

#### [NEW] [main.py](file:///e:/ookho/backend/app/main.py)
- FastAPI app setup with CORS middleware (allowing Next.js origins).
- Mounts `/api/uploads` and `/api/reports`.
- Mounts static file serving for local uploads.
- Health check `GET /api/health`.

---

### Frontend (`/frontend`)

#### [NEW] [Next.js App Configuration](file:///e:/ookho/frontend/package.json)
- Next.js 14/15, React 19, Tailwind CSS, Lucide-react for forensic icons.
- Configured proxy/API URL routing to FastAPI backend (`http://localhost:8000`).

#### [NEW] [Landing Page](file:///e:/ookho/frontend/src/app/page.tsx)
- Modern, dark-mode cybersecurity and forensic aesthetic.
- Hero banner with Aookho branding: "Aookho - Synthetic Media Forensics & Deepfake Intelligence".
- Live capability metrics (e.g. "Facial Warp Detection", "Diffusion Artifact Scanner", "C2PA Provenance Verification").
- Multi-modal Upload Widget:
  - **Image / Video Tab**: Drag-and-drop zone with drag-over visual feedback, file type icons, format restriction tags (`JPG, PNG, WEBP, MP4, MOV, WEBM`), preview display before analysis.
  - **Text Analysis Tab**: Clean textarea for paste-and-detect synthetic/LLM text.
  - "Scan Media" call to action button with animated scanning pulse.

#### [NEW] [Results / Report Page](file:///e:/ookho/frontend/src/app/report/[id]/page.tsx)
- Automatic polling until the report status is `done`.
- Scanning loading animation with step-by-step forensic checklist feedback while waiting.
- Visual components:
  1. **AI Confidence Gauge** ([ConfidenceGauge.tsx](file:///e:/ookho/frontend/src/components/ConfidenceGauge.tsx)):
     - Semi-circular/radial speedometer gauge showing 0-100% estimated likelihood of AI generation.
     - Color coded: Low (<30% Green/Authentic), Moderate (30-65% Yellow/Inconclusive), High (>65% Crimson/Manipulated).
     - Sub-metric for `edit_confidence` (manual retouching vs synthetic generation).
  2. **Heatmap & Bounding Box Overlay** ([HeatmapOverlay.tsx](file:///e:/ookho/frontend/src/components/HeatmapOverlay.tsx)):
     - Interactive HTML5 Canvas overlay layered over the uploaded image or video.
     - Toggleable layers: "Heatmap View", "Bounding Boxes", "Split View (Original vs Flagged)", "Opacity Control".
     - Hoverable flagged regions showing artifact name, confidence, and localized forensic explanation.
  3. **Detected Techniques Card** ([TechniquesList.tsx](file:///e:/ookho/frontend/src/components/TechniquesList.tsx)):
     - Grid of identified manipulation methods (e.g., Face-Swap GAN, Spectral Noise Inconsistency, Clone-Stamp Artifacts, Inpainted Boundary).
     - Forensic severity badges and educational breakdown.
  4. **Plain-Language Summary & Voice Assistant** ([VoiceSummary.tsx](file:///e:/ookho/frontend/src/components/VoiceSummary.tsx)):
     - Human-readable explanation from `summary_text`.
     - "Listen to Voice Summary" button utilizing browser Web Speech API with audio waveform visualization.
  5. **Forensic Metadata & Model Audit** ([MetadataAuditor.tsx](file:///e:/ookho/frontend/src/components/MetadataAuditor.tsx)):
     - EXIF anomaly inspection (stripped metadata, camera serial mismatch, editing software signature).
     - Contributing detector model versions for cryptographic/auditability verification.

---

### Docker & Development Scripts

#### [NEW] [docker-compose.yml](file:///e:/ookho/docker-compose.yml)
- Ready-to-run PostgreSQL database container and MinIO S3 container for users who want Docker-based local services.

#### [NEW] [README.md](file:///e:/ookho/README.md)
- Complete instructions for running backend, frontend, environment variables, schema, and API documentation.

## Verification Plan

### Automated Tests
1. **Backend Integration Tests**:
   - Run Python test script against FastAPI endpoints:
     - Test upload with sample image (`POST /api/uploads`).
     - Test upload with sample video (`POST /api/uploads`).
     - Test upload with sample text (`POST /api/uploads`).
     - Poll report endpoint (`GET /api/reports/{upload_id}`) and verify schema conformity (all required fields present, numeric ranges 0-100, valid JSON structures).
2. **Frontend Build & Lint**:
   - Run `npm run build` in `frontend/` to ensure clean TypeScript compilation and zero build errors.

### Manual Verification
1. Start FastAPI backend on `http://127.0.0.1:8000`.
2. Start Next.js frontend on `http://localhost:3000`.
3. Open `http://localhost:3000` in browser:
   - Verify Aookho branding and hero section render correctly.
   - Upload an image via drag-and-drop.
   - Verify upload progress and transition to report page.
   - Verify the AI confidence gauge animates to the score.
   - Verify heatmap and bounding boxes render over the image and can be toggled.
   - Click "Listen to Voice Summary" to verify speech audio.
   - Test text analysis tab with a sample paragraph.
