import { Alert } from '@/types';

export const INITIAL_ALERTS: Alert[] = [
  {
    id: 'ALT-2026-8901',
    timestamp: '2026-08-08T16:45:12Z',
    sourceIp: '185.220.101.5',
    destinationIp: '192.168.10.45',
    sourcePort: 54321,
    destinationPort: 22,
    attackType: 'SSH Credential Brute Force',
    severity: 'CRITICAL',
    riskScore: 94,
    confidence: 0.98,
    mitreTactic: 'Initial Access',
    mitreTechnique: 'Brute Force',
    mitreId: 'T1110',
    status: 'CONTAINED',
    remediationAction: 'eBPF XDP Driver Drop Rule Injected',
    flowFeatures: {
      flowDurationMs: 450,
      totalFwdPackets: 128,
      packetLengthMean: 512.4,
      autoencoderAnomalyScore: 0.89
    },
    threatIntel: {
      virusTotalScore: '14/90 Malicious',
      abuseIpDbConfidence: 96,
      country: 'DE (Germany)',
      isp: 'Tor Exit Node Relay'
    }
  },
  {
    id: 'ALT-2026-8902',
    timestamp: '2026-08-08T16:47:30Z',
    sourceIp: '198.51.100.42',
    destinationIp: '192.168.10.80',
    sourcePort: 49152,
    destinationPort: 80,
    attackType: 'HTTP SQL Injection Probe',
    severity: 'HIGH',
    riskScore: 82,
    confidence: 0.91,
    mitreTactic: 'Execution',
    mitreTechnique: 'Exploit Public-Facing Application',
    mitreId: 'T1190',
    status: 'HONEYPOT_DIVERTED',
    remediationAction: 'Diverted to Dynamic Web Trap Container #hpy-http-02',
    flowFeatures: {
      flowDurationMs: 1200,
      totalFwdPackets: 45,
      packetLengthMean: 840.2,
      autoencoderAnomalyScore: 0.76
    },
    threatIntel: {
      virusTotalScore: '8/90 Malicious',
      abuseIpDbConfidence: 78,
      country: 'RU (Russian Federation)',
      isp: 'HostProvider Network Ltd'
    }
  },
  {
    id: 'ALT-2026-8903',
    timestamp: '2026-08-08T16:50:04Z',
    sourceIp: '203.0.113.195',
    destinationIp: '192.168.20.12',
    sourcePort: 33410,
    destinationPort: 23,
    attackType: 'Telnet Mirai Botnet Recon',
    severity: 'MEDIUM',
    riskScore: 65,
    confidence: 0.85,
    mitreTactic: 'Discovery',
    mitreTechnique: 'Network Service Discovery',
    mitreId: 'T1046',
    status: 'ACTIVE',
    remediationAction: 'Pending Analyst Review / Automated Trap Spawning',
    flowFeatures: {
      flowDurationMs: 3200,
      totalFwdPackets: 12,
      packetLengthMean: 64.0,
      autoencoderAnomalyScore: 0.62
    },
    threatIntel: {
      virusTotalScore: '22/90 Malicious',
      abuseIpDbConfidence: 89,
      country: 'CN (China)',
      isp: 'China Telecom Backbone'
    }
  },
  {
    id: 'ALT-2026-8904',
    timestamp: '2026-08-08T16:51:19Z',
    sourceIp: '45.154.255.88',
    destinationIp: '192.168.10.15',
    sourcePort: 60100,
    destinationPort: 445,
    attackType: 'SMB Lateral Movement Attempt',
    severity: 'CRITICAL',
    riskScore: 98,
    confidence: 0.99,
    mitreTactic: 'Lateral Movement',
    mitreTechnique: 'Exploration via SMB/Windows Admin Shares',
    mitreId: 'T1021',
    status: 'CONTAINED',
    remediationAction: 'iptables TCP RST & Micro-segmentation VLAN 99',
    flowFeatures: {
      flowDurationMs: 150,
      totalFwdPackets: 310,
      packetLengthMean: 1024.0,
      autoencoderAnomalyScore: 0.95
    },
    threatIntel: {
      virusTotalScore: '45/90 Malicious',
      abuseIpDbConfidence: 100,
      country: 'NL (Netherlands)',
      isp: 'Bulletproof Hosting B.V.'
    }
  },
  {
    id: 'ALT-2026-8905',
    timestamp: '2026-08-08T16:52:45Z',
    sourceIp: '103.251.140.2',
    destinationIp: '192.168.30.5',
    sourcePort: 41200,
    destinationPort: 21,
    attackType: 'FTP Anonymous Recon & Directory Traversal',
    severity: 'LOW',
    riskScore: 35,
    confidence: 0.72,
    mitreTactic: 'Credential Access',
    mitreTechnique: 'Unsecured Credentials',
    mitreId: 'T1552',
    status: 'RESOLVED',
    remediationAction: 'Logged & Session Expired Gracefully',
    flowFeatures: {
      flowDurationMs: 5400,
      totalFwdPackets: 8,
      packetLengthMean: 120.0,
      autoencoderAnomalyScore: 0.31
    },
    threatIntel: {
      virusTotalScore: '0/90 Malicious',
      abuseIpDbConfidence: 12,
      country: 'IN (India)',
      isp: 'Bharti Airtel Ltd'
    }
  },
  {
    id: 'ALT-2026-8906',
    timestamp: '2026-08-08T16:54:10Z',
    sourceIp: '91.240.118.172',
    destinationIp: '192.168.10.45',
    sourcePort: 51234,
    destinationPort: 8080,
    attackType: 'Spring4Shell Remote Code Execution (RCE)',
    severity: 'CRITICAL',
    riskScore: 96,
    confidence: 0.97,
    mitreTactic: 'Execution',
    mitreTechnique: 'Command and Scripting Interpreter',
    mitreId: 'T1059',
    status: 'CONTAINED',
    remediationAction: 'eBPF Drop Rule & Dynamic IP Ban',
    flowFeatures: {
      flowDurationMs: 210,
      totalFwdPackets: 88,
      packetLengthMean: 1450.0,
      autoencoderAnomalyScore: 0.92
    },
    threatIntel: {
      virusTotalScore: '38/90 Malicious',
      abuseIpDbConfidence: 98,
      country: 'UA (Ukraine)',
      isp: 'FastServer Datacenter'
    }
  }
];
