# Self-Healing Network & Autonomous Containment Architecture Specification

## RakshaSphere
### AI-Powered Autonomous Cyber Defense & Self-Healing Network Platform

> **Document Identifier**: `SELF-HEAL-ARCH-RAKSHASPHERE-2026-V1.0`  
> **Standards Alignment**: `NIST CSF v2.0, MITRE D3FEND, Zero Trust Architecture (NIST SP 800-207), OWASP, Google SRE`  
> **Containment Engines**: `Linux eBPF/XDP Drivers, Dynamic iptables, TCP RST Socket Kill Daemon`  
> **Classification**: `Official Enterprise Self-Healing Subsystem Specification`

---

## 📑 Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [What is a Self-Healing Network?](#2-what-is-a-self-healing-network)
3. [Architectural Diagrams Library](#3-architectural-diagrams-library)
   - [High-Level Self-Healing System Architecture](#31-high-level-self-healing-system-architecture)
   - [End-to-End Recovery Pipeline Sequence](#32-end-to-end-recovery-pipeline-sequence)
   - [Decision Engine Logic Flowchart](#33-decision-engine-logic-flowchart)
   - [Self-Healing Component Diagram](#34-self-healing-component-diagram)
   - [Containment & Recovery Lifecycle State Diagram](#35-containment--recovery-lifecycle-state-diagram)
   - [SOC Dashboard Recovery Flow](#36-soc-dashboard-recovery-flow)
4. [Autonomous Decision Engine Architecture](#4-autonomous-decision-engine-architecture)
5. [Containment Strategies & Enforcement Mechanisms](#5-containment-strategies--enforcement-mechanisms)
6. [Recovery & Remediation Strategies](#6-recovery--remediation-strategies)
7. [Post-Remediation Verification Engine](#7-post-remediation-verification-engine)
8. [Recovery Policy Framework & Governance](#8-recovery-policy-framework--governance)
9. [AI Engine & Machine Learning Integration](#9-ai-engine--machine-learning-integration)
10. [Threat Intelligence Integration Engine](#10-threat-intelligence-integration-engine)
11. [SOC Operations Dashboard Integration](#11-soc-operations-dashboard-integration)
12. [Relational Database Schema & Data Model](#12-relational-database-schema--data-model)
13. [Security Architecture, RBAC & Approval Workflows](#13-security-architecture-rbac--approval-workflows)
14. [Structured Self-Healing Logging & Audit Strategy](#14-structured-self-healing-logging--audit-strategy)
15. [Error Handling, Failure Recovery & Rollback Strategy](#15-error-handling-failure-recovery--rollback-strategy)
16. [Performance, Concurrency & Latency Strategy](#16-performance-concurrency--latency-strategy)
17. [Self-Healing Engine Repository Structure](#17-self-healing-engine-repository-structure)
18. [Quality Assurance & Self-Healing Testing Strategy](#18-quality-assurance--self-healing-testing-strategy)
19. [Risk Assessment & Mitigation Matrix](#19-risk-assessment--mitigation-matrix)
20. [MVP Scope vs. Future Enterprise Scope](#20-mvp-scope-vs-future-enterprise-scope)

---

## 1. 🎯 Executive Summary

The **RakshaSphere Self-Healing Network Subsystem** provides closed-loop autonomous containment, damage reduction, and network service recovery following the detection of high-risk cyber intrusions.

Moving beyond passive alerting, the Self-Healing Engine evaluates dynamic risk scores, validates threat context against policy rules, and executes sub-second OS-level containment mechanisms—including **eBPF/XDP driver-level packet drops**, **dynamic host `iptables` rule injection**, **TCP RST socket teardowns**, and **honeypot NAT diversions**.

```
Threat Detection ➔ Risk Score (>=75) ➔ Decision Engine ➔ eBPF Drop / iptables Block ➔ Health Verification ➔ Audit Log
```

### Core Subsystem Objectives
- **Sub-150ms Containment Latency**: Execute driver and network-level packet drops in under 150 milliseconds from threat validation.
- **Zero-Trust Micro-Containment**: Isolate compromised source IPs or sessions without disrupting unrelated enterprise subnet traffic.
- **Automated Verification & Rollback**: Validate service health post-containment; execute automated rollback if legitimate network connectivity is impaired.
- **Cryptographic Auditability**: Log every self-healing execution to an immutable MySQL table with row-level SHA-256 hash chaining.

---

## 2. 🛡️ What is a Self-Healing Network?

### 2.1 Definition & Philosophy
A **Self-Healing Network** is an autonomous network architecture that continuously monitors system health, detects operational anomalies or cyber intrusions, executes corrective containment actions without human intervention, and verifies post-remediation operational stability.

### 2.2 Why RakshaSphere Integrates Self-Healing Capabilities
1. **Human Reaction Latency**: Manual SOC triage takes minutes or hours; active exploits (e.g., ransomware lateral movement or volumetric SYN floods) inflict catastrophic damage within seconds.
2. **Alert Fatigue Reduction**: Automating low-level routine containment allows security analysts to focus on strategic threat hunting.
3. **MITRE D3FEND Alignment**: Implements standardized countermeasure techniques: *Network Traffic Filtering (D3-NTF)*, *User Session Isolation (D3-USI)*, and *Executable Quarantining (D3-EQ)*.

---

## 3. 📊 Architectural Diagrams Library

### 3.1 High-Level Self-Healing System Architecture

```mermaid
graph TB
    subgraph DetectionLayer ["1. Intrusion & Intelligence Plane"]
        AI_ENGINE["AI Inference Engine (FastAPI)"]
        CTI_ENGINE["Threat Intel Aggregator"]
        RISK_ENGINE["Dynamic Risk Scoring Engine"]
    end

    subgraph DecisionLayer ["2. Autonomous Decision Plane"]
        DECISION_ENG["Self-Healing Decision Engine"]
        POLICY_MGR["Recovery Policy Manager"]
        APPROVAL_MGR["Manual Approval Workflow Manager"]
    end

    subgraph ExecutionLayer ["3. OS Containment & Remediation Enforcer"]
        EBPF_ENFORCER["eBPF / XDP Driver Engine"]
        IPTABLES_ENFORCER["Host iptables Controller"]
        SOCKET_KILLER["TCP Socket RST Daemon"]
        HONEYPOT_DIVERTER["Honeypot NAT Redirector"]
    end

    subgraph VerificationLayer ["4. Verification & Audit Plane"]
        HEALTH_VERIFIER["Post-Remediation Health Checker"]
        AUDIT_LOGGER["Cryptographic Hash Audit Logger"]
        SOC_WEBSOCKET["SOC Dashboard STOMP Broadcaster"]
    end

    AI_ENGINE & CTI_ENGINE --> RISK_ENGINE
    RISK_ENGINE -->|Risk Score Payload| DECISION_ENG
    DECISION_ENG <--> POLICY_MGR & APPROVAL_MGR

    DECISION_ENG -->|Enforce Action| EBPF_ENFORCER & IPTABLES_ENFORCER & SOCKET_KILLER & HONEYPOT_DIVERTER
    EBPF_ENFORCER & IPTABLES_ENFORCER & SOCKET_KILLER & HONEYPOT_DIVERTER --> HEALTH_VERIFIER
    HEALTH_VERIFIER --> AUDIT_LOGGER --> SOC_WEBSOCKET
```

---

### 3.2 End-to-End Recovery Pipeline Sequence

```mermaid
sequenceDiagram
    autonumber
    participant Sensor as Scapy Network Sensor
    participant AI as FastAPI AI Engine
    participant Risk as Dynamic Risk Engine
    participant Decision as Self-Healing Decision Engine
    participant Enforcer as eBPF / iptables Enforcer
    participant Verifier as Health Verification Engine
    participant DB as MySQL Audit Store
    participant SOC as Next.js SOC Dashboard

    Sensor->>AI: Post 84-Element Flow Vector
    AI-->>Risk: Return Class: "DDOS_SYN_FLOOD", Confidence: 0.98
    Risk->>Risk: Calculate Risk Score (Result: 88.50)
    Risk->>Decision: Submit Risk Payload { sourceIp: "198.51.100.42", riskScore: 88.50 }
    
    Decision->>Decision: Evaluate Policy (Score >= 75 -> Policy: AUTOMATIC_CONTAINMENT)
    
    rect rgb(240, 240, 240)
        note over Decision, Enforcer: Autonomous Containment Execution (< 150ms)
        Decision->>Enforcer: executeAction(EBPF_DRIVER_DROP, "198.51.100.42")
        Enforcer->>Enforcer: Inject XDP Driver Filter on NIC (eth0)
        Enforcer-->>Decision: Status: ENFORCED (Execution Time: 12.4ms)
    end

    Decision->>Verifier: runPostHealthCheck("198.51.100.42")
    Verifier-->>Decision: Health Status: CONFIRMED (Traffic Dropped)
    Decision->>DB: INSERT INTO recovery_actions & AUDIT_LOGS (Hash Chained)
    Decision->>SOC: Push Real-Time Event via WebSocket STOMP (/topic/self-healing)
```

---

### 3.3 Decision Engine Logic Flowchart

```mermaid
flowchart TD
    A[Incoming Risk Payload] --> B{Risk Score >= 75.00?}
    B -->|No| C{40.00 <= Risk Score < 75.00?}
    B -->|Yes| D{Policy Mode?}

    C -->|Yes| E[Medium Risk: Alert SOC & Throttle Bandwidth]
    C -->|No| F[Low Risk: Log Event Only]

    D -->|AUTOMATIC| G[Select Containment Strategy]
    D -->|SEMI_AUTOMATIC| H[Generate Admin Approval Request]
    D -->|MANUAL| I[Display SOC Triage Recommendation]

    G --> J{Attack Vector?}
    J -->|Volumetric DDoS| K[Inject eBPF XDP Driver Drop]
    J -->|Port Scanning| L[Append iptables Block Rule]
    J -->|Brute Force Session| M[Issue TCP RST Socket Kill]

    K & L & M --> N[Trigger Health Verification]
```

---

### 3.4 Self-Healing Component Diagram

```mermaid
component
    package "Detection Ingestion" {
        [Risk Score Receiver]
    }

    package "Self-Healing Core Engine" {
        [Policy Engine] --> [Strategy Selector]
        [Strategy Selector] --> [eBPF Enforcer]
        [Strategy Selector] --> [iptables Enforcer]
        [Strategy Selector] --> [Socket Teardown Enforcer]
        [Strategy Selector] --> [Health Verifier]
    }

    package "Persistence & Messaging" {
        database "MySQL Audit Store"
        [STOMP WebSocket Broadcaster]
    }

    [Risk Score Receiver] ..> [Policy Engine] : RiskPayload DTO
    [Health Verifier] ..> [MySQL Audit Store] : JPA Save
    [Health Verifier] ..> [STOMP WebSocket Broadcaster] : Alert Broadcast
```

---

### 3.5 Containment & Recovery Lifecycle State Diagram

```mermaid
stateDiagram-v2
    [*] --> DETECTED: Risk Score >= 75
    DETECTED --> EVALUATING_POLICY: Decision Engine Evaluates Governance Rules
    EVALUATING_POLICY --> PENDING_APPROVAL: Mode == SEMI_AUTOMATIC
    EVALUATING_POLICY --> EXECUTING: Mode == AUTOMATIC
    PENDING_APPROVAL --> EXECUTING: Administrator Approves Action
    PENDING_APPROVAL --> ABORTED: Administrator Rejects Action
    EXECUTING --> VERIFYING: Containment Command Applied
    VERIFYING --> CONFIRMED: Health Check Confirms Isolation
    VERIFYING --> ROLLING_BACK: Health Check Flags System Degradation
    ROLLING_BACK --> REVERTED: Rule Removed & State Restored
    CONFIRMED --> [*]: Immutable Audit Log Created
```

---

### 3.6 SOC Dashboard Recovery Flow

```mermaid
flowchart TD
    A[Autonomous Self-Healing Action Executed] --> B[Push STOMP WebSocket Message to /topic/self-healing]
    B --> C[Update Dashboard Active Containment Badge]
    B --> D[Append Entry to Recovery Audit Timeline Table]
    D --> E{Analyst Clicks 'Revert Rule'?}
    E -->|Yes| F[POST /api/v1/self-healing/remediate { action: REVERT_BLOCK }]
    F --> G[Remove eBPF / iptables Drop Rule & Write Audit Log]
    E -->|No| H[Maintain Active Block until Expiration]
```

---

## 4. 🧠 Autonomous Decision Engine Architecture

The Decision Engine synthesizes multiple security inputs to select an optimal, proportional containment strategy:

### 4.1 Decision Matrix Inputs
1. **Calculated Risk Score ($0.00 - 100.00$)**: Output from the dynamic risk engine.
2. **AI Model Confidence ($0.0 - 1.0$)**: Machine learning ensemble probability.
3. **MITRE ATT&CK TTP ID**: Taxonomy identifier (e.g., `T1110` for SSH Brute Force).
4. **Asset Criticality Weight ($1 - 5$)**: Target host importance multiplier.
5. **System Governance Policy**: Configured execution mode (`AUTOMATIC`, `SEMI_AUTOMATIC`, `MANUAL`).

### 4.2 Proportional Action Selection Rules

| Risk Score Range | Attack Profile | System Mode | Selected Containment Mechanism | Target Latency |
| :--- | :--- | :--- | :--- | :--- |
| $< 40.00$ | Reconnaissance / Scan | All Modes | **Log & Monitor**: Record event; no containment. | N/A |
| $40.00 - 64.99$ | Low-Rate Probing | AUTOMATIC | **Honeypot Diversion**: Reroute IP to decoy container via NAT. | $< 250\text{ms}$ |
| $65.00 - 74.99$ | SSH / Web Brute Force | AUTOMATIC | **Socket Kill & iptables Block**: Issue TCP RST and drop IP. | $< 100\text{ms}$ |
| $\ge 75.00$ | Volumetric DDoS / Exploit | AUTOMATIC | **eBPF Driver Drop**: Inject low-level XDP packet drop filter. | **$< 15\text{ms}$** |

---

## 5. 🛠️ Containment Strategies & Enforcement Mechanisms

RakshaSphere implements four practical containment mechanisms at the OS and network layers:

### 1. eBPF / XDP Driver-Level Packet Drop
- **Purpose**: Drops malicious network frames at the NIC driver layer before packet buffer allocation in Linux kernel memory.
- **Implementation**: Uses `libbpf` to attach an eBPF BPF_MAP_TYPE_HASH lookup map containing blocked IPs to the `XDP_DROP` hook on interface `eth0`.
- **Target Latency**: $< 15\text{ms}$.

### 2. Dynamic Host `iptables` Rule Injection
- **Purpose**: Applies host-level firewall drop rules to isolate malicious IPs from local transport sockets.
- **Implementation**: Executes Linux system command: `iptables -I INPUT -s {target_ip} -j DROP`.
- **Target Latency**: $< 50\text{ms}$.

### 3. TCP Socket RST Teardown
- **Purpose**: Instantly terminates active, established TCP authentication sessions associated with compromised credentials.
- **Implementation**: Issues TCP RST packets via `ss -k dst {target_ip}` or `tcpkill`.
- **Target Latency**: $< 50\text{ms}$.

### 4. Honeypot NAT Diversion
- **Purpose**: Diverts suspicious reconnaissance probes into isolated Docker honeypot containers.
- **Implementation**: Modifies host PREROUTING NAT table: `iptables -t nat -A PREROUTING -s {target_ip} -p tcp --dport 22 -j REDIRECT --to-ports 2222`.
- **Target Latency**: $< 200\text{ms}$.

---

## 6. 🔄 Recovery & Remediation Strategies

Following successful threat containment, the Self-Healing Engine manages network service recovery:

1. **Firewall Rule Expiration & Cleanup**: Temporary firewall drop rules are configured with a default 24-hour TTL. A background scheduler (`LogCleanupTask`) automatically removes expired rules.
2. **Session Cleanup & State Reset**: Clears invalid authentication state entries in Redis for compromised internal accounts.
3. **Manual Operator Rollback**: Authorized administrators (`ROLE_ADMIN`) can execute an instant one-click unblock via the SOC Dashboard, removing applied eBPF/iptables rules within 1 second.

---

## 7. 🧪 Post-Remediation Verification Engine

To ensure an applied containment action successfully isolates the threat without inducing self-inflicted network outages:

```mermaid
flowchart TD
    A[Containment Rule Applied] --> B[Wait 500ms Buffer]
    B --> C[Execute Verification Suite]
    
    C --> D[1. Packet Drop Verification: Confirm 0 packets pass for target IP]
    C --> E[2. Host Health Check: Ping local default gateway]
    C --> F[3. Service Availability Check: Query internal HTTP/DB socket health]

    D & E & F --> G{All Verification Checks Passed?}
    G -->|Yes| H[Mark Containment Status: CONFIRMED]
    G -->|No| I[Trigger Automatic Rollback & Alert SOC]
```

---

## 8. 📋 Recovery Policy Framework & Governance

Administrators configure the platform's self-healing posture using three policy execution modes:

```mermaid
graph TD
    A[Policy Governance Modes] --> B[AUTOMATIC Mode]
    A --> C[SEMI_AUTOMATIC Mode]
    A --> D[MANUAL Mode]

    B -->|Behavior| B1[System executes eBPF/iptables drops autonomously without human intervention.]
    C -->|Behavior| C1[System stages containment action and requires 1-click SOC analyst approval.]
    D -->|Behavior| D1[System displays recommendations only; analyst manually applies rules.]
```

---

## 9. 🧠 AI Engine & Machine Learning Integration

The Self-Healing Engine receives risk payloads from the Python FastAPI AI Engine and returns execution metrics:

```mermaid
flowchart LR
    A[Raw Packet Stream] --> B[AI Engine Ensemble Prediction]
    B --> C[Calculate Dynamic Risk Score]
    C -->|Risk Score >= 75| D[Self-Healing Decision Engine]
    D --> E[Enforce eBPF Drop / iptables Block]
    E --> F[Return Execution Reaction Time to AI Telemetry Log]
```

---

## 10. 🌐 Threat Intelligence Integration Engine

The Decision Engine cross-references AbuseIPDB reputation scores prior to enforcing permanent blocks:
- **High Abuse Confidence ($> 80\%$)**: Instantly elevates rule execution mode to `AUTOMATIC`.
- **Low Abuse Confidence ($< 20\%$) / Internal Subnet IP**: Forces policy mode to `SEMI_AUTOMATIC` requiring analyst approval to prevent false positive isolation of internal enterprise hosts.

---

## 11. 🖥️ SOC Operations Dashboard Integration

The Next.js SOC Dashboard features a **Self-Healing Control Panel** (`app/(dashboard)/settings/page.tsx` & `/alerts`):
- **Live Containment Feed**: Displays real-time eBPF and `iptables` active drop rules.
- **One-Click Revert Button**: Allows administrators to immediately remove host blocks.
- **Policy Mode Selector**: Radio buttons allowing admins to toggle between `AUTOMATIC`, `SEMI_AUTOMATIC`, and `MANUAL` execution modes.

---

## 12. 🗄️ Relational Database Schema & Data Model

The Self-Healing Subsystem uses three relational tables within the MySQL database:

```mermaid
erDiagram
    SECURITY_ALERTS ||--o{ RECOVERY_ACTIONS : triggers
    RECOVERY_ACTIONS ||--o{ FIREWALL_RULES : applies
    RECOVERY_ACTIONS ||--o{ VERIFICATION_RESULTS : validates

    RECOVERY_ACTIONS {
        bigint id PK
        string alert_id FK
        string action_type
        string target_ip
        string status
        int execution_time_ms
        timestamp created_at
    }

    FIREWALL_RULES {
        bigint id PK
        bigint action_id FK
        string rule_type
        string target_ip
        int rule_ttl_seconds
        timestamp expires_at
    }

    VERIFICATION_RESULTS {
        bigint id PK
        bigint action_id FK
        boolean packet_drop_confirmed
        boolean gateway_reachable
        boolean service_healthy
        timestamp verified_at
    }
```

---

## 13. 🔒 Security Architecture, RBAC & Approval Workflows

1. **Role-Based Access Control**: Reverting a containment rule or changing system policy modes requires explicit `ROLE_ADMIN` authorization.
2. **Cryptographic Audit Chaining**: Every self-healing action writes a record to the `AUDIT_LOGS` table with row-level SHA-256 hash chaining ($\text{Hash}_n = \text{SHA256}(\text{Data}_n \parallel \text{Hash}_{n-1})$).
3. **Privilege Escalation Controls**: The backend process executing `iptables` or eBPF commands runs under a dedicated, unprivileged system user (`raksha-agent`) granted narrow `sudoers` privileges for specific binary paths only.

---

## 14. 📝 Structured Self-Healing Logging & Audit Strategy

All self-healing actions are logged in structured JSON format via Logback (`self-healing.json`):

```json
{
  "timestamp": "2026-08-02T15:22:01.120Z",
  "logLevel": "INFO",
  "subsystem": "SELF_HEALING_ENGINE",
  "action": "EBPF_DRIVER_DROP",
  "targetIp": "198.51.100.42",
  "riskScore": 88.50,
  "executionTimeMs": 12.4,
  "status": "ENFORCED",
  "verification": "PASSED"
}
```

---

## 15. 🚨 Error Handling, Failure Recovery & Rollback Strategy

- **Execution Failure**: If an eBPF injection command fails, the engine falls back to `iptables` drop rule injection within 20 milliseconds.
- **Verification Failure**: If post-remediation health checks detect that host gateway connectivity is broken, the engine immediately executes an automated rollback (`iptables -D`) and issues a high-priority alert to the SOC dashboard.
- **Command Timeout**: System process execution calls time out after 2,000 milliseconds to prevent thread starvation.

---

## 16. ⚡ Performance, Concurrency & Latency Strategy

- **Sub-150ms Reaction Pipeline**: Virtual Threads in Java 21 execute containment calls asynchronously without blocking HTTP request threads.
- **eBPF XDP Performance**: Driver-level frame drops process up to $10,000,000$ packets/sec per core with $< 1\%$ CPU utilization.

---

## 17. 📁 Self-Healing Engine Repository Structure

```
backend/src/main/java/com/rakshasphere/
├── controller/
│   └── SelfHealingController.java    # REST API endpoints for manual overrides & policy configs
├── service/
│   ├── SelfHealingService.java       # Master containment orchestrator
│   ├── DecisionEngine.java           # Rule evaluation and priority matrix engine
│   ├── EbpfContainmentService.java   # Low-level eBPF XDP driver wrapper
│   ├── IptablesService.java          # Host iptables command wrapper
│   └── HealthVerificationService.java# Post-remediation health check verifier
├── model/entity/
│   ├── RecoveryAction.java           # JPA entity for self-healing actions
│   ├── FirewallRule.java             # JPA entity for active blocks
│   └── VerificationResult.java       # JPA entity for health checks
└── repository/
    ├── RecoveryActionRepository.java
    └── FirewallRuleRepository.java
```

---

## 18. 🧪 Quality Assurance & Self-Healing Testing Strategy

1. **Containment Speed Testing**: Automated benchmark scripts measuring time elapsed from alert ingestion to network packet drop verification ($< 150\text{ms}$).
2. **Rollback Verification Testing**: Synthetic failure injection tests confirming automated rule removal occurs when health checks fail.
3. **RBAC Authorization Testing**: MockMVC tests ensuring non-admin users cannot alter self-healing policies or revert firewall rules.

---

## 19. ⚠️ Risk Assessment & Mitigation Matrix

| Risk Domain | Identified Threat / Risk | Impact | Architectural Mitigation Strategy |
| :--- | :--- | :--- | :--- |
| **False Positive Blocking** | System automatically blocks legitimate internal host or gateway IP. | High | Enforce Admin Whitelist tables (`127.0.0.1`, default gateways) and require manual approval for internal IPs. |
| **Self-Inflicted Outage** | Firewall rule syntax error disrupts all host networking. | Critical | Run automated post-remediation health checks; execute instant rollback if gateway ping fails. |
| **Containment Loop** | Rapid recurring alerts cause duplicate rule creation. | Medium | Maintain active block lookup set in Redis to skip duplicate rule commands. |
| **Privilege Escalation** | Attacker exploits backend process to issue arbitrary `sudo` commands. | Critical | Restrict `sudoers` file to explicit binary paths (`/sbin/iptables`, `/usr/sbin/bpftool`) only. |

---

## 20. 🔮 MVP Scope vs. Future Enterprise Scope

| Subsystem Capability | Minimum Viable Product (MVP) | Future Enterprise Scope |
| :--- | :--- | :--- |
| **Containment Mechanisms** | eBPF XDP NIC drop, host `iptables`, TCP RST socket kill, Honeypot NAT. | Cloud Security Group APIs (AWS SG / Azure NSG), Cisco switch ACLs. |
| **Policy Modes** | `AUTOMATIC`, `SEMI_AUTOMATIC`, `MANUAL` global toggles. | Per-subnet granular policy governance matrices. |
| **Verification Engine** | Local gateway ping & HTTP socket availability check. | Synthetic end-to-end user transaction testing. |
| **SOAR Integration** | Local execution + STOMP WebSockets + MySQL Audit Log. | Native STIX/TAXII webhooks for Palo Alto Cortex XSOAR & Splunk SOAR. |
