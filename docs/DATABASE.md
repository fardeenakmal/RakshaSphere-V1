# RakshaSphere — Database

> **Source of truth:** `database/init.sql`, JPA entity classes in `backend/src/main/java/com/rakshasphere/model/entity/`.

---

## Database Configuration

| Mode | Engine | Connection |
|------|--------|-----------|
| Docker Compose (production demo) | MySQL 8.0 | `localhost:3307` → `rakshaspheredb` |
| Local backend dev (no Docker) | H2 In-Memory | `jdbc:h2:mem:rakshaspheredb` |

**MySQL credentials (from `init.sql` defaults):**

| | Value |
|--|------|
| Database | `rakshaspheredb` |
| User | `raksha_user` |
| Password | `change_this_user_password` (from env or `.env` file) |
| Root password | Configured via `MYSQL_ROOT_PASSWORD` env var |

---

## Schema

### Table: `roles`

| Column | Type | Description |
|--------|------|-------------|
| `id` | BIGINT PK AUTO_INCREMENT | Role ID |
| `name` | VARCHAR(30) UNIQUE NOT NULL | Role name |
| `description` | VARCHAR(255) | Human-readable description |
| `created_at` | TIMESTAMP | Creation timestamp |

**Seeded rows:**

| ID | Name | Description |
|----|------|-------------|
| 1 | `ROLE_ADMIN` | Administrator with full self-healing rule control |
| 2 | `ROLE_SOC_ANALYST` | SOC Security Analyst with triage capabilities |
| 3 | `ROLE_USER` | Executive viewer with read-only dashboard permissions |

---

### Table: `users`

| Column | Type | Description |
|--------|------|-------------|
| `id` | BIGINT PK AUTO_INCREMENT | User ID |
| `username` | VARCHAR(50) UNIQUE NOT NULL | Login username |
| `email` | VARCHAR(100) UNIQUE NOT NULL | Email address |
| `password_hash` | VARCHAR(255) NOT NULL | BCrypt-hashed password |
| `name` | VARCHAR(100) NOT NULL | Display name |
| `role_id` | BIGINT FK → `roles.id` | Role foreign key |
| `role` | VARCHAR(30) | Denormalized role string (e.g., `ROLE_ADMIN`) |
| `avatar_url` | VARCHAR(255) | Profile image URL |
| `status` | VARCHAR(20) | `ACTIVE`, `PENDING`, `SUSPENDED` |
| `created_at` | TIMESTAMP | Account creation time |

**Seeded rows:**

| Username | Name | Role | Status |
|----------|------|------|--------|
| `admin` | Sarah Connor | `ROLE_ADMIN` | `ACTIVE` |
| `analyst_mike` | Mike Ross | `ROLE_SOC_ANALYST` | `ACTIVE` |

---

### Table: `security_alerts`

| Column | Type | Description |
|--------|------|-------------|
| `id` | VARCHAR(50) PK | Alert ID (e.g., `ALT-1724000000000`) |
| `timestamp` | TIMESTAMP NOT NULL | Alert creation time |
| `source_ip` | VARCHAR(45) NOT NULL | Source IP address |
| `destination_ip` | VARCHAR(45) NOT NULL | Destination IP address |
| `source_port` | INT NOT NULL | Source port |
| `destination_port` | INT NOT NULL | Destination port |
| `attack_type` | VARCHAR(100) NOT NULL | Attack classification string |
| `severity` | VARCHAR(20) NOT NULL | `CRITICAL`, `HIGH`, `MEDIUM`, `LOW`, `INFO` |
| `risk_score` | INT NOT NULL | 0–100 risk score |
| `confidence_score` | DOUBLE NOT NULL | AI classification confidence (0–1) |
| `mitre_tactic` | VARCHAR(100) NOT NULL | MITRE tactic name |
| `mitre_technique` | VARCHAR(100) NOT NULL | MITRE technique name |
| `mitre_id` | VARCHAR(30) NOT NULL | MITRE technique ID (e.g., `T1110`) |
| `status` | VARCHAR(30) NOT NULL | `ACTIVE`, `CONTAINED`, `HONEYPOT_DIVERTED`, `RESOLVED`, `IGNORED` |
| `remediation_action` | VARCHAR(255) | Description of action taken |
| `flow_duration_ms` | BIGINT | Network flow duration |
| `total_fwd_packets` | INT | Forward packet count |
| `packet_length_mean` | DOUBLE | Mean packet length |
| `anomaly_score` | DOUBLE | Reconstruction MSE score |
| `virustotal_score` | VARCHAR(50) | VirusTotal result string (e.g., `3/90 Malicious`) |
| `abuseipdb_confidence` | INT | AbuseIPDB confidence score (0–100) |
| `geo_country` | VARCHAR(50) | Geolocation country code |
| `isp_name` | VARCHAR(100) | ISP name from threat intel |

