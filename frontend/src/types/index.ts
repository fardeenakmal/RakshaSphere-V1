export type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';

export type AlertStatus = 'ACTIVE' | 'CONTAINED' | 'HONEYPOT_DIVERTED' | 'RESOLVED' | 'IGNORED';

export interface Alert {
  id: string;
  timestamp: string;
  sourceIp: string;
  destinationIp: string;
  sourcePort: number;
  destinationPort: number;
  attackType: string;
  severity: Severity;
  riskScore: number;
  confidence: number;
  mitreTactic: string;
  mitreTechnique: string;
  mitreId: string;
  status: AlertStatus;
  remediationAction?: string;
  flowFeatures?: {
    flowDurationMs: number;
    totalFwdPackets: number;
    packetLengthMean: number;
    autoencoderAnomalyScore: number;
  };
  threatIntel?: {
    virusTotalScore: string;
    abuseIpDbConfidence: number;
    country: string;
    isp: string;
  };
}

export interface HoneypotSession {
  id: string;
  service: 'SSH' | 'HTTP' | 'TELNET' | 'FTP';
  containerId: string;
  attackerIp: string;
  port: number;
  startTime: string;
  status: 'RUNNING' | 'ISOLATED' | 'TERMINATED';
  keystrokes: string[];
  commandsExecuted: string[];
  capturedPayloadsCount: number;
  riskScore: number;
}

export interface MitreTechnique {
  id: string;
  name: string;
  tactic: string;
  count: number;
  severity: Severity;
  description: string;
  mitigation: string;
}

export interface SystemMetrics {
  activeThreats: number;
  containedToday: number;
  ebpfDropsCount: number;
  activeHoneypots: number;
  systemRiskScore: number;
  networkHealthPct: number;
  ingestedFlowsPerSec: number;
  selfHealingLatencyMs: number;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  target: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  hash: string;
}

export type UserRole = 'ROLE_ADMIN' | 'ROLE_SOC_ANALYST' | 'ROLE_USER';

export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
}
