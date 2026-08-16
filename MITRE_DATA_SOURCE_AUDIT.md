# MITRE ATT&CK DATA SOURCE AUDIT — RAKSHASPHERE

This document presents the complete forensic audit of all MITRE ATT&CK data sources, taxonomy mappings, static metadata, and alert pipelines across the RakshaSphere project.

---

## Data Source Classification Summary

| Data Source / File Location | Description | Classification | Notes / Evidence |
|-----------------------------|-------------|----------------|------------------|
| `frontend/src/data/mitreTactics.ts` | Static list of 7 ATT&CK tactics (`TA0001`-`TA0011`) & 12 technique definitions | **STATIC REAL MITRE METADATA** / **HARDCODED DATA** | Metadata (IDs, names, descriptions, mitigations) are static real MITRE definitions. Initial technique counts are set to 0. Technique severity strings (`CRITICAL`, `HIGH`, etc.) are hardcoded. |
| `frontend/src/app/(dashboard)/mitre/page.tsx` | Dashboard heatmap & TTP incident aggregation logic | **REAL RAKSHASPHERE TELEMETRY** | Aggregates technique counts (`count`) dynamically by filtering real alert state from `useAlertStore` using `a.mitreId === tech.id`. |
| `ai-engine/inference/pipeline.py` | ML model prediction taxonomy mapping | **STATIC REAL MITRE METADATA** / **REAL RAKSHASPHERE TELEMETRY** | Deterministically maps AI threat predictions (`SSH_BRUTE_FORCE`, `HTTP_SQL_INJECTION`, `TELNET_MIRAI`, `DDoS_SYN_FLOOD`) to valid MITRE IDs (`T1110`, `T1190`, `T1046`, `T1498`). |
| `backend/src/main/java/com/rakshasphere/controller/AlertController.java` | Ingests network flow vectors & populates `SecurityAlert` entity | **REAL RAKSHASPHERE TELEMETRY** / **HARDCODED DATA** | Takes MITRE fields from AI Engine inference. Contains hardcoded fallback strings (`"Initial Access"`, `"Exploit"`, `"T1110"`) if AI engine response is incomplete. |
| `backend/src/main/java/com/rakshasphere/service/HoneypotOrchestratorService.java` | Maps real honeypot container events (Cowrie) to `SecurityAlert` | **REAL RAKSHASPHERE TELEMETRY** | Maps SSH success events to `T1078` (Valid Accounts) and command execution / payload events to `T1059` (Command & Scripting Interpreter). |
| `database/seed/dev_seed_data.sql` | Seed script for development database initialization | **SEEDED DATA** | Seeds initial roles, users, 3 MITRE tactics, 3 MITRE techniques, and 3 sample `security_alerts` (`ALT-2026-8901`, `ALT-2026-8902`, `ALT-2026-8903`). |
| `database/schema/01_init_tables.sql` | Relational tables for `mitre_tactics`, `mitre_techniques`, `security_alerts` | **STATIC REAL MITRE METADATA** | Defines SQL schema for storing tactics, techniques, and alert TTP attributes (`mitre_tactic`, `mitre_technique`, `mitre_id`). |

---

## Detailed Inspection Findings

### 1. Frontend MITRE Matrix (`mitre/page.tsx` & `mitreTactics.ts`)
- **Activity Counts**: Activity counts are **NOT hardcoded numbers** like 142, 110, or 1230 in the codebase. Counts are calculated at runtime by comparing loaded alerts (`alerts` from Zustand `useAlertStore`) with `tech.id` (`T1110`, etc.).
- **Zero-Activity State**: If no alerts match a technique, `count` evaluates to `0`.
- **Severity Handling**: Techniques currently have hardcoded static severity attributes (`severity: 'CRITICAL'`, etc.) in `mitreTactics.ts`. Per audit rules, MITRE techniques are not inherently Critical/High/Low—severity must be derived from actual observed alerts mapped to that technique.
- **"Last Seen" & Timestamps**: The frontend does not currently display "Last Seen" timestamps or first seen dates per technique. This must be calculated from real alert timestamps (`timestamp` field of matching `SecurityAlert` entities).

### 2. Backend & Alert Pipeline (`AlertController.java` & `SecurityAlert.java`)
- `SecurityAlert` entity persists `mitreTactic`, `mitreTechnique`, and `mitreId`.
- In `AlertController.java`, fallbacks for missing AI metadata default to `"T1110"`. Fallbacks must be made explicit and deterministic based on the underlying event/attack type.

### 3. AI Engine Mapping (`ai-engine/inference/pipeline.py`)
- The AI Engine evaluates an 84-element netflow vector and outputs `attackType`.
- It deterministically assigns valid ATT&CK TTPs:
  - `SSH_BRUTE_FORCE` $\rightarrow$ `T1110` (Initial Access / Brute Force)
  - `HTTP_SQL_INJECTION` $\rightarrow$ `T1190` (Execution / Exploit Public-Facing Application)
  - `TELNET_MIRAI` $\rightarrow$ `T1046` (Discovery / Network Service Discovery)
  - `DDoS_SYN_FLOOD` $\rightarrow$ `T1498` (Impact / Network Denial of Service)
  - `BENIGN` $\rightarrow$ `T0000` (Normal Operation)
- This is a valid, deterministic taxonomy mapping layer based on actual ML predictions.

### 4. Honeypot Event Pipeline (`HoneypotOrchestratorService.java`)
- Real Cowrie/honeypot events trigger alert creation:
  - `SSH_LOGIN_SUCCESS` $\rightarrow$ `T1078` (Valid Accounts)
  - `COMMAND` / `file_download` $\rightarrow$ `T1059` (Command and Scripting Interpreter)
- Mappings are technically grounded and avoid synthetic/fabricated events.

### 5. Verification of Fake/Hardcoded Numbers
- Searched codebase for `1230`, `142`, `110`, `230`. None of these are hardcoded in the frontend MITRE dashboard or backend MITRE calculations.
- The dashboard calculates total detected incidents by summing matching real alerts in the database.

---

## Recommendations & Next Phase Blueprint
1. **Remove Hardcoded Technique Severity**: Update `mitreTactics.ts` and `mitre/page.tsx` so severity is derived dynamically from observed alert severities rather than static technique defaults.
2. **Add Observed Metadata (Last Seen, First Seen, Alert Breakdown)**: Calculate `lastSeen` and `firstSeen` from actual matching alert timestamps.
3. **Enhance Backend Endpoint for MITRE TTP Aggregation**: Create dedicated backend endpoint (`GET /api/v1/mitre/matrix` or `GET /api/v1/mitre/stats`) to return actual database-calculated technique statistics (`eventCount`, `lastSeen`, `firstSeen`, `maxSeverity`, `alerts`) so the frontend doesn't rely solely on client-side array filtering.
4. **Detail Modal Enhancement**: Update technique detail modal to clearly separate **MITRE ATT&CK Metadata** (ID, Tactic, Description, Mitigation) from **RakshaSphere Observations** (Observed Event Count, Last Seen, Alert Severity Distribution).
5. **Truthful UI Wording**: Ensure all UI copy uses "Observed ATT&CK Activity" / "RakshaSphere Events" / "Observed Techniques".
