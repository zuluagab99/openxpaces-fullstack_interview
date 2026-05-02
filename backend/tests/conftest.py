"""
Shared fixtures for integration tests.
Uses SQLite in-memory so no PostgreSQL needed to run tests.
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.db import Base, get_db
from app.middleware.auth import require_api_key
from app.api import deals as deals_module   # so we can patch SessionLocal
from main import app

TEST_DB_URL = "sqlite:///./test.db"

engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestingSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSession()
    try:
        yield db
    finally:
        db.close()


def override_api_key():
    return "test-key"


@pytest.fixture(scope="function")
def client():
    Base.metadata.create_all(bind=engine)

    # Override HTTP dependency (GET /deals, GET /analytics, etc.)
    app.dependency_overrides[get_db]          = override_get_db
    app.dependency_overrides[require_api_key] = override_api_key

    # Patch SessionLocal used inside the background task (_run_import)
    # so it writes to the same SQLite DB the test reads from
    original_session_local = deals_module.SessionLocal
    deals_module.SessionLocal = TestingSession

    with TestClient(app) as c:
        yield c

    # Restore everything
    deals_module.SessionLocal = original_session_local
    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=engine)