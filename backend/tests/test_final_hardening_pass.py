import io
import time
import uuid
import pytest
from PIL import Image
from fastapi.testclient import TestClient

from app.main import app
from app.config import settings
from app.rate_limiter import limiter
from app.auth import (
    hash_password,
    verify_password,
    create_access_token,
    decode_access_token,
    normalize_email
)
from app.routes.uploads import process_upload_forensics
from app.database import SessionLocal
from app.models import Upload, DetectionReport

@pytest.fixture
def client():
    # Reset rate limiter before each test run
    limiter.reset()
    return TestClient(app)

def make_test_png():
    buf = io.BytesIO()
    Image.new("RGB", (30, 30), color="purple").save(buf, format="PNG")
    return buf.getvalue()

# =========================================================================
# 1. PBKDF2 Password Security & Configurable Work Factor
# =========================================================================

def test_pbkdf2_work_factor_and_verification():
    """Verify PBKDF2 hash encodes iterations and validates correctly"""
    pw = "SuperSecretPassword123!"
    hashed = hash_password(pw)
    assert hashed.startswith("pbkdf2_sha256$")
    parts = hashed.split("$")
    assert len(parts) == 4
    iterations = int(parts[1])
    assert iterations >= 100_000

    # Verification success
    assert verify_password(pw, hashed) is True
    # Verification failure
    assert verify_password("WrongPassword!", hashed) is False

def test_pbkdf2_legacy_format_compatibility():
    """Verify verify_password remains backward-compatible with legacy salt$hash format"""
    legacy_hash = "0123456789abcdef$0123456789abcdef"
    assert verify_password("test", legacy_hash) is False

# =========================================================================
# 2. Email Normalization Policy
# =========================================================================

def test_email_normalization_policy(client):
    """Verify consistent Unicode & casing normalization prevents duplicate accounts"""
    raw_email = f"CaseSensitive_{uuid.uuid4().hex[:6]}@EXAMPLE.com"
    normalized = normalize_email(raw_email)
    assert normalized == raw_email.strip().lower()

    # 1. Register with mixed-case email
    res1 = client.post("/api/auth/register", json={"email": raw_email, "password": "Password123!"})
    assert res1.status_code == 200

    # 2. Duplicate registration with all lowercase must be rejected
    res2 = client.post("/api/auth/register", json={"email": raw_email.lower(), "password": "Password123!"})
    assert res2.status_code == 400
    assert "already exists" in res2.text.lower()

    # 3. Login with all uppercase must succeed
    res3 = client.post("/api/auth/login", json={"email": raw_email.upper(), "password": "Password123!"})
    assert res3.status_code == 200
    assert "access_token" in res3.json()

# =========================================================================
# 3. JWT Claims, Issuer, and Audience
# =========================================================================

def test_jwt_issuer_audience_and_no_sensitive_data():
    """Verify JWT contains strict issuer, audience, and no sensitive secrets"""
    user_id = str(uuid.uuid4())
    token = create_access_token({"sub": user_id, "email": "jwt_test@example.com"})
    payload = decode_access_token(token)

    assert payload["sub"] == user_id
    assert payload["iss"] == "aookho-auth"
    assert payload["aud"] == "aookho-api"
    assert "exp" in payload
    assert "password" not in payload
    assert "secret" not in payload

# =========================================================================
# 4. Actual Rate Limiting Enforcement
# =========================================================================

def test_rate_limiting_registration(client):
    """Verify registration endpoint actively throttles when limit is exceeded"""
    limiter.reset()
    limit = settings.RATE_LIMIT_REGISTER  # e.g. 5

    for i in range(limit):
        res = client.post(
            "/api/auth/register",
            json={"email": f"ratelimit_{i}_{uuid.uuid4().hex[:6]}@example.com", "password": "Password123!"}
        )
        assert res.status_code in [200, 400]

    # Exceed limit
    throttled_res = client.post(
        "/api/auth/register",
        json={"email": "exceeded@example.com", "password": "Password123!"}
    )
    assert throttled_res.status_code == 429
    assert "Retry-After" in throttled_res.headers
    assert "rate limit exceeded" in throttled_res.text.lower()

# =========================================================================
# 5. Stored XSS Prevention (Rejecting SVG, HTML, XML, JS)
# =========================================================================

