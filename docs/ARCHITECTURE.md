# RakshaSphere — Architecture

> **Source of truth:** Inspected from `docker/docker-compose.yml`, `backend/src/main/resources/application.yml`, source controllers, and services.

---

## 1. Deployment Topology

All services run on the **host network** (`network_mode: host`) in Docker Compose. There is no inter-container DNS bridging used; all services communicate via `localhost` on designated ports.

### Docker Services (docker/docker-compose.yml)

| Container Name | Image | Port | Purpose |
|----------------|-------|------|---------|
| `raksha-mysql` | `mysql:8.0` | 3307→3306 | Relational database |
| `raksha-mosquitto` | `eclipse-mosquitto:latest` | 1883 (host) | MQTT broker |
| `raksha-redis` | `redis:7-alpine` | 6379 (host) | Rate limiting |
| `raksha-ai-engine` | Built from `ai-engine/` | 5000 (host) | ML inference |
| `raksha-backend` | Built from `backend/` | 8080 (host) | Spring Boot REST + STOMP |
| `raksha-frontend` | Built from `frontend/` | 3000 (host) | Next.js SOC dashboard |
| `raksha-nginx` | `nginx:latest` | host | Reverse proxy (optional) |
| `raksha-db-backup` | `alpine:latest` | — | Nightly MySQL dump cron |
| `raksha-iot-agent` | Built from `iot-agent/` | — | MQTT telemetry publisher |
| `raksha-honeypot-manager` | Built from `honeypot-manager/` | 6000 (host) | Cowrie container lifecycle |
| `raksha-ebpf-collector` | Built from `ebpf-collector/` | 7000 (host) | Kernel BPF map reader |

### Startup Dependency Order

```
mysql → redis → ai-engine → backend → frontend
mosquitto → iot-agent
backend → honeypot-manager
ebpf-collector (privileged, independent)
db-backup → mysql
```

---

## 2. Communication Paths

| Source | Destination | Protocol | Port | Path / Topic | Auth |
|--------|-------------|----------|------|--------------|------|
| Browser | Frontend | HTTP | 3000 | Next.js pages | None |
| Browser | Backend REST | HTTP | 8080 | `/api/v1/*` | JWT Bearer token |
| Browser | Backend STOMP | WebSocket/SockJS | 8080 | `/ws-soc` | JWT in CONNECT frame |
| Backend | AI Engine | HTTP | 5000 | `/predict`, `/explain`, `/batch-predict`, `/health` | None (internal) |
| Backend | Honeypot Manager | HTTP | 6000 | `/deploy`, `/stop`, `/{sessionId}`, `/list`, `/health` | `X-Api-Key` header |
| Backend | eBPF Collector | HTTP | 7000 | `/api/ebpf/status` | None (internal) |
| Backend | MySQL | JDBC | 3307 | `rakshaspheredb` | Username/password |
| Backend | Redis | Redis protocol | 6379 | Rate limit keys | Optional password |
| Backend | VirusTotal API | HTTPS | 443 | `https://www.virustotal.com/api/v3/ip_addresses/{ip}` | `x-apikey` header |
| Backend | AbuseIPDB API | HTTPS | 443 | `https://api.abuseipdb.com/api/v2/check?ipAddress={ip}` | `Key` header |
| IoT Agent | Mosquitto | MQTT | 1883 | `rakshasphere/devices/{deviceId}/telemetry` | Username (deviceId) |
| IoT Agent | Mosquitto | MQTT | 1883 | `rakshasphere/devices/{deviceId}/status` | Username (deviceId) |
| Backend | Mosquitto | MQTT | 1883 | Subscribe: `rakshasphere/devices/+/telemetry`, `rakshasphere/devices/+/status` | Username "admin" |
| Honeypot Manager | Docker Daemon | Unix socket | `/var/run/docker.sock` | Docker SDK | Socket access |
| Honeypot Manager | Backend | HTTP | 8080 | `/api/v1/honeypots/events` | None (webhook, JWT optional) |
| eBPF Collector | Linux Kernel | BPF syscall | — | `bpftool`, `ip` commands | Privileged container |

---

## 3. Network Isolation

The `honeypot_net` internal Docker bridge network (`172.30.0.0/24`) is used to isolate Cowrie honeypot containers. This network has `internal: true`, meaning containers on it cannot access external networks directly. Only the honeypot-manager container bridges between the isolated honeypot network and the host.

---

