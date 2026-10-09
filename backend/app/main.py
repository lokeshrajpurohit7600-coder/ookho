import time
import uuid
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text

from app.config import settings
from app.database import init_db, SessionLocal
from app.routes import uploads, reports, assistant, auth

# Structured logging setup
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [%(name)s] %(message)s"
)
logger = logging.getLogger("aookho.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing Aookho backend services...")
    init_db()
    yield
    logger.info("Shutting down Aookho backend services...")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="AI-Generated and Deepfake Content Detection Platform API",
    version="2.0.0",
    lifespan=lifespan
)

# 1. Security Headers & Request ID Middleware
@app.middleware("http")
async def security_and_logging_middleware(request: Request, call_next):
    request_id = request.headers.get("X-Request-ID") or uuid.uuid4().hex
    request.state.request_id = request_id

    # Guest session continuity
    incoming_session = request.headers.get("X-Session-ID") or request.cookies.get("aookho_session")
    session_id = incoming_session or uuid.uuid4().hex
    request.state.session_id = session_id

    start_time = time.time()
    response = await call_next(request)
    elapsed_ms = round((time.time() - start_time) * 1000, 2)

    response.headers["X-Request-ID"] = request_id

    # Session cookie persistence if not previously present
    if not request.cookies.get("aookho_session"):
        response.set_cookie(
            key="aookho_session",
            value=session_id,
            httponly=True,
            samesite="lax"
        )

    # Security Headers
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"

    # Safe structured logging without logging request bodies, tokens, or secrets
    logger.info(
        f"req_id={request_id} method={request.method} path={request.url.path} "
        f"status={response.status_code} latency_ms={elapsed_ms}"
    )
    return response

# 2. CORS Configuration (Strict origins in production, no wildcard with credentials)
cors_origins = settings.CORS_ORIGINS
if settings.ENVIRONMENT == "development":
    cors_origins = settings.CORS_ORIGINS + ["http://localhost:3000", "http://127.0.0.1:3000"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["X-Request-ID"]
)

# 3. Mount local uploads static directory only when explicitly configured for local development
if settings.STORAGE_PROVIDER == "local":
    settings.STORAGE_DIR.mkdir(parents=True, exist_ok=True)
    app.mount("/uploads", StaticFiles(directory=str(settings.STORAGE_DIR)), name="uploads")


# 4. Standardized Error Handling (No stack-trace or internal query leakage)
@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    req_id = getattr(request.state, "request_id", "unknown")
    response_headers = {"X-Request-ID": req_id}
    if hasattr(exc, "headers") and exc.headers:
        response_headers.update(exc.headers)

    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": f"HTTP_{exc.status_code}",
                "message": exc.detail,
                "request_id": req_id
            }
        },
        headers=response_headers
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    req_id = getattr(request.state, "request_id", "unknown")
    # Clean validation errors for clients
    errors = [
        {"field": ".".join(str(loc) for loc in err["loc"]), "message": err["msg"]}
        for err in exc.errors()
    ]
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Invalid request parameters.",
                "details": errors,
                "request_id": req_id
            }
        },
        headers={"X-Request-ID": req_id}
    )

@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    req_id = getattr(request.state, "request_id", "unknown")
    logger.error(f"Unhandled server error [req_id={req_id}]: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An internal server error occurred. Please try again later.",
                "request_id": req_id
            }
        },
        headers={"X-Request-ID": req_id}
    )

# 5. Include API Routers
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["Authentication"])
app.include_router(uploads.router, prefix=settings.API_V1_STR, tags=["Uploads"])
app.include_router(reports.router, prefix=settings.API_V1_STR, tags=["Reports"])
app.include_router(assistant.router, prefix="/api/assistant", tags=["Assistant"])

# 6. Health & Readiness Probes (Phase 18)
@app.get("/health")
@app.get("/api/health")
def liveness_probe():
    """
    Kubernetes / Docker Liveness probe verifying server responds.
    """
    return {
        "status": "healthy",
        "service": "Aookho Detection API",
        "environment": settings.ENVIRONMENT,
        "storage_provider": settings.STORAGE_PROVIDER
    }

@app.get("/ready")
@app.get("/api/ready")
def readiness_probe():
    """
    Readiness probe verifying database connectivity and storage readiness.
    """
    db_status = "ok"
    try:
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
    except Exception as e:
        logger.error(f"Readiness check failed for database: {e}")
        db_status = "unavailable"

    is_ready = (db_status == "ok")
    status_code = status.HTTP_200_OK if is_ready else status.HTTP_503_SERVICE_UNAVAILABLE

    return JSONResponse(
        status_code=status_code,
        content={
            "status": "ready" if is_ready else "not_ready",
            "database": db_status,
            "storage": settings.STORAGE_PROVIDER,
            "environment": settings.ENVIRONMENT
        }
    )

@app.get("/")
def root():
    return {
        "message": "Welcome to Aookho Deepfake & AI Detection API",
        "docs": "/docs",
        "health": "/health",
        "ready": "/ready"
    }