**Indexes:** `idx_master_alerts_source_ip`, `idx_master_alerts_status`

---

### Table: `honeypot_sessions`

| Column | Type | Description |
|--------|------|-------------|
| `id` | VARCHAR(50) PK | Session ID |
| `service` | VARCHAR(20) NOT NULL | `SSH`, `HTTP`, `TELNET`, `FTP` |
| `container_id` | VARCHAR(100) NOT NULL | Docker container ID |
| `attacker_ip` | VARCHAR(45) NOT NULL | Attacker IP address |
| `port` | INT NOT NULL | Honeypot port (typically 2222) |
| `start_time` | TIMESTAMP NOT NULL | Session start time |
| `status` | VARCHAR(20) NOT NULL | `RUNNING`, `ISOLATED`, `TERMINATED` |
| `keystrokes_json` | TEXT | JSON array of captured keystrokes (capped at ~200 entries) |
| `commands_json` | TEXT | JSON array of executed commands |
| `payloads_captured` | INT | Count of file upload/download events |
| `risk_score` | INT | Session risk score (increases on dangerous events) |

---

### Table: `audit_logs`

| Column | Type | Description |
|--------|------|-------------|
| `id` | VARCHAR(50) PK | Audit log ID (e.g., `AUD-a1b2c3d4`) |
| `timestamp` | TIMESTAMP NOT NULL | Log creation time |
| `actor` | VARCHAR(100) NOT NULL | Username performing the action |
| `action` | VARCHAR(100) NOT NULL | Action type: `INJECT_XDP_DROP`, `DIVERT_TRAFFIC_HONEYPOT`, `REVERT_XDP_DROP` |
| `target` | VARCHAR(255) NOT NULL | Target description (e.g., IP address + port) |
| `status` | VARCHAR(20) NOT NULL | `SUCCESS`, `FAILED`, `PENDING` |
| `crypto_hash` | VARCHAR(64) NOT NULL | Pseudo-random hex identifier (not a cryptographic hash of content) |

**Index:** `idx_master_audit_logs_timestamp`

> **Note:** The `crypto_hash` field is populated using `UUID.randomUUID().toString()` — it is a random identifier, not an HMAC or SHA hash of the log entry content.

---

### Table: `mitre_tactics`

| Column | Type | Description |
|--------|------|-------------|
| `id` | VARCHAR(20) PK | Tactic ID (e.g., `TA0001`) |
| `name` | VARCHAR(100) NOT NULL | Tactic name (e.g., `Initial Access`) |
| `description` | TEXT | Tactic description |

---

### Table: `mitre_techniques`

| Column | Type | Description |
|--------|------|-------------|
| `id` | VARCHAR(20) PK | Technique ID (e.g., `T1110`) |
| `tactic_id` | VARCHAR(20) FK → `mitre_tactics.id` | Parent tactic |
| `name` | VARCHAR(100) NOT NULL | Technique name |
| `description` | TEXT | Technique description |
| `mitigation_playbook` | TEXT | Mitigation guidance |

> **Note:** The `mitre_tactics` and `mitre_techniques` tables are created by `init.sql` but are **not seeded** with ATT&CK data in the current schema. The MITRE ATT&CK metadata displayed on the frontend comes from `frontend/src/data/mitreTactics.ts` (static TypeScript data), not from these database tables. See [MITRE_ATTACK.md](../MITRE_ATTACK.md).

---

### Additional Tables (JPA entities, created by Hibernate DDL)

These tables are defined via JPA `@Entity` classes and created by Hibernate's `ddl-auto: update`:

| Table | Entity Class | Description |
|-------|-------------|-------------|
| `iot_devices` | `IotDevice.java` | IoT device registry (deviceId, status, CPU, memory, last heartbeat) |
| `iot_telemetry_logs` | `IotTelemetryLog.java` | Per-sample IoT telemetry records |
| `honeypot_events` | `HoneypotEvent.java` | Individual events within a honeypot session |
| `service_health_events` | `ServiceHealthEvent.java` | Health event history |

---

## Backup

The `raksha-db-backup` Docker container runs a `crond` job at 02:00 daily to dump the MySQL database to `/backups/backup-YYYYMMDD.sql` (mounted at `docker/backups/`).
