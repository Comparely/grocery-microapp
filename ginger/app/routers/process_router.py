from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services import (
    eprocess_manager as process_manager,
)
from searchintelligence import (
    process_unmapped_from_redis,
)

router = APIRouter()

class SpawnRequest(BaseModel):
    type: str
    data: dict

@router.post("/spawn")
def spawn_search(request: SpawnRequest):
    """
    Spawn a new background process based on request type.

    For `search-intelligence`, it calls `process_unmapped_from_redis(query)`
    but only if no other running process exists for that same query.
    """
    if request.type != "search-intelligence":
        raise HTTPException(status_code=400, detail="Unsupported type")

    query = request.data.get("query")
    if not query:
        raise HTTPException(status_code=400, detail="Missing query in data")

    # Ensures only one process per query, even under concurrent requests
    pid = process_manager.spawn_for_query(
        query, process_unmapped_from_redis, query
    )
    return {"pid": pid}

@router.get("/status/{pid}")
def get_status(pid: int):
    status = process_manager.get_status(pid)
    if status == "not_found":
        raise HTTPException(status_code=404, detail="Process not found")
    return {"pid": pid, "status": status}

@router.get("/status/all")
def get_all_statuses():
    return process_manager.get_all()

@router.get("/status/all/running")
def get_running():
    return process_manager.get_running()

@router.get("/status/all/completed")
def get_completed():
    return process_manager.get_completed()

@router.get("/status/all/failed")
def get_failed():
    return process_manager.get_failed()