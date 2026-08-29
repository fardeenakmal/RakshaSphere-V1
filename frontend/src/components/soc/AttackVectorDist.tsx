'use client';

import React, { useState } from 'react';
import { Alert } from '@/types';
import { ShieldAlert, BarChart3, Network, ShieldCheck } from 'lucide-react';

interface AttackVectorDistProps {
  alerts: Alert[];
}

export const AttackVectorDist: React.FC<AttackVectorDistProps> = ({ alerts }) => {
  const [viewMode, setViewMode] = useState<'VECTORS' | 'PORTS' | 'SEVERITY'>('VECTORS');

  // Compute Attack Types Distribution
  const typeCounts: Record<string, number> = {};
  const portCounts: Record<string, number> = {};
  const severityCounts: Record<string, number> = {
    CRITICAL: 0,
    HIGH: 0,
    MEDIUM: 0,
    LOW: 0
  };

  alerts.forEach((alert) => {
    // Attack Types
    const type = alert.attackType || 'Unknown Vector';
    typeCounts[type] = (typeCounts[type] || 0) + 1;

    // Destination Ports
    const port = `Port ${alert.destinationPort || 'N/A'}`;
    portCounts[port] = (portCounts[port] || 0) + 1;

    // Severities
    if (alert.severity && severityCounts[alert.severity] !== undefined) {
      severityCounts[alert.severity] += 1;
    }
  });

  const total = alerts.length;

  const sortedTypes = Object.entries(typeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const sortedPorts = Object.entries(portCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="soc-card flex flex-col h-full min-h-[380px]">
      {/* Card Header with View Switcher — wraps on narrow columns */}
      <div className="soc-card-header flex-wrap gap-y-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-xs md:text-sm text-slate-100 font-mono tracking-wide truncate">
              ATTACK VECTOR DIST.
            </h3>
            <p className="text-[10px] text-slate-400 font-mono truncate">
              Authentic Alert Ingress Analytics
            </p>
          </div>
        </div>

        {/* View Toggle Tabs */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-white/10 text-[10px] font-mono shrink-0">
          <button
            onClick={() => setViewMode('VECTORS')}
            className={`px-2 py-0.5 rounded transition ${
              viewMode === 'VECTORS'
                ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Vectors
          </button>
          <button
            onClick={() => setViewMode('PORTS')}
            className={`px-2 py-0.5 rounded transition ${
              viewMode === 'PORTS'
                ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Ports
          </button>
          <button
            onClick={() => setViewMode('SEVERITY')}
            className={`px-2 py-0.5 rounded transition ${
              viewMode === 'SEVERITY'
                ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Severity
          </button>
        </div>
      </div>

      {/* Body Content */}
      <div className="soc-card-body flex-1 flex flex-col justify-center font-mono">
        {total === 0 ? (
          <div className="py-8 text-center space-y-2">
            <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto" />
            <h4 className="font-bold text-xs text-slate-200 uppercase">
              NO OBSERVED ATTACK TELEMETRY
            </h4>
            <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
              Zero active intrusion vectors logged in current session. Real-time kernel eBPF stream standing by.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {viewMode === 'VECTORS' &&
              sortedTypes.map(([type, count]) => {
                const pct = Math.round((count / total) * 100);
                return (
                  <div key={type} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-200 font-semibold truncate max-w-[200px]">
                        {type}
                      </span>
                      <span className="text-slate-400 text-[11px] tabular-nums">
                        {count} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-white/[0.04]">
                      <div
                        className="bg-emerald-400 h-full transition-all duration-300"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}

            {viewMode === 'PORTS' &&
              sortedPorts.map(([port, count]) => {
                const pct = Math.round((count / total) * 100);
                return (
                  <div key={port} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-cyan-300 font-semibold">{port}</span>
                      <span className="text-slate-400 text-[11px] tabular-nums">
                        {count} events ({pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-white/[0.04]">
                      <div
                        className="bg-cyan-400 h-full transition-all duration-300"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}

            {viewMode === 'SEVERITY' && (
              <div className="space-y-3">
                {[
                  { key: 'CRITICAL', label: 'Critical Severity', count: severityCounts.CRITICAL, color: 'bg-rose-500', text: 'text-rose-400' },
                  { key: 'HIGH', label: 'High Severity', count: severityCounts.HIGH, color: 'bg-amber-500', text: 'text-amber-400' },
                  { key: 'MEDIUM', label: 'Medium Severity', count: severityCounts.MEDIUM, color: 'bg-yellow-500', text: 'text-yellow-400' },
                  { key: 'LOW', label: 'Low Severity', count: severityCounts.LOW, color: 'bg-sky-500', text: 'text-sky-400' },
                ].map((item) => {
                  const pct = total > 0 ? Math.round((item.count / total) * 100) : 0;
                  return (
                    <div key={item.key} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className={`font-semibold ${item.text}`}>{item.label}</span>
                        <span className="text-slate-400 text-[11px] tabular-nums">
                          {item.count} ({pct}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-white/[0.04]">
                        <div
                          className={`${item.color} h-full transition-all duration-300`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Card Footer */}
      <div className="px-4 py-2.5 border-t border-white/[0.06] flex items-center justify-between text-[10px] font-mono text-slate-400">
        <span>Total Evaluated Ingress: <strong className="text-slate-200 tabular-nums">{total}</strong></span>
        <span>Real Telemetry Data</span>
      </div>
    </div>
  );
};
