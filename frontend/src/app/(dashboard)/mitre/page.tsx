'use client';

import React, { useEffect, useState } from 'react';
import { Grid3X3, Search, Filter, Layers, ShieldAlert, Clock, Activity, AlertTriangle, FileText } from 'lucide-react';
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

  // Compute dynamic activity counts & telemetry observations from database alerts
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

  // Selected technique matching alerts for detail modal
  const selectedTechniqueAlerts = selectedTechnique
    ? alerts.filter(
        (a) =>
          a.mitreId === selectedTechnique.id ||
          a.mitreTechnique?.toLowerCase() === selectedTechnique.name.toLowerCase()
      )
    : [];

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
          <span>STIX 2.1 Telemetry Active</span>
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
          <span className="text-[10px] text-slate-400 font-mono mt-2">TA0001 to TA0011 Coverage</span>
        </div>

        <div className="soc-card p-4 flex flex-col justify-between">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold">
            OBSERVED RAKSHASPHERE EVENTS
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold font-mono text-cyan-400 tabular-nums">
              {totalObservedEvents}
            </span>
            <span className="text-slate-400 text-xs font-mono">Telemetry Hits</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono mt-2">Real Database Alert Telemetry</span>
        </div>

        <div className="soc-card p-4 flex flex-col justify-between">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold">
            OBSERVED ACTIVE TACTICS
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold font-mono text-amber-400 tabular-nums">
              {activeTacticsCount}
            </span>
            <span className="text-slate-400 text-xs font-mono">/ {computedTactics.length} Tactics</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono mt-2">Tactics with Telemetry</span>
        </div>

        <div className="soc-card p-4 flex flex-col justify-between">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold">
            FRAMEWORK ALIGNMENT
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
              <option value="ALL">Observed Severity: All</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>
        </div>

        {/* Legend Row */}
        <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-400">
          <span className="text-slate-300 font-bold">Observed Telemetry Status:</span>
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-red-500/30 border border-red-500" /> Critical Severity Alert
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-amber-500/30 border border-amber-500" /> High Severity Alert
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-cyan-500/30 border border-cyan-500" /> Medium / Low Alert
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-slate-900 border border-slate-800" /> Unobserved (0 Events)
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Matrix Grid Container */}
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
                    const isCritical = tech.count > 0 && tech.severity === 'CRITICAL';
                    const isHigh = tech.count > 0 && tech.severity === 'HIGH';
                    const isMedium = tech.count > 0 && (tech.severity === 'MEDIUM' || tech.severity === 'LOW');
                    const isUnobserved = tech.count === 0;

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
                            : 'bg-slate-900/60 border-slate-800/80 text-slate-400 hover:bg-slate-800/80 hover:text-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between font-bold">
                          <span className="text-emerald-400 text-[10px] font-mono">{tech.id}</span>
                          <span
                            className={`px-1.5 py-0.5 text-[9px] font-bold rounded font-mono tabular-nums ${
                              tech.count > 0
                                ? 'bg-slate-950 text-cyan-400 border border-cyan-500/30'
                                : 'bg-slate-950/80 text-slate-500 border border-slate-800'
                            }`}
                          >
                            {tech.count}
                          </span>
                        </div>
                        <div className="font-semibold text-slate-200 mt-1 line-clamp-2">{tech.name}</div>
                        {tech.count > 0 && (
                          <div className="text-[9px] text-slate-400 mt-1.5 truncate">
                            Last: {tech.lastSeen}
                          </div>
                        )}
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
        size="lg"
        footer={
          <div className="w-full flex items-center justify-between font-mono text-[10px] text-slate-400">
            <span>STIX 2.1 Technique Standard</span>
            <Button size="sm" variant="secondary" onClick={() => setSelectedTechnique(null)}>
              Close
            </Button>
          </div>
        }
      >
        {selectedTechnique && (
          <div className="space-y-6 font-mono text-xs">

            {/* SECTION A: OFFICIAL MITRE ATT&CK METADATA */}
            <div className="space-y-3 border-b border-slate-800 pb-5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-extrabold uppercase text-cyan-400 tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  MITRE ATT&CK Framework Metadata
                </h3>
                <span className="text-[10px] bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-slate-400">
                  Version 14.1
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-500 text-[10px] block">TECHNIQUE ID & NAME</span>
                  <span className="text-slate-200 font-bold block mt-0.5">
                    {selectedTechnique.id} — {selectedTechnique.name}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-500 text-[10px] block">TACTIC CATEGORY</span>
                  <span className="text-cyan-400 font-bold block mt-0.5">
                    {selectedTechnique.tactic}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-slate-500 text-[10px] block">DESCRIPTION & ATTACK PATTERN</span>
                <p className="text-slate-300 leading-relaxed bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-[11px]">
                  {selectedTechnique.description}
                </p>
              </div>

              <div className="space-y-1.5">
                <span className="text-slate-500 text-[10px] block">AUTONOMOUS MITIGATION PLAYBOOK</span>
                <p className="text-emerald-400 leading-relaxed bg-emerald-500/10 p-3.5 rounded-xl border border-emerald-500/30 text-[11px]">
                  {selectedTechnique.mitigation}
                </p>
              </div>
            </div>

            {/* SECTION B: RAKSHASPHERE TELEMETRY OBSERVATIONS */}
            <div className="space-y-4">
              <h3 className="text-xs font-extrabold uppercase text-emerald-400 tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4" />
                RakshaSphere Telemetry Observations
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-500 text-[10px] block">OBSERVED EVENT COUNT</span>
                  <span className="font-extrabold text-slate-100 text-sm block mt-0.5 tabular-nums">
                    {selectedTechnique.count} RakshaSphere Events
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-500 text-[10px] block">OBSERVED SEVERITY</span>
                  <div className="mt-1">
                    {selectedTechnique.severity && selectedTechnique.severity !== 'NOMINAL' ? (
                      <StatusBadge status={selectedTechnique.severity as Severity} size="sm" />
                    ) : (
                      <span className="text-[10px] text-slate-500 italic">No Active Alerts</span>
                    )}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 col-span-2 sm:col-span-1">
                  <span className="text-slate-500 text-[10px] block">LAST OBSERVED</span>
                  <span className="text-slate-300 text-[11px] font-bold block mt-1">
                    {selectedTechnique.lastSeen}
                  </span>
                </div>
              </div>

              {selectedTechnique.count === 0 ? (
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 text-center space-y-1">
                  <span className="text-slate-400 text-xs font-semibold block">
                    No observed ATT&CK activity yet.
                  </span>
                  <span className="text-slate-500 text-[10px] block">
                    RakshaSphere telemetry has not recorded any security alerts mapped to {selectedTechnique.id}.
                  </span>
                </div>
              ) : (
                <div className="space-y-2">
                  <span className="text-slate-400 text-[10px] block uppercase font-bold">
                    Matching RakshaSphere Security Alerts ({selectedTechniqueAlerts.length})
                  </span>
                  <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                    {selectedTechniqueAlerts.map((alert: Alert) => (
                      <div
                        key={alert.id}
                        className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-[11px]"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-cyan-400 font-bold">{alert.id}</span>
                            <span className="text-slate-400">({alert.attackType})</span>
                          </div>
                          <div className="text-slate-500 text-[10px]">
                            Source: {alert.sourceIp} &rarr; Target: {alert.destinationIp}:{alert.destinationPort}
                          </div>
                        </div>
                        <div className="text-right space-y-1">
                          <StatusBadge status={alert.severity} size="sm" />
                          <div className="text-[9px] text-slate-500">
                            {new Date(alert.timestamp).toLocaleString()}
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
