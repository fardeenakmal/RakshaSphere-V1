/**
 * RakshaSphere — Unified REST API Client Service Layer
 * Target: Spring Boot Core Backend (http://localhost:8080/api/v1)
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

export async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('rakshasphere_token') : null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => 'API Error');
      throw new Error(`HTTP ${res.status}: ${errorText}`);
    }

    const json = await res.json();
    return json.data !== undefined ? json.data : json;
  } catch (error) {
    console.warn(`[API Client Error] ${endpoint}:`, error);
    throw error;
  }
}

export const apiService = {
  // Auth REST Endpoints
  async login(username: string, password?: string) {
    return fetchApi<any>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        username: username || 'admin',
        password: password || 'password',
      }),
    });
  },

  // Security Alerts REST Endpoints
  async getAlerts() {
    return fetchApi<any[]>('/alerts');
  },

  async getAlertById(id: string) {
    return fetchApi<any>(`/alerts/${id}`);
  },

  // Self-Healing Remediation REST Endpoint
  async remediateAlert(alertId: string, actionType: string = 'eBPF_DROP') {
    return fetchApi<any>('/self-healing/remediate', {
      method: 'POST',
      body: JSON.stringify({
        alertId,
        actionType,
      }),
    });
  },

  // Honeypots REST Endpoints
  async getHoneypots() {
    return fetchApi<any[]>('/honeypots');
  },

  async deployHoneypot(service: string = 'SSH', attackerIp: string = '185.220.101.99') {
    return fetchApi<any>(`/honeypots/deploy?service=${encodeURIComponent(service)}&attackerIp=${encodeURIComponent(attackerIp)}`, {
      method: 'POST',
    });
  },

  // SOC System Metrics & Audit Trail Endpoints
  async getSystemMetrics() {
    return fetchApi<any>('/soc/metrics');
  },

  async getAuditLogs() {
    return fetchApi<any[]>('/soc/audit-logs');
  },
};
