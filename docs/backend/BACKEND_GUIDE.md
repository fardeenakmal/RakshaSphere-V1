# RakshaSphere — Backend Architecture & Developer Guide

> **Source of truth:** `backend/src/main/java/com/rakshasphere/`, `backend/pom.xml`, `backend/src/main/resources/application.yml`.

---

## Technical Specifications

- **Framework:** Spring Boot 3.2.x
- **Runtime:** Java 21 LTS (OpenJDK)
- **Security:** Spring Security 6.x + JJWT (`io.jsonwebtoken:jjwt-api:0.12.x`)
- **Persistence:** Spring Data JPA + Hibernate (MySQL 8 Dialect & H2 Dialect)
- **Messaging:** Spring WebSocket (STOMP over SockJS) + Eclipse Paho MQTT Client
- **Observability:** Spring Boot Actuator with custom `HealthIndicator` beans

---

## Package Hierarchy

```
com.rakshasphere/
├── RakshaSphereBackendApplication.java    Main Spring Boot Entry Point
├── aspect/                                AOP Audit Logging Aspect
├── config/                                WebMvc, CORS, Rate Limiting, WebSocket Config
├── controller/                            REST API Controllers & Global Exception Handler
├── dto/                                   Data Transfer Objects (Requests & Responses)
├── health/                                Custom Actuator Health Indicators (9 subsystems)
├── model/                                 Service Health Event Model
│   └── entity/                            JPA Entities & Enumerations
├── repository/                            Spring Data JPA Repositories
├── security/                              JWT Provider, Filter, UserDetailsService, SecurityConfig
└── service/                               Core Business Logic & External Integration Services
```

---

## Core Service Implementations

1. **`AuthenticationService`:**
   - Authenticates credentials against BCrypt hashes stored in MySQL.
   - Enforces user status checks (`ACTIVE` vs `PENDING` vs `SUSPENDED`).
   - Delegates TOTP validation to `MfaService`.
   - Generates 24-hour HMAC-SHA256 JWT tokens.

2. **`SecurityAlertService`:**
   - Persists security alerts to MySQL.
   - Asynchronously enriches external threat intel via `ThreatIntelService`.
   - Broadcasts real-time alert updates over STOMP WebSocket topic `/topic/alerts`.

3. **`AiEngineService`:**
   - WebClient HTTP client proxy communicating with the FastAPI AI server on port `5000`.
   - Handles `/predict`, `/explain`, `/batch-predict`, and `/health` requests with sub-millisecond serialization.

4. **`SelfHealingService`:**
   - Orchestrates automated and manual remediation actions:
     - `applyEbpfDrop()` — Marks alert `CONTAINED` and invokes JNI driver stub.
     - `divertToHoneypot()` — Marks alert `HONEYPOT_DIVERTED`.
     - `revertEbpfRule()` — Restores alert to `ACTIVE`.
   - Records non-repudiation audit trails in `audit_logs` table.

5. **`HoneypotOrchestratorService`:**
   - Coordinates with `honeypot-manager` (port `6000`) over HTTP.
   - Manages `HoneypotSession` lifecycles and parses incoming `HoneypotEventDTO` payloads.

6. **`IotMqttSubscriberService`:**
   - Implements `MqttCallbackExtended` to consume telemetry from Mosquitto on `rakshasphere/devices/+/telemetry`.
   - Persists hardware telemetry and device status updates to MySQL.

---

## Database Failover & Configuration Profiles

In `application.yml`:
- **Default Profile (Local Dev):** Uses an embedded H2 database (`jdbc:h2:mem:rakshaspheredb`) for zero-dependency execution.
- **Docker Compose Profile:** Overridden via environment variables (`SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD`) to connect to MySQL 8 on port `3307`.

---

## Building and Running Standalone

```bash
cd /home/fardeen/RakshaSphere/backend
./mvnw clean package -DskipTests
java -jar target/rakshasphere-backend-0.0.1-SNAPSHOT.jar
```