## 4. Backend Internal Architecture (Spring Boot)

```
com.rakshasphere
├── config/
│   ├── CorsConfig.java           CORS policy (localhost + Vercel origins)
│   ├── RateLimitInterceptor.java Per-IP rate limiter backed by Redis
│   ├── WebMvcConfig.java         Registers RateLimitInterceptor
│   └── WebSocketConfig.java      STOMP broker, /ws-soc SockJS endpoint, JWT auth
├── controller/
│   ├── AuthController.java       /api/v1/auth/*
│   ├── AlertController.java      /api/v1/alerts/*
│   ├── AiController.java         /api/v1/ai/*
│   ├── HoneypotController.java   /api/v1/honeypots/*
│   ├── MitreController.java      /api/v1/mitre/*
│   ├── SelfHealingController.java /api/v1/self-healing/*
│   ├── SocDashboardController.java /api/v1/soc/*
│   ├── SettingsController.java   /api/v1/settings/*
│   ├── SystemHealthController.java /api/v1/system/*
│   ├── UserController.java       /api/v1/users/*
│   └── GlobalExceptionHandler.java  @ControllerAdvice error handler
├── service/
│   ├── AuthenticationService     Login, register, MFA setup/verify
│   ├── SecurityAlertService      CRUD + threat intel enrichment + STOMP broadcast
│   ├── AiEngineService           HTTP proxy to FastAPI AI engine
│   ├── ThreatIntelService        VirusTotal + AbuseIPDB reactive WebClient
│   ├── MitreService              Alert aggregation by MITRE technique ID
│   ├── HoneypotOrchestratorService Honeypot session + event management
│   ├── IotMqttSubscriberService  Paho MQTT consumer → MySQL persistence
│   ├── SelfHealingService        eBPF/JNI drop rules, honeypot divert, revert
│   ├── EBpfDriver                JNI native library loader (libebpfdriver.so)
│   ├── MfaService                TOTP secret generation and verification
│   ├── RiskEngineService         Risk score computation
│   └── SystemHealthService       Aggregates Actuator health + JVM/OS info
├── security/
│   ├── SecurityConfig            Spring Security filter chain, RBAC rules
│   ├── JwtTokenProvider          HMAC-SHA256 JWT generation and validation
│   ├── JwtAuthenticationFilter   JWT extraction from request headers
│   └── CustomUserDetailsService  Load user from database for Spring Security
├── health/                       Custom Spring Actuator health indicators
│   ├── AiEngineHealthIndicator
│   ├── EBpfHealthIndicator
│   ├── HoneypotHealthIndicator
│   ├── MqttHealthIndicator
│   ├── MySqlHealthIndicator
│   ├── RedisIntegrationHealthIndicator
│   ├── StompHealthIndicator
│   ├── ThreatIntelHealthIndicator
│   └── DatabaseBackupHealthIndicator
├── model/entity/                 JPA entities
│   ├── User, UserRole, UserStatus
│   ├── SecurityAlert, AlertSeverity, AlertStatus
│   ├── HoneypotSession, HoneypotEvent
│   ├── AuditLog
│   ├── IotDevice, IotTelemetryLog
│   └── ServiceHealthEvent
├── repository/                   Spring Data JPA repositories
└── aspect/
    └── AuditLogAspect.java       @Around advice for automatic audit logging
```

---

## 5. Security Architecture

See [SECURITY.md](../security/SECURITY.md) for the complete security architecture document.

---

## 6. eBPF / JNI Architecture Note

The backend contains two separate eBPF-related components:

1. **`EBpfDriver.java` + `libebpfdriver.so`** — A JNI bridge that calls a native C function (`eBpfDriver.c`). The C code simulates XDP rule injection with `printf` statements. The `.so` library attempts to load via `System.loadLibrary("ebpfdriver")`. If loading fails (which it commonly will in non-prepared environments), the code catches `UnsatisfiedLinkError` and logs a warning. **This is a JNI stub/simulator.**

2. **`ebpf-collector/` service** — A separate, privileged Docker container (`raksha-ebpf-collector`) that uses `bpftool` to load the actual compiled BPF ELF object (`rakshasphere_xdp.bpf.o`) into the Linux kernel and attach it in **Generic XDP mode** to a dedicated `veth_raksha0` virtual interface. This reads real kernel BPF map counters (`xdp_stats_map`). **This is a real kernel-level BPF probe**, limited to a test virtual interface, not a production NIC.
