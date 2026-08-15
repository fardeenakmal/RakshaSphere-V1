'use client';

import React from 'react';
import { Alert } from '@/types';
import { ShieldAlert, ExternalLink, Radio } from 'lucide-react';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';

interface LiveFeedTableProps {
  alerts: Alert[];
  onSelectAlert: (alert: Alert) => void;
}

export const LiveFeedTable: React.FC<LiveFeedTableProps> = ({ alerts, onSelectAlert }) => {
  return (
    <div className="soc-card flex flex-col h-full min-h-[400px]">
      {/* Header */}
      <div className="soc-card-header">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-slate-100 font-mono tracking-wide">
              STOMP WEBSOCKET LIVE ALERT STREAM
            </h3>
            <p className="text-[10px] text-slate-400 font-mono">Real-time Intrusion Ingress & Triage Queue</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>LIVE STREAM</span>
          </span>
        </div>
      </div>

      {/* Table Content Area */}
      <div className="flex-1 overflow-x-auto">
        {alerts.length === 0 ? (
          <div className="p-12 text-center font-mono space-y-3 flex flex-col items-center justify-center h-full">
            <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mb-1 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
              <Radio className="w-8 h-8 animate-pulse" />
              <span className="absolute inset-0 rounded-2xl border border-emerald-400/40 animate-ping" />
            </div>
            <h4 className="font-extrabold text-sm text-slate-200 tracking-wider">NO ACTIVE THREATS DETECTED</h4>
            <p className="text-xs text-emerald-400 font-semibold flex items-center justify-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>Monitoring live alert stream...</span>
            </p>
            <p className="text-[11px] text-slate-400 max-w-md mx-auto leading-relaxed">
              Closed-loop eBPF NIC sniffer active. Inbound anomalous packets will trigger real-time alert triage.
            </p>
          </div>
        ) : (
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Alert ID & Time</th>
                <th className="py-3 px-4">Attacker IP</th>
                <th className="py-3 px-4">Vector & Severity</th>
                <th className="py-3 px-4">MITRE Mapping</th>
                <th className="py-3 px-4 text-center">Risk</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {alerts.slice(0, 6).map((alert) => (
                <tr
                  key={alert.id}
                  onClick={() => onSelectAlert(alert)}
                  className="hover:bg-slate-800/50 cursor-pointer transition-all duration-150 group"
                >
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="font-bold text-emerald-400">{alert.id}</div>
                    <div className="text-[10px] text-slate-400">
                      {new Date(alert.timestamp).toLocaleTimeString()}
                    </div>
                  </td>

                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="text-slate-200 font-bold">{alert.sourceIp}</div>
                    <div className="text-[10px] text-slate-400">Port {alert.sourcePort} → {alert.destinationPort}</div>
                  </td>

                  <td className="py-3 px-4">
                    <div className="text-slate-100 font-medium">{alert.attackType}</div>
                    <StatusBadge status={alert.severity} size="sm" showIcon={false} className="mt-1" />
                  </td>

                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="text-cyan-400 font-semibold">{alert.mitreTactic}</div>
                    <div className="text-[10px] text-slate-400">{alert.mitreId} ({alert.mitreTechnique})</div>
                  </td>

                  <td className="py-3 px-4 text-center whitespace-nowrap">
                    <span
                      className={`inline-block px-2 py-0.5 rounded font-bold font-mono text-xs ${
                        alert.riskScore >= 80
                          ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                          : alert.riskScore >= 60
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      }`}
                    >
                      {alert.riskScore}
                    </span>
                  </td>

                  <td className="py-3 px-4 whitespace-nowrap">
                    <StatusBadge status={alert.status} size="sm" />
                  </td>

                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectAlert(alert);
                      }}
                      rightIcon={<ExternalLink className="w-3 h-3" />}
                    >
                      Triage
                    </Button>
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

