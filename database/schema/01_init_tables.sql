-- RakshaSphere Master Database Schema Initialization
-- MySQL 8.0 / InnoDB Compliant Schema Definitions

CREATE TABLE IF NOT EXISTS roles (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(30) NOT NULL UNIQUE,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    role_id BIGINT NOT NULL,
    avatar_url VARCHAR(255),
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS threat_categories (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    severity VARCHAR(20) DEFAULT 'MEDIUM'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS mitre_tactics (
    id VARCHAR(20) PRIMARY KEY, -- e.g. TA0001
    name VARCHAR(100) NOT NULL,
    description TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS mitre_techniques (
    id VARCHAR(20) PRIMARY KEY, -- e.g. T1110
    tactic_id VARCHAR(20) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    mitigation_playbook TEXT,
    CONSTRAINT fk_mitre_technique_tactic FOREIGN KEY (tactic_id) REFERENCES mitre_tactics(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS security_alerts (
    id VARCHAR(50) PRIMARY KEY,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    source_ip VARCHAR(45) NOT NULL,
    destination_ip VARCHAR(45) NOT NULL,
    source_port INT NOT NULL,
    destination_port INT NOT NULL,
    attack_type VARCHAR(100) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    risk_score INT NOT NULL,
    confidence_score DOUBLE NOT NULL,
    mitre_tactic VARCHAR(100) NOT NULL,
    mitre_technique VARCHAR(100) NOT NULL,
    mitre_id VARCHAR(30) NOT NULL,
    status VARCHAR(30) NOT NULL,
    remediation_action VARCHAR(255),
    flow_duration_ms BIGINT,
    total_fwd_packets INT,
    packet_length_mean DOUBLE,
    anomaly_score DOUBLE,
    virustotal_score VARCHAR(50),
    abuseipdb_confidence INT,
    geo_country VARCHAR(50),
    isp_name VARCHAR(100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS risk_scores (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    threat_event_id VARCHAR(50) NOT NULL,
    threat_severity DECIMAL(4,2) NOT NULL,
    asset_weight INT DEFAULT 1,
    mitigation_factor DECIMAL(4,2) DEFAULT 1.00,
    calculated_risk DECIMAL(5,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_risk_threat_event FOREIGN KEY (threat_event_id) REFERENCES security_alerts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS honeypot_sessions (
    id VARCHAR(50) PRIMARY KEY,
    service VARCHAR(20) NOT NULL,
    container_id VARCHAR(100) NOT NULL,
    attacker_ip VARCHAR(45) NOT NULL,
    port INT NOT NULL,
    start_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP NULL,
    status VARCHAR(20) NOT NULL,
    keystrokes_json TEXT,
    commands_json TEXT,
    payloads_captured INT DEFAULT 0,
    risk_score INT DEFAULT 50
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS honeypot_events (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(50) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    source_ip VARCHAR(45),
    source_port INT,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    username VARCHAR(100),
    command VARCHAR(500),
    raw_event_json TEXT,
    CONSTRAINT fk_honeypot_event_session FOREIGN KEY (session_id) REFERENCES honeypot_sessions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS recovery_actions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    threat_event_id VARCHAR(50) NOT NULL,
    action_type VARCHAR(50) NOT NULL,
    target_ip VARCHAR(45) NOT NULL,
    status VARCHAR(20) DEFAULT 'ENFORCED',
    execution_time_ms INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_recovery_threat_event FOREIGN KEY (threat_event_id) REFERENCES security_alerts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(50) PRIMARY KEY,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actor VARCHAR(100) NOT NULL,
    action VARCHAR(100) NOT NULL,
    target VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL,
    crypto_hash VARCHAR(64) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS iot_devices (
    id VARCHAR(50) PRIMARY KEY,
    device_name VARCHAR(100) NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    mac_address VARCHAR(17) NOT NULL UNIQUE,
    status VARCHAR(20) DEFAULT 'ONLINE',
    last_heartbeat TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
