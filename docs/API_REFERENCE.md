# RakshaSphere — API Reference

> **Base URL:** `http://localhost:8080/api/v1`  
> **Source of truth:** Inspected from all `controller/*.java` files.

All endpoints return `ApiResponseDTO<T>` with fields: `status` (OK/ERROR), `message`, `data`.

---

## Authentication

### POST /auth/login
- **Auth:** None required
- **Request body:**
  ```json
  { "username": "admin", "password": "Admin@Raksha2026!", "mfaCode": "123456" }
  ```
  (`mfaCode` is optional — only required if MFA is enabled for the user)
- **Response data:** `{ "token": "...", "username": "admin", "role": "ROLE_ADMIN", "name": "..." }`
- **Errors:** `400` invalid input, `401` bad credentials

### POST /auth/register
- **Auth:** None required
- **Request body:**
  ```json
  { "username": "newuser", "name": "New User", "email": "user@example.com", "password": "...", "confirmPassword": "...", "requestedRole": "ROLE_SOC_ANALYST" }
  ```
- **Response:** Registered user object with `status: PENDING` (requires admin approval)
- **Errors:** `400` validation error, `409` username/email conflict

### GET /auth/me
- **Auth:** JWT required
- **Response data:** `AuthResponseDTO` (same shape as login response)
- **Errors:** `401` if token invalid/expired

### GET /auth/mfa/setup?username={username}
- **Auth:** None required
- **Response data:** `{ "secret": "...", "qrCodeUri": "data:image/png;base64,..." }`

### POST /auth/mfa/verify
- **Auth:** None required
- **Request body:** `{ "username": "admin", "code": "123456" }`
- **Response:** `"VERIFIED"` or `401`

---

## Security Alerts

### GET /alerts
- **Auth:** JWT (`ROLE_ADMIN`, `ROLE_SOC_ANALYST`, `ROLE_USER`)
- **Response data:** `SecurityAlert[]` — all alerts from database

### GET /alerts/{id}
- **Auth:** JWT (`ROLE_ADMIN`, `ROLE_SOC_ANALYST`, `ROLE_USER`)
- **Response data:** Single `SecurityAlert`
- **Errors:** `404` not found

### POST /alerts
- **Auth:** JWT (`ROLE_ADMIN`, `ROLE_SOC_ANALYST`)
- **Request body:** `SecurityAlert` object (manual alert creation)
- **Response data:** Created `SecurityAlert`

### POST /alerts/ingest-flow
- **Auth:** JWT (`ROLE_ADMIN`, `ROLE_SOC_ANALYST`)
- **Request body:**
  ```json
  {
    "sourceIp": "185.220.101.1",
    "destinationIp": "10.0.0.15",
    "sourcePort": 54321,
    "destinationPort": 22,
    "flowFeatures": [450.0, 120.0, 512.0, 0.85, ...] // 84 float values
  }
  ```
- **Behavior:** Calls AI engine `/predict`, maps result to MITRE technique, enriches with threat intel (VirusTotal/AbuseIPDB), persists to DB, broadcasts via STOMP `/topic/alerts`
- **Response data:** Created `SecurityAlert` with AI classification and threat intel
- **Errors:** `500` if AI engine unreachable or returns empty data

---

## Self-Healing (Remediation)

### POST /self-healing/remediate
- **Auth:** JWT (`ROLE_ADMIN`, `ROLE_SOC_ANALYST`)
- **Request body:** `{ "alertId": "ALT-12345", "actionType": "eBPF_DROP" | "HONEYPOT" | "REVERT" }`
- **Behavior:**
  - `eBPF_DROP`: Sets alert status to `CONTAINED`, attempts JNI `injectDropRule()`, writes audit log
  - `HONEYPOT`: Sets alert status to `HONEYPOT_DIVERTED`, writes audit log
  - `REVERT`: Sets alert status back to `ACTIVE`, writes audit log
- **Response data:** Updated `SecurityAlert`
- **Errors:** `404` alert not found

---

## Honeypots

### GET /honeypots
- **Auth:** JWT (any authenticated role)
- **Response data:** `HoneypotSession[]`

### POST /honeypots/deploy?service=SSH&attackerIp=185.220.101.1
- **Auth:** JWT (`ROLE_ADMIN`, `ROLE_SOC_ANALYST`)
- **Behavior:** Calls Honeypot Manager (`http://localhost:6000/deploy`), creates `HoneypotSession` in DB
- **Response data:** Created `HoneypotSession`

### POST /honeypots/{id}/stop
- **Auth:** JWT (`ROLE_ADMIN`, `ROLE_SOC_ANALYST`)
- **Behavior:** Calls Honeypot Manager to stop the container, updates session status to `TERMINATED`
- **Response data:** Updated `HoneypotSession`

### POST /honeypots/events
- **Auth:** None required (webhook endpoint for Honeypot Manager)
- **Request body:** `HoneypotEventDTO`
- **Behavior:** Persists honeypot event, updates session, broadcasts via STOMP `/topic/honeypot-events`, generates `SecurityAlert` for significant events (SSH_LOGIN_SUCCESS, COMMAND, file_download)

### GET /honeypots/{sessionId}/events
- **Auth:** JWT (any authenticated role)
- **Response data:** `HoneypotEvent[]` ordered by timestamp ascending

---

## MITRE ATT&CK

