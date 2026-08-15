'use client';

import React, { useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Search,
  Filter,
  Download
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-slate-100 flex items-center gap-2 tracking-tight">
            THREAT TRIAGE & INCIDENT FEED
          </h1>
          <p className="text-xs font-mono text-slate-400 mt-1">
            Real-Time Intrusion Stream, Risk Scoring & Closed-Loop Containment Workspace
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 font-mono text-xs text-slate-300 bg-slate-900 px-3.5 py-2 rounded-xl border border-slate-800">
            <ShieldAlert className="w-4 h-4 text-emerald-400" />
            <span>Incidents: <strong className="text-white">{filteredAlerts.length}</strong></span>
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
      <div className="soc-card p-4 space-y-3 font-mono text-xs">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Search Field */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search IP, Attack Type, ID, or MITRE Tactic..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 transition font-mono"
            />
          </div>

          {/* Severity Dropdown */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={selectedSeverity}
              onChange={(e) => setSeverityFilter(e.target.value as Severity | 'ALL')}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-emerald-500/50 cursor-pointer font-mono"
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
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-emerald-500/50 cursor-pointer font-mono"
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

      {/* Main Alerts Triage View: Table on Desktop (md:table), Cards on Mobile */}
      <div className="soc-card overflow-hidden shadow-2xl">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950/90 text-slate-400 border-b border-slate-800 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Alert ID & Time</th>
                <th className="py-3.5 px-4">Attacker IP</th>
                <th className="py-3.5 px-4">Vector & Severity</th>
                <th className="py-3.5 px-4">MITRE Mapping</th>
                <th className="py-3.5 px-4 text-center">Risk Score</th>
                <th className="py-3.5 px-4">Current Status</th>
                <th className="py-3.5 px-4 text-right">Autonomous Controls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {filteredAlerts.length > 0 ? (
                filteredAlerts.map((alert) => (
                  <tr
                    key={alert.id}
                    onClick={() => setSelectedAlert(alert)}
                    className="hover:bg-slate-800/60 cursor-pointer transition-all duration-150"
                  >
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-bold text-emerald-400">{alert.id}</div>
                      <div className="text-[10px] text-slate-400">
                        {new Date(alert.timestamp).toLocaleTimeString()}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="text-slate-200 font-bold">{alert.sourceIp}</div>
                      <div className="text-[10px] text-slate-400">Port {alert.sourcePort} → {alert.destinationPort}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="text-slate-100 font-medium">{alert.attackType}</div>
                      <StatusBadge status={alert.severity} size="sm" showIcon={false} className="mt-1" />
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="text-cyan-400 font-semibold">{alert.mitreTactic}</div>
                      <div className="text-[10px] text-slate-400">{alert.mitreId} ({alert.mitreTechnique})</div>
                    </td>

                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-lg font-bold tabular-nums ${
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
                      <StatusBadge status={alert.status} size="sm" />
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <PermissionGuard allowedRoles={['ROLE_ADMIN', 'ROLE_SOC_ANALYST']}>
                          {alert.status === 'ACTIVE' && (
                            <Button
                              size="sm"
                              variant="success"
                              onClick={(e) => {
                                e.stopPropagation();
                                containAlert(alert.id);
                              }}
                              title="Inject eBPF Drop Rule"
                            >
                              eBPF Drop
                            </Button>
                          )}

                          {alert.status === 'ACTIVE' && (
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={(e) => {
                                e.stopPropagation();
                                divertToHoneypot(alert.id);
                              }}
                              title="Divert to Honeypot Trap"
                            >
                              Honeypot
                            </Button>
                          )}
                        </PermissionGuard>

                        <Button
                          size="sm"
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
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-mono">
                    <div className="space-y-2 max-w-sm mx-auto">
                      <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto" />
                      <span className="font-bold text-slate-200 block text-xs">NO ACTIVE THREATS MATCHED</span>
                      <span className="text-xs text-slate-400 block">No security alerts currently match your query or filter criteria.</span>
                      <button
                        onClick={() => {
                          setSearchQuery('');
                          setSeverityFilter('ALL');
                          setStatusFilter('ALL');
                        }}
                        className="text-xs font-mono text-emerald-400 hover:underline pt-1 cursor-pointer font-bold inline-block"
                      >
                        Reset Active Filters
                      </button>

                    </div>
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

