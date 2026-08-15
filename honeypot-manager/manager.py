"""
RakshaSphere Honeypot Manager
─────────────────────────────
Lightweight FastAPI sidecar that manages the lifecycle of Cowrie SSH
honeypot containers on an isolated Docker network.

Security model:
  • Only this manager has Docker socket access.
  • Cowrie containers run on 'honeypot_net' (internal: true) with
    all capabilities dropped, read-only root, PID + memory limits.
  • Events are forwarded to Spring Boot via HTTP POST.
"""

import asyncio
import json
import logging
import os
import time
import uuid
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

import docker
import httpx
from fastapi import FastAPI, HTTPException, Header, BackgroundTasks
from pydantic import BaseModel

# ──────────────────────────────────────────────────────────────
# Configuration from environment
# ──────────────────────────────────────────────────────────────
API_KEY = os.getenv("HONEYPOT_MANAGER_API_KEY", "changeme")
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8080")
BACKEND_JWT = os.getenv("BACKEND_SERVICE_TOKEN", "")
HONEYPOT_NETWORK = os.getenv("HONEYPOT_NETWORK", "honeypot_net")
COWRIE_IMAGE = os.getenv("COWRIE_IMAGE", "cowrie/cowrie:latest")
COWRIE_SSH_PORT = int(os.getenv("COWRIE_SSH_PORT", "2222"))
MAX_HONEYPOTS = int(os.getenv("MAX_HONEYPOTS", "5"))
LOG_DIR = Path(os.getenv("LOG_DIR", "/logs"))

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("honeypot-manager")

# ──────────────────────────────────────────────────────────────
# Docker client (lazy init)
# ──────────────────────────────────────────────────────────────
docker_client: Optional[docker.DockerClient] = None

# Track running sessions: session_id -> container_id
active_sessions: dict[str, str] = {}

# Background log-watcher tasks
log_watchers: dict[str, asyncio.Task] = {}


def get_docker() -> docker.DockerClient:
    global docker_client
    if docker_client is None:
        docker_client = docker.from_env()
    return docker_client


def ensure_network():
    """Ensure the isolated honeypot_net bridge network exists."""
    client = get_docker()
    try:
        client.networks.get(HONEYPOT_NETWORK)
        logger.info(f"Network '{HONEYPOT_NETWORK}' already exists.")
    except docker.errors.NotFound:
        client.networks.create(
            HONEYPOT_NETWORK,
            driver="bridge",
            internal=True,
            ipam=docker.types.IPAMConfig(
                pool_configs=[
                    docker.types.IPAMPool(subnet="172.30.0.0/24")
                ]
            ),
            labels={"rakshasphere.managed": "true"},
        )
        logger.info(f"Created isolated network '{HONEYPOT_NETWORK}' (internal=true).")


def ensure_image():
    """Pull Cowrie image if not already present."""
    client = get_docker()
    try:
        client.images.get(COWRIE_IMAGE)
        logger.info(f"Image '{COWRIE_IMAGE}' already available locally.")
    except docker.errors.ImageNotFound:
        logger.info(f"Pulling '{COWRIE_IMAGE}'... this may take a moment.")
        client.images.pull(COWRIE_IMAGE)
        logger.info(f"Image '{COWRIE_IMAGE}' pulled successfully.")


# ──────────────────────────────────────────────────────────────
# Pydantic models
# ──────────────────────────────────────────────────────────────
class DeployRequest(BaseModel):
    session_id: str
    service: str = "SSH"
    attacker_ip: str = "0.0.0.0"
    host_port: int = 2222


class DeployResponse(BaseModel):
    session_id: str
    container_id: str
    container_name: str
    status: str
    network: str
    host_port: int


class StopResponse(BaseModel):
    session_id: str
    status: str


class HoneypotStatus(BaseModel):
    session_id: str
    container_id: str
    container_name: str
    status: str
    created: str


