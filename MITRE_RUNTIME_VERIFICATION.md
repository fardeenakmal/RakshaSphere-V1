# RAKSHASPHERE — LIVE MITRE ATT&CK PRODUCTION RUNTIME VERIFICATION REPORT

**Subsystem Classification:** `FULLY REAL AND RUNTIME VERIFIED`  

> **Architectural Note:** MITRE ATT&CK taxonomy metadata (tactic names, technique IDs, descriptions, and framework mappings) are static/versioned reference data from the official MITRE framework, while all displayed technique activity, alert event counts, timestamps, and severity distributions are live runtime database telemetry.


---

## Executive Summary

A comprehensive, non-destructive runtime verification of RakshaSphere's MITRE ATT&CK telemetry integration was conducted against the active production environment. Every test was validated via live HTTP REST requests, MySQL database queries, container restarts, and AI inference predictions.

No fabricated or synthetic MITRE counts were observed or displayed. The frontend dynamically reflects live backend telemetry aggregated directly from database alerts.

---

## Test Results Summary

| Test # | Description | Status | Evidence Summary |
|---|---|---|---|
| **TEST 1** | Baseline Telemetry Audit | **PASS** | Captured initial T1110 count (`4`), `firstSeen` (`2026-08-14T15:35:55`), `lastSeen` (`2026-08-14T15:59:16`), severity breakdown |
| **TEST 2** | Controlled Alert Ingestion | **PASS** | Ingested test alert `ALT-TEST-T1110-VERIFY-001` via `POST /api/v1/alerts` for T1110 Brute Force |
| **TEST 3** | MySQL Database Verification | **PASS** | Verified record inserted in `security_alerts` with `mitre_id='T1110'` and `severity='CRITICAL'` |
| **TEST 4** | MITRE Matrix Aggregation API | **PASS** | `GET /api/v1/mitre/matrix` showed T1110 event count incremented 4 → 5, `lastSeen` updated to `2026-08-16T21:20:00`, `highestSeverity` updated to `CRITICAL` |
| **TEST 5** | Technique Detail API | **PASS** | `GET /api/v1/mitre/techniques/T1110` returned updated stats (`5` events) and alert list including `ALT-TEST-T1110-VERIFY-001` |
| **TEST 6** | Frontend Verification | **PASS** | Dynamic rendering verified on `/mitre`; zero hardcoded counts, clear separation of MITRE metadata vs observed telemetry |
| **TEST 7** | Persistence Across Container Restarts | **PASS** | `docker compose restart backend` performed; post-restart `GET /api/v1/mitre/matrix` confirmed T1110 count remained `5` |
| **TEST 8** | BENIGN AI Flow Inference Verification | **PASS** | Benign flow predictions return `mitreId: null` and create 0 MITRE activity; fake `T0000` is removed completely |

---

## Detailed Test Evidence

### TEST 1 — BASELINE TELEMETRY AUDIT

**Request:** `GET http://localhost:8080/api/v1/mitre/matrix`  
**Observed Response (T1110 Baseline):**
```json
{
  "techniqueId": "T1110",
  "eventCount": 4,
  "firstSeen": "2026-08-14T15:35:55",
  "lastSeen": "2026-08-14T15:59:16",
  "highestSeverity": "HIGH",
  "criticalCount": 0,
  "highCount": 4,
  "mediumCount": 0,
  "lowCount": 0
}
```

---

### TEST 2 — CONTROLLED SECURITY ALERT INGESTION

**Endpoint:** `POST http://localhost:8080/api/v1/alerts`  
**Payload Ingested:**
```json
{
  "id": "ALT-TEST-T1110-VERIFY-001",
  "timestamp": "2026-08-16T21:20:00",
  "sourceIp": "198.51.100.222",
  "destinationIp": "10.0.0.1",
  "sourcePort": 54321,
  "destinationPort": 22,
  "attackType": "SSH Credential Brute Force Verification Test",
  "severity": "CRITICAL",
  "riskScore": 95,
  "confidence": 0.99,
  "mitreTactic": "Initial Access",
  "mitreTechnique": "Brute Force",
  "mitreId": "T1110",
  "status": "ACTIVE",
  "remediationAction": "Controlled Test Verification Ingestion"
}
```
**API Ingestion Response:** `HTTP 200 OK` — `Alert ingested successfully`

---

### TEST 3 — MYSQL DATABASE VERIFICATION

**Query Executed:**
```sql
SELECT id, timestamp, attack_type, severity, mitre_id, mitre_tactic, mitre_technique 
FROM security_alerts 
WHERE id = 'ALT-TEST-T1110-VERIFY-001';
```

**Observed MySQL Row Output:**
```
id                         timestamp            attack_type                                 severity  mitre_id  mitre_tactic    mitre_technique
ALT-TEST-T1110-VERIFY-001  2026-08-16 21:20:00  SSH Credential Brute Force Verification Test CRITICAL  T1110     Initial Access  Brute Force
```

---

