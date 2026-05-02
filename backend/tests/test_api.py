"""
Integration tests — spins up the full FastAPI app with SQLite.
Run: python -m pytest tests/test_api.py -v
"""
import time

VALID_RECORD = {
    "tenant": "Acme Logistics",
    "address": "1200 NW 7th Ave, Miami, FL 33136",
    "size": "10,000", "rent": "$34/SF",
    "lease_type": "NNN", "start_date": "2024-02-01",
    "term_months": 60, "source": "broker-email",
}

DUPLICATE_RECORD = {**VALID_RECORD, "source": "csv-import", "rent": "34"}

INVALID_RECORD = {
    "tenant": "Bad Record", "address": "",
    "size": "5000", "rent": "$30/SF",
    "lease_type": "NNN", "start_date": "2022-01-01",
    "term_months": 60, "source": "csv-import",
}


def wait_for_job(client, job_id, timeout=5):
    """Poll status endpoint until job is done or timeout (seconds)."""
    deadline = time.time() + timeout
    while time.time() < deadline:
        status = client.get(f"/deals/import/status/{job_id}").json()
        if status["status"] in ("done", "error"):
            return status
        time.sleep(0.1)
    raise TimeoutError(f"Job {job_id} did not complete within {timeout}s")


def import_and_wait(client, records):
    """Post import job and block until done. Returns the status dict."""
    r = client.post("/deals/import", json=records)
    assert r.status_code == 202
    return wait_for_job(client, r.json()["job_id"])


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------

def test_health(client):
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


# ---------------------------------------------------------------------------
# Import endpoint
# ---------------------------------------------------------------------------

def test_import_single_valid_record(client):
    status = import_and_wait(client, [VALID_RECORD])
    assert status["status"] == "done"
    assert status["result"]["imported"] == 1
    assert status["result"]["skipped"] == 0
    assert status["result"]["errors"] == []


def test_import_deduplicates(client):
    import_and_wait(client, [VALID_RECORD])
    status = import_and_wait(client, [VALID_RECORD])
    assert status["result"]["skipped"] == 1
    assert status["result"]["imported"] == 0


def test_import_in_batch_dedup(client):
    status = import_and_wait(client, [VALID_RECORD, DUPLICATE_RECORD])
    assert status["result"]["imported"] == 1
    assert status["result"]["skipped"] == 1


def test_import_invalid_record_returns_error(client):
    status = import_and_wait(client, [INVALID_RECORD])
    assert status["result"]["errors"][0]["field"] == "address"
    assert status["result"]["imported"] == 0


def test_import_status_404_for_unknown_job(client):
    r = client.get("/deals/import/status/nonexistent-job-id")
    assert r.status_code == 404


# ---------------------------------------------------------------------------
# Deals list endpoint
# ---------------------------------------------------------------------------

def test_list_deals_empty(client):
    r = client.get("/deals")
    assert r.status_code == 200
    assert r.json()["total"] == 0


def test_list_deals_after_import(client):
    import_and_wait(client, [VALID_RECORD])
    r = client.get("/deals")
    assert r.json()["total"] == 1
    deal = r.json()["results"][0]
    assert deal["tenant_name"] == "Acme Logistics"
    assert deal["rent_psf"] == 34.0
    assert deal["lease_type"] == "NNN"


def test_list_deals_filter_by_city(client):
    import_and_wait(client, [VALID_RECORD])
    assert client.get("/deals?city=Miami").json()["total"] == 1
    assert client.get("/deals?city=Austin").json()["total"] == 0


def test_list_deals_filter_by_lease_type(client):
    import_and_wait(client, [VALID_RECORD])
    assert client.get("/deals?lease_type=NNN").json()["total"] == 1
    assert client.get("/deals?lease_type=GROSS").json()["total"] == 0


def test_list_deals_search(client):
    import_and_wait(client, [VALID_RECORD])
    assert client.get("/deals?search=acme").json()["total"] == 1
    assert client.get("/deals?search=nonexistent").json()["total"] == 0


def test_list_deals_pagination(client):
    r = client.get("/deals?page=1&page_size=10")
    assert r.status_code == 200
    assert "total" in r.json()


# ---------------------------------------------------------------------------
# Analytics endpoint
# ---------------------------------------------------------------------------

def test_market_summary_404_when_no_data(client):
    r = client.get("/analytics/market-summary?city=Miami&state=FL")
    assert r.status_code == 404


def test_market_summary_returns_stats(client):
    import_and_wait(client, [VALID_RECORD])
    r = client.get("/analytics/market-summary?city=Miami&state=FL")
    assert r.status_code == 200
    data = r.json()
    assert data["deal_count"] == 1
    assert data["avg_rent_psf"] == 34.0
    assert "NNN" in data["lease_type_breakdown"]


def test_market_summary_cached_on_second_call(client):
    import_and_wait(client, [VALID_RECORD])
    client.get("/analytics/market-summary?city=Miami&state=FL")      # warm cache
    r2 = client.get("/analytics/market-summary?city=Miami&state=FL") # should hit cache
    assert r2.json()["cached"] is True


# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------

def test_auth_required_without_override():
    """Real app rejects requests with missing API key."""
    from fastapi.testclient import TestClient
    from main import app as real_app
    with TestClient(real_app, raise_server_exceptions=False) as c:
        r = c.get("/deals")
        assert r.status_code == 401