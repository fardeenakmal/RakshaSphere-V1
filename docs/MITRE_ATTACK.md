# RakshaSphere — MITRE ATT&CK Integration

> **Source of truth:** `MitreService.java`, `MitreController.java`, `AlertController.java` (ingest-flow), `frontend/src/data/mitreTactics.ts`, `database/init.sql`.

---

## Important Distinction

This document clearly separates:

- **MITRE ATT&CK Framework Metadata** — static reference data (tactic/technique names, IDs, descriptions)
- **RakshaSphere Observed Telemetry** — live alert counts, severity, firstSeen, lastSeen from the database

---

## MITRE ATT&CK Metadata Source

RakshaSphere's MITRE framework metadata (technique names, descriptions, mitigations) is stored as **static TypeScript data** in `frontend/src/data/mitreTactics.ts`.

This file contains a curated subset of MITRE ATT&CK techniques organized by tactic, with:
- Tactic ID (e.g., `TA0001`)
- Tactic name (e.g., `Initial Access`)
- Per-technique: ID, name, description, mitigation guidance

The `mitre_tactics` and `mitre_techniques` MySQL tables exist in the schema but are not seeded with data. They are available for future database-driven MITRE metadata.

---

## MITRE Tactics Covered (Frontend Static Data)

| Tactic ID | Tactic Name | Key Techniques |
|-----------|------------|----------------|
| TA0001 | Initial Access | T1110 Brute Force, T1190 Exploit Public-Facing App, T1566 Phishing |
| TA0002 | Execution | T1059 Command & Scripting Interpreter, T1203 Client Exploitation |
| TA0003 | Persistence | T1053 Scheduled Task, T1098 Account Manipulation |
| TA0004 | Privilege Escalation | T1068 Exploit for Privilege Escalation, T1548 Abuse Elevation Control |
| TA0005 | Defense Evasion | T1036 Masquerading, T1562 Impair Defenses |
| TA0006 | Credential Access | T1003 OS Credential Dumping, T1555 Credentials from Password Stores |
| TA0007 | Discovery | T1046 Network Service Discovery, T1082 System Info Discovery |
| TA0008 | Lateral Movement | T1021 Remote Services, T1534 Internal Spearphishing |
| TA0009 | Collection | T1005 Data from Local System, T1560 Archive Collected Data |
| TA0010 | Exfiltration | T1041 Exfiltration Over C2, T1048 Exfiltration Over Alt Protocol |
| TA0040 | Impact | T1498 Network Denial of Service, T1485 Data Destruction |

---

## Live MITRE Telemetry (from Database)

### How It Works

1. When a `SecurityAlert` is created (via flow ingestion or honeypot event), it includes `mitreId`, `mitreTactic`, and `mitreTechnique` fields.
2. These fields are persisted to the `security_alerts` table.
3. `MitreService.getMatrixStats()` queries all alerts, groups by `mitreId`, and computes:
   - `eventCount` — total alerts for this technique
   - `firstSeen` — earliest alert timestamp
   - `lastSeen` — most recent alert timestamp
   - `highestSeverity` — worst severity seen
   - `criticalCount`, `highCount`, `mediumCount`, `lowCount` — severity breakdown

### API

- `GET /api/v1/mitre/matrix` → `MitreStatsDTO[]` (one entry per observed technique ID)
- `GET /api/v1/mitre/techniques/{id}` → `MitreStatsDTO` for one technique

### Frontend Rendering

The MITRE Matrix page (`/mitre`) merges:
- **Static metadata** from `mitreTactics.ts` (technique names, descriptions, mitigations)
- **Live telemetry** from `GET /mitre/matrix` (event counts, severity, dates)

Techniques with `eventCount: 0` display as `NOMINAL` state.

---

## MITRE Technique Mapping (Alert Ingestion)

### From AI Engine Predictions (AlertController.java — ingest-flow)

| Attack Class | MITRE ID | Tactic | Technique |
|-------------|---------|--------|-----------|
| SSH_BRUTE_FORCE | T1110 | Initial Access | Brute Force |
| HTTP_SQL_INJECTION | T1190 | Execution | Exploit Public-Facing Application |
| TELNET_MIRAI | T1046 | Discovery | Network Service Discovery |
| DDoS_SYN_FLOOD | T1498 | Impact | Network Denial of Service |
| Other (fallback) | T1059 | Execution | Command and Scripting Interpreter |
| BENIGN | None | — | — |

If the AI engine itself returns MITRE fields (in `aiData`), those take precedence.

### From Honeypot Events (HoneypotOrchestratorService.java)

| Honeypot Event Type | MITRE ID | Tactic | Technique |
|--------------------|---------|--------|-----------|
| SSH_LOGIN_SUCCESS / login.success | T1078 | Initial Access | Valid Accounts |
| COMMAND / file_download | T1059 | Execution | Command and Scripting Interpreter |

---

## Technique Resolution Priority

```
1. AI engine prediction (mitreTactic, mitreTechnique, mitreId in response)
        ↓ if empty/null
2. Alert ingestion rule-based mapping (attackType string matching)
        ↓ if no match
3. Fallback: T1059 / Execution / Command and Scripting Interpreter
```
