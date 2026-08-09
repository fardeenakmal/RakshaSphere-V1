# RakshaSphere

> **AI-Powered Autonomous Cyber Defense & Self-Healing Network Platform**

[![Version](https://img.shields.io/badge/version-1.0.0--production-007ACC?style=for-the-badge&logo=git&logoColor=white)](https://github.com/fardeenakmal/RakshaSphere-V1)
[![License](https://img.shields.io/badge/license-MIT-green?style=for-the-badge&logo=open-source-initiative&logoColor=white)](LICENSE)
[![Java 21](https://img.shields.io/badge/Java-21_LTS-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white)](https://www.oracle.com/java/)
[![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.2.x-6DB33F?style=for-the-badge&logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
[![Next.js](https://img.shields.io/badge/Next.js-14.x-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![Docker](https://img.shields.io/badge/Docker-Containerized-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)

---

## 📑 Table of Contents

- [Overview](#-overview)
- [System Architecture](#-system-architecture)
- [Core Features & Modules](#-core-features--modules)
- [Technology Stack](#-technology-stack)
- [Repository Structure](#-repository-structure)
- [End-to-End System Workflow](#-end-to-end-system-workflow)
- [Installation & Setup Guide](#-installation--setup-guide)
- [Project Status & Roadmap](#-project-status--roadmap)
- [License](#-license)

---

## 🛡️ Overview

**RakshaSphere** is an enterprise-ready, AI-driven autonomous cyber defense platform engineered by a solo developer. It unifies real-time threat detection, dynamic adversary deception, automated risk quantification, and self-healing network orchestration into a single resilient security ecosystem.

Traditional Security Operations Center (SOC) infrastructure suffers from high false positive rates, delayed manual remediation, and static rules that fail against zero-day exploits. RakshaSphere addresses this through a **Closed-Loop Cyber Defense Architecture**. When a malicious payload or reconnaissance pattern is classified, the platform automatically triggers network containment via eBPF/iptables, diverts attackers into isolated deception honeypots, and presents actionable telemetry on a unified Next.js SOC dashboard.

### Key Value Proposition
- **Zero-Day Anomaly Detection**: Deep Autoencoders flag uncatalogued exploits in sub-10ms.
- **Attacker Redirection**: Dynamically routes attacker traffic into ephemeral Docker deception containers.
- **Automated Network Self-Healing**: Enforces network containment within milliseconds of threat validation, eliminating the MTTR (Mean Time to Respond) human bottleneck.

---

## 🏗️ System Architecture

RakshaSphere follows a decoupled microservices pattern comprising five core subsystems: Network Ingestion Layer, AI Classification Core, Threat Intelligence Engine, Self-Healing Orchestrator, and the Next.js SOC Dashboard.

### Enterprise Data Flow & Architecture

```mermaid
flowchart TB
    subgraph Client_Edge ["Network Edge & Ingestion Layer"]
        NET_TAP["Raw Traffic / PCAP Tap"]
        IOT_DAEMON["IoT Edge Security Daemon"]
        FLOW_EXTRACT["CICFlowMeter / Scapy Analyzer"]
    end

    subgraph AI_Inference ["AI & Machine Learning Core"]
        MODEL_RF["Random Forest Classifier"]
        MODEL_XGB["XGBoost Flow Engine"]
        MODEL_AE["Autoencoder Anomaly Detector"]
        INFERENCE_API["Python FastAPI Endpoint"]
    end

    subgraph Backend_Core ["Spring Boot 21 Backend Core"]
        JWT_AUTH["Spring Security & JWT"]
        EVENT_BUS["Async Security Event Bus"]
        RISK_ENGINE["Dynamic Risk Scoring Engine"]
        MITRE_MAPPER["MITRE ATT&CK Mapping Module"]
        HEAL_ENGINE["Self-Healing Orchestrator"]
    end

    subgraph Deception_Subsystem ["Adaptive Deception Subsystem"]
        HONEY_MGR["Dynamic Trap Controller"]
        TRAP_SSH["SSH Honeypot"]
        TRAP_HTTP["HTTP Web Trap"]
    end

    subgraph External_Feeds ["External Threat Intelligence"]
        VT_API["VirusTotal API v3"]
        ABUSE_API["AbuseIPDB API v2"]
    end

    subgraph Storage_Presentation ["Persistence & Management"]
        MYSQL_DB[("MySQL 8.0 Database")]
        REDIS_CACHE[("Redis Cache")]
        SOC_UI["Next.js 14 SOC Dashboard"]
    end

    NET_TAP --> FLOW_EXTRACT
    FLOW_EXTRACT -->|84 Feature Vector| INFERENCE_API
    INFERENCE_API --> MODEL_RF & MODEL_XGB & MODEL_AE
    MODEL_RF & MODEL_XGB & MODEL_AE -->|Threat Label & Confidence| EVENT_BUS
    EVENT_BUS --> RISK_ENGINE & MITRE_MAPPER
    MITRE_MAPPER <--> External_Feeds
    HEAL_ENGINE -->|eBPF / iptables| NET_TAP
    HEAL_ENGINE -->|Spawn & Divert| HONEY_MGR
    HONEY_MGR --> TRAP_SSH & TRAP_HTTP
    EVENT_BUS --> MYSQL_DB & REDIS_CACHE
    EVENT_BUS -->|Stomp WebSocket| SOC_UI
```

---

## 📦 Core Features & Modules

### 1. Intelligent Intrusion Detection System (IIDS)
Captures raw packet streams via Scapy and passes network flow windows to CICFlowMeter to generate 84 distinct statistical features. The Python AI Core evaluates these using an ensemble of Random Forest, XGBoost, and Deep Autoencoders.

### 2. Automated Self-Healing Network Engine
Provides automated containment upon validation of critical threats:
- **eBPF / XDP Packet Drop**: Injects low-level network packet filter rules to drop attacker traffic at the NIC driver layer.
- **Dynamic iptables & Socket Termination**: Kills active TCP sessions associated with compromised credentials instantly.

### 3. Adaptive Honeypot Subsystem
Dynamically spins up isolated, low/medium-interaction Docker containers mimicking SSH daemons or IoT Telnet interfaces, diverting suspicious IPs to capture forensic telemetry and keystrokes.

### 4. MITRE ATT&CK & Threat Intelligence Engine
- Maps behaviors to specific Tactics, Techniques, and Procedures (TTPs) using the official MITRE ATT&CK Matrix.
- Queries AbuseIPDB and VirusTotal via async workers to enrich logs with IP reputation and geographic data.

---

## 🛠️ Technology Stack

| Domain | Technology | Role & Purpose |
| :--- | :--- | :--- |
| **Frontend UI** | **Next.js 14, React, Tailwind CSS** | High-performance React App Router for SOC dashboard. |
| **Backend Core** | **Java 21, Spring Boot 3.2** | Enterprise microservices, OOP components, and business logic. |
| **Security** | **Spring Security, Nimbus JOSE JWT** | Role-based access control (RBAC), API rate-limiting, authentication. |
| **Database** | **MySQL 8.0, Redis 7.2** | Relational storage for audit logs and high-speed caching. |
| **AI / Machine Learning** | **Python 3.11, FastAPI, Scikit-Learn** | Threat inference server and multi-model ensemble classifiers. |
| **DevOps** | **Docker, Docker Compose, Nginx** | Fully containerized environment orchestration and reverse proxy. |

---

## 💻 Installation & Setup Guide

### Prerequisites
- Docker Engine `v25.0+` & Docker Compose
- Java Development Kit `OpenJDK 21 LTS`
- Node.js `v20.x`
- Python `v3.11+`

### Quickstart via Docker Compose (Production Ready)

```bash
# 1. Clone repository
git clone https://github.com/fardeenakmal/RakshaSphere-V1.git
cd RakshaSphere-V1

# 2. Configure Environment Variables
cp docker/.env.example docker/.env

# 3. Build and launch all services
docker compose -f docker/docker-compose.yml up --build -d
```

Once launched, access the system:
- **SOC Dashboard**: `http://localhost:3000` (Login: `admin` / `Admin@Raksha2026!`)
- **Backend API**: `http://localhost:8080/api/v1`
- **AI Inference Engine**: `http://localhost:5000/docs`

---

## 🗺️ Project Status & Roadmap

The project is currently in a **Production-Ready** state.

```mermaid
gantt
    title RakshaSphere Engineering Roadmap
    dateFormat  YYYY-MM-DD
    section Phase 1 & 2: Architecture & AI
    Core Setup & AI Inference Server         :done, p1, 2025-01-01, 2025-06-30
    section Phase 3: Intel & Risk Engine
    MITRE ATT&CK & Risk Scoring Formula      :done, p2, 2025-07-01, 2025-10-31
    section Phase 4: Self-Healing & SOC
    eBPF Orchestrator & Next.js SOC          :done, p3, 2025-11-01, 2026-01-31
    section Phase 5: Production Hardening
    Zero Trust, Auth Fixes, Audit Logging    :done, p4, 2026-02-01, 2026-08-09
```

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for complete terms. Developed and maintained by Fardeen Akmal.
