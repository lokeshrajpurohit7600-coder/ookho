import io
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.security import sanitize_filename, detect_file_signature

@pytest.fixture
def client():
    return TestClient(app)

def test_sanitize_filename():
    assert sanitize_filename("../../../etc/passwd") == "passwd"
    assert sanitize_filename("evil\x00file.png") == "evilfile.png"
    assert sanitize_filename("normal_image.JPG") == "normal_image.JPG"
    assert sanitize_filename("...many..dots...png") == "many.dots.png"
    assert len(sanitize_filename("a" * 200 + ".jpg")) <= 100

def test_detect_file_signature():
    # PNG signature
    png_hdr = b"\x89PNG\r\n\x1a\n\x00\x00\x00\r"
    assert detect_file_signature(png_hdr) == ("image/png", ".png")

    # JPEG signature
    jpg_hdr = b"\xff\xd8\xff\xe0\x00\x10JFIF\x00"
    assert detect_file_signature(jpg_hdr) == ("image/jpeg", ".jpg")

    # WebP signature
    webp_hdr = b"RIFF\x00\x00\x00\x00WEBPVP8 "
    assert detect_file_signature(webp_hdr) == ("image/webp", ".webp")

    # Spoofed content
    fake_hdr = b"This is plain text pretending to be a png"
    assert detect_file_signature(fake_hdr) is None

def test_reject_spoofed_upload(client):
    # Upload text with .png filename
    fake_png = b"Not a real PNG header"
    files = {"file": ("malicious.png", io.BytesIO(fake_png), "image/png")}
    res = client.post("/api/uploads", files=files)
    assert res.status_code == 415

def test_reject_oversized_text(client):
    oversized = "a" * (60 * 1024)  # 60 KB > 50 KB limit
    res = client.post("/api/uploads", data={"text_content": oversized})
    assert res.status_code == 413