### GET /mitre/matrix
- **Auth:** JWT (any authenticated role)
- **Response data:** `MitreStatsDTO[]` — aggregated alert counts per MITRE technique ID from the database.
- **Note:** Returns live telemetry (event counts, severity, firstSeen/lastSeen) grouped by `mitreId` field of `SecurityAlert` records.

### GET /mitre/techniques/{id}
- **Auth:** JWT (any authenticated role)
- **Response data:** `MitreStatsDTO` for a specific technique ID (e.g., `T1110`)

---

## AI Engine Proxy

All these endpoints proxy to the FastAPI AI engine at `http://localhost:5000`.

### GET /ai/health
- **Auth:** JWT (any authenticated role)
- **Response:** AI engine health including model readiness and manifest

### POST /ai/predict
- **Auth:** JWT (any authenticated role)
- **Request body:** `{ "flowFeatures": [84 floats], "topK": 5 }`
- **Response:** Threat classification result

### POST /ai/explain
- **Auth:** JWT (any authenticated role)
- **Request body:** `{ "flowFeatures": [84 floats], "topK": 5 }`
- **Response:** Feature attribution dossier (top-K contributing features)

### POST /ai/batch-predict
- **Auth:** JWT (any authenticated role)
- **Request body:** `{ "flows": [[84 floats], [84 floats], ...] }`
- **Response:** Array of classification results

---

## SOC Dashboard

### GET /soc/metrics
- **Auth:** JWT (any authenticated role)
- **Response data:** `SystemMetricsDTO`
  ```json
  {
    "activeThreats": 3,
    "containedToday": 5,
    "ebpfDropsCount": 5,
    "activeHoneypots": 2,
    "systemRiskScore": 72,
    "networkHealthPct": 86.5,
    "ingestedFlowsPerSec": 18,
    "selfHealingLatencyMs": 8
  }
  ```
- **Source:** All values computed from the `security_alerts` and `honeypot_sessions` database tables at request time.

### GET /soc/audit-logs
- **Auth:** JWT (`ROLE_ADMIN`, `ROLE_SOC_ANALYST`)
- **Response data:** `AuditLog[]` — last 20 entries ordered by timestamp descending

---

## System Health

### GET /system/health
- **Auth:** None required
- **Response data:** Full health report from Spring Actuator (aggregated from all custom health indicators)
- **Includes:** AI Engine, MySQL, Redis, MQTT, Honeypot, eBPF Collector, STOMP, Threat Intel (VirusTotal + AbuseIPDB), Database Backup

### GET /system/info
- **Auth:** JWT (any authenticated role)
- **Response data:** JVM memory, OS, disk, CPU load, uptime, containerized flag
  ```json
  { "hostname": "...", "osName": "Linux", "javaVersion": "21.x", "ramTotalMb": 2048, "ramUsedMb": 512, ... }
  ```

---

## Settings

### GET /settings
- **Auth:** JWT (`ROLE_ADMIN`)
- **Response data:** Current settings (risk threshold, eBPF enabled, API key status)

### POST /settings/rules
- **Auth:** JWT (`ROLE_ADMIN`)
- **Request body:** `{ "riskThreshold": 70, "ebpfEnabled": true }`

### POST /settings/keys
- **Auth:** JWT (`ROLE_ADMIN`)
- **Request body:** `{ "vtApiKey": "...", "abuseApiKey": "..." }`

---

## User Management

### GET /users
- **Auth:** JWT (`ROLE_ADMIN`)
- **Response data:** All users

### GET /users/pending
- **Auth:** JWT (`ROLE_ADMIN`)
- **Response data:** Users with `PENDING` status

### POST /users
- **Auth:** JWT (`ROLE_ADMIN`)
- **Request body:** `{ "username": "...", "email": "...", "name": "...", "role": "ROLE_SOC_ANALYST", "password": "..." }`

### PUT /users/{id}/approve
- **Auth:** JWT (`ROLE_ADMIN`)
- **Request body:** `{ "role": "ROLE_SOC_ANALYST" }`

### PUT /users/{id}/status
- **Auth:** JWT (`ROLE_ADMIN`)
- **Request body:** `{ "status": "ACTIVE" | "SUSPENDED" | "PENDING" }`

### PUT /users/{id}/role
- **Auth:** JWT (`ROLE_ADMIN`)
- **Request body:** `{ "role": "ROLE_SOC_ANALYST" }`

---

## WebSocket / STOMP

### Endpoint
- **URL:** `http://localhost:8080/ws-soc` (SockJS fallback enabled)
- **Auth:** JWT Bearer token required in STOMP `CONNECT` frame `Authorization` header

### Topics (subscribe to receive events)

| Topic | Event Type | Publisher |
|-------|------------|-----------|
| `/topic/alerts` | `SecurityAlert` JSON | `SecurityAlertService.saveAndBroadcastAlert()` |
| `/topic/honeypot-events` | Honeypot event JSON | `HoneypotOrchestratorService.processHoneypotEvent()` |
| `/topic/alerts` | `IOT_DEVICE_STATUS` event | `IotMqttSubscriberService.messageArrived()` |

---

## Public (No Auth Required)

- `POST /api/v1/auth/login`
- `POST /api/v1/auth/register`
- `GET /api/v1/auth/mfa/setup`
- `POST /api/v1/auth/mfa/verify`
- `GET /api/v1/system/health` (and `/system/health/**`)
- `GET /actuator/health`
- `POST /api/v1/honeypots/events` (webhook)
- `GET /ws-soc/**` (STOMP WebSocket — JWT required in frame)
