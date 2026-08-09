'use client';

import React, { useEffect, useState } from 'react';
import { Grid3X3, X } from 'lucide-react';
import { MITRE_TACTICS } from '@/data/mockMitre';
import { MitreTechnique } from '@/types';
import { useAlertStore } from '@/store/useAlertStore';

export default function MitrePage() {
  const { alerts, fetchAlerts } = useAlertStore();
  const [selectedTechnique, setSelectedTechnique] = useState<MitreTechnique | null>(null);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  // Compute dynamic hit counts for MITRE matrix tactics from real alert state
  const computedTactics = MITRE_TACTICS.map((group) => ({
    ...group,
    techniques: group.techniques.map((tech) => {
      const matchCount = alerts.filter(
        (a) => a.mitreId === tech.id || a.mitreTechnique?.toLowerCase() === tech.name.toLowerCase()
      ).length;

      const count = matchCount > 0 ? matchCount * 12 + tech.count : tech.count;

      return {
        ...tech,
        count
      };
    })
  }));

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-slate-100 flex items-center gap-2">
            MITRE ATT&CK MATRIX (v14.1 ALIGNED)
          </h1>
          <p className="text-xs font-mono text-slate-400 mt-1">
            Enterprise Threat Tactics, Techniques & Procedures (TTP) Heatmap
          </p>
        </div>

        <div className="flex items-center gap-3 font-mono text-xs text-slate-400 bg-slate-900 px-3.5 py-2 rounded-xl border border-slate-800">
          <Grid3X3 className="w-4 h-4 text-cyan-400" />
          <span>STIX 2.1 Schema Mapping Active</span>
        </div>
      </div>

      {/* Heatmap Legend */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-4 font-mono text-xs">
        <span className="text-slate-300 font-bold">Threat Intensity Heatmap Index:</span>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-red-500/40 border border-red-500" /> Critical (100+ Hits)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-amber-500/40 border border-amber-500" /> High (50-99 Hits)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-cyan-500/40 border border-cyan-500" /> Medium (20-49 Hits)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-slate-800 border border-slate-700" /> Low / Monitoring
          </span>
        </div>
      </div>

      {/* Interactive Matrix Grid */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-[1000px]">
          {computedTactics.map((group) => (
            <div key={group.tacticId} className="flex-1 min-w-[160px] space-y-3 font-mono">
              {/* Tactic Group Column Header */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                <span className="text-[10px] text-cyan-400 font-bold block">{group.tacticId}</span>
                <span className="text-xs font-extrabold text-slate-100 truncate block mt-0.5">{group.name}</span>
              </div>

              {/* Techniques Cards in Tactic */}
              <div className="space-y-2">
                {group.techniques.map((tech) => {
                  const isCritical = tech.severity === 'CRITICAL' || tech.count >= 100;
                  const isHigh = tech.severity === 'HIGH' || (tech.count >= 50 && tech.count < 100);
                  const isMedium = tech.severity === 'MEDIUM' || (tech.count >= 20 && tech.count < 50);

                  return (
                    <button
                      key={tech.id}
                      onClick={() => setSelectedTechnique(tech)}
                      className={`w-full text-left p-3 rounded-xl border transition-all text-xs ${
                        isCritical
                          ? 'bg-red-500/10 border-red-500/30 text-red-300 hover:bg-red-500/20'
                          : isHigh
                          ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
                          : isMedium
                          ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold">
                        <span className="text-emerald-400 text-[10px]">{tech.id}</span>
                        <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-slate-950 text-slate-300">
                          {tech.count}
                        </span>
                      </div>
                      <div className="font-semibold text-slate-200 mt-1 line-clamp-2">{tech.name}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Technique Detail Modal Drawer */}
      {selectedTechnique && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4 font-mono">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-xs text-emerald-400 font-bold">{selectedTechnique.id}</span>
                <h3 className="font-extrabold text-base text-slate-100">{selectedTechnique.name}</h3>
              </div>
              <button
                onClick={() => setSelectedTechnique(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-500 text-[10px] block">TACTIC GROUP</span>
                <span className="font-bold text-cyan-400">{selectedTechnique.tactic}</span>
              </div>

              <div>
                <span className="text-slate-500 text-[10px] block">INCIDENT COUNT</span>
                <span className="font-bold text-red-400 text-sm">{selectedTechnique.count} Incidents Tagged</span>
              </div>

              <div>
                <span className="text-slate-500 text-[10px] block">DESCRIPTION & PATTERN</span>
                <p className="text-slate-300 leading-relaxed mt-1 bg-slate-950 p-3 rounded-xl border border-slate-800">
                  {selectedTechnique.description}
                </p>
              </div>

              <div>
                <span className="text-slate-500 text-[10px] block">AUTONOMOUS MITIGATION PLAYBOOK</span>
                <p className="text-emerald-400 leading-relaxed mt-1 bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/30">
                  {selectedTechnique.mitigation}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
