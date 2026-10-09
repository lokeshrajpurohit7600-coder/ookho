import io
import time
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal, init_db
from app.models import Upload, DetectionReport

@pytest.fixture(scope="session", autouse=True)
def setup_database():
    init_db()

@pytest.fixture
def client():
    return TestClient(app)

def test_health_check(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"

def make_test_png():
    from PIL import Image
    buf = io.BytesIO()
    img = Image.new("RGB", (10, 10), color="blue")
    img.save(buf, format="PNG")
    return buf.getvalue()

def test_upload_image_and_poll_report(client):
    # 1. Upload mock image
    image_content = make_test_png()
    files = {"file": ("deepfake_sample.png", io.BytesIO(image_content), "image/png")}
    
    upload_res = client.post("/api/uploads", files=files)
    assert upload_res.status_code == 200
    upload_data = upload_res.json()
    
    assert "id" in upload_data
    upload_id = upload_data["id"]
    assert upload_data["file_type"] == "image"
    assert upload_data["status"] in ["pending", "processing", "done"]

    # 2. Poll report endpoint
    # Wait up to 5 seconds for background stub processing
    max_wait = 5.0
    start_time = time.time()
    final_report = None

    while time.time() - start_time < max_wait:
        rep_res = client.get(f"/api/reports/{upload_id}")
        assert rep_res.status_code == 200
        report_json = rep_res.json()
        if report_json["status"] == "done":
            final_report = report_json
            break
        time.sleep(0.5)

    assert final_report is not None, "Report did not transition to done in time."
    assert final_report["status"] == "done"
    assert final_report["upload_id"] == upload_id
    assert final_report["ai_confidence"] is not None
    assert 0 <= final_report["ai_confidence"] <= 100
    assert final_report["edit_confidence"] is not None
    assert 0 <= final_report["edit_confidence"] <= 100
    assert isinstance(final_report["detected_techniques"], list)
    assert len(final_report["detected_techniques"]) > 0
    assert isinstance(final_report["edited_regions"], list)
    assert isinstance(final_report["metadata_findings"], dict)
    assert isinstance(final_report["model_versions"], dict)
    assert isinstance(final_report["summary_text"], str)
    assert len(final_report["summary_text"]) > 10

def test_upload_text_and_poll_report(client):
    # Test text upload
    data = {"text_content": "This is a sample generated paragraph written by an artificial intelligence assistant."}
    upload_res = client.post("/api/uploads", data=data)
    assert upload_res.status_code == 200
    upload_data = upload_res.json()
    upload_id = upload_data["id"]
    assert upload_data["file_type"] == "text"

    # Poll report
    max_wait = 5.0
    start_time = time.time()
    final_report = None

    while time.time() - start_time < max_wait:
        rep_res = client.get(f"/api/reports/{upload_id}")
        assert rep_res.status_code == 200
        report_json = rep_res.json()
        if report_json["status"] == "done":
            final_report = report_json
            break
        time.sleep(0.5)

    assert final_report is not None
    assert final_report["file_type"] == "text"
    assert final_report["ai_confidence"] is not None

def test_upload_ai_generator_image_affirmative_verdict(client):
    from PIL import Image
    buf = io.BytesIO()
    img = Image.new("RGB", (80, 80), color=(20, 20, 20))
    img.save(buf, format="PNG")
    content = buf.getvalue()

    # Upload with ChatGPT image naming pattern
    files = {"file": ("ChatGPT_Image_Sep_1__2026__12_31_32_AM.png", io.BytesIO(content), "image/png")}
    upload_res = client.post("/api/uploads", files=files)
    assert upload_res.status_code == 200
    upload_data = upload_res.json()
    upload_id = upload_data["id"]

    max_wait = 5.0
    start_time = time.time()
    final_report = None
    while time.time() - start_time < max_wait:
        rep_res = client.get(f"/api/reports/{upload_id}")
        assert rep_res.status_code == 200
        data = rep_res.json()
        if data["status"] == "done":
            final_report = data
            break
        time.sleep(0.3)

    assert final_report is not None
    assert final_report["status"] == "done"
    assert final_report["metadata_findings"]["verdict"] == "likely_synthetic"
    assert final_report["ai_confidence"] >= 95.0

