"""
Aookho Database Migration & Schema Verification Script
Usage:
    python migrate.py
    or
    python -m migrate
"""
import sys
import logging
from sqlalchemy import text
from app.config import settings
from app.database import engine, Base
from app.models import User, Upload, DetectionReport, VoiceSession

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("aookho.migrate")

def run_migrations():
    logger.info(f"Connecting to database: {settings.DATABASE_URL.split('@')[-1] if '@' in settings.DATABASE_URL else settings.DATABASE_URL}")
    is_postgres = settings.DATABASE_URL.startswith("postgresql") or settings.DATABASE_URL.startswith("postgres")

    try:
        if is_postgres:
            logger.info("Executing PostgreSQL schema.sql...")
            schema_file = settings.BASE_DIR / "schema.sql"
            if schema_file.exists():
                sql_content = schema_file.read_text(encoding="utf-8")
                with engine.begin() as conn:
                    for statement in sql_content.split(";"):
                        stmt = statement.strip()
                        if stmt:
                            conn.execute(text(stmt))
                logger.info("PostgreSQL DDL schema applied successfully.")
            else:
                logger.warning("schema.sql not found; applying SQLAlchemy metadata.")
                Base.metadata.create_all(bind=engine)
        else:
            logger.info("Applying SQLite schema via SQLAlchemy metadata...")
            Base.metadata.create_all(bind=engine)

            # Column verification and evolution for SQLite
            with engine.begin() as conn:
                cols_result = conn.execute(text("PRAGMA table_info(users)")).fetchall()
                col_names = [r[1] for r in cols_result]
                if "password_hash" not in col_names:
                    conn.execute(text("ALTER TABLE users ADD COLUMN password_hash VARCHAR"))
                    logger.info("Added 'password_hash' column to users table.")
                if "is_active" not in col_names:
                    conn.execute(text("ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT 1"))
                    logger.info("Added 'is_active' column to users table.")

        # Verify tables exist
        with engine.connect() as conn:
            if is_postgres:
                res = conn.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema='public';"))
                tables = [r[0] for r in res.fetchall()]
            else:
                res = conn.execute(text("SELECT name FROM sqlite_master WHERE type='table';"))
                tables = [r[0] for r in res.fetchall()]

            logger.info(f"Verified database tables: {tables}")
            required = ["users", "uploads", "detection_reports", "voice_sessions"]
            missing = [t for t in required if t not in tables]
            if missing:
                logger.error(f"Migration verification failed: missing tables {missing}")
                sys.exit(1)

        logger.info("All database migrations and verifications completed successfully.")
        return 0

    except Exception as e:
        logger.error(f"Database migration failed: {e}", exc_info=True)
        sys.exit(1)

if __name__ == "__main__":
    run_migrations()
