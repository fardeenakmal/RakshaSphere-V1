# RakshaSphere — Honeypot Deception Subsystem

> **Source of truth:** `honeypot-manager/manager.py`, `HoneypotOrchestratorService.java`, `HoneypotController.java`, `docker/docker-compose.yml`.

---

## Overview

The honeypot subsystem deploys **Cowrie SSH honeypot containers** on demand via a Python FastAPI sidecar (`honeypot-manager`). The manager controls container lifecycle and forwards captured events to the Spring Boot backend.

---

## Architecture

```
Frontend (deploy/stop actions)
        ↓ POST /api/v1/honeypots/deploy
Spring Boot Backend (HoneypotController)
        ↓ HTTP POST http://localhost:6000/deploy (X-Api-Key)
Honeypot Manager (FastAPI :6000)
        ↓ docker.run(cowrie/cowrie:latest, ...)
Cowrie SSH Container (port 2222, honeypot_net)
        ↓ Log events read from container logs (background task)
Honeypot Manager
        ↓ HTTP POST http://localhost:8080/api/v1/honeypots/events
Spring Boot Backend (HoneypotOrchestratorService)
        ↓ Persists HoneypotEvent → MySQL
        ↓ Updates HoneypotSession → MySQL
        ↓ STOMP broadcast → /topic/honeypot-events
        ↓ [On significant events] Creates SecurityAlert → DB + STOMP /topic/alerts
```

---

## Honeypot Manager Service

**Port:** 6000  
**Auth:** All management endpoints require `X-Api-Key` header matching `HONEYPOT_MANAGER_API_KEY` environment variable  
**Source:** `honeypot-manager/manager.py`

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Manager and Docker connection health |
| `POST` | `/deploy` | Deploy a new Cowrie container |
| `POST` | `/stop/{session_id}` | Stop and remove a container |
| `GET` | `/{session_id}` | Get container status |
| `GET` | `/list` | List all active honeypot containers |

### Deploy Request

```json
{
  "session_id": "HP-abc123",
  "service": "SSH",
  "attacker_ip": "185.220.101.1",
  "host_port": 2222
}
```

---

## Container Configuration

Cowrie containers are launched with these security constraints:
- **Image:** `cowrie/cowrie:latest`
- **Network:** `honeypot_net` (internal bridge, `172.30.0.0/24`, no external access)
- **All capabilities dropped** (`cap_drop: ALL`)
- **Read-only root filesystem**
- **PID limit:** 64 (prevents fork bombs)
- **Memory limit:** 256 MB
- **No privileged mode**

---

## Event Collection

The honeypot manager runs a background `asyncio.Task` per container (`_watch_container_logs()`). It streams container stdout/stderr logs, parses Cowrie JSON log lines, and forwards events to the backend via `POST /api/v1/honeypots/events`.

### Cowrie Event Mapping

| Raw Cowrie Event ID | RakshaSphere Event Type |
|--------------------|------------------------|
| `cowrie.session.connect` | `CONNECTION` |
| `cowrie.login.success` | `SSH_LOGIN_SUCCESS` |
| `cowrie.login.failed` | `SSH_LOGIN_FAILURE` |
| `cowrie.command.input` | `COMMAND` |
| `cowrie.session.file_download` | `FILE_DOWNLOAD` |
| `cowrie.session.closed` | `SESSION_CLOSED` |
| (other) | `UNKNOWN` |

---

## Backend Event Processing (HoneypotOrchestratorService)

When the backend receives a honeypot event:

1. **Persist** `HoneypotEvent` record to MySQL
2. **Update** parent `HoneypotSession`:
   - Append keystroke/command to JSON arrays (capped at 200 entries)
   - Increment `capturedPayloadsCount` for file events
   - Increase risk score on `SSH_LOGIN_SUCCESS` / `file_download`
   - Set `endTime` on `session.closed`
3. **Broadcast** event via STOMP `/topic/honeypot-events`
4. **For significant events** (`SSH_LOGIN_SUCCESS`, `COMMAND`, `file_download`):
   - Create a `SecurityAlert` with:
     - Severity: `HIGH` (login/file) or `MEDIUM` (command)
     - Attack type: "Deception Sandbox Breach (SSH Success)" or "Honeypot Command Execution Probe"
     - MITRE: `T1078 Valid Accounts` (login) or `T1059 Command Interpreter` (command)
     - Source IP: attacker IP from event
     - Destination IP: `172.30.0.2` (honeypot network range)
     - Destination port: `2222`
   - Enriches with threat intel (VirusTotal/AbuseIPDB)
   - Persists to database
   - Broadcasts via STOMP `/topic/alerts`

---

## Frontend Honeypot Terminal

The Honeypot page (`/honeypots`) displays:
- Active honeypot sessions with status badges
- `HoneypotTerminal` component: simulated terminal showing captured keystrokes and commands from the session

---

## Development / Demo Note

For the honeypot subsystem to function, the Docker daemon must be accessible to the `honeypot-manager` container (via `/var/run/docker.sock`). In a local desktop environment without Docker, the Cowrie containers will not actually start. The backend will still track sessions, but no real attacker capture will occur.
