# Security Architecture & Secure Software Development Lifecycle (SSDLC) Specification

## RakshaSphere
### AI-Powered Autonomous Cyber Defense & Self-Healing Network Platform

> **Document Identifier**: `SEC-ARCH-RAKSHASPHERE-2026-V1.0`  
> **Framework Compliance**: `OWASP ASVS v4.0, OWASP Top 10:2021, OWASP API Security Top 10, NIST CSF v2.0, NIST SP 800-53`  
> **Security Model**: `Zero Trust Network Architecture (ZTNA - NIST SP 800-207) & Defense-in-Depth`  
> **Classification**: `Official Master Security Architecture & SSDLC Specification`

---

## 📑 Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Security Philosophy & Core Principles](#2-security-philosophy--core-principles)
3. [Security Architecture & Trust Boundaries](#3-security-architecture--trust-boundaries)
   - [High-Level Security Architecture](#31-high-level-security-architecture)
   - [System Trust Boundaries Diagram](#32-system-trust-boundaries-diagram)
   - [Secure Data Flow Architecture](#33-secure-data-flow-architecture)
   - [Authentication Sequence Diagram](#34-authentication-sequence-diagram)
   - [Authorization & RBAC Decision Sequence](#35-authorization--rbac-decision-sequence)
4. [System Threat Modeling & DFD Level 1](#4-system-threat-modeling--dfd-level-1)
5. [Authentication Architecture & Token Lifecycle](#5-authentication-architecture--token-lifecycle)
6. [Authorization & Role-Based Access Control (RBAC)](#6-authorization--role-based-access-control-rbac)
7. [Input Validation, Sanitization & Encoding](#7-input-validation-sanitization--encoding)
8. [API Security & OWASP Protection Strategy](#8-api-security--owasp-protection-strategy)
9. [Data Protection, Cryptography & Secrets Management](#9-data-protection-cryptography--secrets-management)
10. [Database Security & Query Hardening](#10-database-security--query-hardening)
11. [AI Engine Security & Model Integrity](#11-ai-engine-security--model-integrity)
12. [Honeypot Sandbox Security & Container Boundaries](#12-honeypot-sandbox-security--container-boundaries)
13. [IoT Security & MQTT Authentication](#13-iot-security--mqtt-authentication)
14. [Docker Container Infrastructure Hardening](#14-docker-container-infrastructure-hardening)
15. [Security Logging, Audit & Telemetry Architecture](#15-security-logging-audit--telemetry-architecture)
16. [Secure Software Development Lifecycle (SSDLC)](#16-secure-software-development-lifecycle-ssdlc)
17. [Incident Response (IR) Plan & Workflow](#17-incident-response-ir-plan--workflow)
18. [Enterprise Compliance & Framework Mapping](#18-enterprise-compliance--framework-mapping)
19. [Vulnerability & Patch Management Strategy](#19-vulnerability--patch-management-strategy)
20. [Security Verification & Penetration Testing](#20-security-verification--penetration-testing)
21. [Quantitative Risk Assessment Matrix](#21-quantitative-risk-assessment-matrix)
22. [Security Repository Folder Structure](#22-security-repository-folder-structure)
23. [Module-Wise Security Best Practices](#23-module-wise-security-best-practices)
24. [MVP Security Scope vs. Future Enterprise Scope](#24-mvp-security-scope-vs-future-enterprise-scope)

---

## 1. 🎯 Executive Summary

The **RakshaSphere Security Architecture** defines the technical controls, cryptographic protocols, defense-in-depth strategies, and secure software development lifecycle (SSDLC) standards governing the platform.

Designed following **OWASP ASVS Level 2**, **NIST CSF v2.0**, and **Zero Trust Architecture (NIST SP 800-207)**, this document establishes a zero-compromise security posture that protects internal platform services, user sessions, database persistence, AI inference models, and edge communications while operating in adversarial network environments.

---

## 2. 🛡️ Security Philosophy & Core Principles

RakshaSphere enforces six fundamental security engineering principles:

```mermaid
mindmap
  root((RakshaSphere Security Philosophy))
    Defense-in-Depth
      Multi-Layered Security Controls
      Perimeter, App, DB, Kernel Isolation
    Zero Trust Architecture
      Never Trust, Always Verify
      Explicit RSA-256 JWT Authentication
    Least Privilege Access
      Strict RBAC Scope Limits
      Unprivileged System Users
    Secure by Default
      TLS 1.3 Transport Encryption
      Strict SameSite CORS & Content Security Policies
    Fail Secure State
      Atomic Transaction Rollbacks
      Default Drop Firewall Rules
    Separation of Duties
      Isolated Admin, Analyst, Viewer Roles
      Cryptographic Audit Hash Chaining
```

1. **Defense-in-Depth**: No single security control is relied upon exclusively. Security is enforced at the Nginx Proxy perimeter, Spring Security application layer, MySQL database layer, Linux eBPF driver layer, and Docker container runtime level.
2. **Zero Trust Architecture (ZTNA)**: No network segment—whether local enterprise subnets, IoT edge nodes, or internal Docker bridge networks—is assumed implicitly trusted. All inter-service requests must carry explicit authentication and authorization context.
3. **Least Privilege**: All application components, database connections, and Docker containers run under minimal necessary privileges. Custom system daemons execute under unprivileged user handles (`raksha-agent`, `nobody`).
4. **Secure-by-Default**: Systems default to strict security configurations. Unauthenticated endpoints are rejected; default database passwords are forbidden; network ports remain closed unless explicitly required.
5. **Fail-Secure**: Upon encountering unexpected system exceptions, missing parameters, or component timeouts, RakshaSphere terminates execution securely without leaking internal stack traces or granting access.
6. **Separation of Duties**: Operational capabilities are strictly partitioned across roles (`ROLE_ADMIN`, `ROLE_SOC_ANALYST`, `ROLE_USER`) to prevent single-operator privilege abuse.

---

## 3. 🏗️ Security Architecture & Trust Boundaries

### 3.1 High-Level Security Architecture

```mermaid
graph TB
    subgraph Untrusted_Zone ["Untrusted External Zone"]
        User["SOC Analyst / Administrator"]
        Attacker["Adversary / Botnet Probe"]
        IoT_Edge["IoT Edge Gateway"]
    end

    subgraph Perimeter_DMZ ["Perimeter DMZ Boundary"]
        NGINX["Nginx Proxy (TLS 1.3 / Rate Limiter / WAF Header Filters)"]
        FIREWALL["Linux eBPF Driver / iptables Hardening"]
    end

    subgraph App_Security_Zone ["Application Security Zone"]
        SPRING_SEC["Spring Security 6 (JWT Provider / RBAC Filter)"]
        REST_API["Spring Boot 3 REST Controllers"]
    end

    subgraph Core_Services ["Isolated Microservice Zone"]
        AI_ENGINE["FastAPI AI Engine (XAI / Checksum Validated)"]
        HONEYPOT["Docker Honeynet (Read-Only Root / cap_drop: ALL)"]
    end

    subgraph Secure_Data_Store ["Secure Storage Zone"]
        MYSQL[("MySQL 8.0 (AES-256 / Hash Chained Audits)")]
        REDIS[("Redis 7.2 Cache (Password Protected)")]
    end

    User -->|HTTPS TLS 1.3| NGINX
    Attacker -->|Probe Packets| FIREWALL
    IoT_Edge -->|MQTT HMAC Auth| NGINX
    FIREWALL --> NGINX
    NGINX --> SPRING_SEC --> REST_API
    REST_API <--> AI_ENGINE & HONEYPOT
    REST_API <--> MYSQL & REDIS
```

---

### 3.2 System Trust Boundaries Diagram

```mermaid
flowchart TD
    subgraph TB1 ["Trust Boundary 1: External Network Ingress"]
        AttackerIP["Public IP Address"] -->|Untrusted HTTP/MQTT| PerimeterProxy["Nginx Gateway Proxy"]
    end

    subgraph TB2 ["Trust Boundary 2: Application Layer Boundary"]
        PerimeterProxy -->|Authenticated Bearer Token| SpringFilter["Spring Security Filter Chain"]
        SpringFilter -->|Validated Request Payload| ApplicationCore["Spring Boot Business Logic"]
    end

    subgraph TB3 ["Trust Boundary 3: Internal Microservice Boundary"]
        ApplicationCore -->|Internal REST / HMAC Header| AIEngine["Python FastAPI Inference Engine"]
        ApplicationCore -->|Docker Socket API| HoneypotSubnet["Isolated Docker Deception Bridge"]
    end

    subgraph TB4 ["Trust Boundary 4: Data Storage Boundary"]
        ApplicationCore -->|Encrypted JDBC Connection| MySQLDB[("MySQL 8.0 Persistence Store")]
    end
```

---

### 3.3 Secure Data Flow Architecture

```mermaid
flowchart LR
    A[Client Inputs Payload] --> B[Client-Side Zod Validation]
    B --> C[TLS 1.3 Transport Encryption]
    C --> D[Nginx Rate Limit & Header Inspection]
    D --> E[Spring Security RSA-256 JWT Verification]
    E --> F[Hibernate Validator JSR-380 Annotation Check]
    F --> G[Parameterized SQL / JPA Processing]
    G --> H[SHA-256 Cryptographic Audit Chain Logging]
```

---

### 3.4 Authentication Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor Client as User / Browser
    participant Nginx as Nginx Gateway
    participant AuthFilter as Spring Security Filter
    participant AuthCtrl as AuthController
    participant JWTProv as JWT Provider Service
    participant DB as MySQL Database

    Client->>Nginx: POST /api/v1/auth/login { username, password }
    Nginx->>AuthCtrl: Proxy HTTP Request
    AuthCtrl->>DB: Query User Entity by Username
    DB-->>AuthCtrl: Return User Record (BCrypt Hash: $2a$12$...)
    AuthCtrl->>AuthCtrl: BCrypt.checkpw(rawPassword, storedHash)
    
    alt Credentials Valid
        AuthCtrl->>JWTProv: Generate Access Token (RSA-256, 15m) & Refresh Token (7d)
        JWTProv-->>AuthCtrl: Issued Tokens
        AuthCtrl-->>Client: HTTP 200 OK + JWT Tokens Payload
    else Credentials Invalid
        AuthCtrl-->>Client: HTTP 401 Unauthorized + RFC-7807 Error JSON
    end
```

---

### 3.5 Authorization & RBAC Decision Sequence

```mermaid
sequenceDiagram
    autonumber
    actor Client as Authenticated Client
    participant Filter as JWT Authorization Filter
    participant SecurityContext as SecurityContextHolder
    participant MethodInterceptor as AspectJ @PreAuthorize Interceptor
    participant Controller as Restricted REST Controller

    Client->>Filter: GET /api/v1/admin/users (Header: Bearer <JWT>)
    Filter->>Filter: Verify RSA-256 Signature & Expiration
    Filter->>SecurityContext: Set Authentication (Principal, Authorities: [ROLE_SOC_ANALYST])
    Filter->>MethodInterceptor: Invoke Controller Method
    MethodInterceptor->>MethodInterceptor: Check @PreAuthorize("hasRole('ROLE_ADMIN')")
    
    alt Role Match
        MethodInterceptor->>Controller: Forward Execution
        Controller-->>Client: HTTP 200 OK + Payload
    else Role Mismatch
        MethodInterceptor-->>Client: HTTP 403 Forbidden (Access Denied)
    end
```

---

## 4. 🕵️ System Threat Modeling & DFD Level 1

RakshaSphere applies **STRIDE Threat Modeling** across data flow boundaries:

```mermaid
flowchart TD
    ExtUser(("External User / Adversary"))
    P1["1.0 Gateway Rate Limiting & TLS Termination"]
    P2["2.0 JWT Authentication & RBAC Authorization"]
    P3["3.0 AI Threat Classification & Risk Scoring"]
    P4["4.0 Autonomous Self-Healing Containment"]
    
    D1[[(D1) MySQL Database Store]]
    D2[[(D2) Immutable Audit Log Store]]

    ExtUser -->|Untrusted Traffic| P1
    P1 -->|Cleaned HTTP Flow| P2
    P2 -->|Authenticated Request| P3
    P3 -->|Risk Payload| P4
    P3 <-->|JPA Read/Write| D1
    P4 -->|Write Chained Log| D2
```

### STRIDE Risk Mitigation Mapping

| Threat Category | Identified System Risk | Architectural Security Control |
| :--- | :--- | :--- |
| **Spoofing** | Adversary impersonates legitimate SOC analyst or IoT node. | RSA-256 JWT signatures for users; HMAC-SHA256 signatures for IoT nodes. |
| **Tampering** | Attacker modifies historical audit records or security alerts. | Cryptographic SHA-256 row-level hash chaining ($\text{Hash}_n = \text{SHA256}(\text{Data}_n \parallel \text{Hash}_{n-1})$). |
| **Repudiation** | Operator denies executing manual self-healing rule override. | Immutable audit logs binding `username`, `action`, `timestamp`, and `origin_ip`. |
| **Information Disclosure** | Sensitive API keys or database credentials exposed. | Environment variable injection (`.env`), AES-256-GCM data encryption at rest. |
| **Denial of Service** | Volumetric HTTP flood overwhelms REST controllers. | Redis-backed token bucket rate limiting (`100 req/min`) and eBPF XDP NIC drops. |
| **Elevation of Privilege** | Analyst exploits endpoint vulnerability to gain Admin rights. | Declarative Method-Level Security (`@PreAuthorize`) and Spring Security RBAC filters. |

---

## 5. 🔑 Authentication Architecture & Token Lifecycle

### 5.1 JWT Token Specification
- **Algorithm**: `RS256` (Asymmetric RSA 2048-bit key pair).
- **Access Token TTL**: 15 Minutes ($900\text{ seconds}$).
- **Refresh Token TTL**: 7 Days ($604,800\text{ seconds}$) with single-use rotation.

```json
{
  "header": {
    "alg": "RS256",
    "typ": "JWT"
  },
  "payload": {
    "sub": "soc_analyst_01",
    "roles": ["ROLE_SOC_ANALYST"],
    "iss": "rakshasphere-auth-service",
    "iat": 1785684600,
    "exp": 1785685500,
    "jti": "c89a2f10-43b1-4f28-8921-998811223344"
  }
}
```

---

## 6. 🛂 Authorization & Role-Based Access Control (RBAC)

RakshaSphere defines three strict system roles:

| Role Name | Access Privilege Scope | Allowed Operations |
| :--- | :--- | :--- |
| **`ROLE_ADMIN`** | Full System Control | User onboarding, system configuration, manual self-healing overrides, full rule creation. |
| **`ROLE_SOC_ANALYST`** | Operations & Triage | View real-time alert feeds, inspect honeypot sessions, request semi-automatic remediation, export reports. |
| **`ROLE_USER`** | Read-Only Monitoring | View executive summary dashboards and high-level risk score trends only. |

---

## 7. 🧹 Input Validation, Sanitization & Encoding

1. **Frontend Input Validation**: All input forms validated using **Zod** schemas prior to submission.
2. **Backend Input Validation**: JSR-380 Hibernate Validator annotations (`@NotNull`, `@Size`, `@Pattern`, `@ValidIP`) applied to all Data Transfer Objects (DTOs).
3. **Cross-Site Scripting (XSS) Prevention**: All output fields rendered in the Next.js frontend undergo automatic React HTML entity encoding.

---

## 8. 🌐 API Security & OWASP Protection Strategy

RakshaSphere implements defensive controls addressing the **OWASP API Security Top 10:2023**:

```mermaid
graph TD
    API_Req["Inbound REST API Request"] --> Check1{API1: Broken Object Level Auth?}
    Check1 -->|Pass| Check2{API2: Broken Authentication?}
    Check2 -->|Pass| Check3{API3: Broken Object Property Level Auth?}
    Check3 -->|Pass| Check4{API4: Unrestricted Resource Consumption?}
    
    Check4 -->|Pass| Proceed["Process Business Logic"]
    Check1 & Check2 & Check3 & Check4 -->|Fail| Reject["Return RFC-7807 Error Response"]
```

| OWASP API Risk | System Security Mitigation Control |
| :--- | :--- |
| **API1: Broken Object Level Authorization** | Database queries enforce user tenant and role boundaries (`WHERE alert.id = :id AND tenant = :tenant`). |
| **API2: Broken Authentication** | Asymmetric RSA-256 JWT validation; short-lived 15-minute expiration. |
| **API3: Broken Object Property Level Auth** | DTO projections explicitly limit fields returned to clients; sensitive hashes stripped. |
| **API4: Unrestricted Resource Consumption** | Redis token-bucket rate limiting (`100 req/min` per IP) and strict pagination limits (`max size=100`). |

---

## 9. 🔒 Data Protection, Cryptography & Secrets Management

1. **Encryption in Transit**: Transport Layer Security (**TLS 1.3**) enforced across all web traffic via Nginx proxy.
2. **Encryption at Rest**: Sensitive database columns (API keys, integration secrets) encrypted using **AES-256-GCM**.
3. **Password Storage**: Passwords hashed using **BCrypt** with a minimum cost factor of 12.
4. **Secrets Management**: Secrets loaded exclusively via environment variables (`${MYSQL_PASSWORD}`) at container boot time.

---

## 10. 🗄️ Database Security & Query Hardening

- **Parameterized Queries**: All database operations execute through Spring Data JPA / Hibernate ORM parameterized queries, completely eliminating SQL Injection (SQLi) attack vectors.
- **Least Privilege User Accounts**: Application backend connects using `raksha_app_user` limited to `SELECT`, `INSERT`, `UPDATE`, and `DELETE` privileges.

---

## 11. 🧠 AI Engine Security & Model Integrity

1. **Model Binary Integrity**: Serialized model files (`.pkl`, `.h5`) are verified via SHA-256 cryptographic checksums prior to loading into memory.
2. **Input Sanitization**: Input feature vectors are clipped to valid statistical ranges ($\text{Min} \le x_i \le \text{Max}$) to prevent adversarial evasion attacks.

---

## 12. 🍯 Honeypot Sandbox Security & Container Boundaries

```mermaid
flowchart TD
    A[Adversary Diverted to Honeypot Container] --> B[Sandbox Boundary Enforcement]
    B --> C["1. Read-Only Root Filesystem (--read-only)"]
    B --> D["2. Drop All Linux Capabilities (--cap-drop=ALL)"]
    B --> E["3. Unprivileged User Execution (USER nobody)"]
    B --> F["4. Isolated Docker Bridge Network (192.168.100.0/24)"]
    B --> G["5. Resource Limits (512MB RAM, 0.5 CPU)"]
```

---

## 13. 📟 IoT Security & MQTT Authentication

1. **HMAC-SHA256 Device Authentication**: Devices authenticate to Mosquitto MQTT broker using per-device HMAC signatures ($\text{Password} = \text{HMAC-SHA256}(\text{device\_id}, \text{hmac\_secret})$).
2. **Mosquitto ACL Topic Rules**: Edge devices are restricted to publishing exclusively to their designated sub-tree (`rakshasphere/iot/{device_id}/#`).

---

## 14. 🐳 Docker Container Infrastructure Hardening

- **Minimal Base Images**: Built on minimal runtime distributions (`alpine`, `slim`, `temurin-jre`).
- **Container Vulnerability Scanning**: Images scanned in CI/CD via **Trivy**; builds containing High or Critical vulnerabilities are automatically rejected.

---

## 15. 📝 Security Logging, Audit & Telemetry Architecture

High-priority security actions (self-healing triggers, manual overrides, user privilege changes) write immutable audit records to the `AUDIT_LOGS` table:

```mermaid
flowchart LR
    Event["Security Event Action"] --> HashCompute["Compute Row SHA-256 Hash\n(Data + PrevHash)"]
    HashCompute --> DBInsert["INSERT INTO audit_logs"]
    DBInsert --> ImmutableChain[("Cryptographically Hash-Chained Audit Store")]
```

---

## 16. 🔄 Secure Software Development Lifecycle (SSDLC)

RakshaSphere integrates security across every software development lifecycle phase:

```mermaid
flowchart LR
    Reqs["1. Requirements\n(OWASP ASVS Review)"] --> Design["2. Design\n(STRIDE Threat Model)"]
    Design --> Code["3. Implementation\n(Pre-commit Hooks & IDE Linter)"]
    Code --> Test["4. Testing\n(SonarQube SAST & OWASP ZAP DAST)"]
    Test --> Deploy["5. Deployment\n(Trivy Container Scan & Sign-off)"]
    Deploy --> Ops["6. Maintenance\n(Dependabot Vulnerability Scans)"]
```

---

## 17. 🚨 Incident Response (IR) Plan & Workflow

RakshaSphere applies the **NIST SP 800-61 Incident Response Lifecycle**:

```mermaid
flowchart TD
    Preparation["1. Preparation\n(Pre-configured eBPF filters & Logback rules)"] --> Detection["2. Detection & Analysis\n(AI Anomaly & Threat Intel Lookup)"]
    Detection --> Containment["3. Containment & Remediation\n(Autonomous eBPF Drop / iptables Block)"]
    Containment --> Recovery["4. Post-Incident Recovery\n(Health Verification & Rule Cleanup)"]
    Recovery --> LessonsLearned["5. Post-Incident Activity\n(Automated PDF Dossier & Audit Review)"]
    LessonsLearned --> Preparation
```

---

## 18. 📊 Enterprise Compliance & Framework Mapping

| Security Control | OWASP ASVS v4.0 | NIST CSF v2.0 | CIS Controls v8 | Implementation Status |
| :--- | :--- | :--- | :--- | :--- |
| **RSA-256 JWT Authentication** | V2.1.1 (Verify Auth) | PR.AA-01 (Identity) | CIS 6.1 (Access Control) | **Implemented (MVP)** |
| **Role-Based Access Control** | V4.1.1 (Access Control)| PR.AA-02 (Access Mgmt) | CIS 6.2 (Privilege Control) | **Implemented (MVP)** |
| **TLS 1.3 Transport Encryption**| V9.1.1 (Communications)| PR.DS-02 (Transiting Data)| CIS 3.10 (Encrypt Data) | **Implemented (MVP)** |
| **AES-256 Data Encryption** | V8.1.1 (Data Protection)| PR.DS-01 (Data at Rest) | CIS 3.11 (Encrypt Rest) | **Implemented (MVP)** |
| **eBPF/iptables Containment** | V10.1.1 (Malicious Code)| DE.CM-01 (Monitoring) | CIS 13.3 (Network Filter) | **Implemented (MVP)** |
| **Multi-Factor Auth (MFA)** | V2.8.1 (Authenticator)| PR.AA-03 (MFA) | CIS 6.3 (MFA Enforce) | **Future Enhancement** |

---

## 19. 🛠️ Vulnerability & Patch Management Strategy

1. **Dependency Scanning**: Dependabot scans repository dependencies daily for published CVEs.
2. **Automated Patching**: Base Docker images updated monthly to ingest OS-level security patches.

---

## 20. 🧪 Security Verification & Penetration Testing

- **Static Application Security Testing (SAST)**: SonarQube scans source code for security vulnerabilities.
- **Dynamic Application Security Testing (DAST)**: OWASP ZAP scans REST endpoints during CI/CD build execution.

---

## 21. ⚠️ Quantitative Risk Assessment Matrix

| Risk Domain | Threat Description | Likelihood | Impact | Overall Risk Rating | Architectural Mitigation Strategy |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Auth Bypass** | Attacker forge JWT token signature. | Low | Critical | **HIGH** | Enforce asymmetric RSA-256 verification with strict key validation. |
| **Honeypot Breakout** | Attacker exploits zero-day escape to host OS. | Low | Critical | **HIGH** | Run container as `--read-only`, drop capabilities (`cap_drop: ALL`), non-root user. |
| **Rate Limit DoS** | Volumetric REST API flood exhausts threads. | High | Medium | **HIGH** | Redis-backed token bucket rate limiting (`100 req/min`) and eBPF XDP NIC drops. |
| **Audit Hash Alteration**| Compromised user alters historical logs. | Medium | High | **HIGH** | Row-level SHA-256 hash chaining ($\text{Hash}_n = \text{SHA256}(\text{Data}_n \parallel \text{Hash}_{n-1})$). |

---

## 22. 📁 Security Repository Folder Structure

```
backend/src/main/java/com/rakshasphere/
├── security/
│   ├── authentication/   # AuthController & UserDetailsService
│   ├── authorization/    # RBAC Method Interceptors & PermissionGuards
│   ├── jwt/              # RSA-256 JWT Token Provider & Validation Filters
│   └── audit/            # Cryptographic SHA-256 Hash Chained Audit Logger
├── config/
│   ├── SecurityConfig.java # Master Spring Security 6 Filter Chain Configuration
│   └── CorsConfig.java     # Strict CORS & CSP Header Policies
```

---

## 23. 💡 Module-Wise Security Best Practices

- **Frontend**: Enforce `sessionStorage` token isolation; sanitize raw honeypot terminal text.
- **Backend**: Enforce `@PreAuthorize` guards; mandate parameter validation via `@Valid`.
- **Database**: Run under restricted DB user `raksha_app_user`; enforce hash-chained audit logs.
- **Docker**: Execute unprivileged containers (`USER nobody`); drop all Linux capabilities (`--cap-drop=ALL`).

---

## 24. 🔮 MVP Security Scope vs. Future Enterprise Scope

| Security Capability | Minimum Viable Product (MVP) | Future Enterprise Scope |
| :--- | :--- | :--- |
| **Authentication** | Asymmetric RSA-256 JWT Access & Refresh Tokens. | OAuth2 / OpenID Connect (OIDC) & Multi-Factor Authentication (MFA). |
| **Secrets Management** | Environment Variables & Encrypted `.env` files. | HashiCorp Vault / AWS Secrets Manager integration. |
| **IoT Authentication** | HMAC-SHA256 Device Signatures & Mosquitto ACLs. | X.509 Certificate-Based Mutual TLS (mTLS) Device Authentication. |
| **SIEM Integration** | Local Hash-Chained MySQL Audit Store & Logback JSON. | Outbound Syslog / CEF streaming to Splunk & Elastic SIEM. |
