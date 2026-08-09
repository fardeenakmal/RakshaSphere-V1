-- Flyway Migration V1__init_schema.sql
-- Master Flyway migration creating all RakshaSphere schema objects

CREATE TABLE roles (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(30) NOT NULL UNIQUE,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    role_id BIGINT NOT NULL,
    avatar_url VARCHAR(255),
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_flyway_users_role FOREIGN KEY (role_id) REFERENCES roles(id)
);

CREATE TABLE security_alerts (
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
);

CREATE TABLE honeypot_sessions (
    id VARCHAR(50) PRIMARY KEY,
    service VARCHAR(20) NOT NULL,
    container_id VARCHAR(100) NOT NULL,
    attacker_ip VARCHAR(45) NOT NULL,
    port INT NOT NULL,
    start_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) NOT NULL,
    keystrokes_json TEXT,
    commands_json TEXT,
    payloads_captured INT DEFAULT 0,
    risk_score INT DEFAULT 50
);

CREATE TABLE audit_logs (
    id VARCHAR(50) PRIMARY KEY,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actor VARCHAR(100) NOT NULL,
    action VARCHAR(100) NOT NULL,
    target VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL,
    crypto_hash VARCHAR(64) NOT NULL
);

-- Secondary Indexes
CREATE INDEX idx_flyway_alerts_src_ip ON security_alerts(source_ip);
CREATE INDEX idx_flyway_alerts_status ON security_alerts(status);
CREATE INDEX idx_flyway_audit_time ON audit_logs(timestamp DESC);
