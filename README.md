# openxpaces-fullstack_interview
This will be the repository submitted to OpenXpaces in order to complete the technical assestment

# Deal Intake & Explorer

Full-stack app to import, normalize, and explore commercial real estate deal data.

**Stack:** Python 3.11 · FastAPI · SQLAlchemy · PostgreSQL · React 18 · TypeScript · Vite · Tailwind CSS

---

## Running with Docker (recommended for reviewers)

Requires Docker Desktop (macOS 10.15+ or Linux).

```bash
git clone <repo-url>
cd openxpaces-fullstack_interview
docker compose up --build
```

| Service  | URL                         |
|----------|-----------------------------|
| Frontend | http://localhost:5173       |
| Backend  | http://localhost:8000       |
| API docs | http://localhost:8000/docs  |

**API key:** `openxpace-secret-key` — pass as `X-API-Key` header (frontend sends it automatically).

---

## Running locally (dev)

### Prerequisites
- Python 3.10+
- Node 18+
- PostgreSQL 13+ running locally (Postgres.app on macOS)

### Backend

```bash
cd backend
cp .env.example .env          # edit DATABASE_URL and API_KEY as needed
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
# → http://localhost:8000/health
# → http://localhost:8000/docs
```

### Frontend

```bash
cd frontend
cp .env.example .env          # set VITE_API_KEY to match backend API_KEY
npm install
npm run dev
# → http://localhost:5173
```

---

## Architecture

```
frontend (React + Vite)
    ├── /import   → POST /deals/import (background job)
    │              GET  /deals/import/status/:job_id (polling)
    ├── /deals    → GET  /deals (filters, pagination, sort)
    └── /market   → GET  /analytics/market-summary (cached 60s)

backend (FastAPI)
    ├── app/api/          route handlers
    ├── app/services/
    │   ├── normalizer.py  pure normalization functions
    │   ├── anomaly.py     rule-based anomaly detection
    │   ├── cache.py       in-memory TTL cache (60s)
    │   └── job_store.py   background job state
    ├── app/models/        SQLAlchemy ORM
    ├── app/schemas/       Pydantic request/response types
    └── app/middleware/    API key authentication

database (PostgreSQL)
    ├── tenants
    ├── properties
    └── deals (with anomaly_flags JSON column)
```

## Key tradeoffs

| Decision | Choice | Reason |
|---|---|---|
| Dedup | `sha256(tenant + street + start_date)` | Deterministic, no full-row diff |
| Monthly rent | Requires `size_sqft` first | Can't normalize without it |
| `UNKNOWN` lease type | Flag, don't reject | Preserves valid deal data |
| `raw_input` as JSONB | Yes | Full auditability, re-normalize later |
| `zip` nullable | Yes | Common in broker data |
| Auth | Static API key via header | Simple, sufficient for assessment scope |
| Background jobs | FastAPI `BackgroundTasks` + in-memory job store | No Redis/Celery needed |
| Caching | In-memory TTL dict (60s) | No Redis needed, auto-busted on import |
| Anomaly detection | Rule-based thresholds | Transparent, fast, no ML overhead |
| PG driver | `pg8000` (pure Python) | Works on macOS High Sierra without system libs |

## What I'd do next

- Google SSO
- Captcha
- API throttle and request limit
- Redis for job store and cache (multi-process safe)
- Celery for heavy import batches
- URL query param sync on Deals Explorer filters
- Market-relative anomaly flags (e.g. rent > 2× city median)
- Row-level detail drawer in Deals Explorer
- Export to CSV