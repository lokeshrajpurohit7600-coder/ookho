import pytest
from fastapi.testclient import TestClient
from app.main import app

@pytest.fixture
def client():
    return TestClient(app)

def test_liveness_health(client):
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert "service" in data

def test_readiness(client):
    res = client.get("/ready")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ready"
    assert data["database"] == "ok"