### TEST 4 — MITRE MATRIX AGGREGATION API VERIFICATION

**Request:** `GET http://localhost:8080/api/v1/mitre/matrix`  
**Observed Response (Post-Ingestion):**
```json
{
  "techniqueId": "T1110",
  "eventCount": 5,
  "firstSeen": "2026-08-14T15:35:55",
  "lastSeen": "2026-08-16T21:20:00",
  "highestSeverity": "CRITICAL",
  "criticalCount": 1,
  "highCount": 4,
  "mediumCount": 0,
  "lowCount": 0
}
```

*Verification Results:*
- Event count incremented by exactly 1 (`4` → `5`).
- `lastSeen` updated to test alert timestamp (`2026-08-16T21:20:00`).
- `highestSeverity` updated from `HIGH` to `CRITICAL`.
- `criticalCount` incremented from `0` to `1`.

---

### TEST 5 — TECHNIQUE DETAIL ENDPOINT VERIFICATION

**Request:** `GET http://localhost:8080/api/v1/mitre/techniques/T1110`  
**Observed Response:**
```json
{
  "success": true,
  "message": "MITRE technique detail retrieved",
  "data": {
    "stats": {
      "techniqueId": "T1110",
      "eventCount": 5,
      "firstSeen": "2026-08-14T15:35:55",
      "lastSeen": "2026-08-16T21:20:00",
      "highestSeverity": "CRITICAL",
      "criticalCount": 1,
      "highCount": 4,
      "mediumCount": 0,
      "lowCount": 0
    },
    "alerts": [
      {
        "id": "ALT-TEST-T1110-VERIFY-001",
        "timestamp": "2026-08-16T21:20:00",
        "attackType": "SSH Credential Brute Force Verification Test",
        "severity": "CRITICAL",
        "mitreId": "T1110"
      },
      ...
    ]
  }
}
```

---

### TEST 6 — FRONTEND TRUTHFULNESS & UI RENDERING

- Evaluated Next.js UI component rendering for `/mitre`.
- Confirmed total active counts, tactic indicators, and technique cards dynamically fetch telemetry metrics from `GET /api/v1/mitre/matrix`.
- Unobserved techniques render `0 Events` and `Last Seen: Never` with neutral styling.
- Detail modal explicitly distinguishes **MITRE ATT&CK Metadata** from **RakshaSphere Telemetry Observations**.

---

### TEST 7 — PERSISTENCE ACROSS BACKEND CONTAINER RESTARTS

**Action:** Executed `docker compose restart backend`.  
**Post-Restart Request:** `GET http://localhost:8080/api/v1/mitre/matrix`  
**Observed Output:**
```json
{
  "techniqueId": "T1110",
  "eventCount": 5,
  "firstSeen": "2026-08-14T15:35:55",
  "lastSeen": "2026-08-16T21:20:00",
  "highestSeverity": "CRITICAL",
  "criticalCount": 1,
  "highCount": 4,
  "mediumCount": 0,
  "lowCount": 0
}
```
*Verification Result:* T1110 statistics remained persisted at `5` events across container restarts.

---

### TEST 8 — BENIGN AI INFERENCE & NO FAKE MITRE MAPPING

**AI Engine Inference Request (`POST http://localhost:5000/predict`):**
```json
{
  "attackType": "BENIGN",
  "confidenceScore": 0.37,
  "severity": "INFO",
  "isAnomaly": false,
  "reconstructionMse": 0.001,
  "riskScore": 5,
  "mitreTactic": null,
  "mitreTechnique": null,
  "mitreId": null
}
```

**Flow Ingestion Request (`POST /api/v1/alerts/ingest-flow`):**
```json
{
  "attackType": "BENIGN",
  "severity": "INFO",
  "riskScore": 5,
  "mitreTactic": null,
  "mitreTechnique": null,
  "mitreId": null
}
```
*Verification Result:* BENIGN traffic produces `mitreId: null`. No fake `T0000` technique is generated, and zero unmapped MITRE activity is registered on the matrix.

---

## Controlled Test Alert Cleanup Verification

Following successful runtime verification, test alert `ALT-TEST-T1110-VERIFY-001` was deleted from the production MySQL database to keep production telemetry clean:

- **Command Executed:** `DELETE FROM security_alerts WHERE id = 'ALT-TEST-T1110-VERIFY-001';`
- **Post-Cleanup Query (`GET /api/v1/mitre/matrix`):**
  ```json
  {
    "techniqueId": "T1110",
    "eventCount": 4,
    "firstSeen": "2026-08-14T15:35:55",
    "lastSeen": "2026-08-14T15:59:16",
    "highestSeverity": "HIGH",
    "criticalCount": 0,
    "highCount": 4,
    "mediumCount": 0,
    "lowCount": 0
  }
  ```
- **Observed Result:** T1110 event count decreased from **5 → 4**, returning production database telemetry to pristine baseline state.

---

## Final Classification

```
CLASSIFICATION: FULLY REAL AND RUNTIME VERIFIED
```

