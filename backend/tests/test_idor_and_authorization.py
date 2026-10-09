import io
import time
import pytest
from fastapi.testclient import TestClient
from app.main import app

@pytest.fixture
def client():
    return TestClient(app)

def test_idor_protection_between_users(client):
    # 1. Create User A
    user_a_email = f"usera_{time.time()}@example.com"
    res_a = client.post("/api/auth/register", json={"email": user_a_email, "password": "PasswordUserA1!"})
    assert res_a.status_code == 200
    token_a = res_a.json()["access_token"]
    headers_a = {"Authorization": f"Bearer {token_a}"}

    # 2. Create User B
    user_b_email = f"userb_{time.time()}@example.com"
    res_b = client.post("/api/auth/register", json={"email": user_b_email, "password": "PasswordUserB1!"})
    assert res_b.status_code == 200
    token_b = res_b.json()["access_token"]
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # 3. User A uploads a real image
    from PIL import Image
    buf = io.BytesIO()
    Image.new("RGB", (10, 10), color="green").save(buf, format="PNG")
    png_content = buf.getvalue()
    files = {"file": ("usera_photo.png", io.BytesIO(png_content), "image/png")}
    up_res = client.post("/api/uploads", files=files, headers=headers_a)
    assert up_res.status_code == 200
    upload_id = up_res.json()["id"]

    # 4. User A can access their own report
    rep_a = client.get(f"/api/reports/{upload_id}", headers=headers_a)
    assert rep_a.status_code == 200

    # 5. IDOR ATTACK: User B tries to view User A's report
    rep_b = client.get(f"/api/reports/{upload_id}", headers=headers_b)
    assert rep_b.status_code == 404, "User B was able to view User A's report (IDOR Vulnerability)!"

    # 6. IDOR ATTACK: User B tries to chat on User A's report
    chat_b = client.post("/api/assistant/chat", json={"upload_id": upload_id, "message": "Give me findings"}, headers=headers_b)
    assert chat_b.status_code == 404, "User B was able to chat on User A's report (IDOR Vulnerability)!"

    # 7. IDOR ATTACK: User B tries to delete User A's upload
    del_b = client.delete(f"/api/uploads/{upload_id}", headers=headers_b)
    assert del_b.status_code == 404, "User B was able to delete User A's upload (IDOR Vulnerability)!"

    # 8. User A deletes their own upload successfully
    del_a = client.delete(f"/api/uploads/{upload_id}", headers=headers_a)
    assert del_a.status_code == 200