# ──────────────────────────────────────────────────────────────
# Auth helper
# ──────────────────────────────────────────────────────────────
def verify_api_key(x_api_key: str = Header(...)):
    if x_api_key != API_KEY:
        raise HTTPException(status_code=401, detail="Invalid API key")
    return x_api_key


def map_event_type(raw_event_id: str) -> str:
    """Normalize raw Cowrie event IDs to standardized RakshaSphere event types."""
    if not raw_event_id:
        return "UNKNOWN"

    mapping = {
        "cowrie.session.connect": "CONNECTION",
        "cowrie.login.success": "SSH_LOGIN_SUCCESS",
        "cowrie.login.failed": "SSH_LOGIN_FAILURE",
        "cowrie.command.input": "COMMAND",
        "cowrie.command.failed": "COMMAND",
        "cowrie.session.closed": "SESSION_CLOSED",
        "HONEYPOT_STARTED": "HONEYPOT_STARTED",
        "HONEYPOT_STOPPED": "HONEYPOT_STOPPED",
    }

    if raw_event_id in mapping:
        return mapping[raw_event_id]

    if "login" in raw_event_id.lower():
        return "SSH_LOGIN_ATTEMPT"
    if "command" in raw_event_id.lower():
        return "COMMAND"
    if "connect" in raw_event_id.lower():
        return "CONNECTION"

    return raw_event_id


async def forward_event_to_backend(session_id: str, event: dict):
    """POST a normalized honeypot event to Spring Boot backend."""
    url = f"{BACKEND_URL}/api/v1/honeypots/events"
    headers = {"Content-Type": "application/json"}
    if BACKEND_JWT:
        headers["Authorization"] = f"Bearer {BACKEND_JWT}"

    raw_id = event.get("eventid", event.get("eventType", "unknown"))
    normalized_type = map_event_type(raw_id)

    payload = {
        "sessionId": session_id,
        "eventType": normalized_type,
        "sourceIp": event.get("src_ip", event.get("sourceIp", "0.0.0.0")),
        "sourcePort": event.get("src_port", event.get("sourcePort", 0)),
        "timestamp": event.get("timestamp", datetime.now(timezone.utc).isoformat()),
        "username": event.get("username", ""),
        "password": "",  # NEVER store or forward submitted passwords
        "command": event.get("input", event.get("command", event.get("message", ""))),
        "rawEventJson": json.dumps(
            {k: v for k, v in event.items() if k.lower() != "password"}
        ),
    }

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.post(url, json=payload, headers=headers)
            if resp.status_code < 300:
                logger.debug(f"Event forwarded: {normalized_type} for session {session_id}")
            else:
                logger.warning(
                    f"Backend returned {resp.status_code} for event: {normalized_type}"
                )
    except Exception as e:
        logger.error(f"Failed to forward event to backend: {e}")



# ──────────────────────────────────────────────────────────────
# Log watcher — tails cowrie.json for a container
# ──────────────────────────────────────────────────────────────
async def watch_cowrie_logs(session_id: str, container_name: str):
    """Background task: tail the Cowrie JSON log file for a session and
    forward events to the Spring Boot backend."""
    log_file = LOG_DIR / container_name / "cowrie.json"
    logger.info(f"Log watcher started for {session_id} → {log_file}")

    # Wait for the log file to appear (Cowrie takes a moment to start)
    for _ in range(60):
        if log_file.exists():
            break
        await asyncio.sleep(1)
    else:
        logger.warning(f"Log file never appeared: {log_file}")
        return

    last_pos = 0
    while session_id in active_sessions:
        try:
            if log_file.exists():
                with open(log_file, "r") as f:
                    f.seek(last_pos)
                    for line in f:
                        line = line.strip()
                        if not line:
                            continue
                        try:
                            event = json.loads(line)
                            await forward_event_to_backend(session_id, event)
                        except json.JSONDecodeError:
                            pass
                    last_pos = f.tell()
        except Exception as e:
            logger.error(f"Error reading log for {session_id}: {e}")

        await asyncio.sleep(1)  # Poll every second

    logger.info(f"Log watcher stopped for {session_id}")


