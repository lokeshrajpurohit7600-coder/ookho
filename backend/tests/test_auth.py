import pytest
from fastapi.testclient import TestClient
from app.main import app

@pytest.fixture
def client():
    return TestClient(app)

import uuid

def test_register_and_login(client):
    # 1. Register new user
    email = f"test_user_{uuid.uuid4().hex[:8]}@example.com"
    reg_payload = {"email": email, "password": "SecurePassword123!"}
    reg_res = client.post("/api/auth/register", json=reg_payload)
    assert reg_res.status_code == 200
    reg_data = reg_res.json()
    assert "access_token" in reg_data
    assert reg_data["email"] == email

    # 2. Reject duplicate email
    dup_res = client.post("/api/auth/register", json=reg_payload)
    assert dup_res.status_code == 400

    # 3. Reject short password
    short_pw_res = client.post("/api/auth/register", json={"email": "short@example.com", "password": "123"})
    assert short_pw_res.status_code == 422

    # 4. Successful login
    login_res = client.post("/api/auth/login", json=reg_payload)
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]

    # 5. Access profile with token
    headers = {"Authorization": f"Bearer {token}"}
    me_res = client.get("/api/auth/me", headers=headers)
    assert me_res.status_code == 200
    assert me_res.json()["email"] == email

def test_guest_session(client):
    res = client.post("/api/auth/guest")
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert "guest" in data["email"]
