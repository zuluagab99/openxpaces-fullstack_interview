"""
In-memory background job state store.
Tracks import jobs by UUID so the frontend can poll for results.
"""
import uuid
from typing import Any
from enum import Enum


class JobStatus(str, Enum):
    PENDING    = "pending"
    PROCESSING = "processing"
    DONE       = "done"
    ERROR      = "error"


_jobs: dict[str, dict[str, Any]] = {}


def create_job() -> str:
    job_id = str(uuid.uuid4())
    _jobs[job_id] = {"status": JobStatus.PENDING, "result": None, "error": None}
    return job_id


def set_processing(job_id: str) -> None:
    if job_id in _jobs:
        _jobs[job_id]["status"] = JobStatus.PROCESSING


def set_done(job_id: str, result: dict) -> None:
    if job_id in _jobs:
        _jobs[job_id]["status"] = JobStatus.DONE
        _jobs[job_id]["result"] = result


def set_error(job_id: str, error: str) -> None:
    if job_id in _jobs:
        _jobs[job_id]["status"] = JobStatus.ERROR
        _jobs[job_id]["error"] = error


def get_job(job_id: str) -> dict | None:
    return _jobs.get(job_id)