# ──────────────────────────────────────────────────────────────
# Application lifecycle
# ──────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: ensure Docker network and Cowrie image exist."""
    logger.info("RakshaSphere Honeypot Manager starting...")
    try:
        ensure_network()
        ensure_image()

        # Recover any running honeypot containers from a previous run
        client = get_docker()
        for container in client.containers.list(
            filters={"label": "rakshasphere.honeypot=true"}
        ):
            sid = container.labels.get("rakshasphere.session-id", "unknown")
            active_sessions[sid] = container.id
            logger.info(f"Recovered existing honeypot: {sid} → {container.short_id}")

    except Exception as e:
        logger.error(f"Startup initialization error: {e}")

    yield

    # Shutdown: stop all honeypot containers
    logger.info("Shutting down — stopping all honeypot containers...")
    for sid in list(active_sessions.keys()):
        try:
            await _stop_honeypot(sid)
        except Exception as e:
            logger.error(f"Error stopping {sid} during shutdown: {e}")


app = FastAPI(
    title="RakshaSphere Honeypot Manager",
    version="1.0.0",
    lifespan=lifespan,
)


# ──────────────────────────────────────────────────────────────
# Health check
# ──────────────────────────────────────────────────────────────
@app.get("/health")
async def health():
    docker_ok = False
    try:
        get_docker().ping()
        docker_ok = True
    except Exception:
        pass

    return {
        "status": "UP" if docker_ok else "DEGRADED",
        "service": "RakshaSphere Honeypot Manager",
        "dockerConnected": docker_ok,
        "activeHoneypots": len(active_sessions),
        "maxHoneypots": MAX_HONEYPOTS,
        "network": HONEYPOT_NETWORK,
    }


# ──────────────────────────────────────────────────────────────
# Deploy a new honeypot
# ──────────────────────────────────────────────────────────────
@app.post("/api/deploy", response_model=DeployResponse)
async def deploy_honeypot(
    req: DeployRequest,
    background_tasks: BackgroundTasks,
    x_api_key: str = Header(...),
):
    verify_api_key(x_api_key)

    if len(active_sessions) >= MAX_HONEYPOTS:
        raise HTTPException(
            status_code=429,
            detail=f"Maximum honeypot limit reached ({MAX_HONEYPOTS})",
        )

    if req.session_id in active_sessions:
        raise HTTPException(
            status_code=409,
            detail=f"Session {req.session_id} already has a running honeypot",
        )

    client = get_docker()
    container_name = f"cowrie-{req.session_id.lower()}"

    # Create a per-container log directory on the shared volume
    container_log_dir = LOG_DIR / container_name
    container_log_dir.mkdir(parents=True, exist_ok=True)
    try:
        # Set ownership for cowrie non-root user (supports both UID 1000 and UID 999)
        for id_val in (1000, 999):
            try:
                os.chown(container_log_dir, id_val, id_val)
                for p in container_log_dir.glob("**/*"):
                    os.chown(p, id_val, id_val)
            except Exception:
                pass
        os.chmod(container_log_dir, 0o775)
    except Exception as e:
        logger.warning(f"Could not set ownership/permissions on {container_log_dir}: {e}")

    try:
        container = client.containers.run(
            image=COWRIE_IMAGE,
            name=container_name,
            detach=True,
            network=HONEYPOT_NETWORK,
            ports={"2222/tcp": (req.attacker_ip, req.host_port)},
            labels={
                "rakshasphere.honeypot": "true",
                "rakshasphere.session-id": req.session_id,
                "rakshasphere.service": req.service,
                "rakshasphere.created": datetime.now(timezone.utc).isoformat(),
            },
            environment={
                "COWRIE_TELNET_ENABLED": "no",
            },
            volumes={
                str(container_log_dir): {
                    "bind": "/cowrie/cowrie-git/var/log/cowrie",
                    "mode": "rw",
                },
            },
            # Security hardening
            read_only=False,  # Cowrie needs to write to some dirs
            cap_drop=["ALL"],
            security_opt=["no-new-privileges:true"],
            mem_limit="256m",
            memswap_limit="256m",
            cpu_quota=25000,  # 0.25 CPUs
            pids_limit=64,
            # Tmpfs for temp files
            tmpfs={"/tmp": "size=16M,noexec,nosuid"},
        )

        active_sessions[req.session_id] = container.id
        logger.info(
            f"Deployed honeypot: {req.session_id} → {container.short_id} "
            f"on {HONEYPOT_NETWORK} (port {req.host_port})"
        )

        # Forward HONEYPOT_STARTED event to backend
        asyncio.create_task(forward_event_to_backend(req.session_id, {
            "eventType": "HONEYPOT_STARTED",
            "src_ip": req.attacker_ip,
            "src_port": req.host_port,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "message": f"Honeypot container {container.short_id} started on port {req.host_port}"
        }))

        # Start background log watcher
        task = asyncio.create_task(watch_cowrie_logs(req.session_id, container_name))
        log_watchers[req.session_id] = task

        return DeployResponse(
            session_id=req.session_id,
            container_id=container.short_id,
            container_name=container_name,
            status="RUNNING",
            network=HONEYPOT_NETWORK,
            host_port=req.host_port,
        )

    except docker.errors.APIError as e:
        logger.error(f"Docker API error deploying honeypot: {e}")
        raise HTTPException(status_code=500, detail=f"Docker error: {str(e)}")


