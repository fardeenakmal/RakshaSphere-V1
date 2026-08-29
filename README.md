# RakshaSphere (रक्षाSphere) — Autonomous Cyber Defense Platform

[![Next.js 15](https://img.shields.io/badge/Frontend-Next.js%2015%20(App%20Router)-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![Spring Boot 3.2](https://img.shields.io/badge/Backend-Spring%20Boot%203.2%20(Java%2021)-green?style=flat-square&logo=springboot)](https://spring.io/projects/spring-boot)
[![FastAPI](https://img.shields.io/badge/AI%20Engine-FastAPI%20(Python%203.11)-teal?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Docker Compose](https://img.shields.io/badge/Deployment-Docker%20Compose-blue?style=flat-square&logo=docker)](https://www.docker.com/)
[![eBPF / XDP](https://img.shields.io/badge/Kernel-eBPF%20%2F%20XDP-red?style=flat-square&logo=linux)](https://ebpf.io/)
[![MySQL 8.0](https://img.shields.io/badge/Database-MySQL%208.0-orange?style=flat-square&logo=mysql)](https://www.mysql.com/)
[![Redis 7](https://img.shields.io/badge/Cache-Redis%207-critical?style=flat-square&logo=redis)](https://redis.io/)
[![Mosquitto MQTT](https://img.shields.io/badge/IoT-Eclipse%20Mosquitto-purple?style=flat-square&logo=eclipse)](https://mosquitto.org/)

> **An integrated, multi-tier autonomous cyber defense and security operations center (SOC) platform. RakshaSphere integrates real-time machine learning threat inference, kernel-level eBPF/XDP telemetry, containerized Cowrie honeypot deception sandboxing, IoT edge monitoring over MQTT, and a reactive analyst triage console.**

---

## Table of Contents

- [System Architecture](#system-architecture)
- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [Repository Structure](#repository-structure)
- [Service Topology & Port Allocations](#service-topology--port-allocations)
- [Quick Start Guide](#quick-start-guide)
  - [Prerequisites](#prerequisites)
  - [Step-by-Step Launch](#step-by-step-launch)
  - [Default Credentials](#default-credentials)
- [Service Verification & Health Checks](#service-verification--health-checks)
- [Documentation Index](#documentation-index)
- [Engineering Disclaimers & Scope](#engineering-disclaimers--scope)

---

## System Architecture

```
                                  ┌────────────────────────────────┐
                                  │      Next.js 15 SOC Console    │
                                  │      (Port 3000 | App Router)  │
                                  └───────────────┬────────────────┘
                                                  │ REST + STOMP WebSocket
                                                  ▼
┌─────────────────────────┐       ┌────────────────────────────────┐       ┌─────────────────────────┐
│     AI Engine (FastAPI)  │ ◄───► │   Spring Boot Backend Core     │ ◄───► │  Cowrie Honeypot Sidecar│
│  RandomForest Classifier│       │   (Port 8080 | Java 21 LTS)    │       │  (FastAPI on Port 6000) │
│      (Port 5000)        │       └───────┬───────────────┬────────┘       └─────────────────────────┘
└─────────────────────────┘               │               │
                                          ▼               ▼
                              ┌──────────────────┐ ┌───────────────┐
                              │ MySQL 8 Database │ │ Redis 7 Cache │
                              │   (Port 3307)    │ │  (Port 6379)  │
                              └──────────────────┘ └───────────────┘
                                          ▲               ▲
                                          │               │
                              ┌───────────┴───────────────┴────────┐
                              │      Eclipse Mosquitto (1883)      │
                              │ ◄── IoT Edge Security Agent Daemon │
                              └────────────────────────────────────┘
                                          │
                              ┌───────────┴────────────────────────┐
                              │  eBPF/XDP Kernel Defense Collector │
                              │   (Port 7000 | veth_raksha0 probe) │
                              └────────────────────────────────────┘
```

---

## Key Features

- 🛡️ **Executive SOC Dashboard (`/dashboard`):** Real-time threat radar, dynamic risk gauge, global geo-threat map, live incoming flow stream, and instant attack distribution breakdown.
- ⚡ **AI Threat Inference Engine (`/ai`):** Sub-10ms classification using an ensemble `RandomForestClassifier` trained on 84-element CICFlowMeter network flow vectors with Gini feature attribution.
- 🐧 **eBPF/XDP Kernel Defense Module (`/system-health`):** BPF C probe attached via Generic XDP (`xdpgeneric`) to a dedicated virtual test interface (`veth_raksha0`) reading live BPF map packet and byte counters.
- 🪤 **Cowrie Honeypot Sandboxing (`/honeypots`):** Isolated SSH deception containers running on an internal Docker bridge (`172.30.0.0/24`) with live terminal keystroke and command streaming.
- 📡 **IoT Edge Security Daemon:** Python daemon sampling `/proc` metrics (CPU, RAM, sockets) on host gateways, evaluating local anomaly rules, and publishing over Mosquitto MQTT.
- 🎯 **MITRE ATT&CK Matrix Visualization (`/mitre`):** Dynamic enterprise grid mapping live threat alerts against tactics including Initial Access (T1110, T1190), Execution (T1059), Discovery (T1046), and Impact (T1498).
- 🔄 **Self-Healing & Remediation (`/alerts`):** One-click threat mitigation supporting eBPF drop rules, honeypot diversion, and action reversion with non-repudiation cryptographic audit logs.
- 🔐 **Zero-Trust Security & RBAC:** Stateless HMAC-SHA256 JWT tokens (24-hour expiration), RFC 6238 TOTP Two-Factor Authentication, and role-based access control (`ROLE_ADMIN`, `ROLE_SOC_ANALYST`, `ROLE_USER`).
- 🌐 **Reactive Threat Intelligence:** WebClient-driven enrichment fetching reputation and ISP metadata from VirusTotal v3 and AbuseIPDB v2 with RFC 1918 internal bypass.

---

## Technology Stack

| Domain | Technology | Version | Purpose |
|---|---|---|---|
| **Frontend** | Next.js | 15.x | App Router SOC dashboard console |
| | React | 19.x | Component rendering & state hydration |
| | TypeScript | 5.x | Type safety across models and API clients |
| | Tailwind CSS | 3.4.x | Dark cybernetic theme design system |
| | Zustand | 4.5.x | Modular client state management |
| | STOMP / SockJS | — | Real-time WebSocket event ingestion |
| **Backend Core** | Spring Boot | 3.2.x | Microservice orchestration & REST API |
| | Java | 21 LTS | OpenJDK backend runtime |
| | Spring Security | 6.x | Stateless JWT filter & RBAC rules |
| | Spring Data JPA | 3.2.x | Object-relational mapping (Hibernate) |
| | Eclipse Paho | 1.2.x | MQTT consumer for IoT edge telemetry |
| **AI Inference** | FastAPI | 0.110+ | High-throughput sub-10ms REST API |
| | scikit-learn | 1.x | Pre-trained RandomForestClassifier |
| | NumPy / Pandas | — | Feature vector scaling & normalization |
| **Kernel & Sandboxing** | eBPF / XDP | C (clang/LLVM) | Linux kernel packet filtering & map stats |
| | Cowrie | latest | SSH / Telnet medium-interaction honeypot |
| | Docker SDK (Python) | — | Sidecar container lifecycle management |
| **Infrastructure** | MySQL | 8.0 | Primary relational persistence (port 3307) |
| | Redis | 7-alpine | Per-IP sliding window rate limiting (port 6379) |
| | Eclipse Mosquitto | latest | MQTT broker for IoT devices (port 1883) |

---

## Repository Structure

```
RakshaSphere/
├── .env.example                       Template environment configuration file
├── README.md                          Project entrypoint and architectural summary
├── DOCUMENTATION_VERIFICATION.md      Verification audit against codebase
├── CLEANUP_REPORT.md                  Cleanup and modernization report
├── ai-engine/                         FastAPI AI Inference Engine (:5000)
│   ├── inference_server.py            FastAPI endpoints (/predict, /explain, /health)
│   ├── inference/pipeline.py          Feature scaling and RandomForest prediction
│   ├── models/                        Trained classifier.pkl, scaler.pkl, manifest.json
│   └── preprocessing/                 Feature schema (84 CICFlowMeter names)
├── backend/                           Spring Boot 3.2 Core Backend (:8080)
│   ├── src/main/java/com/rakshasphere/
│   │   ├── config/                    WebMvc, CORS, Rate Limit, WebSocket configs
│   │   ├── controller/                REST API Controllers (11 controllers)
│   │   ├── health/                    Spring Actuator health indicators (9 subsystems)
│   │   ├── model/entity/              JPA Entities (User, Alert, Honeypot, etc.)
│   │   ├── security/                  JWT Provider, Filter, SecurityConfig
│   │   └── service/                   Business logic, eBPF JNI driver, Threat Intel
│   └── src/main/resources/ebpf/       eBPF C source (rakshasphere_xdp.bpf.c) & ELF (.o)
├── database/                          Database Schema & Initialization
│   └── init.sql                       MySQL master bootstrap script and seed data
├── docker/                            Container Orchestration
│   └── docker-compose.yml             Complete multi-service host-network orchestration
├── docs/                              Authoritative Documentation Package
│   ├── SYSTEM_OVERVIEW.md             System design, boundaries, and tech stack
│   ├── ARCHITECTURE.md                Network topology, communication matrix, JNI note
│   ├── API_REFERENCE.md               REST & WebSocket STOMP API documentation
│   ├── AUTHENTICATION.md              JWT lifecycle, TOTP MFA, RBAC permissions
│   ├── AI_ENGINE.md                   RandomForest classifier & synthetic data disclosure
│   ├── DATABASE.md                    MySQL schema, indexes, and JPA entity definitions
│   ├── MITRE_ATTACK.md                Static framework metadata vs observed telemetry
│   ├── HONEYPOT.md                    Cowrie honeypot sandboxing & event streaming
│   ├── EBPF.md                        Generic XDP kernel probe vs JNI stub driver
│   ├── IOT_AGENT.md                   Host metric sampling & MQTT messaging
│   ├── THREAT_INTEL.md                VirusTotal v3 & AbuseIPDB v2 reactive pipeline
│   ├── frontend/FRONTEND_GUIDE.md     Next.js 15 App router guide & Zustand stores
│   ├── backend/BACKEND_GUIDE.md       Spring Boot Java 21 architecture guide
│   ├── infrastructure/DEPLOYMENT_LOCAL.md Local Docker Compose operations guide
│   └── testing/TESTING_GUIDE.md       JUnit, frontend auth, and dry run test suites
├── ebpf-collector/                    Linux Kernel eBPF Telemetry Collector (:7000)
│   ├── collector.py                   FastAPI daemon reading bpftool kernel map counters
│   └── Dockerfile                     Privileged Linux container definition
├── frontend/                          Next.js 15 SOC Analyst Console (:3000)
│   ├── src/app/                       App router pages (/dashboard, /alerts, /mitre, etc.)
│   ├── src/components/                Modular UI cards, modals, tables, and guards
│   ├── src/services/api.ts            Unified REST API client layer
│   └── src/store/                     Zustand stores (useAlertStore, useAuthStore, etc.)
├── honeypot-manager/                  Cowrie Honeypot Lifecycle Manager (:6000)
│   ├── manager.py                     FastAPI sidecar controlling Docker daemon
│   └── Dockerfile                     Container definition with Docker socket access
└── iot-agent/                         IoT Edge Security Daemon
    ├── agent.py                       Python daemon reading /proc and evaluating rules
    └── config.json                    Device ID, MQTT broker, and threshold configuration
```

---

## Service Topology & Port Allocations

| Service Name | Container Name | Port (Host) | Protocol | Internal Network / Mode |
|---|---|---|---|---|
| **Next.js Frontend** | `raksha-frontend` | `3000` | HTTP | Host Network Mode |
| **Spring Boot Backend**| `raksha-backend` | `8080` | HTTP / WS | Host Network Mode |
| **FastAPI AI Engine** | `raksha-ai-engine` | `5000` | HTTP | Host Network Mode |
| **Honeypot Manager** | `raksha-honeypot-manager` | `6000` | HTTP | Host Network Mode |
| **eBPF Collector** | `raksha-ebpf-collector` | `7000` | HTTP | Host (Privileged) |
| **MySQL 8.0** | `raksha-mysql` | `3307` (ext) → `3306` | JDBC | Bridge / Port mapping |
| **Redis 7** | `raksha-redis` | `6379` | RESP | Host Network Mode |
| **Mosquitto MQTT** | `raksha-mosquitto` | `1883` | MQTT | Host Network Mode |
| **Cowrie SSH Honeypot**| Spawned on demand | `2222` | SSH | `honeypot_net` (`172.30.0.0/24`) |

---

## Quick Start Guide

### Prerequisites
- **Linux OS** (Ubuntu 22.04 LTS / Debian recommended for eBPF kernel support)
- **Docker Engine** 24.0+ & **Docker Compose** 2.20+
- **System Specs:** 4 Cores, 8 GB RAM, 20 GB Disk

### Step-by-Step Launch

```bash
# 1. Clone repository
git clone https://github.com/fardeenakmal/RakshaSphere.git
cd RakshaSphere

# 2. Configure environment
cp .env.example .env

# 3. Build images and start all services
cd docker
docker compose up -d --build

# 4. Check container health
docker compose ps
```

### Default Credentials

| Username | Password | Role | Description |
|---|---|---|---|
| `admin` | `Admin@Raksha2026!` | `ROLE_ADMIN` | Full access to user management, settings, & self-healing |
| `analyst_mike` | `Admin@Raksha2026!` | `ROLE_SOC_ANALYST`| Triage capabilities, containment, & audit log viewing |

---

## Service Verification & Health Checks

Once the platform is running, test the core services via terminal:

```bash
# 1. Verify Spring Boot Actuator health probe matrix
curl -s http://localhost:8080/actuator/health | jq .

# 2. Test AI Engine classification pipeline
curl -s http://localhost:5000/health | jq .

# 3. Test Honeypot Manager status
curl -s http://localhost:6000/health | jq .

# 4. Check real eBPF kernel attachment & map counters
curl -s http://localhost:7000/api/ebpf/status | jq .

# 5. Execute Backend JUnit test suite
cd ../backend && ./mvnw test

# 6. Execute Frontend Auth test suite
cd ../frontend && npx tsx src/tests/auth_cases.test.ts
```

---

## Documentation Index

Explore the comprehensive documentation suite in the [`docs/`](file:///home/fardeen/RakshaSphere/docs/) directory:

- 📖 **[System Overview](docs/SYSTEM_OVERVIEW.md)** — Architectural vision, module roles, and technology matrix.
- 📐 **[Architecture Specification](docs/ARCHITECTURE.md)** — Deep dive into container topologies, communications, and backend packages.
- 📡 **[REST & STOMP API Reference](docs/API_REFERENCE.md)** — Complete endpoint parameters, DTOs, and error codes.
- 🔑 **[Authentication & Security](docs/AUTHENTICATION.md)** — JWT generation, TOTP MFA verification, and RBAC matrix.
- 🧠 **[AI Inference Engine](docs/AI_ENGINE.md)** — Model schema, 84-feature CICFlowMeter layout, and synthetic data notices.
- 🗄️ **[Database & Persistence](docs/DATABASE.md)** — MySQL 8 schema, JPA entity mapping, and automated backups.
- 🎯 **[MITRE ATT&CK Integration](docs/MITRE_ATTACK.md)** — Framework metadata vs dynamic database telemetry.
- 🍯 **[Honeypot Deception](docs/HONEYPOT.md)** — Cowrie container sandboxing, event ingestion, and terminal streaming.
- 🛡️ **[eBPF / XDP Defense Module](docs/EBPF.md)** — Generic XDP kernel probe details vs JNI driver simulation.
- 📟 **[IoT Edge Subsystem](docs/IOT_AGENT.md)** — Linux `/proc` sampling, edge anomaly detection, and Mosquitto broker.
- 🌐 **[Threat Intelligence Service](docs/THREAT_INTEL.md)** — VirusTotal v3 and AbuseIPDB v2 reactive WebClient enrichment.
- 💻 **[Frontend Developer Guide](docs/frontend/FRONTEND_GUIDE.md)** — Next.js 15 App router structure, Zustand stores, and styling.
- ☕ **[Backend Developer Guide](docs/backend/BACKEND_GUIDE.md)** — Spring Boot 3.2 Java 21 service architecture.
- 🚀 **[Local Deployment Guide](docs/infrastructure/DEPLOYMENT_LOCAL.md)** — Docker Compose step-by-step operations.
- 🧪 **[Testing & Verification Guide](docs/testing/TESTING_GUIDE.md)** — Automated test execution across backend, frontend, and AI.

---

## Engineering Disclaimers & Scope

1. **Target Deployment Scope:** RakshaSphere is designed and validated specifically for **local multi-container college demonstration and cybersecurity research**. It is not configured for public internet exposure without network perimeter hardening and credential rotation.
2. **AI Model Training:** The machine learning classifier is trained on **synthetic Gaussian-cluster network flow vectors**. The 100% test metrics reflect synthetic separability and require validation against live PCAP datasets (e.g., CIC-IDS2017) prior to production deployment.
3. **eBPF Scope:** The eBPF telemetry collector attaches in **Generic XDP mode** (`xdpgeneric`) to a dedicated virtual test interface (`veth_raksha0`), not to the physical hardware root NIC.

---

*RakshaSphere (रक्षाSphere) — Developed for College Academic Demonstration & Cyber Defense Research.*