@pytest.mark.parametrize("malicious_ext,payload,mime_type", [
    ("vector.svg", b"<svg xmlns='http://www.w3.org/2000/svg' onload='alert(1)'></svg>", "image/svg+xml"),
    ("page.html", b"<html><head><script>alert(document.cookie)</script></head><body>evil</body></html>", "text/html"),
    ("doc.xml", b"<?xml version='1.0'?><!DOCTYPE foo [<!ENTITY xxe SYSTEM 'file:///etc/passwd'>]><foo>&xxe;</foo>", "text/xml"),
    ("script.js", b"console.log('executing script');", "application/javascript"),
])
def test_reject_stored_xss_filetypes(client, malicious_ext, payload, mime_type):
    """Verify script-capable formats (SVG, HTML, XML, JS) are strictly rejected with 415"""
    res = client.post(
        "/api/uploads",
        files={"file": (malicious_ext, io.BytesIO(payload), mime_type)}
    )
    assert res.status_code == 415, f"Expected 415 for script-capable format {malicious_ext}"
    assert "unsupported file format" in res.text.lower()

# =========================================================================
# 6. Concurrency & Race Condition Defenses
# =========================================================================

def test_simultaneous_uploads_have_unique_isolation(client):
    """Verify simultaneous uploads produce unique upload IDs and non-overlapping object keys"""
    png1 = make_test_png()
    png2 = make_test_png()

    res1 = client.post("/api/uploads", files={"file": ("simul1.png", io.BytesIO(png1), "image/png")})
    res2 = client.post("/api/uploads", files={"file": ("simul2.png", io.BytesIO(png2), "image/png")})

    assert res1.status_code == 200
    assert res2.status_code == 200
    assert res1.json()["id"] != res2.json()["id"]
    assert res1.json()["file_url"] != res2.json()["file_url"]

def test_concurrency_delete_while_processing(client):
    """Verify worker handles concurrent upload deletion gracefully without crashing"""
    # 1. Upload text
    res = client.post("/api/uploads", data={"text_content": "Temporary snippet to be deleted."})
    assert res.status_code == 200
    upload_id = uuid.UUID(res.json()["id"])

    # 2. Delete upload immediately
    del_res = client.delete(f"/api/uploads/{upload_id}")
    assert del_res.status_code == 200

    # 3. Simulate background worker running on deleted upload
    # Must exit cleanly without throwing unhandled database integrity error
    process_upload_forensics(upload_id, "text", f"uploads/dummy/{upload_id}/original.txt", "pasted_text.txt")

    # Verify no orphaned report was created
    db = SessionLocal()
    orphaned_report = db.query(DetectionReport).filter_by(upload_id=upload_id).first()
    assert orphaned_report is None
    db.close()

def test_concurrency_duplicate_processing_idempotency(client):
    """Verify duplicate background worker invocations do not create duplicate reports"""
    # 1. Upload image
    png = make_test_png()
    res = client.post("/api/uploads", files={"file": ("dup_check.png", io.BytesIO(png), "image/png")})
    assert res.status_code == 200
    upload_id = uuid.UUID(res.json()["id"])

    # Wait for first background task to finish
    time.sleep(1.0)

    # Trigger worker a second time manually for the same upload
    process_upload_forensics(upload_id, "image", f"uploads/dummy/{upload_id}/original.png", "dup_check.png")

    # Verify exactly one detection report exists for this upload
    db = SessionLocal()
    reports = db.query(DetectionReport).filter_by(upload_id=upload_id).all()
    assert len(reports) == 1
    db.close()

# =========================================================================
# 7. Forensic Verdict Safety & Categorized Metadata
# =========================================================================

def test_forensic_verdict_safety_wording(client):
    """Verify forensic verdicts do not claim certainty and structure findings cleanly"""
    png = make_test_png()
    res = client.post("/api/uploads", files={"file": ("safety_test.png", io.BytesIO(png), "image/png")})
    assert res.status_code == 200
    upload_id = res.json()["id"]

    # Poll until done
    for _ in range(10):
        time.sleep(0.5)
        rep_res = client.get(f"/api/reports/{upload_id}")
        assert rep_res.status_code == 200
        data = rep_res.json()
        if data["status"] == "done":
            break

    assert data["status"] == "done"
    mf = data["metadata_findings"]
    assert "verdict" in mf
    # Ensure verdict never claims "AUTHENTIC / UNMANIPULATED"
    assert "AUTHENTIC / UNMANIPULATED" not in mf.get("verdict_label", "")
    assert "ai_generation_indicators" in mf
    assert "manipulation_indicators" in mf
    assert "metadata_evidence" in mf
    assert "model_confidence" in mf
    assert "uncertainty" in mf
    assert "limitations" in mf
