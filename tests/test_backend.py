"""
Tests for KEV Backend
~~~~~~~~~~~~~~~~~~~~~~~
"""

import pytest
from fastapi.testclient import TestClient
from kev.backend.main import app

client = TestClient(app)


def test_health_check():
    """Test health check endpoint"""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_root():
    """Test root endpoint"""
    response = client.get("/")
    assert response.status_code == 200
    assert "message" in response.json()


def test_api_docs():
    """Test API documentation is accessible"""
    response = client.get("/docs")
    assert response.status_code == 200
