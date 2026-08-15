'use client';

import React from 'react';
import { Radar } from 'lucide-react';
import { Alert } from '@/types';

interface ThreatRadarProps {
  alerts: Alert[];
}

export const ThreatRadar: React.FC<ThreatRadarProps> = ({ alerts }) => {
  const activeTargets = alerts.slice(0, 6).map((alert, index) => {
    const angle = (index * 60 + 30) * (Math.PI / 180);
    const radius = 35 + (index % 3) * 20;
    const x = 50 + radius * Math.cos(angle) * 0.42;
    const y = 50 + radius * Math.sin(angle) * 0.42;
    
    return {
      id: alert.id,
      ip: alert.sourceIp,
      type: alert.attackType,
      severity: alert.severity,
      x,
      y
    };
  });

  return (
    <div className="soc-card flex flex-col justify-between h-full">
      {/* Header */}
      <div className="soc-card-header">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <Radar className="w-4 h-4 animate-spin" style={{ animationDuration: '10s' }} />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-slate-100 font-mono tracking-wide">
              REAL-TIME THREAT VECTOR RADAR
            </h3>
            <p className="text-[10px] text-slate-400 font-mono">Directional Attack Ingress & Telemetry</p>
          </div>
        </div>
        <span className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" /> SCANNING
        </span>
      </div>

      {/* Canvas Radar Container */}
      <div className="soc-card-body flex-1 flex flex-col items-center justify-center">
        <div className="relative w-full aspect-square max-h-[260px] mx-auto flex items-center justify-center border border-slate-800 rounded-full bg-slate-950/80 shadow-inner">
          {/* Concentric Circles */}
          <div className="absolute w-[80%] h-[80%] rounded-full border border-emerald-500/20" />
          <div className="absolute w-[60%] h-[60%] rounded-full border border-emerald-500/15" />
          <div className="absolute w-[40%] h-[40%] rounded-full border border-emerald-500/10" />
          <div className="absolute w-[20%] h-[20%] rounded-full border border-emerald-500/10" />

          {/* Crosshair Lines */}
          <div className="absolute w-full h-[1px] bg-emerald-500/20" />
          <div className="absolute h-full w-[1px] bg-emerald-500/20" />

          {/* Rotating Sweep Beam */}
          <div
            className="absolute inset-0 rounded-full bg-gradient-to-tr from-emerald-500/20 via-transparent to-transparent opacity-60 animate-spin origin-center pointer-events-none"
            style={{ animationDuration: '6s' }}
          />

          {/* Center Marker */}
          <div className="absolute w-3.5 h-3.5 rounded-full bg-emerald-500/30 border border-emerald-400 flex items-center justify-center">
            <div className="w-1 h-1 rounded-full bg-emerald-400" />
          </div>

          {/* Target Blips */}
          {activeTargets.map((target) => (
            <div
              key={target.id}
              className="absolute group cursor-pointer"
              style={{ left: `${target.x}%`, top: `${target.y}%` }}
            >
              <div
                className={`w-3.5 h-3.5 rounded-full border shadow-lg flex items-center justify-center transition transform group-hover:scale-150 ${
                  target.severity === 'CRITICAL'
                    ? 'bg-red-500/40 border-red-500 text-red-400 animate-bounce'
                    : target.severity === 'HIGH'
                    ? 'bg-amber-500/40 border-amber-500 text-amber-400'
                    : 'bg-cyan-500/40 border-cyan-500 text-cyan-400'
                }`}
              >
                <div
                  className={`w-1.5 h-1.5 rounded-full ${
                    target.severity === 'CRITICAL'
                      ? 'bg-red-400'
                      : target.severity === 'HIGH'
                      ? 'bg-amber-400'
                      : 'bg-cyan-400'
                  }`}
                />
              </div>

              {/* Hover Tooltip */}
              <div className="absolute left-5 bottom-0 hidden group-hover:block z-50 bg-slate-900 border border-slate-700 rounded-lg p-2 shadow-2xl text-[10px] font-mono whitespace-nowrap text-slate-200">
                <p className="font-bold text-emerald-400">{target.ip}</p>
                <p className="text-slate-300">{target.type}</p>
                <p className="text-slate-400">Severity: {target.severity}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="w-full mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[10px] font-mono text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500" /> Critical Ingress
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" /> High Ingress
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-500" /> Probe Scan
          </span>
        </div>
      </div>
    </div>
  );
};

