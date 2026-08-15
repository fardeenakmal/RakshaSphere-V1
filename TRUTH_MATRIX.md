# RAKSHASPHERE — MASTER FEATURE TRUTH MATRIX

**Version:** `1.0.0-RELEASE`  
**Date:** `2026-08-15`  
**Classification:** Production Feature Audit & Component Truthfulness Matrix

---

## Executive Summary

RakshaSphere strictly enforces technical truthfulness across all UI components, backend APIs, and documentation. Features are audited and categorized into three distinct operational states:

- **`REAL`**: Fully implemented, database-persisted, runtime-verified production code.
- **`SIMULATED`**: User-space prototype or synthetic implementation with clear UI labeling.
- **`NOT VERIFIED`**: Features requiring external physical hardware not attached to this build.

---

## Master Feature Audit Matrix

| Feature / Subsystem | Operational Status | Technical Implementation Details | UI Labeling |
|---|---|---|---|
| **JWT Authentication & RBAC** | **`REAL`** | Spring Security 6, BCrypt password hashing, SHA-512 signed JWT tokens, `@PreAuthorize` role enforcement (`ROLE_ADMIN`, `ROLE_SOC_ANALYST`, `ROLE_USER`). | Live Auth Gateway |
| **TOTP Multi-Factor Auth (MFA)** | **`REAL`** | Secret key generation, QR code setup, time-based OTP validation via `MfaService`. | Live Modal in Settings |
| **User Request Access & Approval** | **`REAL`** | `POST /api/v1/auth/register` creates account with `PENDING` status. Demotes requested `ADMIN` roles. Requires Super Admin approval (`PUT /api/v1/users/{id}/approve`). | User Management Tab |
| **System Hardware Telemetry** | **`REAL`** | Live OperatingSystemMXBean metrics (`GET /api/v1/system/info`), host CPU cores, RAM, filesystem disk usage, JVM uptime. | System Information Tab |
| **System Health Aggregator** | **`REAL`** | Single authoritative `useHealthStore` polling `GET /api/v1/system/health`. Aggregates 13 subsystem health indicators with no `0/13` loading flashes. | Header & System Health Page |
| **MySQL 8.0 Persistence** | **`REAL`** | HikariCP pool, InnoDB schema, JPA repositories (`User`, `SecurityAlert`, `HoneypotSession`, `IotDevice`, `IotTelemetryLog`, `AuditLog`). | Live Database |
| **Redis In-Memory Cache** | **`REAL`** | Redis 7.x connection pool for fast metric retrieval with fallback on cache miss. | System Health Indicator |
| **STOMP WebSocket Real-Time Bus** | **`REAL`** | Spring WebSocket message broker broadcasting to `/topic/alerts` and `/topic/honeypot`. | Real-time Dashboard Updates |
| **Cowrie Deception Honeypot** | **`REAL`** | Docker sidecar (`honeypot-manager`) spawning isolated Cowrie SSH containers on `honeypot_net` (`internal=true`, `cap_drop=[ALL]`). Zero-trust password stripping. | Honeypots Page & Dossier |
| **AI ML Inference Engine** | **`REAL`** | FastAPI container executing scikit-learn `RandomForestClassifier` & `StandardScaler` model artifacts on 84-element flow vectors. | AI Threat Analysis |
| **AI Dataset Training Data** | **`SYNTHETICALLY TRAINED`** | Model trained on synthetically generated network flow vectors. | `"trainingNotice": "MODEL TRAINED ON SYNTHETIC DATA"` |
| **AI Explainability Engine** | **`HEURISTIC`** | Gini feature attribution weighting returning top-K risk contributing features. | Heuristic Attribution Label |
| **AI Anomaly Detector** | **`STATISTICAL MSE`** | Vector reconstruction Mean Squared Error (MSE) loss variance calculation. | Statistical Anomaly Metric |
| **IoT Telemetry Software Pipeline** | **`REAL`** | Python daemon (`agent.py`), Mosquitto MQTT broker (`:1883`), Paho Java subscriber (`IotMqttSubscriberService`), LWT offline notice, MySQL logging. | Software Pipeline = REAL |
| **Physical ESP32 Edge Device** | **`NOT VERIFIED`** | No physical ESP32 microcontroller attached to build host. | ESP32 Hardware = NOT VERIFIED |
| **VirusTotal & AbuseIPDB Intel** | **`REAL`** | Reactive parallel API calls with 4s timeout, exponential backoff retries, and non-blocking fallback on rate limits (`429`). | Threat Intel Badges |
| **Kernel eBPF / XDP Driver** | **`SIMULATED`** | User-space JNI prototype simulating packet filtering actions. | `SIMULATED` Badge |
| **Cryptographic Audit Trail** | **`REAL`** | Append-only `audit_logs` table storing SHA-256 state hashes (`crypto_hash`) for RBAC events and admin actions. | Settings Audit Log |
| **Database Backup & Restore** | **`REAL`** | Automated database snapshots (`backup-manual-verification.sql`) with timestamp validation and verified isolated schema restore. | Backup Health Indicator |

---

## Non-Negotiable Engineering Rules

1. **Zero Fake Metrics:** UI components must never output `Math.random()` or hardcoded mock JSON.
2. **Zero Plaintext Passwords:** Submitted user authentication and honeypot passwords are zeroized and never logged.
3. **No Public Admin Self-Registration:** Public registration cannot grant `ROLE_ADMIN` permissions.
4. **No Hidden Secrets:** API keys and JWT signing secrets are stored exclusively in server environment variables.
