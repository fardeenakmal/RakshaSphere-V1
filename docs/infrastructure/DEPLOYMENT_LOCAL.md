# RakshaSphere — Local Deployment Guide

> **Source of truth:** `docker/docker-compose.yml`, `backend/src/main/resources/application.yml`, `.env.example`.

---

## Prerequisites

Before starting the platform locally, ensure the host system has:
- **Docker Engine** 24.0+ and **Docker Compose** 2.20+
- **Linux OS** (Ubuntu 22.04 LTS or Debian recommended for eBPF kernel support)
- **Minimum System Resources:**
  - 4 CPU Cores
  - 8 GB System RAM
  - 20 GB Free Disk Space
- **Ports Available:** `3000`, `3307`, `5000`, `6000`, `6379`, `7000`, `8080`, `1883`, `2222`.

---

## Environment Configuration

Create or inspect the `.env` file in the project root:

```env
# Database Credentials
MYSQL_ROOT_PASSWORD=001974
MYSQL_DATABASE=rakshaspheredb
MYSQL_USER=raksha_user
MYSQL_PASSWORD=change_this_user_password

# JWT Authentication
JWT_SECRET=9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b
JWT_EXPIRATION_MS=86400000

# Honeypot Manager
HONEYPOT_MANAGER_API_KEY=changeme

# Threat Intelligence API Keys (Optional)
VIRUSTOTAL_API_KEY=
ABUSEIPDB_API_KEY=

# Rate Limiting
RATE_LIMIT_MAX_REQUESTS=100
```

---

## Launching the Platform

To build images and launch all microservices in the background:

```bash
cd /home/fardeen/RakshaSphere/docker
docker compose up -d --build
```

### Checking Service Health

```bash
docker compose ps
```

Expected running containers:
1. `raksha-mysql` (Healthy on `3307`)
2. `raksha-redis` (Healthy on `6379`)
3. `raksha-mosquitto` (Running on `1883`)
4. `raksha-ai-engine` (Healthy on `5000`)
5. `raksha-backend` (Healthy on `8080`)
6. `raksha-frontend` (Running on `3000`)
7. `raksha-honeypot-manager` (Healthy on `6000`)
8. `raksha-ebpf-collector` (Healthy on `7000`)
9. `raksha-iot-agent` (Running)
10. `raksha-db-backup` (Running)

---

## Verification Endpoints

Test that key services are responding:

```bash
# 1. Spring Boot Actuator Health Check
curl -s http://localhost:8080/actuator/health | jq .

# 2. AI Engine Status
curl -s http://localhost:5000/health | jq .

# 3. Honeypot Manager Health
curl -s http://localhost:6000/health | jq .

# 4. eBPF Collector Status
curl -s http://localhost:7000/api/ebpf/status | jq .

# 5. Frontend UI
curl -I http://localhost:3000
```

---

## Stopping the Platform

To stop all services and preserve database volumes:

```bash
cd /home/fardeen/RakshaSphere/docker
docker compose down
```

To stop all services and remove all database volumes (clean reset):

```bash
docker compose down -v
```
