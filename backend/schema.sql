-- Aookho Production PostgreSQL Database Schema
-- Hardened with foreign key cascades, check constraints, and performance indexes

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

CREATE TABLE IF NOT EXISTS uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  file_type TEXT NOT NULL CHECK (file_type IN ('image', 'video', 'text')),
  file_url TEXT NOT NULL,
  original_filename TEXT NOT NULL DEFAULT 'uploaded_media',
  uploaded_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'done', 'failed')) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_uploads_user_id ON uploads(user_id);
CREATE INDEX IF NOT EXISTS idx_uploads_uploaded_at ON uploads(uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_uploads_status ON uploads(status);
CREATE INDEX IF NOT EXISTS idx_uploads_user_date ON uploads(user_id, uploaded_at DESC);

CREATE TABLE IF NOT EXISTS detection_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  upload_id UUID UNIQUE NOT NULL REFERENCES uploads(id) ON DELETE CASCADE,
  ai_confidence NUMERIC CHECK (ai_confidence >= 0 AND ai_confidence <= 100),
  edit_confidence NUMERIC CHECK (edit_confidence >= 0 AND edit_confidence <= 100),
  edited_regions JSONB,
  detected_techniques JSONB,
  metadata_findings JSONB,
  model_versions JSONB,
  summary_text TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_reports_upload_id ON detection_reports(upload_id);

CREATE TABLE IF NOT EXISTS voice_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  upload_id UUID NOT NULL REFERENCES uploads(id) ON DELETE CASCADE,
  transcript JSONB,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_voice_sessions_upload_id ON voice_sessions(upload_id);
