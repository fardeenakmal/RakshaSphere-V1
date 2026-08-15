-- RakshaSphere IoT Database Schema Extension
-- MySQL 8.0 / InnoDB Compliant Schema Definitions for IoT Devices & Telemetry Logs

CREATE TABLE IF NOT EXISTS iot_devices (
    device_id VARCHAR(50) PRIMARY KEY,
    status VARCHAR(20) NOT NULL DEFAULT 'ONLINE',
    ip_address VARCHAR(45),
    mac_address VARCHAR(17),
    cpu_usage_pct DOUBLE,
    memory_usage_pct DOUBLE,
    active_sockets INT,
    latency_ms DOUBLE,
    last_heartbeat TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS iot_telemetry_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    device_id VARCHAR(50) NOT NULL,
    cpu_usage_pct DOUBLE,
    memory_usage_pct DOUBLE,
    active_sockets INT,
    latency_ms DOUBLE,
    raw_payload TEXT,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_iot_telemetry_device FOREIGN KEY (device_id) REFERENCES iot_devices(device_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
