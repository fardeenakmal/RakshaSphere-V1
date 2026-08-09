-- Development & Testing Initial Seed Data

-- Insert System Roles
INSERT INTO roles (id, name, description) VALUES 
(1, 'ROLE_ADMIN', 'Administrator with full self-healing rule control'),
(2, 'ROLE_SOC_ANALYST', 'SOC Security Analyst with triage capabilities'),
(3, 'ROLE_USER', 'Executive viewer with read-only dashboard permissions')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- Insert Default Demo Users
INSERT INTO users (id, username, email, password_hash, name, role_id, avatar_url, status) VALUES 
(1, 'admin', 'sarah.c@rakshasphere.internal', '$2a$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeg6Lruj3vjPGga31lW', 'Sarah Connor', 1, 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', 'ACTIVE'),
(2, 'analyst_mike', 'mike.r@rakshasphere.internal', '$2a$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeg6Lruj3vjPGga31lW', 'Mike Ross', 2, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', 'ACTIVE')
ON DUPLICATE KEY UPDATE username=VALUES(username);

-- Insert MITRE ATT&CK Tactics & Techniques
INSERT INTO mitre_tactics (id, name, description) VALUES
('TA0001', 'Initial Access', 'Adversaries attempting to get into your network.'),
('TA0002', 'Execution', 'Adversaries running malicious code.'),
('TA0007', 'Discovery', 'Adversaries trying to figure out your network environment.')
ON DUPLICATE KEY UPDATE name=VALUES(name);

INSERT INTO mitre_techniques (id, tactic_id, name, description, mitigation_playbook) VALUES
('T1110', 'TA0001', 'Brute Force', 'Password guessing probes targeting SSH/RDP/FTP.', 'Enforce strong password policy & automated eBPF drop rule.'),
('T1190', 'TA0001', 'Exploit Public-Facing App', 'Exploiting web application vulnerabilities.', 'WAF rate limiting & divert flow to web honeypot trap.'),
('T1046', 'TA0007', 'Network Service Discovery', 'Port scanning services to map open ports.', 'Auto-divert scanning IPs into Telnet/HTTP honeypots.')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- Insert Sample Security Alerts
INSERT INTO security_alerts (id, timestamp, source_ip, destination_ip, source_port, destination_port, attack_type, severity, risk_score, confidence_score, mitre_tactic, mitre_technique, mitre_id, status, remediation_action, flow_duration_ms, total_fwd_packets, packet_length_mean, anomaly_score, virustotal_score, abuseipdb_confidence, geo_country, isp_name) VALUES
('ALT-2026-8901', CURRENT_TIMESTAMP, '185.220.101.5', '192.168.10.45', 54321, 22, 'SSH Credential Brute Force', 'CRITICAL', 94, 0.98, 'Initial Access', 'Brute Force', 'T1110', 'CONTAINED', 'eBPF XDP Driver Drop Rule Injected', 450, 128, 512.4, 0.89, '14/90 Malicious', 96, 'DE (Germany)', 'Tor Exit Node Relay'),
('ALT-2026-8902', CURRENT_TIMESTAMP, '198.51.100.42', '192.168.10.80', 49152, 80, 'HTTP SQL Injection Probe', 'HIGH', 82, 0.91, 'Execution', 'Exploit Public-Facing Application', 'T1190', 'HONEYPOT_DIVERTED', 'Diverted to Dynamic Web Trap Container #hpy-http-02', 1200, 45, 840.2, 0.76, '8/90 Malicious', 78, 'RU (Russian Federation)', 'HostProvider Network Ltd'),
('ALT-2026-8903', CURRENT_TIMESTAMP, '203.0.113.195', '192.168.20.12', 33410, 23, 'Telnet Mirai Botnet Recon', 'MEDIUM', 65, 0.85, 'Discovery', 'Network Service Discovery', 'T1046', 'ACTIVE', 'Pending Analyst Review', 3200, 12, 64.0, 0.62, '22/90 Malicious', 89, 'CN (China)', 'China Telecom')
ON DUPLICATE KEY UPDATE attack_type=VALUES(attack_type);

-- Insert Sample Honeypot Sessions
INSERT INTO honeypot_sessions (id, service, container_id, attacker_ip, port, start_time, status, keystrokes_json, commands_json, payloads_captured, risk_score) VALUES
('HP-SSH-01', 'SSH', 'docker-trap-ssh-7f9a', '185.220.101.5', 2222, CURRENT_TIMESTAMP, 'RUNNING', '["ssh root@192.168.10.45", "uname -a", "cat /etc/passwd"]', '["uname -a", "cat /etc/passwd"]', 3, 88),
('HP-HTTP-02', 'HTTP', 'docker-trap-web-3c1b', '198.51.100.42', 8080, CURRENT_TIMESTAMP, 'RUNNING', '["GET /admin/login.php?user=admin\' OR 1=1--"]', '["SQL injection probe"]', 5, 92)
ON DUPLICATE KEY UPDATE service=VALUES(service);

-- Insert Sample Audit Log Chained Entries
INSERT INTO audit_logs (id, timestamp, actor, action, target, status, crypto_hash) VALUES
('AUD-901', CURRENT_TIMESTAMP, 'Autonomous Engine (eBPF)', 'INJECT_XDP_DROP', '185.220.101.5 (Port 22)', 'SUCCESS', '0x8f2a1b9c3d4e5f6a'),
('AUD-902', CURRENT_TIMESTAMP, 'Honeypot Orchestrator', 'DIVERT_TRAFFIC_HONEYPOT', '198.51.100.42 -> docker-trap-web-3c1b', 'SUCCESS', '0x1c3d5e7f9a2b4c6d')
ON DUPLICATE KEY UPDATE action=VALUES(action);
