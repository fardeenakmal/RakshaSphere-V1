/**
 * RakshaSphere — Unified REST API Client Service Layer
 * Target: Spring Boot Core Backend (http://localhost:8080/api/v1)
 */

const getApiBaseUrl = (): string => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!envUrl) {
    if (typeof window !== 'undefined') {
      const host = window.location.hostname;
      if (host === 'localhost' || host === '127.0.0.1') {
        return 'http://localhost:8080/api/v1';
      }
    }
    return 'http://localhost:8080/api/v1';
  }
  const cleanUrl = envUrl.replace(/\/+$/, '');
  return cleanUrl.endsWith('/api/v1') ? cleanUrl : `${cleanUrl}/api/v1`;
};

const BASE_URL = getApiBaseUrl();

export async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== 'undefined'
    ? (localStorage.getItem('rakshasphere_token') || sessionStorage.getItem('rakshasphere_token'))
    : null;

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

    if ((res.status === 401 || res.status === 403) && endpoint !== '/auth/login') {
      if (typeof window !== 'undefined' && !token?.startsWith('guest_')) {
        localStorage.removeItem('rakshasphere_token');
        sessionStorage.removeItem('rakshasphere_token');
      }
    }

    if (!res.ok) {
      let errorMsg = `HTTP ${res.status}`;
      try {
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const jsonErr = await res.json();
          errorMsg = jsonErr.message || jsonErr.error || errorMsg;
        } else {
          const rawText = await res.text();
          if (rawText.startsWith('<') || rawText.includes('<!DOCTYPE')) {
            errorMsg = res.status === 404
              ? 'Backend API unavailable (HTTP 404). Please ensure Spring Boot backend is running on http://localhost:8080.'
              : `Backend service error (HTTP ${res.status})`;
          } else {
            errorMsg = rawText.slice(0, 150) || errorMsg;
          }
        }
      } catch (e) {
        // fallback to HTTP status
      }
      throw new Error(errorMsg);
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
  async login(username: string, password?: string, mfaCode?: string) {
    return fetchApi<any>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        username,
        password,
        mfaCode: mfaCode || undefined,
      }),
    });
  },

  async getCurrentUser() {
    try {
      return await fetchApi<any>('/auth/me');
    } catch (err) {
      return null;
    }
  },

  async register(data: { username: string; name: string; email: string; password: string; confirmPassword: string; requestedRole?: string }) {
    return fetchApi<any>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Security Alerts REST Endpoints
  async getAlerts() {
    return fetchApi<any[]>('/alerts');
  },

  async getAlertById(id: string) {
    return fetchApi<any>(`/alerts/${id}`);
  },

  async ingestNetworkFlow(flowData: { sourceIp?: string; destinationIp?: string; sourcePort?: number; destinationPort?: number; flowFeatures: number[] }) {
    return fetchApi<any>('/alerts/ingest-flow', {
      method: 'POST',
      body: JSON.stringify(flowData),
    });
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

  async stopHoneypot(id: string) {
    return fetchApi<any>(`/honeypots/${id}/stop`, {
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

  // Settings & Configuration Endpoints
  async getSettings() {
    return fetchApi<any>('/settings');
  },

  async saveSettingsRules(riskThreshold: number, ebpfEnabled: boolean) {
    return fetchApi<any>('/settings/rules', {
      method: 'POST',
      body: JSON.stringify({ riskThreshold, ebpfEnabled }),
    });
  },

  async saveSettingsKeys(vtApiKey: string, abuseApiKey: string) {
    return fetchApi<any>('/settings/keys', {
      method: 'POST',
      body: JSON.stringify({ vtApiKey, abuseApiKey }),
    });
  },

  // User Management Endpoints
  async getUsers() {
    return fetchApi<any[]>('/users');
  },

  async getPendingUsers() {
    return fetchApi<any[]>('/users/pending');
  },

  async approveUser(id: number | string, role?: string) {
    return fetchApi<any>(`/users/${id}/approve`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    });
  },

  async updateUserStatus(id: number | string, status: string) {
    return fetchApi<any>(`/users/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },

  async createUser(user: { username: string; email: string; name?: string; role?: string; password?: string }) {
    return fetchApi<any>('/users', {
      method: 'POST',
      body: JSON.stringify(user),
    });
  },

  async updateUserRole(id: number | string, role: string) {
    return fetchApi<any>(`/users/${id}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    });
  },

  // AI Engine Endpoints
  async getAiHealth() {
    return fetchApi<any>('/ai/health');
  },

  async predictAiFlow(flowFeatures: number[], topK: number = 5) {
    return fetchApi<any>('/ai/predict', {
      method: 'POST',
      body: JSON.stringify({ flowFeatures, topK }),
    });
  },

  async explainAiFlow(flowFeatures: number[], topK: number = 5) {
    return fetchApi<any>('/ai/explain', {
      method: 'POST',
      body: JSON.stringify({ flowFeatures, topK }),
    });
  },

  async batchPredictAiFlow(flows: number[][]) {
    return fetchApi<any>('/ai/batch-predict', {
      method: 'POST',
      body: JSON.stringify({ flows }),
    });
  },

  // Real-Time System Health Endpoint
  async getSystemHealth() {
    return fetchApi<any>('/system/health');
  },

  async getSystemInfo() {
    return fetchApi<any>('/system/info');
  },

  // MITRE ATT&CK Telemetry Endpoints
  async getMitreMatrix() {
    return fetchApi<any[]>('/mitre/matrix');
  },

  async getMitreTechniqueDetail(id: string) {
    return fetchApi<any>(`/mitre/techniques/${id}`);
  },
};