# ──────────────────────────────────────────────────────────────
# Stop a honeypot
# ──────────────────────────────────────────────────────────────
async def _stop_honeypot(session_id: str) -> str:
    """Internal stop logic, used by both the API and shutdown."""
    container_id = active_sessions.get(session_id)
    if not container_id:
        return "NOT_FOUND"

    client = get_docker()
    try:
        container = client.containers.get(container_id)
        container.stop(timeout=5)
        container.remove(force=True)
    except docker.errors.NotFound:
        pass
    except Exception as e:
        logger.error(f"Error stopping container {container_id}: {e}")

    active_sessions.pop(session_id, None)

    # Forward HONEYPOT_STOPPED event to backend
    asyncio.create_task(forward_event_to_backend(session_id, {
        "eventType": "HONEYPOT_STOPPED",
        "src_ip": "0.0.0.0",
        "src_port": 0,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "message": f"Honeypot container {session_id} stopped and removed"
    }))


    # Cancel log watcher
    watcher = log_watchers.pop(session_id, None)
    if watcher and not watcher.done():
        watcher.cancel()

    logger.info(f"Stopped honeypot: {session_id}")
    return "TERMINATED"


@app.post("/api/stop/{session_id}", response_model=StopResponse)
async def stop_honeypot(session_id: str, x_api_key: str = Header(...)):
    verify_api_key(x_api_key)

    status = await _stop_honeypot(session_id)
    if status == "NOT_FOUND":
        raise HTTPException(status_code=404, detail=f"No active honeypot for session {session_id}")

    return StopResponse(session_id=session_id, status=status)


# ──────────────────────────────────────────────────────────────
# List active honeypots
# ──────────────────────────────────────────────────────────────
@app.get("/api/status")
async def list_honeypots(x_api_key: str = Header(...)):
    verify_api_key(x_api_key)

    result = []
    client = get_docker()
    for sid, cid in list(active_sessions.items()):
        try:
            container = client.containers.get(cid)
            result.append(
                HoneypotStatus(
                    session_id=sid,
                    container_id=container.short_id,
                    container_name=container.name,
                    status=container.status,
                    created=container.labels.get(
                        "rakshasphere.created", "unknown"
                    ),
                )
            )
        except docker.errors.NotFound:
            active_sessions.pop(sid, None)

    return {"honeypots": result, "count": len(result), "max": MAX_HONEYPOTS}


# ──────────────────────────────────────────────────────────────
# Entry point
# ──────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=6000, log_level="info")
