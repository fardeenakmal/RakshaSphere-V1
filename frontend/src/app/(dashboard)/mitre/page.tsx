'use client';

import React, { useEffect, useState } from 'react';
import { Grid3X3, Search, Filter, Layers, ShieldAlert } from 'lucide-react';
import { MITRE_TACTICS } from '@/data/mockMitre';
import { MitreTechnique, Severity } from '@/types';
import { useAlertStore } from '@/store/useAlertStore';
import { Modal } from '@/components/ui/Modal';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';

export default function MitrePage() {
  const { alerts, fetchAlerts } = useAlertStore();
  const [selectedTechnique, setSelectedTechnique] = useState<MitreTechnique | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<Severity | 'ALL'>('ALL');

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

      return {
        ...tech,
        count: matchCount
      };
    })
  }));

  // Filter tactics and techniques
  const filteredTactics = computedTactics.map((group) => ({
    ...group,
    techniques: group.techniques.filter((tech) => {
      const matchesSearch =
        searchQuery === '' ||
        tech.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tech.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tech.tactic.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesSeverity = selectedSeverity === 'ALL' || tech.severity === selectedSeverity;

      return matchesSearch && matchesSeverity;
    })
  }));

  const totalCoveredTechniques = computedTactics.reduce(
    (acc, g) => acc + g.techniques.length,
    0
  );

  const totalDetectedIncidents = computedTactics.reduce(
    (acc, g) => acc + g.techniques.reduce((sum, t) => sum + t.count, 0),
    0
  );

  const highRiskTacticsCount = computedTactics.filter(
    (g) => g.techniques.some((t) => t.severity === 'CRITICAL' || t.severity === 'HIGH')
  ).length;

  return (
    <div className="space-y-6 pb-8">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-slate-100 flex items-center gap-2 tracking-tight">
            MITRE ATT&CK MATRIX (v14.1 ALIGNED)
          </h1>
          <p className="text-xs font-mono text-slate-400 mt-1">
            Enterprise Threat Tactics, Techniques & Procedures (TTP) Correlation Heatmap
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs text-slate-300 bg-slate-900 px-3.5 py-2 rounded-xl border border-slate-800">
          <Grid3X3 className="w-4 h-4 text-cyan-400" />
          <span>STIX 2.1 Correlation Active</span>
        </div>
      </div>

      {/* Coverage Metrics Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="soc-card p-4 flex flex-col justify-between">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold">
            COVERED TECHNIQUES
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold font-mono text-emerald-400 tabular-nums">
              {totalCoveredTechniques}
            </span>
            <span className="text-slate-400 text-xs font-mono">Mapped TTPs</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono mt-2">TA0001 to TA0040 Coverage</span>
        </div>

        <div className="soc-card p-4 flex flex-col justify-between">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold">
            TOTAL DETECTED INCIDENTS
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold font-mono text-red-400 tabular-nums">
              {totalDetectedIncidents}
            </span>
            <span className="text-slate-400 text-xs font-mono">TTP Hits</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono mt-2">Real Telemetry Correlation</span>
        </div>

        <div className="soc-card p-4 flex flex-col justify-between">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold">
            HIGH-RISK TACTIC GROUPS
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold font-mono text-amber-400 tabular-nums">
              {highRiskTacticsCount}
            </span>
            <span className="text-slate-400 text-xs font-mono">/ {computedTactics.length} Tactics</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono mt-2">Critical Exposure Vectors</span>
        </div>

        <div className="soc-card p-4 flex flex-col justify-between">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold">
            FRAMEWORK VERSION
          </span>
          <div className="mt-2 flex items-center gap-2">
            <StatusBadge status="HEALTHY" size="sm" labelOverride="v14.1 ALIGNED" />
          </div>
          <span className="text-[10px] text-slate-400 font-mono mt-2">Enterprise Matrix STIX 2.1</span>
        </div>
      </div>

      {/* Filter Bar Controls & Legend */}
      <div className="soc-card p-4 space-y-4 font-mono text-xs">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Technique ID (e.g. T1110), Name, or Tactic..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 font-mono"
            />
          </div>

          {/* Severity Filter */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value as Severity | 'ALL')}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-cyan-500/50 cursor-pointer font-mono"
            >
              <option value="ALL">Severity: All</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>
        </div>

        {/* Legend Row */}
        <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-400">
          <span className="text-slate-300 font-bold">Threat Heatmap Intensity Index:</span>
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-red-500/30 border border-red-500" /> Critical (100+ Hits)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-amber-500/30 border border-amber-500" /> High (50-99 Hits)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-cyan-500/30 border border-cyan-500" /> Medium (20-49 Hits)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-slate-900 border border-slate-800" /> Low / Nominal
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Matrix Grid Container (Scrollable within bounds) */}
      <div className="soc-card p-4 max-w-full overflow-x-auto custom-scrollbar">
        <div className="flex gap-4 min-w-[1100px]">
          {filteredTactics.map((group) => (
            <div key={group.tacticId} className="flex-1 min-w-[180px] space-y-3 font-mono">

              {/* Tactic Group Column Header */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-center">
                <span className="text-[10px] text-cyan-400 font-bold block">{group.tacticId}</span>
                <span className="text-xs font-extrabold text-slate-100 truncate block mt-0.5">{group.name}</span>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  {group.techniques.length} Techniques
                </span>
              </div>

              {/* Techniques Cards in Tactic */}
              <div className="space-y-2">
                {group.techniques.length > 0 ? (
                  group.techniques.map((tech) => {
                    const isCritical = tech.severity === 'CRITICAL' || tech.count >= 100;
                    const isHigh = tech.severity === 'HIGH' || (tech.count >= 50 && tech.count < 100);
                    const isMedium = tech.severity === 'MEDIUM' || (tech.count >= 20 && tech.count < 50);

                    return (
                      <button
                        key={tech.id}
                        onClick={() => setSelectedTechnique(tech)}
                        className={`w-full text-left p-3 rounded-xl border transition-all text-xs ${
                          isCritical
                            ? 'bg-red-500/10 border-red-500/40 text-red-300 hover:bg-red-500/20'
                            : isHigh
                            ? 'bg-amber-500/10 border-amber-500/40 text-amber-300 hover:bg-amber-500/20'
                            : isMedium
                            ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/20'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between font-bold">
                          <span className="text-emerald-400 text-[10px] font-mono">{tech.id}</span>
                          <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-slate-950 text-slate-300 font-mono tabular-nums">
                            {tech.count}
                          </span>
                        </div>
                        <div className="font-semibold text-slate-200 mt-1 line-clamp-2">{tech.name}</div>
                      </button>
                    );
                  })
                ) : (
                  <div className="p-3 text-center text-[10px] text-slate-600 bg-slate-950/50 rounded-xl border border-slate-900">
                    No matching TTPs
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Technique Detail Modal Drawer */}
      <Modal
        isOpen={!!selectedTechnique}
        onClose={() => setSelectedTechnique(null)}
        title={
          selectedTechnique ? (
            <div className="flex items-center gap-3">
              <span className="text-emerald-400 font-mono">{selectedTechnique.id}:</span>
              <span>{selectedTechnique.name}</span>
            </div>
          ) : ''
        }
        subtitle={selectedTechnique ? `Tactic Group: ${selectedTechnique.tactic}` : ''}
        icon={<Layers className="w-5 h-5 text-cyan-400" />}
        size="md"
        footer={
          <div className="w-full flex items-center justify-between">
            <span className="text-[10px] font-mono text-slate-400">STIX 2.1 Technique Standard</span>
            <Button size="sm" variant="secondary" onClick={() => setSelectedTechnique(null)}>
              Close
            </Button>
          </div>
        }
      >
        {selectedTechnique && (
          <div className="space-y-4 font-mono text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 text-[10px] block">SEVERITY RATING</span>
                <StatusBadge status={selectedTechnique.severity} size="sm" className="mt-1" />
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 text-[10px] block">INCIDENT COUNT</span>
                <span className="font-extrabold text-red-400 text-sm block mt-0.5 tabular-nums">
                  {selectedTechnique.count} Incidents Tagged
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-slate-400 text-[10px] block">DESCRIPTION & ATTACK PATTERN</span>
              <p className="text-slate-300 leading-relaxed bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-[11px]">
                {selectedTechnique.description}
              </p>
            </div>

            <div className="space-y-1.5">
              <span className="text-slate-400 text-[10px] block">AUTONOMOUS MITIGATION PLAYBOOK</span>
              <p className="text-emerald-400 leading-relaxed bg-emerald-500/10 p-3.5 rounded-xl border border-emerald-500/30 text-[11px]">
                {selectedTechnique.mitigation}
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

