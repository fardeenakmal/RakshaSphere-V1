'use client';

import React, { useEffect } from 'react';
import {
  ShieldAlert,
  Search,
  Filter,
  ShieldCheck,
  Zap,
  Bug,
  Download
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import Papa from 'papaparse';
import { useAlertStore } from '@/store/useAlertStore';
import { AlertDetailModal } from '@/components/alerts/AlertDetailModal';
import { Severity, AlertStatus } from '@/types';
import { PermissionGuard } from '@/components/common/PermissionGuard';

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
      alert.mitreTactic.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSeverity = selectedSeverity === 'ALL' || alert.severity === selectedSeverity;
    const matchesStatus = selectedStatus === 'ALL' || alert.status === selectedStatus;

    return matchesSearch && matchesSeverity && matchesStatus;
  });

  const exportToCSV = () => {
    const csvData = filteredAlerts.map(alert => ({
      ID: alert.id,
      Timestamp: alert.timestamp,
      Source_IP: alert.sourceIp,
      Dest_IP: alert.destinationIp,
      Attack_Type: alert.attackType,
      Severity: alert.severity,
      Risk_Score: alert.riskScore,
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
    doc.text('RakshaSphere - Threat Alerts Report', 14, 15);
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
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-slate-100 flex items-center gap-2">
            THREAT TRIAGE & INCIDENT FEED
          </h1>
          <p className="text-xs font-mono text-slate-400 mt-1">
            Real-Time Intrusion Stream, Risk Scoring & Self-Healing Containment
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 font-mono text-xs text-slate-400 bg-slate-900 px-3.5 py-2 rounded-xl border border-slate-800">
            <ShieldAlert className="w-4 h-4 text-emerald-400" />
            <span>Total Incidents: {filteredAlerts.length}</span>
          </div>
          <button onClick={exportToCSV} className="flex items-center gap-1.5 font-mono text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 px-3.5 py-2 rounded-xl border border-slate-700 transition" title="Export to CSV">
            <Download className="w-4 h-4" /> CSV
          </button>
          <button onClick={exportToPDF} className="flex items-center gap-1.5 font-mono text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 px-3.5 py-2 rounded-xl border border-slate-700 transition" title="Export to PDF">
            <Download className="w-4 h-4" /> PDF
          </button>
        </div>
      </div>

      {/* Filter Bar Controls */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 font-mono text-xs">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Search Field */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by IP, Attack Name, ID, or MITRE Tactic..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 transition"
            />
          </div>

          {/* Severity Dropdown */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={selectedSeverity}
              onChange={(e) => setSeverityFilter(e.target.value as Severity | 'ALL')}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-500/50"
            >
              <option value="ALL">Severity: All</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>

            {/* Status Dropdown */}
            <select
              value={selectedStatus}
              onChange={(e) => setStatusFilter(e.target.value as AlertStatus | 'ALL')}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-500/50"
            >
              <option value="ALL">Status: All</option>
              <option value="ACTIVE">Active Threats</option>
              <option value="CONTAINED">Contained (eBPF)</option>
              <option value="HONEYPOT_DIVERTED">Honeypot Trapped</option>
              <option value="RESOLVED">Resolved</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Alerts Triage Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Alert ID & Time</th>
                <th className="py-3.5 px-4">Attacker IP</th>
                <th className="py-3.5 px-4">Vector & Severity</th>
                <th className="py-3.5 px-4">MITRE Mapping</th>
                <th className="py-3.5 px-4 text-center">Risk Score</th>
                <th className="py-3.5 px-4">Current Status</th>
                <th className="py-3.5 px-4 text-right">Self-Healing Controls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {filteredAlerts.length > 0 ? (
                filteredAlerts.map((alert) => {
                  const isCritical = alert.severity === 'CRITICAL';
                  const isHigh = alert.severity === 'HIGH';

                  return (
                    <tr
                      key={alert.id}
                      onClick={() => setSelectedAlert(alert)}
                      className="hover:bg-slate-800/60 cursor-pointer transition-all duration-150"
                    >
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-bold text-emerald-400">{alert.id}</div>
                        <div className="text-[10px] text-slate-500">
                          {new Date(alert.timestamp).toLocaleTimeString()}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="text-slate-200 font-bold">{alert.sourceIp}</div>
                        <div className="text-[10px] text-slate-500">Port {alert.sourcePort} → {alert.destinationPort}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="text-slate-100 font-medium">{alert.attackType}</div>
                        <span
                          className={`inline-block mt-1 px-1.5 py-0.5 text-[9px] font-bold rounded ${
                            isCritical
                              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                              : isHigh
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                          }`}
                        >
                          {alert.severity}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="text-cyan-400 font-semibold">{alert.mitreTactic}</div>
                        <div className="text-[10px] text-slate-500">{alert.mitreId} ({alert.mitreTechnique})</div>
                      </td>

                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-lg font-bold ${
                            alert.riskScore >= 80
                              ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                              : alert.riskScore >= 60
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                              : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          }`}
                        >
                          {alert.riskScore}/100
                        </span>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {alert.status === 'CONTAINED' && (
                          <span className="inline-flex items-center gap-1 text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30 text-[11px]">
                            <ShieldCheck className="w-3.5 h-3.5" /> CONTAINED
                          </span>
                        )}
                        {alert.status === 'HONEYPOT_DIVERTED' && (
                          <span className="inline-flex items-center gap-1 text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30 text-[11px]">
                            <Bug className="w-3.5 h-3.5" /> HONEYPOT
                          </span>
                        )}
                        {alert.status === 'ACTIVE' && (
                          <span className="inline-flex items-center gap-1 text-red-400 font-bold bg-red-500/10 px-2 py-0.5 rounded border border-red-500/30 text-[11px] animate-pulse">
                            <Zap className="w-3.5 h-3.5" /> ACTIVE
                          </span>
                        )}
                        {alert.status === 'RESOLVED' && (
                          <span className="inline-flex items-center gap-1 text-slate-400 font-bold bg-slate-800 px-2 py-0.5 rounded border border-slate-700 text-[11px]">
                            RESOLVED
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <PermissionGuard allowedRoles={['ROLE_ADMIN', 'ROLE_SOC_ANALYST']}>
                            {alert.status === 'ACTIVE' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  containAlert(alert.id);
                                }}
                                className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition text-[10px]"
                                title="Inject eBPF Drop Rule"
                              >
                                eBPF Drop
                              </button>
                            )}

                            {alert.status === 'ACTIVE' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  divertToHoneypot(alert.id);
                                }}
                                className="px-2 py-1 rounded bg-amber-600 hover:bg-amber-500 text-white font-bold transition text-[10px]"
                                title="Divert to Honeypot Trap"
                              >
                                Honeypot
                              </button>
                            )}
                          </PermissionGuard>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedAlert(alert);
                            }}
                            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition text-[10px]"
                          >
                            Details
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No matching threat alerts found for the current query/filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Alert Detail Modal Popup */}
      <AlertDetailModal alert={selectedAlert} onClose={() => setSelectedAlert(null)} />
    </div>
  );
}
