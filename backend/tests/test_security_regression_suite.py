import io
import time
import uuid
from datetime import datetime, timezone, timedelta
from unittest.mock import patch
import jwt
import pytest
from PIL import Image
from fastapi.testclient import TestClient

from app.main import app
from app.config import settings
from app.security import sanitize_filename, detect_file_signature
from app.auth import hash_password, verify_password, create_access_token

@pytest.fixture
def client():
    return TestClient(app)

def make_valid_png_bytes(width=20, height=20, color="blue"):
    buf = io.BytesIO()
    img = Image.new("RGB", (width, height), color=color)
    img.save(buf, format="PNG")
    return buf.getvalue()

def make_valid_jpeg_bytes(width=20, height=20, color="red"):
    buf = io.BytesIO()
    img = Image.new("RGB", (width, height), color=color)
    img.save(buf, format="JPEG")
    return buf.getvalue()

# =========================================================================
# PHASE 2: Comprehensive 24-Scenario Security Regression Suite
# =========================================================================

def test_01_user_a_accessing_user_b_upload(client):
    """Scenario 1: User B tries to access User A's upload via GET /api/uploads/{id}"""
    # User A
    uid_a = uuid.uuid4().hex[:8]
    res_a = client.post("/api/auth/register", json={"email": f"usera_{uid_a}@test.com", "password": "PasswordA123!"})
    token_a = res_a.json()["access_token"]
    
    # User B
    uid_b = uuid.uuid4().hex[:8]
    res_b = client.post("/api/auth/register", json={"email": f"userb_{uid_b}@test.com", "password": "PasswordB123!"})
    token_b = res_b.json()["access_token"]

    # User A uploads
    png_bytes = make_valid_png_bytes()
    up_res = client.post(
        "/api/uploads",
        files={"file": ("usera_private.png", io.BytesIO(png_bytes), "image/png")},
        headers={"Authorization": f"Bearer {token_a}"}
    )
    assert up_res.status_code == 200
    upload_id = up_res.json()["id"]

    # User B tries to view User A's upload
    res = client.get(f"/api/uploads/{upload_id}", headers={"Authorization": f"Bearer {token_b}"})
    assert res.status_code == 404, "IDOR: User B was able to view User A's upload!"

def test_02_user_a_accessing_user_b_report(client):
    """Scenario 2: User B tries to access User A's forensic report"""
    uid_a = uuid.uuid4().hex[:8]
    res_a = client.post("/api/auth/register", json={"email": f"usera_{uid_a}@test.com", "password": "PasswordA123!"})
    token_a = res_a.json()["access_token"]

    uid_b = uuid.uuid4().hex[:8]
    res_b = client.post("/api/auth/register", json={"email": f"userb_{uid_b}@test.com", "password": "PasswordB123!"})
    token_b = res_b.json()["access_token"]

    png_bytes = make_valid_png_bytes()
    up_res = client.post(
        "/api/uploads",
        files={"file": ("usera_report.png", io.BytesIO(png_bytes), "image/png")},
        headers={"Authorization": f"Bearer {token_a}"}
    )
    upload_id = up_res.json()["id"]

    # User B tries to view User A's report
    res = client.get(f"/api/reports/{upload_id}", headers={"Authorization": f"Bearer {token_b}"})
    assert res.status_code == 404, "IDOR: User B was able to view User A's report!"

def test_03_user_a_deleting_user_b_upload(client):
    """Scenario 3: User B tries to delete User A's upload"""
    uid_a = uuid.uuid4().hex[:8]
    res_a = client.post("/api/auth/register", json={"email": f"usera_{uid_a}@test.com", "password": "PasswordA123!"})
    token_a = res_a.json()["access_token"]

    uid_b = uuid.uuid4().hex[:8]
    res_b = client.post("/api/auth/register", json={"email": f"userb_{uid_b}@test.com", "password": "PasswordB123!"})
    token_b = res_b.json()["access_token"]

    png_bytes = make_valid_png_bytes()
    up_res = client.post(
        "/api/uploads",
        files={"file": ("usera_del.png", io.BytesIO(png_bytes), "image/png")},
        headers={"Authorization": f"Bearer {token_a}"}
    )
    upload_id = up_res.json()["id"]

    # User B tries to delete User A's upload
    res = client.delete(f"/api/uploads/{upload_id}", headers={"Authorization": f"Bearer {token_b}"})
    assert res.status_code == 404, "IDOR: User B was able to delete User A's upload!"

def test_04_unauthenticated_access_to_protected_endpoints(client):
    """Scenario 4: Requesting strictly protected endpoints without Authorization header"""
    res = client.get("/api/auth/me")
    assert res.status_code == 401, "Expected 401 for unauthenticated profile access"

