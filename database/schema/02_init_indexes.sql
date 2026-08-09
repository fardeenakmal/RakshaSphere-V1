-- Secondary & Composite Indexes for RakshaSphere Performance Optimization

-- Indexes for Security Alerts
CREATE INDEX idx_security_alerts_source_ip ON security_alerts(source_ip);
CREATE INDEX idx_security_alerts_status ON security_alerts(status);
CREATE INDEX idx_security_alerts_severity ON security_alerts(severity);
CREATE INDEX idx_security_alerts_timestamp ON security_alerts(timestamp DESC);
CREATE INDEX idx_security_alerts_status_timestamp ON security_alerts(status, timestamp DESC);

-- Indexes for Honeypot Deception Sessions
CREATE INDEX idx_honeypot_sessions_attacker_ip ON honeypot_sessions(attacker_ip);
CREATE INDEX idx_honeypot_sessions_status ON honeypot_sessions(status);

-- Indexes for Cryptographic Audit Logs
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp DESC);

-- Indexes for IoT Edge Nodes
CREATE INDEX idx_iot_devices_status ON iot_devices(status);
