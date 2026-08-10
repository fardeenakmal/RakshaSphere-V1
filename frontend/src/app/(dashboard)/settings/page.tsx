'use client';

import React, { useEffect, useState } from 'react';
import { Shield, Key, Sliders, Users, Save, CheckCircle2, Lock } from 'lucide-react';
import { DEMO_USERS, INITIAL_AUDIT_LOGS } from '@/data/mockMetrics';
import { PermissionGuard } from '@/components/common/PermissionGuard';
import { apiService } from '@/services/api';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'RULES' | 'USERS' | 'KEYS' | 'AUDIT'>('RULES');
  const [riskThreshold, setRiskThreshold] = useState<number>(75);
  const [ebpfMode, setEbpfMode] = useState<boolean>(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const [vtApiKey, setVtApiKey] = useState('vt_api_key_demo_8f9a2b7c4d');
  const [abuseApiKey, setAbuseApiKey] = useState('abuseipdb_sec_key_1a3b5c7d');
  const [auditLogs, setAuditLogs] = useState<any[]>(INITIAL_AUDIT_LOGS);

  const [users, setUsers] = useState<any[]>(DEMO_USERS);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    // Fetch Audit Logs (requires ROLE_ADMIN or ROLE_SOC_ANALYST)
    apiService.getAuditLogs()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setAuditLogs(data);
        }
      })
      .catch((err) => {
        console.warn('Backend audit logs access restricted:', err);
      });

    // Fetch System Settings
    apiService.getSettings()
      .then((settings) => {
        if (settings?.riskThreshold !== undefined) setRiskThreshold(settings.riskThreshold);
        if (settings?.ebpfEnabled !== undefined) setEbpfMode(settings.ebpfEnabled);
      })
      .catch((err) => console.warn('Backend settings fetch warning:', err));

    // Fetch Users list (requires ROLE_ADMIN)
    apiService.getUsers()
      .then((userList) => {
        if (Array.isArray(userList) && userList.length > 0) {
          setUsers(userList);
        }
      })
      .catch((err) => console.warn('Users management endpoint restricted to ADMIN:', err));
  }, []);

  const handleSaveRules = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    try {
      await apiService.saveSettingsRules(riskThreshold, ebpfMode);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'HTTP 403 Forbidden: Admin role required');
      setTimeout(() => setErrorMessage(null), 4000);
    }
  };

  const handleSaveKeys = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    try {
      await apiService.saveSettingsKeys(vtApiKey, abuseApiKey);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'HTTP 403 Forbidden: Admin role required');
      setTimeout(() => setErrorMessage(null), 4000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-slate-100 flex items-center gap-2">
            SYSTEM SETTINGS & RULES CONFIGURATION
          </h1>
          <p className="text-xs font-mono text-slate-400 mt-1">
            RBAC Controls, Self-Healing Risk Thresholds & Threat Intel Integration
          </p>
        </div>

        {savedSuccess && (
          <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/30 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4" />
            <span>Settings Saved & Applied</span>
          </div>
        )}

        {errorMessage && (
          <div className="flex items-center gap-2 text-red-400 font-mono text-xs bg-red-500/10 px-3 py-1.5 rounded-xl border border-red-500/30 animate-in fade-in">
            <Lock className="w-4 h-4" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 space-x-4 font-mono text-xs">
        <button
          onClick={() => setActiveTab('RULES')}
          className={`py-2.5 px-4 font-bold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'RULES'
              ? 'border-emerald-400 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sliders className="w-4 h-4" /> Self-Healing Rules
        </button>

        <button
          onClick={() => setActiveTab('USERS')}
          className={`py-2.5 px-4 font-bold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'USERS'
              ? 'border-emerald-400 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" /> User RBAC Management
        </button>

        <button
          onClick={() => setActiveTab('KEYS')}
          className={`py-2.5 px-4 font-bold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'KEYS'
              ? 'border-emerald-400 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Key className="w-4 h-4" /> Threat Intel API Keys
        </button>

        <button
          onClick={() => setActiveTab('AUDIT')}
          className={`py-2.5 px-4 font-bold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'AUDIT'
              ? 'border-emerald-400 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Shield className="w-4 h-4" /> Cryptographic Audit Logs
        </button>
      </div>

      {/* Tab 1: Self-Healing Rules */}
      {activeTab === 'RULES' && (
        <form onSubmit={handleSaveRules} className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6 font-mono text-xs">
          <div className="space-y-4">
            <h3 className="font-bold text-sm text-slate-100 border-b border-slate-800 pb-2">
              AUTONOMOUS REMEDIATION THRESHOLDS
            </h3>

            {/* Risk Threshold Slider */}
            <div className="space-y-2 max-w-xl">
              <div className="flex justify-between font-bold text-slate-300">
                <span>Auto-Containment Risk Score Trigger:</span>
                <span className="text-emerald-400 text-sm">{riskThreshold} / 100</span>
              </div>
              <input
                type="range"
                min="30"
                max="95"
                value={riskThreshold}
                onChange={(e) => setRiskThreshold(Number(e.target.value))}
                className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-emerald-400"
              />
              <p className="text-[10px] text-slate-500">
                Threat incidents with evaluated Risk Score ≥ {riskThreshold} will immediately trigger closed-loop containment.
              </p>
            </div>

            {/* eBPF XDP Toggle */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-950 border border-slate-800 max-w-xl">
              <div>
                <span className="font-bold text-slate-200 block">eBPF XDP Hardware NIC Driver Drop</span>
                <span className="text-[10px] text-slate-500">High-performance zero-copy packet drop at NIC layer</span>
              </div>
              <button
                type="button"
                onClick={() => setEbpfMode(!ebpfMode)}
                className={`w-12 h-6 rounded-full p-1 transition ${
                  ebpfMode ? 'bg-emerald-500' : 'bg-slate-800'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-slate-950 transition transform ${
                    ebpfMode ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          <PermissionGuard
            requiredRole="ROLE_ADMIN"
            fallback={
              <div className="text-amber-400 text-xs flex items-center gap-2 pt-2">
                <Lock className="w-4 h-4" /> Admin rights required to save rules (Switch role in Navbar to ROLE_ADMIN)
              </div>
            }
          >
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition flex items-center gap-2"
            >
              <Save className="w-4 h-4" /> Save Configuration
            </button>
          </PermissionGuard>
        </form>
      )}

      {/* Tab 2: Users RBAC */}
      {activeTab === 'USERS' && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="font-bold text-sm text-slate-100">
              ENTERPRISE USER ACCOUNTS & ACCESS APPROVALS
            </h3>
            <span className="text-[10px] text-slate-400">Total Registered Users: {users.length}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-950 text-slate-400 text-[10px] uppercase">
                <tr>
                  <th className="p-3">User</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {users.map((u) => {
                  const statusStr = u.status || 'ACTIVE';
                  const isPending = statusStr === 'PENDING';
                  const isDisabled = statusStr === 'DISABLED';

                  return (
                    <tr key={u.id || u.username}>
                      <td className="p-3 flex items-center gap-3">
                        <img src={u.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'} alt={u.name} className="w-8 h-8 rounded-full border border-slate-700 object-cover" />
                        <div>
                          <div className="font-bold text-slate-200">{u.name}</div>
                          <div className="text-[10px] text-slate-500">@{u.username}</div>
                        </div>
                      </td>
                      <td className="p-3 text-slate-300">{u.email}</td>
                      <td className="p-3">
                        <select
                          value={u.role}
                          onChange={async (e) => {
                            const newRole = e.target.value;
                            try {
                              await apiService.updateUserRole(u.id, newRole);
                              setUsers(users.map(item => item.id === u.id ? { ...item, role: newRole } : item));
                            } catch (err: any) {
                              setErrorMessage(err.message || 'Failed to update user role');
                            }
                          }}
                          className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-[11px] text-emerald-400 font-bold focus:outline-none"
                        >
                          <option value="ROLE_ADMIN">ROLE_ADMIN</option>
                          <option value="ROLE_SOC_ANALYST">ROLE_SOC_ANALYST</option>
                          <option value="ROLE_USER">ROLE_USER</option>
                        </select>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          isPending
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 animate-pulse'
                            : isDisabled
                            ? 'bg-red-500/10 text-red-400 border-red-500/30'
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        }`}>
                          {statusStr}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isPending && (
                            <button
                              onClick={async () => {
                                try {
                                  await apiService.approveUser(u.id);
                                  setUsers(users.map(item => item.id === u.id ? { ...item, status: 'ACTIVE' } : item));
                                } catch (err: any) {
                                  setErrorMessage(err.message || 'Failed to approve user');
                                }
                              }}
                              className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold"
                            >
                              Approve
                            </button>
                          )}
                          {!isDisabled ? (
                            <button
                              onClick={async () => {
                                try {
                                  await apiService.updateUserStatus(u.id, 'DISABLED');
                                  setUsers(users.map(item => item.id === u.id ? { ...item, status: 'DISABLED' } : item));
                                } catch (err: any) {
                                  setErrorMessage(err.message || 'Failed to disable user');
                                }
                              }}
                              className="px-2.5 py-1 rounded bg-red-600/20 hover:bg-red-600/40 text-red-300 text-[10px] font-bold border border-red-500/30"
                            >
                              Disable
                            </button>
                          ) : (
                            <button
                              onClick={async () => {
                                try {
                                  await apiService.updateUserStatus(u.id, 'ACTIVE');
                                  setUsers(users.map(item => item.id === u.id ? { ...item, status: 'ACTIVE' } : item));
                                } catch (err: any) {
                                  setErrorMessage(err.message || 'Failed to activate user');
                                }
                              }}
                              className="px-2.5 py-1 rounded bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 text-[10px] font-bold border border-emerald-500/30"
                            >
                              Re-Activate
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: API Keys */}
      {activeTab === 'KEYS' && (
        <form onSubmit={handleSaveKeys} className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6 font-mono text-xs">
          <h3 className="font-bold text-sm text-slate-100 border-b border-slate-800 pb-2">
            EXTERNAL THREAT INTELLIGENCE API CREDENTIALS
          </h3>

          <div className="space-y-4 max-w-xl">
            <div>
              <label className="text-slate-400 block mb-1">VirusTotal v3 API Secret Key</label>
              <input
                type="password"
                value={vtApiKey}
                onChange={(e) => setVtApiKey(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">AbuseIPDB v2 API Secret Key</label>
              <input
                type="password"
                value={abuseApiKey}
                onChange={(e) => setAbuseApiKey(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200"
              />
            </div>
          </div>

          <PermissionGuard requiredRole="ROLE_ADMIN">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition flex items-center gap-2"
            >
              <Save className="w-4 h-4" /> Save API Keys
            </button>
          </PermissionGuard>
        </form>
      )}

      {/* Tab 4: Audit Logs */}
      {activeTab === 'AUDIT' && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 font-mono text-xs">
          <h3 className="font-bold text-sm text-slate-100 border-b border-slate-800 pb-2">
            APPEND-ONLY CRYPTOGRAPHIC AUDIT TRAIL
          </h3>

          <div className="space-y-3">
            {auditLogs.map((log) => (
              <div key={log.id} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-emerald-400">{log.id}</span>
                    <span className="text-slate-300 font-bold">{log.action || log.actionPerformed}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Target: {log.target || log.targetResource || 'eBPF NIC Filter'} | Actor: {log.actor || log.actorUser || 'Autonomous System'}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-500 block font-mono">HASH: {log.hash || log.currentHash || 'SHA256-OK'}</span>
                  <span className="text-[10px] text-slate-400">{log.timestamp}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
