'use client';

import React from 'react';
import { Alert } from '@/types';
import { ShieldAlert, ExternalLink, Radio, ShieldCheck, Zap, Bug } from 'lucide-react';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { PermissionGuard } from '@/components/common/PermissionGuard';
import { useAlertStore } from '@/store/useAlertStore';

interface LiveFeedTableProps {
  alerts: Alert[];
  onSelectAlert: (alert: Alert) => void;
}

export const LiveFeedTable: React.FC<LiveFeedTableProps> = ({ alerts, onSelectAlert }) => {
  const { containAlert, divertToHoneypot } = useAlertStore();

  return (
    <div className="soc-card flex flex-col h-full min-h-[380px]">
      {/* Header */}
      <div className="soc-card-header">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 shrink-0">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-xs md:text-sm text-slate-100 font-mono tracking-wide truncate">
              LIVE STOMP THREAT STREAM
            </h3>
            <p className="text-[10px] text-slate-400 font-mono truncate">
              Real-time Closed-Loop Telemetry &amp; Containment Queue
            </p>
          </div>
        </div>

        <span className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>STREAM ACTIVE</span>
        </span>
      </div>

      {/* Table Content Area */}
      <div className="flex-1 overflow-auto custom-scrollbar" aria-live="polite">
        {alerts.length === 0 ? (
          <div className="p-10 text-center font-mono space-y-3 flex flex-col items-center justify-center h-full">
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Radio className="w-6 h-6 animate-pulse" />
            </div>
            <h4 className="font-bold text-xs text-slate-200 uppercase tracking-wider">
              NO ACTIVE THREATS DETECTED
            </h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
              Closed-loop eBPF kernel sniffer active. Inbound anomalous packets will trigger real-time alert triage.
            </p>
          </div>
        ) : (
          <table className="w-full text-left text-xs font-mono min-w-[640px]">
            <thead className="bg-slate-950/90 text-slate-400 border-b border-white/[0.06] uppercase text-[10px] tracking-wider font-semibold sticky top-0 z-10">
              <tr>
                <th className="py-2.5 px-3 whitespace-nowrap">ID &amp; Time</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Attacker IP</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Vector</th>
                <th className="py-2.5 px-3 whitespace-nowrap hidden lg:table-cell">MITRE TTP</th>
                <th className="py-2.5 px-3 text-center whitespace-nowrap">Risk</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Status</th>
                <th className="py-2.5 px-3 text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {alerts.slice(0, 6).map((alert) => (
                <tr
                  key={alert.id}
                  onClick={() => onSelectAlert(alert)}
                  className="hover:bg-slate-900/60 cursor-pointer transition-colors duration-100 group"
                >
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <div className="font-bold text-emerald-400 text-[11px] truncate max-w-[120px]">{alert.id}</div>
                    <div className="text-[10px] text-slate-400 tabular-nums">
                      {new Date(alert.timestamp).toLocaleTimeString()}
                    </div>
                  </td>

                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <div className="text-slate-100 font-bold text-[11px]">{alert.sourceIp}</div>
                    <div className="text-[10px] text-slate-400 tabular-nums">
                      :{alert.sourcePort} → :{alert.destinationPort}
                    </div>
                  </td>

                  <td className="py-2.5 px-3">
                    <div className="text-slate-200 font-medium truncate max-w-[130px] text-[11px]">
                      {alert.attackType}
                    </div>
                    <StatusBadge status={alert.severity} size="xs" showIcon={false} className="mt-1" />
                  </td>

                  <td className="py-2.5 px-3 whitespace-nowrap hidden lg:table-cell">
                    <div className="text-cyan-300 font-semibold text-[11px]">{alert.mitreTactic}</div>
                    <div className="text-[10px] text-slate-400">{alert.mitreId}</div>
                  </td>

                  <td className="py-2.5 px-3 text-center whitespace-nowrap">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold tabular-nums border ${
                        alert.riskScore >= 80
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                          : alert.riskScore >= 60
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      }`}
                    >
                      {alert.riskScore}
                    </span>
                  </td>

                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <StatusBadge status={alert.status} size="xs" />
                  </td>

                  <td className="py-2.5 px-3 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1">
                      <PermissionGuard allowedRoles={['ROLE_ADMIN', 'ROLE_SOC_ANALYST']}>
                        {alert.status === 'ACTIVE' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              containAlert(alert.id);
                            }}
                            className="px-1.5 py-1 rounded bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-[10px] font-bold transition flex items-center gap-0.5 cursor-pointer"
                            title="Inject eBPF Kernel Drop Rule"
                          >
                            <Zap className="w-3 h-3" />
                          </button>
                        )}

                        {alert.status === 'ACTIVE' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              divertToHoneypot(alert.id);
                            }}
                            className="px-1.5 py-1 rounded bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-[10px] font-bold transition flex items-center gap-0.5 cursor-pointer"
                            title="Divert to Honeypot Sandbox"
                          >
                            <Bug className="w-3 h-3" />
                          </button>
                        )}
                      </PermissionGuard>

                      <Button
                        size="xs"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectAlert(alert);
                        }}
                        rightIcon={<ExternalLink className="w-3 h-3" />}
                      >
                        Details
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
