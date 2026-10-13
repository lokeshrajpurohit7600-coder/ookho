import os
import sys
import logging
from pathlib import Path

# Signal Vercel serverless environment
os.environ["VERCEL"] = "1"

# Add backend directory to sys.path so app modules are resolvable
current_dir = Path(__file__).resolve().parent
root_dir = current_dir.parent
backend_dir = root_dir / "backend"

if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

# Import the existing FastAPI app instance and init_db
from app.main import app
from app.database import init_db

# Initialize database schema on cold start
try:
    init_db()
except Exception as e:
    logging.getLogger("aookho.vercel").warning(f"Database initialization warning on cold start: {e}")
