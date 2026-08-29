# RakshaSphere — System Overview

> **Version:** 1.0.0 | **Documentation Date:** 2026-08-18  
> **Source of truth:** Actual source code, configuration, and database schema inspected from `/home/fardeen/RakshaSphere`.

---

## What Is RakshaSphere?

RakshaSphere is a locally-hosted, multi-subsystem cybersecurity platform built as a college demonstration project. It integrates:

- A **machine-learning-based threat classifier** (Python / FastAPI / scikit-learn)
- A **Spring Boot REST + WebSocket backend** with JWT-secured APIs
- A **Next.js 15 SOC dashboard** for real-time alert visualization and analyst actions
- A **Cowrie honeypot manager** (Python / Docker / FastAPI) for deception-based attacker capture
- An **IoT edge security daemon** (Python / MQTT) that samples host metrics and publishes to a Mosquitto broker
- An **eBPF/XDP kernel probe** (BPF C / Python FastAPI collector) that attaches an XDP program to a dedicated `veth_raksha0` virtual interface
- A **MySQL 8 database** (with H2 fallback for local dev) for persistent alert, user, audit, honeypot, and telemetry storage
- **Redis 7** used for API rate limiting via per-IP sliding window counters
- **Threat intelligence** from VirusTotal v3 API and AbuseIPDB v2 API (requires API keys)

---

## Development / Demo Context

This platform targets **localhost-only college demonstration** execution. There is no remote cloud deployment in the current active configuration. All services communicate over `localhost` / Docker `host` network mode.

---

## Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | Next.js | 15.x (App Router) |
| Frontend Language | TypeScript | 5.x |
| Frontend State | Zustand | latest |
| Frontend Real-time | STOMP over SockJS | via `@stomp/stompjs` |
| Backend | Spring Boot | 3.2.x |
| Backend Language | Java | OpenJDK 21 LTS |
| Backend Security | Spring Security + JJWT | Stateless JWT |
| Backend WebSocket | STOMP over SockJS | Spring WebSocket |
| AI Engine | FastAPI + scikit-learn | Python 3.11+ |
| Classifier | RandomForestClassifier | sklearn 1.x |
| Honeypot | Python FastAPI + Docker SDK | Cowrie SSH Honeypot |
| IoT Agent | Python + paho-mqtt | Eclipse Mosquitto 1883 |
| eBPF Collector | Python FastAPI + bpftool | Port 7000 |
| Database (prod) | MySQL 8.0 | Port 3307 (Docker mapping) |
| Database (dev) | H2 In-Memory | Auto (no external dep) |
| Cache / Rate Limit | Redis 7 | Port 6379 |
| MQTT Broker | Eclipse Mosquitto | Port 1883 |
| Reverse Proxy | Nginx | (Docker optional) |
| Containerization | Docker + Compose | docker-compose v3.8 |

---

## Service Ports

| Service | Port | Notes |
|---------|------|-------|
| Frontend (Next.js) | 3000 | `npm run dev` or Docker |
| Backend (Spring Boot) | 8080 | REST API + STOMP `/ws-soc` |
| AI Engine (FastAPI) | 5000 | `/predict`, `/explain`, `/batch-predict`, `/health` |
| Honeypot Manager (FastAPI) | 6000 | `/deploy`, `/stop`, `/status`, `/health` |
| eBPF Collector (FastAPI) | 7000 | `/api/ebpf/status`, `/health` |
| MySQL (Docker) | 3307 (host) | Internal: 3306 |
| Redis | 6379 | Host network mode |
| MQTT Broker | 1883 | Eclipse Mosquitto |
| Cowrie SSH Honeypot | 2222 | Spawned on demand by honeypot-manager |

---

## High-Level Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                         BROWSER (Analyst)                             │
│         Next.js 15 SOC Dashboard  :3000                              │
│         REST (fetch) + STOMP/SockJS WebSocket                        │
└──────────────────────┬───────────────────────────────────────────────┘
                       │ HTTP / WebSocket
                       ▼
┌──────────────────────────────────────────────────────────────────────┐
│          Spring Boot Backend  :8080                                   │
│  /api/v1/*  (JWT-secured REST)  +  /ws-soc (STOMP broker)           │
│                                                                      │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────────┐    │
│  │  AlertController │  │ AuthController  │  │ MitreController  │    │
│  └────────┬─────────┘  └────────┬────────┘  └────────┬─────────┘    │
│           │                     │                     │              │
│  ┌────────▼────────────────────▼─────────────────────▼─────────┐   │
│  │                    Service Layer                               │   │
│  │  SecurityAlertService │ AuthenticationService │ MitreService  │   │
│  │  ThreatIntelService   │ SelfHealingService    │ MfaService    │   │
│  │  HoneypotOrchSvc      │ IotMqttSubscriberSvc  │ SystemHealth  │   │
│  └──────────────────────────────────────────────────────────────┘   │
└───┬───────────────┬───────────────┬────────────────┬────────────────┘
    │               │               │                │
    ▼               ▼               ▼                ▼
 MySQL:3307      Redis:6379    AI Engine:5000   Honeypot Mgr:6000
                               (FastAPI)         (FastAPI)
                                    │
                                    ▼
                           scikit-learn RF Model
                            (classifier.pkl)
                                    │
 eBPF Collector:7000 ◄─────────────┘
 (Kernel BPF maps,                  IoT Agent → Mosquitto:1883
  veth_raksha0)                                    │
                                              Backend subscribes:
                                    rakshasphere/devices/+/telemetry
```

---

## Data Persistence

All persistent data is stored in the **MySQL 8 database** (`rakshaspheredb`) when running via Docker Compose. When running the backend locally without Docker, it falls back to an **H2 in-memory database** (data is lost on restart).

## Authentication Overview

All backend REST endpoints (except `/api/v1/auth/login`, `/api/v1/auth/register`, `/api/v1/system/health`, `/ws-soc/**`, `/actuator/health`) require a valid JWT Bearer token.

Roles: `ROLE_ADMIN`, `ROLE_SOC_ANALYST`, `ROLE_USER`.

JWT expiry: 24 hours (configurable via `JWT_EXPIRATION_MS`).
