# REST & WebSocket API Specification

## RakshaSphere
### AI-Powered Autonomous Cyber Defense & Self-Healing Network Platform

> **Document Identifier**: `API-SPEC-RAKSHASPHERE-2026-V1.0`  
> **OpenAPI Version**: `OpenAPI 3.1.0 Specification`  
> **Target Framework**: `Spring Boot 3.2 (Java 21) & FastAPI (Python 3.11)`  
> **Classification**: `Official API Reference & Technical Contract`

---

## 📑 Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [API Architecture & Design Philosophy](#2-api-architecture--design-philosophy)
3. [API Standards & Conventions](#3-api-standards--conventions)
4. [Authentication & RBAC Architecture](#4-authentication--rbac-architecture)
5. [Standard Request & Response Formats](#5-standard-request--response-formats)
6. [Global Error Handling Strategy (RFC 7807)](#6-global-error-handling-strategy-rfc-7807)
7. [Core API Endpoints Specification](#7-core-api-endpoints-specification)
   - [7.1 Authentication & Authorization Module](#71-authentication--authorization-module)
   - [7.2 User & Role Management Module](#72-user--role-management-module)
   - [7.3 Dashboard & Executive Metrics Module](#73-dashboard--executive-metrics-module)
   - [7.4 Threat Events & Intrusion Module](#74-threat-events--intrusion-module)
   - [7.5 Threat Intelligence Module](#75-threat-intelligence-module)
   - [7.6 MITRE ATT&CK Correlation Module](#76-mitre-attck-correlation-module)
   - [7.7 Risk Scoring Module](#77-risk-scoring-module)
   - [7.8 Adaptive Honeypot Deception Module](#78-adaptive-honeypot-deception-module)
   - [7.9 Incident Reports & Export Module](#79-incident-reports--export-module)
   - [7.10 Self-Healing & Firewall Control Module](#710-self-healing--firewall-control-module)
   - [7.11 IoT Edge & Telemetry Module](#711-iot-edge--telemetry-module)
   - [7.12 System Audit Logs Module](#712-system-audit-logs-module)
   - [7.13 Health Monitoring & Telemetry Module](#713-health-monitoring--telemetry-module)
8. [Internal AI Engine Microservice APIs (FastAPI)](#8-internal-ai-engine-microservice-apis-fastapi)
9. [External Threat Intelligence Integrations](#9-external-threat-intelligence-integrations)
10. [IoT Edge Daemon APIs](#10-iot-edge-daemon-apis)
11. [Reporting & Data Export APIs](#11-reporting--data-export-apis)
12. [Real-Time WebSocket API Specification](#12-real-time-websocket-api-specification)
13. [API Security & Hardening Controls](#13-api-security--hardening-controls)
14. [API Versioning & Lifecycle Policy](#14-api-versioning--lifecycle-policy)
15. [Backend Repository & Folder Responsibilities](#15-backend-repository--folder-responsibilities)
16. [OpenAPI & Swagger Integration Strategy](#16-openapi--swagger-integration-strategy)
17. [API Testing & Verification Strategy](#17-api-testing--verification-strategy)
18. [Performance Tuning & High Throughput Strategy](#18-performance-tuning--high-throughput-strategy)
19. [Future API Roadmap](#19-future-api-roadmap)

---

## 1. 🎯 Executive Summary

This document establishes the official **REST and WebSocket API Specification** for **RakshaSphere**. It serves as the binding integration contract between the Next.js Frontend, Spring Boot Backend Core, Python FastAPI AI Inference Engine, IoT Edge Security Daemons, and external threat intelligence APIs (AbuseIPDB, VirusTotal, MITRE ATT&CK).

Engineered following **OpenAPI 3.1.0** standards, **Google REST API Design Guidelines**, **Microsoft REST API Guidelines**, and **OWASP API Security Top 10**, this specification provides strict, unambiguous request/response schemas, validation rules, error formats, and security constraints.

---

## 2. 🏗️ API Architecture & Design Philosophy

RakshaSphere follows a **Decoupled Gateway-Orchestrator Pattern**:

```mermaid
graph TB
    subgraph Clients ["Client Integration Layer"]
        NEXT["Next.js 14 SOC Dashboard"]
        IOT_D["IoT Edge Daemon"]
        EXT_SYS["External Systems / Webhooks"]
    end

    subgraph Gateway ["Nginx Proxy & API Gateway"]
        NGINX["Nginx Proxy (TLS 1.3 / Rate Limiter)"]
    end

    subgraph CoreBackend ["Spring Boot Core Orchestrator (:8080)"]
        SPRING_SEC["Spring Security + JWT"]
        API_CTRL["REST Controllers"]
        EVENT_BUS["Security Event Bus"]
    end

    subgraph AIMicroservice ["AI Inference Service (:5000)"]
        FASTAPI["FastAPI Engine"]
    end

    subgraph DataStore ["Persistence & Caching"]
        MYSQL[("MySQL 8.0 Primary DB")]
        REDIS[("Redis 7.2 Cache")]
    end

    NEXT & IOT_D & EXT_SYS --> NGINX
    NGINX --> SPRING_SEC
    SPRING_SEC --> API_CTRL
    API_CTRL <--> FASTAPI
    API_CTRL <--> MYSQL & REDIS
    API_CTRL --> EVENT_BUS
```

### Core REST Principles Applied
- **Stateless Communications**: Every REST API request must carry explicit authentication headers (`Authorization: Bearer <JWT>`). No server-side HTTP sessions are maintained.
- **Resource-Oriented Naming**: URLs identify resources via noun primitives (e.g., `/alerts`, `/honeypots`, `/users`), avoiding verbs in paths.
- **Consistent Representation**: JSON (`application/json`) is enforced as the default data exchange format across all REST endpoints.

---

## 3. 📏 API Standards & Conventions

### 3.1 HTTP Method Matrix
| HTTP Method | Operation Category | Idempotency | Primary Usage |
| :--- | :--- | :--- | :--- |
| `GET` | Read / Fetch | Yes | Retrieve resource instances or collections. |
| `POST` | Create / Process | No | Submit credentials, trigger manual self-healing, ingest flows. |
| `PUT` | Full Replace | Yes | Replace entire existing configuration or user entity. |
| `PATCH` | Partial Update | No | Update specific fields (e.g., alert status, asset weight). |
| `DELETE` | Remove | Yes | Revoke API keys, remove firewall drop rules. |

### 3.2 Pagination, Sorting & Filtering
Standard query parameters apply to all collection endpoints (`GET /api/v1/{resources}`):
- `page`: Zero-indexed page number (Default: `0`).
- `size`: Items per page (Default: `20`, Max: `100`).
- `sort`: Field and direction (e.g., `created_at,desc` or `risk_score,asc`).
- `filter`: Field-level equality filters (e.g., `status=CONTAINED&source_ip=198.51.100.42`).

---

## 4. 🔑 Authentication & RBAC Architecture

Authentication relies on **Stateless JSON Web Tokens (JWT)** signed using **RSA-256**.

```mermaid
sequenceDiagram
    autonumber
    participant Client as Next.js Dashboard
    participant AuthAPI as Auth Controller (/auth/login)
    participant JWT as JWT Service
    participant DB as MySQL DB
    participant API as Protected API (/alerts)

    Client->>AuthAPI: POST /api/v1/auth/login { username, password }
    AuthAPI->>DB: Query User Record & BCrypt Verify
    DB-->>AuthAPI: Validated (Role: ROLE_SOC_ANALYST)
    AuthAPI->>JWT: Generate Access Token (TTL: 15m) & Refresh Token (TTL: 7d)
    JWT-->>AuthAPI: Tokens Issued
    AuthAPI-->>Client: HTTP 200 OK + JWT Tokens JSON Payload
    
    note over Client, API: Accessing Protected Endpoints
    Client->>API: GET /api/v1/alerts (Header: Authorization: Bearer <JWT>)
    API->>JWT: Validate RSA-256 Signature & Expiration
    JWT-->>API: Validated (Claims: sub, role, exp)
    API-->>Client: HTTP 200 OK + Paginated Alerts Payload
```

---

## 5. 📦 Standard Request & Response Formats

### 5.1 Standard Request Headers
```http
Host: api.rakshasphere.io
Authorization: Bearer eyJhbGciOiJSUzI1Ni...
Content-Type: application/json
Accept: application/json
X-Correlation-ID: c89a2f10-43b1-4f28-8921-998811223344
```

### 5.2 Standard Success Envelope (`200 OK`, `201 Created`)
```json
{
  "success": true,
  "timestamp": "2026-08-02T15:30:00Z",
  "correlationId": "c89a2f10-43b1-4f28-8921-998811223344",
  "data": {
    "id": "ALT-8921",
    "sourceIp": "198.51.100.42",
    "attackType": "SSH_BRUTE_FORCE",
    "riskScore": 84.50,
    "status": "CONTAINED"
  }
}
```

### 5.3 Standard Paginated Response Envelope
```json
{
  "success": true,
  "timestamp": "2026-08-02T15:30:00Z",
  "correlationId": "c89a2f10-43b1-4f28-8921-998811223344",
  "data": [ ... ],
  "pagination": {
    "page": 0,
    "size": 20,
    "totalElements": 142,
    "totalPages": 8,
    "isLast": false
  }
}
```

---

## 6. 🚨 Global Error Handling Strategy (RFC 7807)

All non-2xx HTTP responses return a standardized **RFC 7807 Problem Detail** JSON structure:

```json
{
  "type": "https://api.rakshasphere.io/errors/validation-failed",
  "title": "Unprocessable Entity / Validation Failure",
  "status": 422,
  "detail": "One or more input fields failed validation constraints.",
  "instance": "/api/v1/self-healing/remediate",
  "timestamp": "2026-08-02T15:30:00Z",
  "correlationId": "c89a2f10-43b1-4f28-8921-998811223344",
  "invalidParams": [
    {
      "name": "targetIp",
      "reason": "Must be a valid IPv4 or IPv6 address string"
    }
  ]
}
```

### HTTP Status Code Mapping
| Status Code | Meaning | Cause / Scenario |
| :--- | :--- | :--- |
| `400 Bad Request` | Malformed JSON / Syntax Error | Unparseable JSON body or invalid enum string. |
| `401 Unauthorized` | Missing / Invalid Token | Expired, missing, or malformed JWT signature. |
| `403 Forbidden` | Insufficient Permissions | User role lacks scope for endpoint (e.g., Analyst requesting Admin endpoint). |
| `404 Not Found` | Resource Does Not Exist | Target alert ID or honeypot session ID not found in database. |
| `409 Conflict` | State / Unique Constraint Violation | Duplicate username creation or active block collision. |
| `422 Unprocessable` | Input Validation Failure | Failed JSR-380 validation (e.g., invalid IP format). |
| `429 Too Many Requests`| Rate Limit Exceeded | Client exceeded 100 requests/minute API threshold. |
| `500 Internal Error` | Unexpected Server Error | Uncaught backend runtime exception. |
| `503 Unavailable` | External Service Timeout | AI Engine or Threat Intel API timeout. |

---

## 7. 🔌 Core API Endpoints Specification

### 7.1 Authentication & Authorization Module

#### Endpoint 1: User Login
- **Name**: Authenticate User & Issue Tokens
- **HTTP Method**: `POST`
- **URL Path**: `/api/v1/auth/login`
- **Auth Required**: False | **Roles Allowed**: Public
- **Request Body**:
  ```json
  {
    "username": "soc_analyst",
    "password": "SecurePassword123!"
  }
  ```
- **Response Body (`200 OK`)**:
  ```json
  {
    "success": true,
    "timestamp": "2026-08-02T15:30:00Z",
    "data": {
      "accessToken": "eyJhbGciOiJSUzI1Ni...",
      "refreshToken": "d89a1f20-...",
      "tokenType": "Bearer",
      "expiresIn": 900,
      "user": {
        "id": 1,
        "username": "soc_analyst",
        "role": "ROLE_SOC_ANALYST"
      }
    }
  }
  ```
- **Possible Errors**: `400 Bad Request`, `401 Unauthorized` (Invalid credentials).

---

#### Endpoint 2: Refresh Access Token
- **Name**: Refresh Expired Access Token
- **HTTP Method**: `POST`
- **URL Path**: `/api/v1/auth/refresh`
- **Auth Required**: False | **Roles Allowed**: Public
- **Request Body**:
  ```json
  {
    "refreshToken": "d89a1f20-..."
  }
  ```
- **Response Body (`200 OK`)**:
  ```json
  {
    "success": true,
    "data": {
      "accessToken": "eyJhbGciOiJSUzI1...NEW_TOKEN",
      "tokenType": "Bearer",
      "expiresIn": 900
    }
  }
  ```

---

### 7.2 Dashboard & Executive Metrics Module

#### Endpoint 3: Fetch Dashboard Summary Statistics
- **Name**: Get High-Level SOC Metrics
- **HTTP Method**: `GET`
- **URL Path**: `/api/v1/dashboard/stats`
- **Auth Required**: True | **Roles Allowed**: `ROLE_ADMIN`, `ROLE_SOC_ANALYST`, `ROLE_USER`
- **Response Body (`200 OK`)**:
  ```json
  {
    "success": true,
    "data": {
      "totalAlerts24h": 142,
      "activeHoneypots": 8,
      "selfHealedCount": 89,
      "averageRiskScore": 64.20,
      "systemStatus": "AUTONOMOUS_DEFENSE_ACTIVE"
    }
  }
  ```

---

### 7.3 Threat Events & Intrusion Module

#### Endpoint 4: Get Paginated Security Alerts
- **Name**: Fetch Security Alert Feed
- **HTTP Method**: `GET`
- **URL Path**: `/api/v1/alerts?page=0&size=20&status=CONTAINED&sort=created_at,desc`
- **Auth Required**: True | **Roles Allowed**: `ROLE_ADMIN`, `ROLE_SOC_ANALYST`
- **Response Body (`200 OK`)**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "ALT-8921",
        "sourceIp": "198.51.100.42",
        "destinationIp": "10.0.1.50",
        "attackType": "SSH_BRUTE_FORCE",
        "riskScore": 84.50,
        "mitreTechnique": "T1110",
        "isZeroDay": false,
        "status": "CONTAINED",
        "createdAt": "2026-08-02T15:22:01Z"
      }
    ],
    "pagination": {
      "page": 0,
      "size": 20,
      "totalElements": 1,
      "totalPages": 1
    }
  }
  ```

---

### 7.4 Self-Healing & Firewall Control Module

#### Endpoint 5: Manual Self-Healing Remediation Override
- **Name**: Enforce or Revert Network Containment Rule
- **HTTP Method**: `POST`
- **URL Path**: `/api/v1/self-healing/remediate`
- **Auth Required**: True | **Roles Allowed**: `ROLE_ADMIN`
- **Request Body**:
  ```json
  {
    "targetIp": "198.51.100.42",
    "action": "REVERT_BLOCK",
    "reason": "Analyst verified false positive probe"
  }
  ```
- **Response Body (`200 OK`)**:
  ```json
  {
    "success": true,
    "data": {
      "targetIp": "198.51.100.42",
      "actionExecuted": "REVERT_BLOCK",
      "status": "UNBLOCKED",
      "auditLogId": 9412,
      "executedAt": "2026-08-02T15:30:12Z"
    }
  }
  ```
- **Possible Errors**: `401 Unauthorized`, `403 Forbidden`, `422 Validation Error`.

---

## 8. 🧠 Internal AI Engine Microservice APIs (FastAPI)

The Python AI Inference Server operates as an internal microservice hosted at `http://ai-engine:5000`.

### Endpoint: Execute Flow Vector Inference
- **HTTP Method**: `POST`
- **URL Path**: `/predict`
- **Auth Required**: Service-to-Service Secret Header (`X-Internal-Secret`)
- **Request Body**:
  ```json
  {
    "flowFeatures": [12450.0, 4.0, 2.0, 512.0, 128.0, 84.2, 12.4, 0.0, 1.0, 0.0]
  }
  ```
- **Response Body (`200 OK`)**:
  ```json
  {
    "attackType": "SSH_BRUTE_FORCE",
    "confidenceScore": 0.9650,
    "isAnomaly": false,
    "reconstructionMse": 0.0124,
    "inferenceTimeMs": 4.2
  }
  ```

---

## 9. 🌐 External Threat Intelligence Integrations

RakshaSphere integrates with third-party intelligence services asynchronously:

1. **AbuseIPDB API v2**: `GET https://api.abuseipdb.com/api/v2/check?ipAddress={ip}`
   - Header: `Key: <ABUSEIPDB_API_KEY>`
   - Extracts: `abuseConfidenceScore`, `countryCode`, `domain`.
2. **VirusTotal API v3**: `GET https://www.virustotal.com/api/v3/ip_addresses/{ip}`
   - Header: `x-apikey: <VIRUSTOTAL_API_KEY>`
   - Extracts: Malicious voting metrics and associated hash samples.

---

## 10. 📟 IoT Edge Daemon APIs

IoT Edge devices post network sensor telemetry to the Central Backend:

### Endpoint: Post Edge Telemetry
- **HTTP Method**: `POST`
- **URL Path**: `/api/v1/iot/telemetry`
- **Auth Header**: `X-IoT-Device-Token: <HMAC_TOKEN>`
- **Request Body**:
  ```json
  {
    "deviceId": "EDGE-GATEWAY-01",
    "interface": "eth0",
    "activeConnections": 14,
    "cpuUsagePct": 4.2,
    "memoryUsagePct": 18.5,
    "timestamp": "2026-08-02T15:30:00Z"
  }
  ```

---

## 11. 📊 Reporting & Data Export APIs

### Endpoint: Export Incident Forensic Dossier
- **HTTP Method**: `GET`
- **URL Path**: `/api/v1/reports/incident/{incidentId}/export?format=pdf`
- **Auth Required**: True | **Roles Allowed**: `ROLE_ADMIN`, `ROLE_SOC_ANALYST`
- **Response**: Binary Data (`application/pdf` or `text/csv`) with `Content-Disposition: attachment; filename="Incident_ALT-8921.pdf"`.

---

## 12. 📡 Real-Time WebSocket API Specification

WebSockets provide sub-second live telemetry streaming to SOC dashboard clients.

```mermaid
sequenceDiagram
    autonumber
    participant Client as Next.js Dashboard
    participant WS as WebSocket Server (/ws-soc)
    participant Bus as Security Event Bus

    Client->>WS: CONNECT (Stomp Client over SockJS)
    WS-->>Client: CONNECTED (SessionId: ws-sess-892)
    Client->>WS: SUBSCRIBE /topic/alerts
    
    note over Bus, WS: Backend Threat Event Triggered
    Bus->>WS: Publish New Threat Alert Event
    WS-->>Client: MESSAGE /topic/alerts { alertId: "ALT-8921", riskScore: 84.5 }
```

### Subscribed STOMP Topics
- `/topic/alerts`: Live security alert feed broadcasts.
- `/topic/honeypot`: Live keystroke streams from active deception containers.
- `/topic/self-healing`: Real-time audit notifications of eBPF/iptables drop enforcement.

---

## 13. 🔒 API Security & Hardening Controls

- **OAuth2 / JWT Authentication**: Stateless RSA-256 signed access tokens.
- **Role-Based Access Control (RBAC)**: Enforced via `@PreAuthorize("hasRole('ROLE_ADMIN')")` annotations on Spring controllers.
- **Rate Limiting**: Redis-backed Token Bucket algorithm (`100 req/min` per client IP). Returns `429 Too Many Requests`.
- **CORS Policy**: Restricts origin domain access strictly to `https://soc.rakshasphere.io`.

---

## 14. 🔄 API Versioning & Lifecycle Policy

- **Current Version**: `/api/v1`
- **Versioning Strategy**: Path-based versioning (`/api/v1`, `/api/v2`).
- **Deprecation Policy**: Deprecated endpoints will carry a `Deprecation: true` HTTP response header and remain supported for a minimum of 6 months prior to removal.

---

## 15. 📁 Backend Repository & Folder Responsibilities

```
backend/
├── controllers/    # Spring @RestController REST API Endpoint mapping
├── services/       # Core business logic & Threat Engine processing
├── repositories/   # Spring Data JPA database query interfaces
├── dto/            # Data Transfer Objects & JSR-380 request validation
├── entities/       # Hibernate JPA database domain models
├── config/         # Spring Security, WebSockets, CORS, & Redis configs
├── security/       # JWT token providers & authentication filters
└── exception/      # Global @ControllerAdvice RFC-7807 error handlers
```

---

## 16. 📜 OpenAPI & Swagger Integration Strategy

RakshaSphere automatically generates interactive API documentation using **Springdoc-OpenAPI 2.x**:

- **Swagger UI URL**: `http://localhost:8080/swagger-ui.html`
- **OpenAPI JSON Spec**: `http://localhost:8080/v3/api-docs`

Annotations such as `@Operation(summary = "...")`, `@ApiResponse(...)`, and `@Schema(...)` ensure the Swagger console matches this specification dynamically.

---

## 17. 🧪 API Testing & Verification Strategy

1. **Unit & Controller Testing**: MockMVC tests verifying Spring controller response codes and validation constraints.
2. **Automated OpenAPI Validation**: Prism Mock Server validation testing schema compliance against `openapi.json`.
3. **Security Testing**: OWASP ZAP automated API scanning verifying JWT validation and rate limiting.
4. **Load & Performance Testing**: k6 load test scripts executing 1,000 requests/sec against `/api/v1/alerts`.

---

## 18. ⚡ Performance Tuning & High Throughput Strategy

- **Spring Boot Virtual Threads**: Java 21 Project Loom virtual threads enabled (`spring.threads.virtual.enabled=true`) for non-blocking I/O.
- **GZIP Compression**: HTTP response compression enabled (`server.compression.enabled=true`).
- **Response Caching**: `Cache-Control: private, max-age=60` headers applied to static lookup responses.

---

## 19. 🔮 Future API Roadmap

- **SOAR Webhooks**: Outbound REST webhooks pushing alerts to Splunk and Palo Alto Cortex XSOAR.
- **gRPC Ingestion API**: High-performance gRPC proto endpoints for 40Gbps+ packet sensor streams.
