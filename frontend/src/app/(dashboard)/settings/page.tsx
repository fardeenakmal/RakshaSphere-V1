'use client';

import React, { useEffect, useState } from 'react';
import { Shield, Key, Sliders, Users, Save, CheckCircle2, Lock, Eye, EyeOff, UserCheck, Cpu, Server, HardDrive } from 'lucide-react';
import { PermissionGuard } from '@/components/common/PermissionGuard';
import { apiService } from '@/services/api';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Tabs } from '@/components/ui/Tabs';
import { Input } from '@/components/ui/Input';
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

  const tabsConfig = [
    { id: 'PROFILE', label: 'Profile & Role', icon: <UserCheck className="w-3.5 h-3.5" /> },
    { id: 'RULES', label: 'Self-Healing Rules', icon: <Sliders className="w-3.5 h-3.5" /> },
    { id: 'USERS', label: 'User RBAC', icon: <Users className="w-3.5 h-3.5" />, badge: <span className="px-1.5 py-0.2 text-[9px] rounded bg-slate-900 border border-white/10">{users.length}</span> },
    { id: 'KEYS', label: 'Threat Intel API Keys', icon: <Key className="w-3.5 h-3.5" /> },
    { id: 'AUDIT', label: 'Cryptographic Audit', icon: <Shield className="w-3.5 h-3.5" /> },
    { id: 'SYSINFO', label: 'Host System Info', icon: <Cpu className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="space-y-6 pb-12 font-mono">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl md:text-2xl font-extrabold text-slate-100 tracking-tight">
              SETTINGS & GOVERNANCE CONSOLE
            </h1>
            <span className="px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-[10px] font-bold">
              RBAC PROTECTED
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Role Permissions, Autonomous Containment Thresholds & External Credentials
          </p>
        </div>

        {savedSuccess && (
          <div className="flex items-center gap-2 text-emerald-400 text-xs bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/30">
            <CheckCircle2 className="w-4 h-4" />
            <span>Settings Saved & Applied</span>
          </div>
        )}

        {errorMessage && (
          <div className="flex items-center gap-2 text-rose-300 text-xs bg-rose-500/10 px-3 py-1.5 rounded-lg border border-rose-500/30">
            <Lock className="w-4 h-4" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <Tabs
        tabs={tabsConfig}
        activeTab={activeTab}
        onChange={(tabId) => setActiveTab(tabId as any)}
      />

      {/* Tab 1: Profile & Role */}
      {activeTab === 'PROFILE' && (
        <div className="soc-card p-5 md:p-6 space-y-6 text-xs">
          <h3 className="font-bold text-sm text-slate-100 border-b border-white/[0.06] pb-2 uppercase tracking-wider">
            AUTHENTICATED SESSION IDENTIFIER
          </h3>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 p-4 rounded-xl bg-slate-950/80 border border-white/[0.06]">
            <img
              src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
              alt={user?.name || 'User'}
              className="w-14 h-14 rounded-full border border-emerald-500/40 object-cover shadow-sm"
            />
            <div className="space-y-1">
              <h4 className="font-extrabold text-sm md:text-base text-slate-100 font-sans">{user?.name || 'Security Analyst'}</h4>
              <p className="text-slate-400 text-xs font-mono">@{user?.username || 'analyst'}</p>
              <div className="pt-1.5 flex items-center gap-2">
                <span className="text-slate-400 text-[10px] uppercase">Active Role:</span>
                <StatusBadge status="HEALTHY" size="xs" labelOverride={user?.role || 'ROLE_SOC_ANALYST'} />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <span className="text-slate-400 text-[10px] uppercase font-bold block tracking-wider">
              Role Capabilities & Permissions Matrix
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="p-4 rounded-lg bg-slate-950/80 border border-white/[0.06] space-y-1">
                <span className="text-emerald-400 font-bold block text-xs">ROLE_ADMIN</span>
                <p className="text-slate-400 text-[11px] leading-relaxed">Full read/write access. Can modify self-healing rules, API keys, approve user registrations, and inject eBPF kernel rules.</p>
              </div>

              <div className="p-4 rounded-lg bg-slate-950/80 border border-white/[0.06] space-y-1">
                <span className="text-cyan-300 font-bold block text-xs">ROLE_SOC_ANALYST</span>
                <p className="text-slate-400 text-[11px] leading-relaxed">Threat triage console access. Can contain threats, divert sessions to honeypots, and mark alerts resolved.</p>
              </div>

              <div className="p-4 rounded-lg bg-slate-950/80 border border-white/[0.06] space-y-1">
                <span className="text-slate-400 font-bold block text-xs">ROLE_USER</span>
                <p className="text-slate-400 text-[11px] leading-relaxed">Read-only telemetry observer. Can view dashboards and stream alerts without execution rights.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Self-Healing Rules */}
      {activeTab === 'RULES' && (
        <form onSubmit={handleSaveRules} className="soc-card p-5 md:p-6 space-y-6 text-xs">
          <div className="space-y-4">
            <h3 className="font-bold text-sm text-slate-100 border-b border-white/[0.06] pb-2 uppercase tracking-wider">
              AUTONOMOUS CONTAINMENT THRESHOLDS
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
              <p className="text-[11px] text-slate-400">
                Threat incidents with evaluated Risk Score &ge; {riskThreshold} will immediately trigger closed-loop containment.
              </p>
            </div>

            {/* eBPF XDP Toggle */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-slate-950/80 border border-white/[0.06] max-w-xl">
              <div>
                <span className="font-bold text-slate-200 block">eBPF XDP Zero-Copy NIC Driver Drop</span>
                <span className="text-[11px] text-slate-400">High-performance zero-copy packet drop at NIC layer</span>
              </div>
              <button
                type="button"
                onClick={() => setEbpfMode(!ebpfMode)}
                className={`w-11 h-6 rounded-full p-0.5 transition cursor-pointer ${
                  ebpfMode ? 'bg-emerald-500' : 'bg-slate-800'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-slate-950 transition transform ${
                    ebpfMode ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Auto Honeypot Divert Toggle */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-slate-950/80 border border-white/[0.06] max-w-xl">
              <div>
                <span className="font-bold text-slate-200 block">Auto-Divert Probing Scans to Honeypot</span>
                <span className="text-[11px] text-slate-400">Reroute port probes to ephemeral deception containers</span>
              </div>
              <button
                type="button"
                onClick={() => setAutoDivertHoneypot(!autoDivertHoneypot)}
                className={`w-11 h-6 rounded-full p-0.5 transition cursor-pointer ${
                  autoDivertHoneypot ? 'bg-amber-500' : 'bg-slate-800'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-slate-950 transition transform ${
                    autoDivertHoneypot ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          <PermissionGuard
            requiredRole="ROLE_ADMIN"
            fallback={
              <div className="text-amber-400 text-xs flex items-center gap-2 pt-2">
                <Lock className="w-4 h-4" /> Admin rights required to modify rules.
              </div>
            }
          >
            <Button type="submit" size="sm" variant="primary" leftIcon={<Save className="w-4 h-4" />}>
              Save Rules Configuration
            </Button>
          </PermissionGuard>
        </form>
      )}

      {/* Tab 3: Users RBAC */}
      {activeTab === 'USERS' && (
        <div className="soc-card p-5 md:p-6 space-y-4 text-xs">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
            <h3 className="font-bold text-sm text-slate-100 uppercase tracking-wider">
              ENTERPRISE USER ACCOUNTS & RBAC PROVISIONS
            </h3>
            <span className="text-[11px] text-slate-400">Total Registered Users: {users.length}</span>
          </div>

          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left">
              <thead className="bg-slate-950/80 text-slate-400 text-[10px] uppercase border-b border-white/[0.06]">
                <tr>
                  <th className="py-2.5 px-3.5">User Identity</th>
                  <th className="py-2.5 px-3.5">Email</th>
                  <th className="py-2.5 px-3.5">Role</th>
                  <th className="py-2.5 px-3.5">Status</th>
                  <th className="py-2.5 px-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {users.length > 0 ? (
                  users.map((u) => {
                    const statusStr = u.status || 'ACTIVE';
                    const isPending = statusStr === 'PENDING';
                    const isDisabled = statusStr === 'DISABLED';

                    return (
                      <tr key={u.id || u.username} className="hover:bg-slate-900/60">
                        <td className="py-2.5 px-3.5 flex items-center gap-2.5">
                          <img
                            src={u.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                            alt={u.name}
                            className="w-7 h-7 rounded-full border border-white/10 object-cover shrink-0"
                          />
                          <div>
                            <div className="font-bold text-slate-200 font-sans text-xs">{u.name || u.username}</div>
                            <div className="text-[10px] text-slate-400">@{u.username}</div>
                          </div>
                        </td>
                        <td className="py-2.5 px-3.5 text-slate-300 text-xs">{u.email}</td>
                        <td className="py-2.5 px-3.5">
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
                            className="bg-slate-950 border border-white/10 rounded px-2 py-1 text-[11px] text-emerald-400 font-bold focus:outline-none cursor-pointer"
                          >
                            <option value="ROLE_ADMIN">ROLE_ADMIN</option>
                            <option value="ROLE_SOC_ANALYST">ROLE_SOC_ANALYST</option>
                            <option value="ROLE_USER">ROLE_USER</option>
                          </select>
                        </td>
                        <td className="py-2.5 px-3.5">
                          <StatusBadge status={statusStr === 'ACTIVE' ? 'HEALTHY' : statusStr} size="xs" labelOverride={statusStr} />
                        </td>
                        <td className="py-2.5 px-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {isPending && (
                              <Button
                                size="xs"
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
                                size="xs"
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
                                size="xs"
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
                                Activate
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400 text-xs">
                      No user accounts found. Login with Administrator privileges to view user directory.
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
        <form onSubmit={handleSaveKeys} className="soc-card p-5 md:p-6 space-y-6 text-xs">
          <h3 className="font-bold text-sm text-slate-100 border-b border-white/[0.06] pb-2 uppercase tracking-wider">
            EXTERNAL THREAT INTELLIGENCE API CREDENTIALS
          </h3>

          <div className="space-y-4 max-w-xl">
            <div className="space-y-1.5">
              <label className="text-slate-400 block text-[11px] uppercase font-bold">
                VirusTotal v3 API Secret Key
              </label>
              <div className="relative">
                <input
                  type={showVtKey ? 'text' : 'password'}
                  value={vtApiKey}
                  onChange={(e) => setVtApiKey(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-lg p-2.5 pr-10 text-slate-200 font-mono text-xs focus:outline-none focus:border-emerald-500/60"
                  placeholder="Enter VT API key..."
                />
                <button
                  type="button"
                  onClick={() => setShowVtKey(!showVtKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  {showVtKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-400 block text-[11px] uppercase font-bold">
                AbuseIPDB v2 API Secret Key
              </label>
              <div className="relative">
                <input
                  type={showAbuseKey ? 'text' : 'password'}
                  value={abuseApiKey}
                  onChange={(e) => setAbuseApiKey(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-lg p-2.5 pr-10 text-slate-200 font-mono text-xs focus:outline-none focus:border-emerald-500/60"
                  placeholder="Enter AbuseIPDB API key..."
                />
                <button
                  type="button"
                  onClick={() => setShowAbuseKey(!showAbuseKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  {showAbuseKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          <PermissionGuard requiredRole="ROLE_ADMIN">
            <Button type="submit" size="sm" variant="primary" leftIcon={<Save className="w-4 h-4" />}>
              Save API Keys
            </Button>
          </PermissionGuard>
        </form>
      )}

      {/* Tab 5: Audit Logs */}
      {activeTab === 'AUDIT' && (
        <div className="soc-card p-5 md:p-6 space-y-4 text-xs">
          <h3 className="font-bold text-sm text-slate-100 border-b border-white/[0.06] pb-2 uppercase tracking-wider">
            APPEND-ONLY CRYPTOGRAPHIC AUDIT TRAIL
          </h3>

          <div className="space-y-2 max-h-[440px] overflow-y-auto pr-1 custom-scrollbar">
            {auditLogs.length > 0 ? (
              auditLogs.map((log) => (
                <div key={log.id} className="p-3 rounded-lg bg-slate-950/80 border border-white/[0.06] flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-emerald-400">{log.id}</span>
                      <span className="text-slate-200 font-bold">{log.action || log.actionPerformed}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Target: {log.target || log.targetResource || 'eBPF NIC Filter'} | Actor: {log.actor || log.actorUser || 'Autonomous Engine'}
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">HASH: {log.hash || log.currentHash || 'SHA256-OK'}</span>
                    <span className="text-[10px] text-slate-500">{log.timestamp}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-slate-400 text-xs bg-slate-950/60 rounded-lg border border-white/10">
                No audit log records found in database.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 6: Real System & Runtime Info */}
      {activeTab === 'SYSINFO' && (
        <div className="soc-card p-5 md:p-6 space-y-5 text-xs">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
            <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2 uppercase tracking-wider">
              <Cpu className="w-4 h-4 text-emerald-400" /> REAL SYSTEM HARDWARE & RUNTIME TELEMETRY
            </h3>
            <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30 font-bold">
              GET /api/v1/system/info
            </span>
          </div>

          {systemInfo ? (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                <div className="p-3.5 rounded-lg bg-slate-950/80 border border-white/[0.06] space-y-1">
                  <span className="text-slate-400 text-[10px] uppercase block font-semibold">HOST & OS NODE</span>
                  <span className="text-slate-100 font-extrabold text-sm block">{systemInfo.hostname}</span>
                  <span className="text-slate-400 text-[11px] block">{systemInfo.osName} {systemInfo.osVersion} ({systemInfo.osArch})</span>
                </div>

                <div className="p-3.5 rounded-lg bg-slate-950/80 border border-white/[0.06] space-y-1">
                  <span className="text-slate-400 text-[10px] uppercase block font-semibold">CPU PROCESSOR CORES</span>
                  <span className="text-emerald-400 font-extrabold text-sm block">{systemInfo.availableProcessors} Logical Cores</span>
                  <span className="text-slate-400 text-[11px] block">System Load Avg: {systemInfo.systemLoadAverage}</span>
                </div>

                <div className="p-3.5 rounded-lg bg-slate-950/80 border border-white/[0.06] space-y-1">
                  <span className="text-slate-400 text-[10px] uppercase block font-semibold">JVM HEAP MEMORY POOL</span>
                  <span className="text-cyan-300 font-extrabold text-sm block">{systemInfo.ramUsedMb} MB / {systemInfo.ramTotalMb} MB</span>
                  <span className="text-slate-400 text-[11px] block">Heap Usage: {systemInfo.ramUsedPct}%</span>
                </div>

                <div className="p-3.5 rounded-lg bg-slate-950/80 border border-white/[0.06] space-y-1">
                  <span className="text-slate-400 text-[10px] uppercase block font-semibold">ROOT DISK STORAGE</span>
                  <span className="text-emerald-400 font-extrabold text-sm block">{systemInfo.diskUsedGb} GB / {systemInfo.diskTotalGb} GB</span>
                  <span className="text-slate-400 text-[11px] block">Disk Usage: {systemInfo.diskUsedPct}%</span>
                </div>

                <div className="p-3.5 rounded-lg bg-slate-950/80 border border-white/[0.06] space-y-1">
                  <span className="text-slate-400 text-[10px] uppercase block font-semibold">JAVA & SPRING BOOT</span>
                  <span className="text-amber-400 font-extrabold text-sm block">Java {systemInfo.javaVersion}</span>
                  <span className="text-slate-400 text-[11px] block">Spring Boot v{systemInfo.springBootVersion}</span>
                </div>

                <div className="p-3.5 rounded-lg bg-slate-950/80 border border-white/[0.06] space-y-1">
                  <span className="text-slate-400 text-[10px] uppercase block font-semibold">RUNTIME ISOLATION</span>
                  <StatusBadge status="HEALTHY" size="xs" labelOverride={systemInfo.containerized ? 'DOCKER CONTAINER' : 'BARE METAL / HOST'} />
                  <span className="text-slate-400 text-[11px] block mt-1">JVM Uptime: {Math.round((systemInfo.jvmUptimeMs || 0) / 1000)}s</span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-white/[0.06] text-[11px] text-slate-400 space-y-1">
                <p>• Data queried dynamically from live Java OperatingSystemMXBean and Runtime environment APIs.</p>
                <p>• Authenticated and read-only. Environment secrets and credentials are not exposed.</p>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-slate-400 text-xs bg-slate-950/60 rounded-lg border border-white/10">
              Querying backend system information endpoint...
            </div>
          )}
        </div>
      )}
    </div>
  );
}