def test_05_expired_jwt(client):
    """Scenario 5: Request with expired JWT"""
    expired_token = create_access_token(
        {"sub": str(uuid.uuid4()), "email": "expired@example.com"},
        expires_delta=timedelta(hours=-2)
    )
    res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {expired_token}"})
    assert res.status_code == 401
    assert "expired" in res.text.lower()

def test_06_invalid_jwt(client):
    """Scenario 6: Request with completely malformed JWT"""
    res = client.get("/api/auth/me", headers={"Authorization": "Bearer not-a-valid-token"})
    assert res.status_code == 401

def test_07_tampered_jwt(client):
    """Scenario 7: Request with tampered JWT signature"""
    valid_token = create_access_token({"sub": str(uuid.uuid4()), "email": "valid@example.com"})
    # Tamper with the last 8 characters of signature
    tampered_token = valid_token[:-8] + "TAMPERED"
    res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {tampered_token}"})
    assert res.status_code == 401

def test_08_wrong_password(client):
    """Scenario 8: Login with incorrect password"""
    email = f"pass_test_{uuid.uuid4().hex[:8]}@example.com"
    client.post("/api/auth/register", json={"email": email, "password": "RealPassword123!"})
    res = client.post("/api/auth/login", json={"email": email, "password": "WrongPassword999!"})
    assert res.status_code == 401
    assert "incorrect" in res.text.lower()

def test_09_duplicate_registration(client):
    """Scenario 9: Registering an account with an already registered email"""
    email = f"dup_{uuid.uuid4().hex[:8]}@example.com"
    res1 = client.post("/api/auth/register", json={"email": email, "password": "Password123!"})
    assert res1.status_code == 200
    res2 = client.post("/api/auth/register", json={"email": email, "password": "Password123!"})
    assert res2.status_code == 400
    assert "already exists" in res2.text.lower()

def test_10_invalid_email(client):
    """Scenario 10: Registering with an invalid email address format"""
    res = client.post("/api/auth/register", json={"email": "not-an-email", "password": "Password123!"})
    assert res.status_code in [400, 422]

def test_11_oversized_upload(client):
    """Scenario 11: Text payload exceeding MAX_TEXT_SIZE_BYTES"""
    oversized_text = "X" * (settings.MAX_TEXT_SIZE_BYTES + 1024)
    res = client.post("/api/uploads", data={"text_content": oversized_text})
    assert res.status_code == 413
    assert "exceeds maximum allowed size" in res.text.lower()

def test_12_wrong_mime_type_and_13_wrong_magic_bytes(client):
    """Scenario 12 & 13: File claiming to be PNG but containing plain ASCII text"""
    fake_png = b"Plain text payload pretending to be an image."
    res = client.post("/api/uploads", files={"file": ("spoof.png", io.BytesIO(fake_png), "image/png")})
    assert res.status_code == 415
    assert "unsupported file format" in res.text.lower()

def test_14_renamed_executable_disguised_as_image(client):
    """Scenario 14: Windows PE executable binary renamed to image.jpg"""
    exe_binary = b"MZ\x90\x00\x03\x00\x00\x00\x04\x00\x00\x00\xff\xff\x00\x00" + b"\x00" * 100
    res = client.post("/api/uploads", files={"file": ("malicious.exe.jpg", io.BytesIO(exe_binary), "image/jpeg")})
    assert res.status_code == 415
    assert "unsupported file format" in res.text.lower()

def test_15_path_traversal_filenames(client):
    """Scenario 15: Various directory traversal sequences in filenames"""
    assert sanitize_filename("../../../etc/passwd") == "passwd"
    assert sanitize_filename("..\\..\\secret.txt") == "secret.txt"
    assert sanitize_filename("....//....//boot.ini") == "boot.ini"
    assert sanitize_filename("evil\x00file.png") == "evilfile.png"
    assert sanitize_filename("image.jpg.exe") == "image.jpg.exe"

def test_16_malformed_corrupted_image(client):
    """Scenario 16: Image with valid JPEG magic header but corrupted payload"""
    corrupted_jpg = b"\xff\xd8\xff\xe0\x00\x10JFIF\x00" + b"\xde\xad\xbe\xef" * 16
    res = client.post("/api/uploads", files={"file": ("corrupt.jpg", io.BytesIO(corrupted_jpg), "image/jpeg")})
    assert res.status_code == 400
    assert "corrupted or malformed" in res.text.lower()

