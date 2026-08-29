'use client';

import React, { useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Search,
  Filter,
  Download,
  Zap,
  Bug,
  ExternalLink,
  RotateCcw
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import Papa from 'papaparse';
import { useAlertStore } from '@/store/useAlertStore';
import { AlertDetailModal } from '@/components/alerts/AlertDetailModal';
import { Severity, AlertStatus } from '@/types';
import { PermissionGuard } from '@/components/common/PermissionGuard';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { EmptyState } from '@/components/ui/EmptyState';

export default function AlertsPage() {
  const {
    alerts,
    searchQuery,
    setSearchQuery,
    selectedSeverity,
    setSeverityFilter,
    selectedStatus,
    setStatusFilter,
    selectedAlert,
    setSelectedAlert,
    containAlert,
    divertToHoneypot,
    fetchAlerts
  } = useAlertStore();

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  // Filter alerts based on search and selected filters
  const filteredAlerts = alerts.filter((alert) => {
    const matchesSearch =
      searchQuery === '' ||
      alert.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.sourceIp.includes(searchQuery) ||
      alert.attackType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.mitreTactic.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (alert.mitreId && alert.mitreId.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesSeverity = selectedSeverity === 'ALL' || alert.severity === selectedSeverity;
    const matchesStatus = selectedStatus === 'ALL' || alert.status === selectedStatus;

    return matchesSearch && matchesSeverity && matchesStatus;
  });

  const exportToCSV = () => {
    const csvData = filteredAlerts.map(alert => ({
      ID: alert.id,
      Timestamp: alert.timestamp,
      Source_IP: alert.sourceIp,
      Source_Port: alert.sourcePort,
      Dest_IP: alert.destinationIp,
      Dest_Port: alert.destinationPort,
      Attack_Type: alert.attackType,
      Severity: alert.severity,
      Risk_Score: alert.riskScore,
      MITRE_Tactic: alert.mitreTactic,
      MITRE_ID: alert.mitreId,
      Status: alert.status
    }));
    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'rakshasphere_alerts.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text('RakshaSphere - Threat Triage Report', 14, 15);
    const tableColumn = ["ID", "Time", "Attacker IP", "Attack Type", "Severity", "Risk", "Status"];
    const tableRows = filteredAlerts.map(alert => [
      alert.id,
      new Date(alert.timestamp).toLocaleString(),
      alert.sourceIp,
      alert.attackType,
      alert.severity,
      alert.riskScore.toString(),
      alert.status
    ]);

    (doc as any).autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 20,
    });
    doc.save('rakshasphere_alerts.pdf');
  };

  return (
    <div className="space-y-5 pb-8 font-mono">
      {/* Title & Export Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl md:text-2xl font-extrabold text-slate-100 tracking-tight">
              INCIDENT TRIAGE WORKSPACE
            </h1>
            <span className="px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[10px] font-bold">
              STREAM QUEUE
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-Time Intrusion Feed, Risk Scoring & Closed-Loop Autonomous Containment
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-300 bg-slate-950 px-3 py-1.5 rounded-lg border border-white/10">
            <ShieldAlert className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Matched: <strong className="text-white tabular-nums">{filteredAlerts.length}</strong></span>
          </div>
          <Button size="sm" variant="outline" leftIcon={<Download className="w-3.5 h-3.5" />} onClick={exportToCSV}>
            CSV
          </Button>
          <Button size="sm" variant="outline" leftIcon={<Download className="w-3.5 h-3.5" />} onClick={exportToPDF}>
            PDF
          </Button>
        </div>
      </div>

      {/* Filter Bar Controls */}
      <div className="soc-card p-4 space-y-3 text-xs">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Search Field */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search IP, attack vector, ID, or MITRE TTP..."
              className="w-full bg-slate-950 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 font-mono transition"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <select
              value={selectedSeverity}
              onChange={(e) => setSeverityFilter(e.target.value as Severity | 'ALL')}
              className="bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-emerald-500/60 cursor-pointer font-mono"
            >
              <option value="ALL">Severity: All</option>
              <option value="CRITICAL">Critical Severity</option>
              <option value="HIGH">High Severity</option>
              <option value="MEDIUM">Medium Severity</option>
              <option value="LOW">Low Severity</option>
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setStatusFilter(e.target.value as AlertStatus | 'ALL')}
              className="bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-emerald-500/60 cursor-pointer font-mono"
            >
              <option value="ALL">Status: All</option>
              <option value="ACTIVE">Active Threats</option>
              <option value="CONTAINED">Contained (eBPF)</option>
              <option value="HONEYPOT_DIVERTED">Honeypot Trapped</option>
              <option value="RESOLVED">Resolved</option>
            </select>

            {(searchQuery || selectedSeverity !== 'ALL' || selectedStatus !== 'ALL') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSeverityFilter('ALL');
                  setStatusFilter('ALL');
                }}
                className="px-2.5 py-2 rounded-lg bg-slate-900 border border-white/10 text-slate-400 hover:text-slate-200 text-xs transition cursor-pointer"
                title="Reset all filters"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Alerts Triage View */}
      <div className="soc-card overflow-hidden shadow-xl">
        {/* Desktop Table View (>= 768px) */}
        <div className="hidden md:block overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950/90 text-slate-400 border-b border-white/[0.06] uppercase text-[10px] tracking-wider font-semibold sticky top-0 z-10">
              <tr>
                <th className="py-3 px-3.5">ID & Time</th>
                <th className="py-3 px-3.5">Attacker IP</th>
                <th className="py-3 px-3.5">Vector & Severity</th>
                <th className="py-3 px-3.5">MITRE Mapping</th>
                <th className="py-3 px-3.5 text-center">Risk</th>
                <th className="py-3 px-3.5">Status</th>
                <th className="py-3 px-3.5 text-right">Autonomous Controls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filteredAlerts.length > 0 ? (
                filteredAlerts.map((alert) => (
                  <tr
                    key={alert.id}
                    onClick={() => setSelectedAlert(alert)}
                    className="hover:bg-slate-900/60 cursor-pointer transition-colors duration-100 group"
                  >
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <div className="font-bold text-emerald-400">{alert.id}</div>
                      <div className="text-[10px] text-slate-400">
                        {new Date(alert.timestamp).toLocaleTimeString()}
                      </div>
                    </td>

                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <div className="text-slate-100 font-bold">{alert.sourceIp}</div>
                      <div className="text-[10px] text-slate-400">Port {alert.sourcePort} &rarr; {alert.destinationPort}</div>
                    </td>

                    <td className="py-3 px-3.5">
                      <div className="text-slate-100 font-medium truncate max-w-[160px]">{alert.attackType}</div>
                      <StatusBadge status={alert.severity} size="xs" showIcon={false} className="mt-1" />
                    </td>

                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <div className="text-cyan-300 font-semibold">{alert.mitreTactic}</div>
                      <div className="text-[10px] text-slate-400">{alert.mitreId} ({alert.mitreTechnique})</div>
                    </td>

                    <td className="py-3 px-3.5 text-center whitespace-nowrap">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded font-bold tabular-nums border text-xs ${
                          alert.riskScore >= 80
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                            : alert.riskScore >= 60
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        }`}
                      >
                        {alert.riskScore}/100
                      </span>
                    </td>

                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <StatusBadge status={alert.status} size="xs" />
                    </td>

                    <td className="py-3 px-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <PermissionGuard allowedRoles={['ROLE_ADMIN', 'ROLE_SOC_ANALYST']}>
                          {alert.status === 'ACTIVE' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                containAlert(alert.id);
                              }}
                              className="px-2 py-1 rounded bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                              title="Inject eBPF Kernel Drop Rule"
                            >
                              <Zap className="w-3 h-3" /> Drop
                            </button>
                          )}

                          {alert.status === 'ACTIVE' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                divertToHoneypot(alert.id);
                              }}
                              className="px-2 py-1 rounded bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                              title="Divert to Honeypot Sandbox"
                            >
                              <Bug className="w-3 h-3" /> Trap
                            </button>
                          )}
                        </PermissionGuard>

                        <Button
                          size="xs"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedAlert(alert);
                          }}
                        >
                          Details
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12">
                    <EmptyState
                      title="NO ACTIVE THREATS MATCHED"
                      description="No security alerts currently match your query or active filter criteria."
                      action={
                        <button
                          onClick={() => {
                            setSearchQuery('');
                            setSeverityFilter('ALL');
                            setStatusFilter('ALL');
                          }}
                          className="text-xs font-mono text-emerald-400 hover:underline font-bold cursor-pointer"
                        >
                          Reset Active Filters
                        </button>
                      }
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View (< 768px) */}
        <div className="md:hidden divide-y divide-white/[0.04]">
          {filteredAlerts.length > 0 ? (
            filteredAlerts.map((alert) => (
              <div
                key={alert.id}
                onClick={() => setSelectedAlert(alert)}
                className="p-4 space-y-2.5 hover:bg-slate-900/60 cursor-pointer transition"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-400 text-xs">{alert.id}</span>
                  <StatusBadge status={alert.severity} size="xs" />
                </div>

                <div className="flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-100 font-bold block">{alert.sourceIp}</span>
                    <span className="text-[10px] text-slate-400">Port {alert.sourcePort} &rarr; {alert.destinationPort}</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded font-bold text-xs tabular-nums border ${
                      alert.riskScore >= 80
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                        : alert.riskScore >= 60
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    }`}
                  >
                    Risk: {alert.riskScore}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] pt-1">
                  <span className="text-cyan-300 font-semibold truncate max-w-[180px]">{alert.attackType}</span>
                  <StatusBadge status={alert.status} size="xs" />
                </div>

                <div className="pt-2 border-t border-white/[0.04] flex items-center justify-end gap-2">
                  <PermissionGuard allowedRoles={['ROLE_ADMIN', 'ROLE_SOC_ANALYST']}>
                    {alert.status === 'ACTIVE' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          containAlert(alert.id);
                        }}
                        className="px-2 py-1 rounded bg-rose-500/15 text-rose-300 border border-rose-500/30 text-[10px] font-bold"
                      >
                        eBPF Drop
                      </button>
                    )}
                  </PermissionGuard>

                  <Button size="xs" variant="secondary" onClick={() => setSelectedAlert(alert)}>
                    Dossier
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="py-10">
              <EmptyState
                title="NO ACTIVE THREATS"
                description="No security incidents match the selected filter."
              />
            </div>
          )}
        </div>
      </div>

      {/* Alert Detail Modal Popup */}
      <AlertDetailModal alert={selectedAlert} onClose={() => setSelectedAlert(null)} />
    </div>
  );
}
