import { MitreTechnique } from '@/types';

export interface MitreTacticGroup {
  tacticId: string;
  name: string;
  techniques: MitreTechnique[];
}

export const MITRE_TACTICS: MitreTacticGroup[] = [
  {
    tacticId: 'TA0001',
    name: 'Initial Access',
    techniques: [
      {
        id: 'T1110',
        name: 'Brute Force',
        tactic: 'Initial Access',
        count: 0,
        severity: 'NOMINAL',
        description: 'Adversaries attempt credential guessing against SSH, RDP, or FTP.',
        mitigation: 'Enforce strong password policy, rate-limiting & automated eBPF IP block.'
      },
      {
        id: 'T1190',
        name: 'Exploit Public-Facing App',
        tactic: 'Initial Access',
        count: 0,
        severity: 'NOMINAL',
        description: 'Targeting known HTTP vulnerabilities or web app flaws to gain entrance.',
        mitigation: 'Divert flow to Web Honeypot Deception trap and apply WAF rules.'
      },
      {
        id: 'T1566',
        name: 'Phishing Vectors',
        tactic: 'Initial Access',
        count: 0,
        severity: 'NOMINAL',
        description: 'Spearphishing links or malicious attachments targeting domain users.',
        mitigation: 'Email filtering & user security awareness training.'
      }
    ]
  },
  {
    tacticId: 'TA0002',
    name: 'Execution',
    techniques: [
      {
        id: 'T1059',
        name: 'Command & Scripting Interpreter',
        tactic: 'Execution',
        count: 0,
        severity: 'NOMINAL',
        description: 'Executing sh, bash, PowerShell or Python scripts to run arbitrary code.',
        mitigation: 'Restrict interpreter permissions and kill suspicious child processes.'
      },
      {
        id: 'T1203',
        name: 'Exploitation for Client Execution',
        tactic: 'Execution',
        count: 0,
        severity: 'NOMINAL',
        description: 'Exploiting client software vulnerabilities to trigger payload.',
        mitigation: 'Automatic patching & micro-segmentation.'
      }
    ]
  },
  {
    tacticId: 'TA0003',
    name: 'Persistence',
    techniques: [
      {
        id: 'T1053',
        name: 'Scheduled Task / Cron Job',
        tactic: 'Persistence',
        count: 0,
        severity: 'NOMINAL',
        description: 'Adversaries configure cron jobs or systemd units to maintain access.',
        mitigation: 'Monitor /etc/cron* and systemd timer creation.'
      },
      {
        id: 'T1098',
        name: 'Account Manipulation',
        tactic: 'Persistence',
        count: 0,
        severity: 'NOMINAL',
        description: 'Adding unauthorized SSH keys or editing account credentials.',
        mitigation: 'Cryptographic identity auditing and SSH key pinning.'
      }
    ]
  },
  {
    tacticId: 'TA0004',
    name: 'Privilege Escalation',
    techniques: [
      {
        id: 'T1068',
        name: 'Exploitation for Privilege Escalation',
        tactic: 'Privilege Escalation',
        count: 0,
        severity: 'NOMINAL',
        description: 'Kernel exploits or SUID binary abuse to achieve root/SYSTEM.',
        mitigation: 'Kernel security hardening and eBPF syscall audit.'
      }
    ]
  },
  {
    tacticId: 'TA0007',
    name: 'Discovery',
    techniques: [
      {
        id: 'T1046',
        name: 'Network Service Discovery',
        tactic: 'Discovery',
        count: 0,
        severity: 'NOMINAL',
        description: 'Port scanning (Nmap, Masscan) to enumerate active services.',
        mitigation: 'Auto-divert scanning IPs into low-interaction Telnet/HTTP honeypots.'
      },
      {
        id: 'T1082',
        name: 'System Information Discovery',
        tactic: 'Discovery',
        count: 0,
        severity: 'NOMINAL',
        description: 'Querying OS version, kernel release, and environment parameters.',
        mitigation: 'Obfuscate server banners and system tokens.'
      }
    ]
  },
  {
    tacticId: 'TA0008',
    name: 'Lateral Movement',
    techniques: [
      {
        id: 'T1021',
        name: 'Remote Services (SMB/SSH)',
        tactic: 'Lateral Movement',
        count: 0,
        severity: 'NOMINAL',
        description: 'Moving across internal subnets using compromised credentials.',
        mitigation: 'Self-healing zero-trust network quarantine & dynamic VLAN isolation.'
      }
    ]
  },
  {
    tacticId: 'TA0011',
    name: 'Impact',
    techniques: [
      {
        id: 'T1498',
        name: 'Network Denial of Service (DDoS)',
        tactic: 'Impact',
        count: 0,
        severity: 'NOMINAL',
        description: 'Volumetric ICMP/UDP/SYN floods targeting core gateway.',
        mitigation: 'Instant NIC driver eBPF/XDP drop rules.'
      }
    ]
  }
];
