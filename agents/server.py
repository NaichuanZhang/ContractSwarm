"""FastAPI sidecar for triggering swarm orchestration."""

from __future__ import annotations

import asyncio
import logging
import os
import sys
import threading

from dotenv import load_dotenv
load_dotenv()

sys.path.insert(0, os.path.dirname(__file__))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from models import OrchestrateRequest, OrchestrateResponse
from orchestrator import run_assessment

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("server")

app = FastAPI(title="ContractSwarm Agent Backend", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def _run_in_thread(assessment_id: str) -> None:
    """Run the async orchestrator in a new event loop on a separate thread."""
    try:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        loop.run_until_complete(run_assessment(assessment_id))
    except Exception as e:
        logger.error(f"Orchestration failed: {e}", exc_info=True)
    finally:
        loop.close()


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/orchestrate", response_model=OrchestrateResponse)
async def orchestrate(request: OrchestrateRequest):
    """Trigger swarm analysis for an assessment. Runs in a background thread."""
    thread = threading.Thread(
        target=_run_in_thread,
        args=(request.assessment_id,),
        daemon=True,
    )
    thread.start()
    logger.info(f"Started orchestration thread for assessment {request.assessment_id}")
    return OrchestrateResponse(
        assessment_id=request.assessment_id,
        status="started",
        message="Swarm analysis started in background",
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
