-- Master Bootstrap Script for RakshaSphere Database Creation
-- Usage: mysql -u root -p < database/init.sql

CREATE DATABASE IF NOT EXISTS rakshaspheredb DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
CREATE USER IF NOT EXISTS 'raksha_user'@'%' IDENTIFIED BY 'change_this_user_password';
GRANT ALL PRIVILEGES ON rakshaspheredb.* TO 'raksha_user'@'%';
FLUSH PRIVILEGES;
USE rakshaspheredb;

-- 1. Create Tables
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
    role_id BIGINT DEFAULT 1,
    role VARCHAR(30) DEFAULT 'ROLE_ADMIN',
    avatar_url VARCHAR(255),
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_master_users_role FOREIGN KEY (role_id) REFERENCES roles(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS mitre_tactics (
    id VARCHAR(20) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS mitre_techniques (
    id VARCHAR(20) PRIMARY KEY,
    tactic_id VARCHAR(20) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    mitigation_playbook TEXT,
    CONSTRAINT fk_master_technique_tactic FOREIGN KEY (tactic_id) REFERENCES mitre_tactics(id)
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

CREATE TABLE IF NOT EXISTS honeypot_sessions (
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

-- 2. Create Secondary Indexes
CREATE INDEX idx_master_alerts_source_ip ON security_alerts(source_ip);
CREATE INDEX idx_master_alerts_status ON security_alerts(status);
CREATE INDEX idx_master_audit_logs_timestamp ON audit_logs(timestamp DESC);

-- 3. Seed Initial Data
INSERT INTO roles (id, name, description) VALUES 
(1, 'ROLE_ADMIN', 'Administrator with full self-healing rule control'),
(2, 'ROLE_SOC_ANALYST', 'SOC Security Analyst with triage capabilities'),
(3, 'ROLE_USER', 'Executive viewer with read-only dashboard permissions')
ON DUPLICATE KEY UPDATE name=VALUES(name);

INSERT INTO users (id, username, email, password_hash, name, role_id, avatar_url, status) VALUES 
(1, 'admin', 'sarah.c@rakshasphere.internal', '$2a$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeg6Lruj3vjPGga31lW', 'Sarah Connor', 1, 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', 'ACTIVE'),
(2, 'analyst_mike', 'mike.r@rakshasphere.internal', '$2a$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeg6Lruj3vjPGga31lW', 'Mike Ross', 2, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', 'ACTIVE')
ON DUPLICATE KEY UPDATE username=VALUES(username);
