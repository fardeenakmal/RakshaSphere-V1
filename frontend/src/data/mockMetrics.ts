import { AuditLog, SystemMetrics, User } from '@/types';

export const INITIAL_METRICS: SystemMetrics = {
  activeThreats: 14,
  containedToday: 184,
  ebpfDropsCount: 1420,
  activeHoneypots: 4,
  systemRiskScore: 78,
  networkHealthPct: 98.4,
  ingestedFlowsPerSec: 14500,
  selfHealingLatencyMs: 112
};

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'AUD-901',
    timestamp: '2026-08-08 16:45:13',
    actor: 'Autonomous Engine (eBPF)',
    action: 'INJECT_XDP_DROP',
    target: '185.220.101.5 (Port 22)',
    status: 'SUCCESS',
    hash: '0x8f2a1b9c3d4e5f6a'
  },
  {
    id: 'AUD-902',
    timestamp: '2026-08-08 16:47:31',
    actor: 'Honeypot Orchestrator',
    action: 'DIVERT_TRAFFIC_HONEYPOT',
    target: '198.51.100.42 -> docker-trap-web-3c1b',
    status: 'SUCCESS',
    hash: '0x1c3d5e7f9a2b4c6d'
  },
  {
    id: 'AUD-903',
    timestamp: '2026-08-08 16:51:20',
    actor: 'Autonomous Engine (iptables)',
    action: 'BLOCK_SUBNET_VLAN',
    target: '45.154.255.88 (SMB 445)',
    status: 'SUCCESS',
    hash: '0x7e9a1b3c5d2f4a6b'
  },
  {
    id: 'AUD-904',
    timestamp: '2026-08-08 16:53:00',
    actor: 'admin (SOC Operator)',
    action: 'UPDATE_RISK_THRESHOLD',
    target: 'Auto-containment score lowered to 75',
    status: 'SUCCESS',
    hash: '0x3b5c7d9a1f2e4a6c'
  }
];

export const DEMO_USERS: User[] = [
  {
    id: 'USR-01',
    username: 'admin',
    name: 'Sarah Connor',
    email: 'sarah.c@rakshasphere.internal',
    role: 'ROLE_ADMIN',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'USR-02',
    username: 'analyst_mike',
    name: 'Mike Ross',
    email: 'mike.r@rakshasphere.internal',
    role: 'ROLE_SOC_ANALYST',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'USR-03',
    username: 'viewer_alex',
    name: 'Alex Vance',
    email: 'alex.v@rakshasphere.internal',
    role: 'ROLE_USER',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'
  }
];
