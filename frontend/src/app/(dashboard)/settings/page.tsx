'use client';

import React, { useEffect, useState } from 'react';
import { Shield, Key, Sliders, Users, Save, CheckCircle2, Lock, Eye, EyeOff, UserCheck, Cpu, Server, HardDrive, Terminal } from 'lucide-react';
import { PermissionGuard } from '@/components/common/PermissionGuard';
import { apiService } from '@/services/api';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useAuthStore } from '@/store/useAuthStore';

export default function SettingsPage() {
  const { currentUser } = useAuthStore();
  const user = currentUser;

  const [activeTab, setActiveTab] = useState<'PROFILE' | 'RULES' | 'USERS' | 'KEYS' | 'AUDIT' | 'SYSINFO'>('PROFILE');
  const [riskThreshold, setRiskThreshold] = useState<number>(75);
  const [ebpfMode, setEbpfMode] = useState<boolean>(true);
  const [autoDivertHoneypot, setAutoDivertHoneypot] = useState<boolean>(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const [vtApiKey, setVtApiKey] = useState('');
  const [abuseApiKey, setAbuseApiKey] = useState('');
  const [showVtKey, setShowVtKey] = useState(false);
  const [showAbuseKey, setShowAbuseKey] = useState(false);

  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [systemInfo, setSystemInfo] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    // Fetch Audit Logs
    apiService.getAuditLogs()
      .then((data) => {
        if (Array.isArray(data)) {
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
        if (settings?.vtApiKey) setVtApiKey(settings.vtApiKey);
        if (settings?.abuseApiKey) setAbuseApiKey(settings.abuseApiKey);
      })
      .catch((err) => console.warn('Backend settings fetch warning:', err));

    // Fetch Users list (requires ROLE_ADMIN)
    apiService.getUsers()
      .then((userList) => {
        if (Array.isArray(userList)) {
          setUsers(userList);
        }
      })
      .catch((err) => console.warn('Users management endpoint restricted to ADMIN:', err));

    // Fetch Real System Hardware & Runtime Info
    apiService.getSystemInfo()
      .then((info) => setSystemInfo(info))
      .catch((err) => console.warn('Could not fetch real system info:', err));
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
    <div className="space-y-6 pb-12">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-slate-100 flex items-center gap-2 tracking-tight">
            SYSTEM SETTINGS & RULES CONFIGURATION
          </h1>
          <p className="text-xs font-mono text-slate-400 mt-1">
            RBAC Controls, Autonomous Containment Thresholds & Threat Intelligence Credentials
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

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-800 space-x-2 font-mono text-xs overflow-x-auto">
        <button
          onClick={() => setActiveTab('PROFILE')}
          className={`py-2.5 px-4 font-bold border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'PROFILE'
              ? 'border-emerald-400 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <UserCheck className="w-4 h-4" /> Profile & Role
        </button>

        <button
          onClick={() => setActiveTab('RULES')}
          className={`py-2.5 px-4 font-bold border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'RULES'
              ? 'border-emerald-400 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sliders className="w-4 h-4" /> Self-Healing Rules
        </button>

        <button
          onClick={() => setActiveTab('USERS')}
          className={`py-2.5 px-4 font-bold border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'USERS'
              ? 'border-emerald-400 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" /> User RBAC Management
        </button>

        <button
          onClick={() => setActiveTab('KEYS')}
          className={`py-2.5 px-4 font-bold border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'KEYS'
              ? 'border-emerald-400 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Key className="w-4 h-4" /> Threat Intel API Keys
        </button>

        <button
          onClick={() => setActiveTab('AUDIT')}
          className={`py-2.5 px-4 font-bold border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'AUDIT'
              ? 'border-emerald-400 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Shield className="w-4 h-4" /> Cryptographic Audit Logs
        </button>

        <button
          onClick={() => setActiveTab('SYSINFO')}
          className={`py-2.5 px-4 font-bold border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'SYSINFO'
              ? 'border-emerald-400 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Cpu className="w-4 h-4" /> Real System & Runtime Info
        </button>
      </div>

      {/* Tab 1: Profile & Role */}
      {activeTab === 'PROFILE' && (
        <div className="soc-card p-6 space-y-6 font-mono text-xs">
          <h3 className="font-bold text-sm text-slate-100 border-b border-slate-800 pb-2">
            CURRENT SESSION & ROLE IDENTIFIER
          </h3>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 p-4 rounded-xl bg-slate-950 border border-slate-800">
            <img
              src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
              alt={user?.name || 'User Avatar'}
              className="w-16 h-16 rounded-full border-2 border-emerald-500/40 object-cover shadow-lg"
            />
            <div className="space-y-1">
              <h4 className="font-extrabold text-base text-slate-100">{user?.name || 'Security Analyst'}</h4>
              <p className="text-slate-400 font-mono text-xs">@{user?.username || 'analyst'}</p>
              <div className="pt-2 flex items-center gap-2">
                <span className="text-slate-400 text-[10px]">ACTIVE ROLE:</span>
                <StatusBadge status="HEALTHY" size="sm" labelOverride={user?.role || 'ROLE_SOC_ANALYST'} />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <span className="text-slate-400 text-[10px] uppercase font-bold block">Role Capabilities & Permissions Matrix</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-emerald-400 font-bold block text-xs">ROLE_ADMIN</span>
                <p className="text-slate-400 text-[10px]">Full read/write access. Can modify self-healing rules, API keys, manage users, and inject eBPF rules.</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-cyan-400 font-bold block text-xs">ROLE_SOC_ANALYST</span>
                <p className="text-slate-400 text-[10px]">Threat triage console access. Can contain threats, divert sessions to honeypots, and mark alerts resolved.</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-slate-400 font-bold block text-xs">ROLE_USER</span>
                <p className="text-slate-400 text-[10px]">Read-only telemetry observer. Can view dashboards and stream alerts without execution rights.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Self-Healing Rules */}
      {activeTab === 'RULES' && (
        <form onSubmit={handleSaveRules} className="soc-card p-6 space-y-6 font-mono text-xs">
          <div className="space-y-4">
            <h3 className="font-bold text-sm text-slate-100 border-b border-slate-800 pb-2">
              AUTONOMOUS REMEDIATION THRESHOLDS
            </h3>

            {/* Risk Threshold Slider */}
            <div className="space-y-2 max-w-xl">
              <div className="flex justify-between font-bold text-slate-300">
                <span>Auto-Containment Risk Score Trigger:</span>
                <span className="text-emerald-400 text-sm tabular-nums font-extrabold">{riskThreshold} / 100</span>
              </div>
              <input
                type="range"
                min="30"
                max="95"
                value={riskThreshold}
                onChange={(e) => setRiskThreshold(Number(e.target.value))}
                className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-emerald-400"
              />
              <p className="text-[10px] text-slate-400">
                Threat incidents with evaluated Risk Score ≥ {riskThreshold} will immediately trigger closed-loop containment.
              </p>
            </div>

            {/* eBPF XDP Toggle */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-950 border border-slate-800 max-w-xl">
              <div>
                <span className="font-bold text-slate-200 block">eBPF XDP Hardware NIC Driver Drop</span>
                <span className="text-[10px] text-slate-400">High-performance zero-copy packet drop at NIC layer</span>
              </div>
              <button
                type="button"
                onClick={() => setEbpfMode(!ebpfMode)}
                className={`w-12 h-6 rounded-full p-1 transition cursor-pointer ${
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

            {/* Auto Honeypot Divert Toggle */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-950 border border-slate-800 max-w-xl">
              <div>
                <span className="font-bold text-slate-200 block">Auto-Divert Probing Scans to Honeypot</span>
                <span className="text-[10px] text-slate-400 font-mono">Reroute port probes to ephemeral deception containers</span>
              </div>
              <button
                type="button"
                onClick={() => setAutoDivertHoneypot(!autoDivertHoneypot)}
                className={`w-12 h-6 rounded-full p-1 transition cursor-pointer ${
                  autoDivertHoneypot ? 'bg-amber-500' : 'bg-slate-800'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-slate-950 transition transform ${
                    autoDivertHoneypot ? 'translate-x-6' : 'translate-x-0'
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
            <Button type="submit" variant="primary" leftIcon={<Save className="w-4 h-4" />}>
              Save Configuration
            </Button>
          </PermissionGuard>
        </form>
      )}

      {/* Tab 3: Users RBAC */}
      {activeTab === 'USERS' && (
        <div className="soc-card p-6 space-y-4 font-mono text-xs">
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
                {users.length > 0 ? (
                  users.map((u) => {
                    const statusStr = u.status || 'ACTIVE';
                    const isPending = statusStr === 'PENDING';
                    const isDisabled = statusStr === 'DISABLED';

                    return (
                      <tr key={u.id || u.username}>
                        <td className="p-3 flex items-center gap-3">
                          <img src={u.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'} alt={u.name} className="w-8 h-8 rounded-full border border-slate-700 object-cover" />
                          <div>
                            <div className="font-bold text-slate-200">{u.name || u.username}</div>
                            <div className="text-[10px] text-slate-400">@{u.username}</div>
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
                            className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-[11px] text-emerald-400 font-bold focus:outline-none cursor-pointer"
                          >
                            <option value="ROLE_ADMIN">ROLE_ADMIN</option>
                            <option value="ROLE_SOC_ANALYST">ROLE_SOC_ANALYST</option>
                            <option value="ROLE_USER">ROLE_USER</option>
                          </select>
                        </td>
                        <td className="p-3">
                          <StatusBadge status={statusStr === 'ACTIVE' ? 'HEALTHY' : statusStr} size="sm" labelOverride={statusStr} />
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {isPending && (
                              <Button
                                size="sm"
                                variant="success"
                                onClick={async () => {
                                  try {
                                    await apiService.approveUser(u.id);
                                    setUsers(users.map(item => item.id === u.id ? { ...item, status: 'ACTIVE' } : item));
                                  } catch (err: any) {
                                    setErrorMessage(err.message || 'Failed to approve user');
                                  }
                                }}
                              >
                                Approve
                              </Button>
                            )}
                            {!isDisabled ? (
                              <Button
                                size="sm"
                                variant="danger"
                                onClick={async () => {
                                  try {
                                    await apiService.updateUserStatus(u.id, 'DISABLED');
                                    setUsers(users.map(item => item.id === u.id ? { ...item, status: 'DISABLED' } : item));
                                  } catch (err: any) {
                                    setErrorMessage(err.message || 'Failed to disable user');
                                  }
                                }}
                              >
                                Disable
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={async () => {
                                  try {
                                    await apiService.updateUserStatus(u.id, 'ACTIVE');
                                    setUsers(users.map(item => item.id === u.id ? { ...item, status: 'ACTIVE' } : item));
                                  } catch (err: any) {
                                    setErrorMessage(err.message || 'Failed to activate user');
                                  }
                                }}
                              >
                                Re-Activate
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400 text-xs font-mono">
                      No registered user accounts found. Login with Administrator privileges to view user directory.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: API Keys */}
      {activeTab === 'KEYS' && (
        <form onSubmit={handleSaveKeys} className="soc-card p-6 space-y-6 font-mono text-xs">
          <h3 className="font-bold text-sm text-slate-100 border-b border-slate-800 pb-2">
            EXTERNAL THREAT INTELLIGENCE API CREDENTIALS
          </h3>

          <div className="space-y-4 max-w-xl">
            <div>
              <label className="text-slate-400 block mb-1">VirusTotal v3 API Secret Key</label>
              <div className="relative">
                <input
                  type={showVtKey ? 'text' : 'password'}
                  value={vtApiKey}
                  onChange={(e) => setVtApiKey(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 pr-10 text-slate-200 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowVtKey(!showVtKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  {showVtKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">AbuseIPDB v2 API Secret Key</label>
              <div className="relative">
                <input
                  type={showAbuseKey ? 'text' : 'password'}
                  value={abuseApiKey}
                  onChange={(e) => setAbuseApiKey(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 pr-10 text-slate-200 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowAbuseKey(!showAbuseKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  {showAbuseKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          <PermissionGuard requiredRole="ROLE_ADMIN">
            <Button type="submit" variant="primary" leftIcon={<Save className="w-4 h-4" />}>
              Save API Keys
            </Button>
          </PermissionGuard>
        </form>
      )}

      {/* Tab 5: Audit Logs */}
      {activeTab === 'AUDIT' && (
        <div className="soc-card p-6 space-y-4 font-mono text-xs">
          <h3 className="font-bold text-sm text-slate-100 border-b border-slate-800 pb-2">
            APPEND-ONLY CRYPTOGRAPHIC AUDIT TRAIL
          </h3>

          <div className="space-y-3">
            {auditLogs.length > 0 ? (
              auditLogs.map((log) => (
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
                    <span className="text-[10px] text-slate-400 block font-mono">HASH: {log.hash || log.currentHash || 'SHA256-OK'}</span>
                    <span className="text-[10px] text-slate-500">{log.timestamp}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-slate-400 text-xs bg-slate-950 rounded-xl border border-slate-800">
                No audit log records found in database.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 6: Real System & Runtime Info */}
      {activeTab === 'SYSINFO' && (
        <div className="soc-card p-6 space-y-6 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-emerald-400" /> REAL SYSTEM HARDWARE & RUNTIME TELEMETRY
            </h3>
            <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30 font-bold">
              GET /api/v1/system/info
            </span>
          </div>

          {systemInfo ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-slate-400 text-[10px] uppercase block">HOST & OS NODE</span>
                  <span className="text-slate-100 font-extrabold text-sm block">{systemInfo.hostname}</span>
                  <span className="text-slate-400 text-[11px] block">{systemInfo.osName} {systemInfo.osVersion} ({systemInfo.osArch})</span>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-slate-400 text-[10px] uppercase block">CPU PROCESSOR CORES</span>
                  <span className="text-emerald-400 font-extrabold text-sm block">{systemInfo.availableProcessors} Logical Cores</span>
                  <span className="text-slate-400 text-[11px] block">System Load Average: {systemInfo.systemLoadAverage}</span>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-slate-400 text-[10px] uppercase block">JVM HEAP MEMORY POOL</span>
                  <span className="text-cyan-400 font-extrabold text-sm block">{systemInfo.ramUsedMb} MB / {systemInfo.ramTotalMb} MB</span>
                  <span className="text-slate-400 text-[11px] block">Allocated Heap Usage: {systemInfo.ramUsedPct}%</span>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-slate-400 text-[10px] uppercase block">ROOT DISK STORAGE</span>
                  <span className="text-emerald-400 font-extrabold text-sm block">{systemInfo.diskUsedGb} GB / {systemInfo.diskTotalGb} GB</span>
                  <span className="text-slate-400 text-[11px] block">Filesystem Disk Usage: {systemInfo.diskUsedPct}%</span>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-slate-400 text-[10px] uppercase block">JAVA & SPRING BOOT STACK</span>
                  <span className="text-amber-400 font-extrabold text-sm block">Java {systemInfo.javaVersion}</span>
                  <span className="text-slate-400 text-[11px] block">Spring Boot v{systemInfo.springBootVersion} ({systemInfo.javaVendor})</span>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-slate-400 text-[10px] uppercase block">RUNTIME ISOLATION</span>
                  <StatusBadge status="HEALTHY" size="sm" labelOverride={systemInfo.containerized ? 'DOCKER CONTAINER' : 'BARE METAL / HOST'} />
                  <span className="text-slate-400 text-[11px] block mt-1">JVM Uptime: {Math.round((systemInfo.jvmUptimeMs || 0) / 1000)} seconds</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 space-y-1">
                <p>• Data queried dynamically from live Java OperatingSystemMXBean and Runtime environment APIs.</p>
                <p>• Authenticated and read-only. Environment secrets and credentials are not exposed.</p>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400 text-xs bg-slate-950 rounded-xl border border-slate-800">
              Querying backend system information endpoint...
            </div>
          )}
        </div>
      )}
    </div>
  );
}

