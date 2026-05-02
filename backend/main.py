from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db import engine, Base
from app.api import deals, analytics

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Deal Intake API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*", "X-API-Key"],
)

app.include_router(deals.router)
app.include_router(analytics.router)


@app.get("/health")
def health():
    return {"status": "ok"}