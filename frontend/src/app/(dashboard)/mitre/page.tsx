'use client';

import React, { useEffect, useState } from 'react';
import { Grid3X3, Search, Filter, Layers, Activity, FileText } from 'lucide-react';
import { MITRE_TACTICS } from '@/data/mitreTactics';
import { MitreTechnique, Severity, Alert } from '@/types';
import { useAlertStore } from '@/store/useAlertStore';
import { apiService } from '@/services/api';
import { Modal } from '@/components/ui/Modal';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';

export default function MitrePage() {
  const { alerts, fetchAlerts } = useAlertStore();
  const [selectedTechnique, setSelectedTechnique] = useState<MitreTechnique | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<Severity | 'ALL'>('ALL');
  const [mitreMatrixStats, setMitreMatrixStats] = useState<Record<string, any>>({});

  useEffect(() => {
    fetchAlerts();

    // Fetch backend calculated MITRE stats if available
    apiService.getMitreMatrix()
      .then((data) => {
        if (Array.isArray(data)) {
          const statsMap: Record<string, any> = {};
          data.forEach((item) => {
            if (item.techniqueId) {
              statsMap[item.techniqueId] = item;
            }
          });
          setMitreMatrixStats(statsMap);
        }
      })
      .catch((err) => {
        console.warn('Could not fetch /api/v1/mitre/matrix, falling back to store alerts:', err);
      });
  }, [fetchAlerts]);

  // Compute dynamic activity counts & telemetry observations from real database alerts
  const computedTactics = MITRE_TACTICS.map((group) => ({
    ...group,
    techniques: group.techniques.map((tech) => {
      const matchingAlerts = alerts.filter(
        (a) => a.mitreId === tech.id || a.mitreTechnique?.toLowerCase() === tech.name.toLowerCase()
      );

      const serverStat = mitreMatrixStats[tech.id];
      const count = serverStat ? serverStat.eventCount : matchingAlerts.length;

      // Compute dynamic severity from observed real alerts
      let derivedSeverity: Severity | 'NOMINAL' = 'NOMINAL';
      let lastSeenStr = 'Never';
      let firstSeenStr = 'Never';

      if (serverStat && serverStat.eventCount > 0) {
        derivedSeverity = (serverStat.highestSeverity as Severity) || 'LOW';
        lastSeenStr = serverStat.lastSeen ? new Date(serverStat.lastSeen).toLocaleString() : 'Never';
        firstSeenStr = serverStat.firstSeen ? new Date(serverStat.firstSeen).toLocaleString() : 'Never';
      } else if (matchingAlerts.length > 0) {
        const hasCritical = matchingAlerts.some((a) => a.severity === 'CRITICAL');
        const hasHigh = matchingAlerts.some((a) => a.severity === 'HIGH');
        const hasMedium = matchingAlerts.some((a) => a.severity === 'MEDIUM');

        if (hasCritical) derivedSeverity = 'CRITICAL';
        else if (hasHigh) derivedSeverity = 'HIGH';
        else if (hasMedium) derivedSeverity = 'MEDIUM';
        else derivedSeverity = 'LOW';

        const timestamps = matchingAlerts
          .map((a) => new Date(a.timestamp).getTime())
          .filter((t) => !isNaN(t));

        if (timestamps.length > 0) {
          const maxTs = Math.max(...timestamps);
          const minTs = Math.min(...timestamps);
          lastSeenStr = new Date(maxTs).toLocaleString();
          firstSeenStr = new Date(minTs).toLocaleString();
        }
      }

      return {
        ...tech,
        count,
        severity: derivedSeverity,
        lastSeen: lastSeenStr,
        firstSeen: firstSeenStr,
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

      const matchesSeverity =
        selectedSeverity === 'ALL' ||
        tech.severity === selectedSeverity ||
        (selectedSeverity === 'LOW' && tech.severity === 'NOMINAL');

      return matchesSearch && matchesSeverity;
    })
  }));

  const totalCoveredTechniques = computedTactics.reduce(
    (acc, g) => acc + g.techniques.length,
    0
  );

  const totalObservedEvents = computedTactics.reduce(
    (acc, g) => acc + g.techniques.reduce((sum, t) => sum + t.count, 0),
    0
  );

  const activeTacticsCount = computedTactics.filter(
    (g) => g.techniques.some((t) => t.count > 0)
  ).length;

  const selectedTechniqueAlerts = selectedTechnique
    ? alerts.filter(
        (a) =>
          a.mitreId === selectedTechnique.id ||
          a.mitreTechnique?.toLowerCase() === selectedTechnique.name.toLowerCase()
      )
    : [];

  return (
    <div className="space-y-5 pb-8 font-mono">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl md:text-2xl font-extrabold text-slate-100 tracking-tight">
              MITRE ATT&CK MATRIX (v14.1 ALIGNED)
            </h1>
            <span className="px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-[10px] font-bold">
              STIX 2.1
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Enterprise Threat Tactics, Techniques & Procedures (TTP) Correlation Heatmap
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-300 bg-slate-950 px-3 py-1.5 rounded-lg border border-white/10">
          <Grid3X3 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span>STIX 2.1 Framework Telemetry Active</span>
        </div>
      </div>

      {/* Coverage Metrics Summary Grid (4 Columns) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
        <div className="soc-card p-4 flex flex-col justify-between">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold">
            COVERED TECHNIQUES
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl md:text-3xl font-extrabold font-mono text-emerald-400 tabular-nums">
              {totalCoveredTechniques}
            </span>
            <span className="text-slate-400 text-xs">Mapped TTPs</span>
          </div>
          <span className="text-[10px] text-slate-500 mt-2">TA0001 to TA0011 Coverage</span>
        </div>

        <div className="soc-card p-4 flex flex-col justify-between">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold">
            OBSERVED RAKSHASPHERE EVENTS
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl md:text-3xl font-extrabold font-mono text-cyan-300 tabular-nums">
              {totalObservedEvents}
            </span>
            <span className="text-slate-400 text-xs">Telemetry Hits</span>
          </div>
          <span className="text-[10px] text-slate-500 mt-2">Real Database Alert Telemetry</span>
        </div>

        <div className="soc-card p-4 flex flex-col justify-between">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold">
            ACTIVE OBSERVED TACTICS
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl md:text-3xl font-extrabold font-mono text-amber-400 tabular-nums">
              {activeTacticsCount}
            </span>
            <span className="text-slate-400 text-xs">/ {computedTactics.length} Tactics</span>
          </div>
          <span className="text-[10px] text-slate-500 mt-2">Tactics with Telemetry</span>
        </div>

        <div className="soc-card p-4 flex flex-col justify-between">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold">
            FRAMEWORK ALIGNMENT
          </span>
          <div className="mt-2">
            <StatusBadge status="HEALTHY" size="sm" labelOverride="v14.1 ALIGNED" />
          </div>
          <span className="text-[10px] text-slate-500 mt-2">Enterprise Matrix STIX 2.1</span>
        </div>
      </div>

      {/* Filter Controls & Legend */}
      <div className="soc-card p-4 space-y-3.5 text-xs">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Technique ID (e.g. T1110), name, or tactic..."
              className="w-full bg-slate-950 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/30 font-mono transition"
            />
          </div>

          {/* Severity Filter */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value as Severity | 'ALL')}
              className="bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-cyan-500/60 cursor-pointer font-mono"
            >
              <option value="ALL">Observed Severity: All</option>
              <option value="CRITICAL">Critical Severity</option>
              <option value="HIGH">High Severity</option>
              <option value="MEDIUM">Medium Severity</option>
              <option value="LOW">Low Severity</option>
            </select>
          </div>
        </div>

        {/* Heatmap Legend */}
        <div className="pt-2.5 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-2.5 text-[11px] text-slate-400">
          <span className="text-slate-300 font-bold uppercase text-[10px]">Heatmap Activity Legend:</span>
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-rose-500/30 border border-rose-500" /> Critical Ingress
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-500/30 border border-amber-500" /> High Ingress
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-cyan-500/30 border border-cyan-500" /> Medium/Low Alert
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-slate-900 border border-white/10" /> Nominal (0 Events)
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Matrix Grid Container (Horizontal Scroll with sticky headers) */}
      <div className="soc-card p-4 max-w-full overflow-x-auto custom-scrollbar">
        <div className="flex gap-3.5 min-w-[1150px]">
          {filteredTactics.map((group) => (
            <div key={group.tacticId} className="flex-1 min-w-[185px] space-y-2.5">
              {/* Tactic Group Column Header */}
              <div className="p-3 rounded-lg bg-slate-950 border border-white/10 text-center sticky top-0 z-10">
                <span className="text-[10px] text-cyan-400 font-bold block">{group.tacticId}</span>
                <span className="text-xs font-bold text-slate-100 truncate block mt-0.5">{group.name}</span>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  {group.techniques.length} Techniques
                </span>
              </div>

              {/* Technique Cards in Tactic */}
              <div className="space-y-2">
                {group.techniques.length > 0 ? (
                  group.techniques.map((tech) => {
                    const isCritical = tech.count > 0 && tech.severity === 'CRITICAL';
                    const isHigh = tech.count > 0 && tech.severity === 'HIGH';
                    const isMedium = tech.count > 0 && (tech.severity === 'MEDIUM' || tech.severity === 'LOW');

                    return (
                      <button
                        key={tech.id}
                        onClick={() => setSelectedTechnique(tech)}
                        className={`w-full text-left p-2.5 rounded-lg border transition-all text-xs cursor-pointer ${
                          isCritical
                            ? 'bg-rose-500/10 border-rose-500/40 text-rose-300 hover:bg-rose-500/20'
                            : isHigh
                            ? 'bg-amber-500/10 border-amber-500/40 text-amber-300 hover:bg-amber-500/20'
                            : isMedium
                            ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/20'
                            : 'bg-slate-950/60 border-white/[0.04] text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between font-bold">
                          <span className="text-emerald-400 text-[10px]">{tech.id}</span>
                          <span
                            className={`px-1.5 py-0.2 rounded font-bold text-[9px] tabular-nums ${
                              tech.count > 0
                                ? 'bg-slate-950 text-cyan-300 border border-cyan-500/30'
                                : 'bg-slate-950/80 text-slate-500 border border-white/[0.04]'
                            }`}
                          >
                            {tech.count}
                          </span>
                        </div>
                        <div className="font-semibold text-slate-200 mt-1 line-clamp-2 text-[11px]">
                          {tech.name}
                        </div>
                        {tech.count > 0 && (
                          <div className="text-[9px] text-slate-500 mt-1.5 truncate">
                            Last: {tech.lastSeen}
                          </div>
                        )}
                      </button>
                    );
                  })
                ) : (
                  <div className="p-2.5 text-center text-[10px] text-slate-500 bg-slate-950/40 rounded-lg border border-white/[0.04]">
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
            <div className="flex items-center gap-2.5">
              <span className="text-emerald-400">{selectedTechnique.id}:</span>
              <span>{selectedTechnique.name}</span>
            </div>
          ) : ''
        }
        subtitle={selectedTechnique ? `Tactic Category: ${selectedTechnique.tactic}` : ''}
        icon={<Layers className="w-5 h-5 text-cyan-400" />}
        size="lg"
        footer={
          <div className="w-full flex items-center justify-between text-[10px] text-slate-400">
            <span>STIX 2.1 Technique Standard</span>
            <Button size="xs" variant="secondary" onClick={() => setSelectedTechnique(null)}>
              Close
            </Button>
          </div>
        }
      >
        {selectedTechnique && (
          <div className="space-y-5 font-mono text-xs">
            {/* SECTION A: OFFICIAL MITRE ATT&CK METADATA */}
            <div className="space-y-3 border-b border-white/[0.06] pb-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase text-cyan-300 tracking-wider flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5" />
                  MITRE ATT&CK Framework Metadata
                </h3>
                <span className="text-[10px] bg-slate-950 border border-white/10 px-2 py-0.5 rounded text-slate-400">
                  Version 14.1
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="p-3 rounded-lg bg-slate-950 border border-white/[0.06]">
                  <span className="text-slate-500 text-[10px] block uppercase">TECHNIQUE ID & NAME</span>
                  <span className="text-slate-200 font-bold block mt-0.5">
                    {selectedTechnique.id} — {selectedTechnique.name}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-slate-950 border border-white/[0.06]">
                  <span className="text-slate-500 text-[10px] block uppercase">TACTIC GROUP</span>
                  <span className="text-cyan-300 font-bold block mt-0.5">
                    {selectedTechnique.tactic}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-slate-500 text-[10px] block uppercase">DESCRIPTION</span>
                <p className="text-slate-300 leading-relaxed bg-slate-950 p-3 rounded-lg border border-white/[0.06] text-[11px]">
                  {selectedTechnique.description}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-slate-500 text-[10px] block uppercase">AUTONOMOUS MITIGATION PLAYBOOK</span>
                <p className="text-emerald-300 leading-relaxed bg-emerald-500/10 p-3 rounded-lg border border-emerald-500/20 text-[11px]">
                  {selectedTechnique.mitigation}
                </p>
              </div>
            </div>

            {/* SECTION B: RAKSHASPHERE TELEMETRY OBSERVATIONS */}
            <div className="space-y-3.5">
              <h3 className="text-xs font-bold uppercase text-emerald-400 tracking-wider flex items-center gap-2">
                <Activity className="w-3.5 h-3.5" />
                RakshaSphere Telemetry Observations
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                <div className="p-3 rounded-lg bg-slate-950 border border-white/[0.06]">
                  <span className="text-slate-500 text-[10px] block uppercase">OBSERVED EVENTS</span>
                  <span className="font-extrabold text-slate-100 text-sm block mt-0.5 tabular-nums">
                    {selectedTechnique.count} Events
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-slate-950 border border-white/[0.06]">
                  <span className="text-slate-500 text-[10px] block uppercase">SEVERITY</span>
                  <div className="mt-1">
                    {selectedTechnique.severity && selectedTechnique.severity !== 'NOMINAL' ? (
                      <StatusBadge status={selectedTechnique.severity as Severity} size="xs" />
                    ) : (
                      <span className="text-[10px] text-slate-500 italic">No Active Alerts</span>
                    )}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-950 border border-white/[0.06] col-span-2 sm:col-span-1">
                  <span className="text-slate-500 text-[10px] block uppercase">LAST OBSERVED</span>
                  <span className="text-slate-300 text-[11px] font-bold block mt-1">
                    {selectedTechnique.lastSeen}
                  </span>
                </div>
              </div>

              {selectedTechnique.count === 0 ? (
                <div className="p-4 rounded-lg bg-slate-950/60 border border-white/[0.04] text-center space-y-1">
                  <span className="text-slate-300 text-xs font-semibold block">
                    No observed ATT&CK activity in active session.
                  </span>
                  <span className="text-slate-500 text-[10px] block">
                    RakshaSphere telemetry has not recorded any security alerts mapped to {selectedTechnique.id}.
                  </span>
                </div>
              ) : (
                <div className="space-y-2">
                  <span className="text-slate-400 text-[10px] block uppercase font-bold">
                    Matching Security Alerts ({selectedTechniqueAlerts.length})
                  </span>
                  <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                    {selectedTechniqueAlerts.map((alert: Alert) => (
                      <div
                        key={alert.id}
                        className="p-2.5 rounded-lg bg-slate-950 border border-white/[0.06] flex items-center justify-between text-[11px]"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-cyan-300 font-bold">{alert.id}</span>
                            <span className="text-slate-400">({alert.attackType})</span>
                          </div>
                          <div className="text-slate-500 text-[10px]">
                            {alert.sourceIp}:{alert.sourcePort} &rarr; {alert.destinationIp}:{alert.destinationPort}
                          </div>
                        </div>
                        <div className="text-right space-y-1">
                          <StatusBadge status={alert.severity} size="xs" />
                          <div className="text-[9px] text-slate-500">
                            {new Date(alert.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
