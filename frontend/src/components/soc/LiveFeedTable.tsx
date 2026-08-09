'use client';

import React from 'react';
import { Alert } from '@/types';
import { ShieldAlert, ShieldCheck, Zap, Bug, ExternalLink, Radio } from 'lucide-react';

interface LiveFeedTableProps {
  alerts: Alert[];
  onSelectAlert: (alert: Alert) => void;
}

export const LiveFeedTable: React.FC<LiveFeedTableProps> = ({ alerts, onSelectAlert }) => {
  return (
    <div className="rounded-2xl bg-white/[0.02] backdrop-blur-md border border-white/10 overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.2)]">
      <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-emerald-400" />
          <h3 className="font-bold text-sm text-slate-100 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]">STOMP WEBSOCKET LIVE ALERT STREAM</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>LIVE</span>
          </span>
          <span className="text-[11px] font-mono text-slate-400 bg-white/5 px-2.5 py-1 rounded-full border border-white/10">
            Top {Math.min(5, alerts.length)} Feeds
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        {alerts.length === 0 ? (
          <div className="p-12 text-center font-mono space-y-3 bg-transparent">
            <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mb-1 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
              <Radio className="w-8 h-8 animate-pulse" />
              <span className="absolute inset-0 rounded-full border border-emerald-400/40 animate-ping" />
            </div>
            <h4 className="font-extrabold text-sm text-slate-200 tracking-wider">NO ACTIVE THREATS DETECTED</h4>
            <p className="text-xs text-emerald-400/90 font-semibold flex items-center justify-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>Monitoring WebSocket stream (ws://localhost:8080/ws-soc)...</span>
            </p>
            <p className="text-[10px] text-slate-500 max-w-sm mx-auto">
              Closed-loop eBPF NIC sniffer active. Inbound anomalous packets will trigger real-time alert triage.
            </p>
          </div>
        ) : (
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-white/5 text-slate-300 border-b border-white/10 uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4">Alert ID & Time</th>
                <th className="py-3 px-4">Source IP & Port</th>
                <th className="py-3 px-4">Attack Vector</th>
                <th className="py-3 px-4">MITRE Tactic</th>
                <th className="py-3 px-4 text-center">Risk Score</th>
                <th className="py-3 px-4">Status & Remediation</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {alerts.slice(0, 5).map((alert) => {
                const isCritical = alert.severity === 'CRITICAL';
                const isHigh = alert.severity === 'HIGH';

                return (
                  <tr
                    key={alert.id}
                    onClick={() => onSelectAlert(alert)}
                    className="hover:bg-white/5 cursor-pointer transition-all duration-300 group hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]"
                  >
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-bold text-emerald-400">{alert.id}</div>
                      <div className="text-[10px] text-slate-500">
                        {new Date(alert.timestamp).toLocaleTimeString()}
                      </div>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="text-slate-200 font-semibold">{alert.sourceIp}</div>
                      <div className="text-[10px] text-slate-500">Port {alert.sourcePort} → {alert.destinationPort}</div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="text-slate-200 font-medium">{alert.attackType}</div>
                      <span
                        className={`inline-block mt-0.5 px-1.5 py-0.5 text-[9px] font-bold rounded ${
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

                    <td className="py-3 px-4 whitespace-nowrap text-slate-300">
                      <div className="text-slate-300">{alert.mitreTactic}</div>
                      <div className="text-[10px] text-slate-500">{alert.mitreId} ({alert.mitreTechnique})</div>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-lg font-bold font-mono text-xs ${
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

                    <td className="py-3 px-4 whitespace-nowrap">
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
                          <Zap className="w-3.5 h-3.5" /> ACTIVE THREAT
                        </span>
                      )}
                      {alert.status === 'RESOLVED' && (
                        <span className="inline-flex items-center gap-1 text-slate-400 font-bold bg-slate-800 px-2 py-0.5 rounded border border-slate-700 text-[11px]">
                          RESOLVED
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectAlert(alert);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center gap-1 ml-auto text-[11px]"
                      >
                        <span>Triage</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
