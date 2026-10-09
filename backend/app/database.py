import logging
import uuid
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from app.config import settings

logger = logging.getLogger("aookho.database")

# Handle SQLite vs Postgres connect args
connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args["check_same_thread"] = False

engine_kwargs = {
    "connect_args": connect_args,
    "echo": False,
    "pool_pre_ping": True,
}
if not settings.DATABASE_URL.startswith("sqlite"):
    engine_kwargs.update({
        "pool_size": 20,
        "max_overflow": 10,
        "pool_recycle": 3600,
    })

engine = create_engine(settings.DATABASE_URL, **engine_kwargs)


SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    """
    Initializes database tables and migrates any missing schema columns/indexes.
    """
    from app.models import User
    
    is_postgres = settings.DATABASE_URL.startswith("postgresql") or settings.DATABASE_URL.startswith("postgres")
    
    if is_postgres:
        logger.info("Initializing PostgreSQL database with schema.sql...")
        try:
            schema_file = settings.BASE_DIR / "schema.sql"
            if schema_file.exists():
                sql_content = schema_file.read_text(encoding="utf-8")
                with engine.begin() as conn:
                    for statement in sql_content.split(";"):
                        stmt = statement.strip()
                        if stmt:
                            conn.execute(text(stmt))
                logger.info("PostgreSQL schema executed successfully.")
        except Exception as e:
            logger.warning(f"Error executing raw schema.sql: {e}. Falling back to metadata creation.")
            Base.metadata.create_all(bind=engine)
    else:
        logger.info("Initializing SQLite database with SQLAlchemy metadata...")
        Base.metadata.create_all(bind=engine)

        # Migration check for SQLite columns on existing tables
        try:
            with engine.begin() as conn:
                cols_result = conn.execute(text("PRAGMA table_info(users)")).fetchall()
                col_names = [r[1] for r in cols_result]
                if "password_hash" not in col_names:
                    conn.execute(text("ALTER TABLE users ADD COLUMN password_hash VARCHAR"))
                    logger.info("Migrated: added 'password_hash' column to users table.")
                if "is_active" not in col_names:
                    conn.execute(text("ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT 1"))
                    logger.info("Migrated: added 'is_active' column to users table.")
        except Exception as e:
            logger.error(f"Migration error for users table: {e}")

    # Ensure a default system user exists
    db = SessionLocal()
    try:
        from app.auth import hash_password
        default_user = db.query(User).filter_by(email="system@aookho.ai").first()
        if not default_user:
            default_user = User(
                id=uuid.uuid4(),
                email="system@aookho.ai",
                password_hash=hash_password("AookhoSystemSecure2026!"),
                is_active=True
            )
            db.add(default_user)
            db.commit()
            logger.info("Default system user created.")
        elif not default_user.password_hash:
            default_user.password_hash = hash_password("AookhoSystemSecure2026!")
            default_user.is_active = True
            db.commit()
    except Exception as e:
        logger.error(f"Error checking/creating default user: {e}")
        db.rollback()
    finally:
        db.close()
