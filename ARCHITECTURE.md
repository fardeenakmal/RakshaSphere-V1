# RAKSHASPHERE — ARCHITECTURE SPECIFICATION

**Version:** `1.0.0-RELEASE`  
**Target:** FAANG-Level Autonomous Cyber Defense & SOC Platform

---

## 1. System Topology & Network Map

RakshaSphere is built as a containerized microservices architecture. Subsystems communicate over designated network ports and isolated internal bridge networks.

```
                               ┌──────────────────────────┐
                               │   Nginx Reverse Proxy    │
                               │   Port 80 (HTTP) / 443   │
                               └────────────┬─────────────┘
                                            │
                      ┌─────────────────────┴─────────────────────┐
                      ▼                                           ▼
          ┌──────────────────────┐                    ┌──────────────────────┐
          │   Next.js SOC UI     │                    │  Spring Boot Backend │
          │      Port 3000       │                    │      Port 8080       │
          └──────────────────────┘                    └───────────┬──────────┘
                                                                  │
         ┌───────────────────┬───────────────────┬────────────────┼───────────────────┐
         ▼                   ▼                   ▼                ▼                   ▼
  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐ ┌──────────────┐ ┌──────────────────────┐
  │ MySQL 8.0 DB │    │ Redis Cache  │    │Mosquitto MQTT│ │ Python AI    │ │ Honeypot Manager     │
  │  Port 3307   │    │  Port 6379   │    │  Port 1883   │ │  Port 5000   │ │     Port 6000        │
  └──────────────┘    └──────────────┘    └──────────────┘ └──────────────┘ └───────────┬──────────┘
                                                                                      │
                                                                           (honeypot_net internal)
                                                                                      │
                                                                           ┌──────────┴───────────┐
                                                                           │ Cowrie SSH Trap      │
                                                                           │ Port 2222 (isolated) │
                                                                           └──────────────────────┘
```

---

## 2. Port & Service Registry

| Port | Service Name | Protocol | Access Level | Description |
|---|---|---|---|---|
| **3000** | Next.js SOC Dashboard | HTTP / React App Router | Public / Internal | Executive & SOC Analyst visual interface. |
| **8080** | Spring Boot Backend Core | REST API & STOMP WS | Authenticated (JWT) | Central business logic, auth, alert engine, WebSocket broker. |
| **3307** | MySQL 8.0 Database | TCP / MySQL Protocol | Internal | Relational persistence for users, alerts, honeypots, telemetry, audit logs. |
| **6379** | Redis 7.x Cache | TCP / Redis Protocol | Internal | In-memory key-value cache for system metrics and session state. |
| **1883** | Eclipse Mosquitto | MQTT Protocol | Internal | IoT Telemetry MQTT broker with topic ACL policies. |
| **5000** | Python AI Engine | HTTP / FastAPI | Internal | ML flow classification, anomaly detection, and explainability endpoints. |
| **6000** | Honeypot Manager | HTTP / FastAPI | Internal (API Key) | Dynamic Docker sidecar managing Cowrie honeypot containers. |
| **2222** | Cowrie Honeypot SSH | SSH | Isolated Bridge | Low-interaction deception SSH trap for capturing attacker keystrokes. |

---

## 3. Data Flow & Event Pipelines

### A. Alert Ingestion & Classification Pipeline
```
Raw Flow Vector (84 Features)
       ↓
POST /api/v1/ai/predict (FastAPI :5000)
       ↓
RandomForest Classifier & StandardScaler
       ↓
Risk Score Calculation & MITRE ATT&CK Mapping (Spring Boot :8080)
       ↓
VirusTotal V3 & AbuseIPDB V2 Async Enrichment
       ↓
MySQL Persistence (security_alerts) & STOMP Broadcast (/topic/alerts)
       ↓
Live UI Render (Next.js :3000)
```

### B. Deception & Honeypot Event Pipeline
```
Attacker SSH Connection (Port 2222)
       ↓
Cowrie Container (honeypot_net internal, cap_drop=[ALL])
       ↓
Log Volume (/logs/cowrie-{session_id}/cowrie.json)
       ↓ (Passwords Stripped: "password": "")
Honeypot Manager Watcher (manager.py :6000)
       ↓
POST /api/v1/honeypots/events (Spring Boot :8080)
       ↓
MySQL Persistence (honeypot_events) & STOMP Broadcast (/topic/honeypot)
```

---

## 4. Security Architecture

1. **Authentication & Token Signing:** Passwords hashed using `BCryptPasswordEncoder`. JWT tokens signed with SHA-512 secret key (`JWT_SECRET`).
2. **Role-Based Access Control:** Spring Security `@EnableMethodSecurity` and `@PreAuthorize` enforce role permissions (`ROLE_ADMIN`, `ROLE_SOC_ANALYST`, `ROLE_USER`).
3. **HTTP Status Boundary:** Unauthenticated calls return `401 Unauthorized`. Unauthorized role calls return `403 Forbidden`.
4. **Zero Trust Log Sanitization:** User authentication passwords and honeypot keystroke passwords are zeroized before logging or database insertion.
5. **Container Isolation:** Cowrie honeypot containers run on an internal bridge network (`honeypot_net`) with `cap_drop=["ALL"]`, `no-new-privileges:true`, and resource limits (256MB RAM, 0.25 CPU quota).