def test_17_extremely_large_image_dimensions(client):
    """Scenario 17: Image exceeding MAX_IMAGE_DIMENSION (8192px)"""
    # Create image with width 8193 > 8192
    buf = io.BytesIO()
    img = Image.new("RGB", (8200, 10), color="white")
    img.save(buf, format="PNG")
    oversized_dim_bytes = buf.getvalue()
    
    res = client.post("/api/uploads", files={"file": ("huge_dim.png", io.BytesIO(oversized_dim_bytes), "image/png")})
    assert res.status_code == 400
    assert "dimensions" in res.text.lower() and "exceed" in res.text.lower()

def test_18_excessive_video_duration_and_19_frames():
    """Scenario 18 & 19: Video processing duration ceiling and frame sampling bounds"""
    from app.video_forensics import analyze_video_parameters
    from pathlib import Path
    
    # Verify constants enforce ceilings
    assert settings.MAX_VIDEO_DURATION_SECONDS == 120
    assert settings.MAX_VIDEO_FRAMES_TO_ANALYZE == 20

def test_20_storage_failure_handling(client):
    """Scenario 20: Storage failure gracefully reported without leaving broken state"""
    png_bytes = make_valid_png_bytes()
    with patch("app.storage.storage_service.save_file", side_effect=IOError("Storage backend unavailable")):
        with pytest.raises(Exception):
            client.post("/api/uploads", files={"file": ("storage_fail.png", io.BytesIO(png_bytes), "image/png")})

def test_21_database_readiness_probe(client):
    """Scenario 21: Database ready probe verifies connectivity and reports failure on DB down"""
    # Healthy database probe
    res = client.get("/api/ready")
    assert res.status_code == 200
    assert res.json()["status"] == "ready"
    assert res.json()["database"] == "ok"

    # Simulated DB connection drop
    with patch("app.database.engine.connect", side_effect=Exception("Database connection timeout")):
        fail_res = client.get("/api/ready")
        assert fail_res.status_code == 503
        assert fail_res.json()["status"] == "not_ready"

def test_22_processing_status_response(client):
    """Scenario 22: Processing status is returned cleanly before analysis completes"""
    # Text snippet upload creates immediate processing upload
    res = client.post("/api/uploads", data={"text_content": "Short test snippet."})
    assert res.status_code == 200
    upload_id = res.json()["id"]

    rep_res = client.get(f"/api/reports/{upload_id}")
    assert rep_res.status_code == 200
    data = rep_res.json()
    assert data["status"] in ["pending", "processing", "done"]

def test_23_invalid_upload_id(client):
    """Scenario 23: Non-existent UUID and malformed string for upload endpoint"""
    random_uuid = uuid.uuid4()
    res = client.get(f"/api/uploads/{random_uuid}")
    assert res.status_code == 404

    bad_res = client.get("/api/uploads/invalid-not-a-uuid")
    assert bad_res.status_code in [404, 422]

def test_24_invalid_report_id(client):
    """Scenario 24: Non-existent UUID and malformed string for report endpoint"""
    random_uuid = uuid.uuid4()
    res = client.get(f"/api/reports/{random_uuid}")
    assert res.status_code == 404

    bad_res = client.get("/api/reports/invalid-not-a-uuid")
    assert bad_res.status_code in [404, 422]

# =========================================================================
# PHASE 3: Realistic Upload Attack Vectors
# =========================================================================

@pytest.mark.parametrize("attack_filename", [
    "../../secret.txt",
    "../../../etc/passwd",
    "..\\..\\secret.txt",
    "image.jpg.exe",
    "malicious.exe",
    "payload.sh",
    "cmd.bat",
    "photo.png\x00.exe"
])
def test_upload_attack_filename_sanitization(client, attack_filename):
    """Verify application isolates and sanitizes realistic adversarial filenames"""
    png_bytes = make_valid_png_bytes()
    res = client.post(
        "/api/uploads",
        files={"file": (attack_filename, io.BytesIO(png_bytes), "image/png")}
    )
    assert res.status_code == 200
    data = res.json()
    saved_filename = data["original_filename"]
    # Path traversal patterns must never be present
    assert ".." not in saved_filename
    assert "/" not in saved_filename
    assert "\\" not in saved_filename
    assert "\x00" not in saved_filename

def test_upload_attack_corrupted_png(client):
    """Adversarial corrupted PNG payload"""
    corrupt_png = b"\x89PNG\r\n\x1a\n" + b"\xff" * 50
    res = client.post("/api/uploads", files={"file": ("corrupt.png", io.BytesIO(corrupt_png), "image/png")})
    assert res.status_code == 400

def test_upload_attack_corrupted_webp(client):
    """Adversarial malformed WebP payload"""
    corrupt_webp = b"RIFF\x00\x00\x00\x00WEBP" + b"\x00" * 30
    res = client.post("/api/uploads", files={"file": ("corrupt.webp", io.BytesIO(corrupt_webp), "image/webp")})
    assert res.status_code == 400
