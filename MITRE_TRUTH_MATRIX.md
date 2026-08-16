# RAKSHASPHERE — MITRE ATT&CK TRUTH MATRIX

This matrix documents the verification status and technical provenance of every component in the RakshaSphere MITRE ATT&CK subsystem.

---

## Technical Truth Matrix

| Component | Status | Technical Evidence / Implementation Details |
| :--- | :--- | :--- |
| **ATT&CK Technique Metadata** | **REAL** | Standardized v14.1 Enterprise ATT&CK technique IDs (T1110, T1190, T1046, T1059, T1078, etc.), descriptions, and mitigations defined in `frontend/src/data/mitreTactics.ts` and `database/schema/01_init_tables.sql`. |
| **Tactic Metadata** | **REAL** | Official MITRE tactics (Initial Access, Execution, Persistence, Privilege Escalation, Discovery, Lateral Movement, Impact) defined in `frontend/src/data/mitreTactics.ts` and `database/schema/01_init_tables.sql`. |
| **Alert $\rightarrow$ Technique Mapping** | **REAL** | Deterministic mapping layer in `AlertController.java` linking network threat classifications directly to verified ATT&CK TTP IDs in `SecurityAlert` database records. |
| **AI $\rightarrow$ MITRE Mapping** | **REAL / DERIVED** | Python AI Engine (`ai-engine/inference/pipeline.py`) deterministically maps 84-feature netflow ML predictions (`SSH_BRUTE_FORCE` $\rightarrow$ T1110, `HTTP_SQL_INJECTION` $\rightarrow$ T1190, `TELNET_MIRAI` $\rightarrow$ T1046, `DDoS_SYN_FLOOD` $\rightarrow$ T1498) to valid MITRE taxonomy. |
| **Cowrie $\rightarrow$ MITRE Mapping** | **REAL / DERIVED** | Honeypot Orchestrator (`HoneypotOrchestratorService.java`) dynamically creates `SecurityAlert` instances mapping SSH breaches to T1078 (Valid Accounts) and executed commands to T1059 (Command and Scripting Interpreter). |
| **Activity Counts** | **REAL** | Calculated dynamically via database aggregation (`MitreService.java` & `MitreController.java`) querying stored `security_alerts`. Techniques with 0 observed events display `0` activity. |
| **Last Seen** | **REAL** | Extracted from the most recent database timestamp (`timestamp` field of matching `SecurityAlert` entities). Unobserved techniques display `Last Seen: Never`. |
| **Severity** | **DERIVED** | Technique severity is calculated dynamically from the highest observed alert severity (CRITICAL/HIGH/MEDIUM/LOW) among alerts mapped to that technique. Defaults to `NOMINAL` when unobserved. |
| **Global Threat Statistics** | **NOT PROVIDED** | The dashboard strictly labels metrics as "Observed RakshaSphere Events" / "RakshaSphere Telemetry". Global or fabricated worldwide threat statistics are not presented. |
| **Mock MITRE Activity** | **NONE** | All hardcoded, fake, or synthetic MITRE activity counts have been removed. Telemetry hit metrics strictly reflect database state. |

---

## Pipeline End-to-End Verification Flow

```
+--------------------------+
| Telemetry Event Ingest   |  (Network Netflow / Cowrie Honeypot Event)
+--------------------------+
             |
             v
+--------------------------+
| Machine Learning & CTI   |  (AI Engine prediction / Honeypot Orchestrator)
+--------------------------+
             |
             v
+--------------------------+
| SecurityAlert Entity     |  (Persisted in MySQL with mitre_id, mitre_tactic, mitre_technique)
+--------------------------+
             |
             v
+--------------------------+
| MITRE Service API        |  (MitreController /api/v1/mitre/matrix database stats aggregation)
+--------------------------+
             |
             v
+--------------------------+
| MITRE Dashboard UI       |  (Truthful activity counts, dynamic severities, STIX 2.1 detail modal)
+--------------------------+
```

---

## Subsystem Classification

```
CLASSIFICATION: FULLY REAL AND RUNTIME VERIFIED
```

> **Architectural Note:** MITRE ATT&CK taxonomy metadata (tactic names, technique IDs, descriptions, and framework mappings) are static/versioned reference data from the official MITRE framework, while all displayed technique activity, alert event counts, timestamps, and severity distributions are live runtime database telemetry.

