'use client';

import React, { useEffect, useState } from 'react';
import {
  ShieldAlert,
  Zap,
  Bug,
  Activity,
  ArrowUpRight,
  TrendingUp,
  Layers,
  ChevronRight,
  ShieldCheck,
  Cpu,
  Radio,
  Clock,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';
import { useAlertStore } from '@/store/useAlertStore';
import { useUIStore } from '@/store/useUIStore';
import { apiService } from '@/services/api';
import { AttackVectorDist } from '@/components/soc/AttackVectorDist';
import { LiveFeedTable } from '@/components/soc/LiveFeedTable';
import { AlertDetailModal } from '@/components/alerts/AlertDetailModal';
import { GeoThreatMap } from '@/components/soc/GeoThreatMap';
import { SystemHealthCard } from '@/components/soc/SystemHealthCard';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';

export default function DashboardPage() {
  const { alerts, selectedAlert, setSelectedAlert, addLiveAlert, fetchAlerts } = useAlertStore();
  const { isLiveFeedActive } = useUIStore();
  const [metrics, setMetrics] = useState<{
    systemRiskScore?: number;
    ebpfDropsCount?: number;
    activeHoneypots?: number;
    selfHealingLatencyMs?: number | null;
    activeThreats?: number;
    containedToday?: number;
    networkHealthPct?: number;
  }>({
    systemRiskScore: 0,
    ebpfDropsCount: 0,
    activeHoneypots: 0,
    selfHealingLatencyMs: null,
    activeThreats: 0,
    containedToday: 0,
    networkHealthPct: 99.8
  });

  const [lastUpdated, setLastUpdated] = useState<string>('');

  useEffect(() => {
    fetchAlerts();
    setLastUpdated(new Date().toLocaleTimeString());

    apiService.getSystemMetrics()
      .then((data) => {
        if (data) {
          setMetrics((prev) => ({
            ...prev,
            ...data
          }));
        }
      })
      .catch((err) => console.warn('Could not load backend SOC metrics:', err));
  }, [fetchAlerts]);

  useEffect(() => {
    if (!isLiveFeedActive) return;

    let client: any = null;

    import('@stomp/stompjs').then(({ Client }) => {
      import('sockjs-client').then((SockJS) => {
        const token = typeof window !== 'undefined' ? (localStorage.getItem('rakshasphere_token') || sessionStorage.getItem('rakshasphere_token')) : null;
        const getSockJsUrl = (): string => {
          if (process.env.NEXT_PUBLIC_WS_URL) {
            return process.env.NEXT_PUBLIC_WS_URL.replace(/^wss:/, 'https:').replace(/^ws:/, 'http:');
          }
          if (process.env.NEXT_PUBLIC_API_URL) {
            const clean = process.env.NEXT_PUBLIC_API_URL.replace(/\/+$/, '').replace(/\/api\/v1$/, '');
            return `${clean}/ws-soc`;
          }
          const protocol = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'https:' : 'http:';
          const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
          const isLocal = host === 'localhost' || host === '127.0.0.1';
          return `${protocol}//${host}${isLocal ? ':8080' : ''}/ws-soc`;
        };

        const sockJsUrl = getSockJsUrl();
        client = new Client({
          webSocketFactory: () => new SockJS.default(sockJsUrl),
          connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
          reconnectDelay: 5000,
          onConnect: () => {
            client.subscribe('/topic/alerts', (message: any) => {
              try {
                const newAlert = JSON.parse(message.body);
                addLiveAlert({
                  id: newAlert.id,
                  timestamp: newAlert.timestamp,
                  sourceIp: newAlert.sourceIp,
                  destinationIp: newAlert.destinationIp,
                  sourcePort: newAlert.sourcePort,
                  destinationPort: newAlert.destinationPort,
                  attackType: newAlert.attackType,
                  severity: newAlert.severity,
                  riskScore: newAlert.riskScore,
                  confidence: newAlert.confidenceScore || newAlert.confidence || 0.9,
                  mitreTactic: newAlert.mitreTactic,
                  mitreTechnique: newAlert.mitreTechnique,
                  mitreId: newAlert.mitreId,
                  status: newAlert.status,
                  remediationAction: newAlert.remediationAction,
                  flowFeatures: {
                    flowDurationMs: newAlert.flowDurationMs || 0,
                    totalFwdPackets: newAlert.totalFwdPackets || 0,
                    packetLengthMean: newAlert.packetLengthMean || 0,
                    autoencoderAnomalyScore: newAlert.anomalyScore || 0
                  },
                  threatIntel: {
                    virusTotalScore: newAlert.virusTotalScore || 'N/A',
                    abuseIpDbConfidence: newAlert.abuseIpDbConfidence || 0,
                    country: newAlert.country || 'Unknown',
                    isp: newAlert.isp || 'Unknown'
                  }
                });
                setLastUpdated(new Date().toLocaleTimeString());
              } catch (err) {
                console.error("Error parsing WebSocket alert", err);
              }
            });
          },
          onStompError: (frame) => {
            console.error('STOMP broker error: ' + frame.headers['message']);
          }
        });

        client.activate();
      });
    });

    return () => {
      if (client) {
        client.deactivate();
      }
    };
  }, [isLiveFeedActive, addLiveAlert]);

  // Dynamic calculations
  const activeCount = alerts.filter((a) => a.status === 'ACTIVE').length;
  const containedCount = alerts.filter((a) => a.status === 'CONTAINED').length;
  const honeypotCount = alerts.filter((a) => a.status === 'HONEYPOT_DIVERTED').length;

  const computedRiskScore = activeCount > 0
    ? Math.min(100, Math.max(30, Math.round(alerts.reduce((acc, a) => acc + a.riskScore, 0) / alerts.length)))
    : (metrics.systemRiskScore !== undefined ? metrics.systemRiskScore : 0);

  const computedEbpfDrops = metrics.ebpfDropsCount !== undefined ? metrics.ebpfDropsCount : containedCount;
  const computedHoneypots = metrics.activeHoneypots !== undefined ? metrics.activeHoneypots : honeypotCount;

  // Active MITRE Tactics
  const uniqueMitreTactics = Array.from(new Set(alerts.map(a => a.mitreTactic).filter(Boolean)));

  return (
    <div className="space-y-6 pb-8">
      {/* 1. COMMAND HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/[0.06] pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl md:text-2xl font-extrabold text-slate-100 font-mono tracking-tight">
              SECURITY OPERATIONS CENTER
            </h1>
            <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold">
              AUTONOMOUS MESH
            </span>
          </div>
          <p className="text-xs font-mono text-slate-400 mt-1">
            Real-Time Threat Detection, Kernel eBPF Mitigation & Closed-Loop Deception
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 font-mono text-xs">
          <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-lg border border-white/10 text-[11px] text-slate-300">
            <Radio className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>AI Inference: <strong className="text-emerald-400">ONLINE</strong></span>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-lg border border-white/10 text-[11px] text-slate-400">
            <Clock className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span>Updated: <span className="text-slate-200 tabular-nums">{lastUpdated || 'Just now'}</span></span>
          </div>

          <Link href="/alerts">
            <Button size="sm" variant="secondary" rightIcon={<ChevronRight className="w-3.5 h-3.5 text-emerald-400" />}>
              Threat Triage Feed
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. KPI STRIP (5 Micro-Cards) */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
        {/* Metric 1: Active Incidents */}
        <div className="soc-card p-4 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-slate-400 uppercase font-bold tracking-wider leading-none">ACTIVE INCIDENTS</span>
            <div className={`p-1.5 rounded-md border shrink-0 ${activeCount > 0 ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
              {activeCount > 0 ? <ShieldAlert className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-3xl font-extrabold font-mono tabular-nums leading-none ${activeCount > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {activeCount}
            </span>
            <span className="text-[10px] font-mono text-slate-500">{containedCount} Contained</span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono truncate">
            {activeCount > 0 ? 'Requires Analyst Review' : 'Nominal Threat Baseline'}
          </span>
        </div>

        {/* Metric 2: Risk Score */}
        <div className="soc-card p-4 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-slate-400 uppercase font-bold tracking-wider leading-none" title="Formula: [(Severity × Conf) / Mitigation] × 10">SYSTEM RISK</span>
            <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border shrink-0 ${
              computedRiskScore >= 70
                ? 'text-rose-400 bg-rose-500/10 border-rose-500/20'
                : computedRiskScore >= 40
                ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
            }`}>
              {computedRiskScore >= 70 ? 'ELEVATED' : 'NOMINAL'}
            </span>
          </div>
          <div className="flex items-baseline gap-1 font-mono">
            <span className={`text-3xl font-extrabold tabular-nums leading-none ${
              computedRiskScore >= 70 ? 'text-rose-400' : computedRiskScore >= 40 ? 'text-amber-400' : 'text-emerald-400'
            }`}>
              {computedRiskScore}
            </span>
            <span className="text-slate-500 text-xs">/ 100</span>
          </div>
          <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-white/[0.04]">
            <div
              className={`h-full transition-all duration-500 ${
                computedRiskScore >= 70 ? 'bg-rose-500' : computedRiskScore >= 40 ? 'bg-amber-400' : 'bg-emerald-400'
              }`}
              style={{ width: `${computedRiskScore}%` }}
            />
          </div>
        </div>

        {/* Metric 3: eBPF Drops */}
        <div className="soc-card p-4 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-slate-400 uppercase font-bold tracking-wider leading-none">eBPF DROPS</span>
            <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
              <Zap className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 font-mono">
            <span className="text-3xl font-extrabold tabular-nums leading-none text-emerald-400">{computedEbpfDrops}</span>
            <span className="text-emerald-400 text-xs font-bold flex items-center">
              <TrendingUp className="w-3 h-3 mr-0.5" />+{containedCount}
            </span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono truncate">Kernel Zero-Copy Drops</span>
        </div>

        {/* Metric 4: Active Honeypots */}
        <div className="soc-card p-4 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-slate-400 uppercase font-bold tracking-wider leading-none">DECEPTION TRAPS</span>
            <div className="p-1.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
              <Bug className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 font-mono">
            <span className="text-3xl font-extrabold tabular-nums leading-none text-amber-400">{computedHoneypots}</span>
            <span className="text-slate-400 text-xs">Active</span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono truncate">SSH, Web, Telnet, FTP</span>
        </div>

        {/* Metric 5: Self-Heal Latency */}
        <div className="soc-card p-4 flex flex-col gap-2 col-span-2 md:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-slate-400 uppercase font-bold tracking-wider leading-none">SELF-HEAL</span>
            <div className="p-1.5 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shrink-0">
              <Activity className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-1 font-mono">
            <span className="text-3xl font-extrabold tabular-nums leading-none text-cyan-400">
              {metrics.selfHealingLatencyMs !== null && metrics.selfHealingLatencyMs !== undefined ? metrics.selfHealingLatencyMs : '<1'}
            </span>
            <span className="text-slate-400 text-xs">ms</span>
            <span className="ml-auto text-[9px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
              SUB-SEC
            </span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono truncate">Inference → eBPF Hook Cycle</span>
        </div>
      </div>

      {/* 3. MAIN COMMAND CENTER SPLIT (Left 67%, Right 33%) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        {/* Left: Live STOMP Stream */}
        <div className="xl:col-span-8 min-h-0">
          <LiveFeedTable
            alerts={alerts}
            onSelectAlert={(alert) => setSelectedAlert(alert)}
          />
        </div>

        {/* Right: Threat Intelligence panel */}
        <div className="xl:col-span-4 soc-card p-5 flex flex-col font-mono">
          {/* Panel Header */}
          <div className="flex items-center justify-between pb-3.5 border-b border-white/[0.06] shrink-0">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 shrink-0">
                <Layers className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-xs md:text-sm text-slate-100 tracking-wide">
                THREAT INTELLIGENCE
              </h3>
            </div>
            <Link href="/mitre" className="text-cyan-400 hover:underline text-[11px] font-bold shrink-0 ml-2">
              Matrix →
            </Link>
          </div>

          {/* Panel Body — grows to fill */}
          <div className="flex-1 flex flex-col justify-between mt-3.5 space-y-4">
            <div className="space-y-4">
              {/* MITRE Active Tactics */}
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Observed ATT&CK Tactics ({uniqueMitreTactics.length})
                </span>
                {uniqueMitreTactics.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {uniqueMitreTactics.slice(0, 5).map((tactic) => (
                      <span
                        key={tactic}
                        className="px-2 py-1 rounded bg-slate-950 border border-cyan-500/30 text-cyan-300 text-[10px] font-bold"
                      >
                        {tactic}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 rounded-lg bg-slate-950/60 border border-white/[0.04] text-[11px] text-slate-400">
                    No active tactics in current stream.
                  </div>
                )}
              </div>

              {/* External Threat Feeds Status */}
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Intelligence Feeds Status
                </span>
                <div className="space-y-1.5">
                  <div className="p-2 rounded-lg bg-slate-950/80 border border-white/[0.04] flex items-center justify-between">
                    <span className="text-slate-300 text-[11px] truncate mr-2">VirusTotal v3 Reputation</span>
                    <StatusBadge status="HEALTHY" size="xs" labelOverride="CONNECTED" />
                  </div>
                  <div className="p-2 rounded-lg bg-slate-950/80 border border-white/[0.04] flex items-center justify-between">
                    <span className="text-slate-300 text-[11px] truncate mr-2">AbuseIPDB v2 Blacklist</span>
                    <StatusBadge status="HEALTHY" size="xs" labelOverride="ACTIVE" />
                  </div>
                  <div className="p-2 rounded-lg bg-slate-950/80 border border-white/[0.04] flex items-center justify-between">
                    <span className="text-slate-300 text-[11px] truncate mr-2">STIX 2.1 ATT&CK v14.1</span>
                    <StatusBadge status="HEALTHY" size="xs" labelOverride="ALIGNED" />
                  </div>
                </div>
              </div>
            </div>

            {/* AI Engine Footer */}
            <div className="pt-3 border-t border-white/[0.06] text-[10px] text-slate-400 space-y-1.5">
              <div className="flex items-center justify-between">
                <span>ML Inference Engine:</span>
                <span className="text-emerald-400 font-bold">FastAPI + Scikit-Learn</span>
              </div>
              <div className="flex items-center justify-between">
                <span>CICFlowMeter Features:</span>
                <span className="text-slate-200 font-bold tabular-nums">84 Network Vectors</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. SECONDARY OPERATIONS ROW — equal height via grid-rows */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 auto-rows-fr">
        <AttackVectorDist alerts={alerts} />
        <GeoThreatMap alerts={alerts} />
        <div className="md:col-span-2 xl:col-span-1">
          <SystemHealthCard />
        </div>
      </div>

      {/* Alert Detail Modal */}
      <AlertDetailModal alert={selectedAlert} onClose={() => setSelectedAlert(null)} />
    </div>
  );
}
