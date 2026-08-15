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
  ShieldCheck
} from 'lucide-react';
import Link from 'next/link';
import { useAlertStore } from '@/store/useAlertStore';
import { useUIStore } from '@/store/useUIStore';
import { apiService } from '@/services/api';
import { ThreatRadar } from '@/components/soc/ThreatRadar';
import { LiveFeedTable } from '@/components/soc/LiveFeedTable';
import { AlertDetailModal } from '@/components/alerts/AlertDetailModal';
import { GeoThreatMap } from '@/components/soc/GeoThreatMap';
import { SystemHealthCard } from '@/components/soc/SystemHealthCard';
import { Button } from '@/components/ui/Button';

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

  useEffect(() => {
    fetchAlerts();

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
        const token = localStorage.getItem('rakshasphere_token');
        const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
        client = new Client({
          webSocketFactory: () => new SockJS.default(`http://${host}:8080/ws-soc`),
          connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
          reconnectDelay: 5000,
          onConnect: () => {

            console.log('STOMP Client connected');
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
              } catch (err) {
                console.error("Error parsing WebSocket alert", err);
              }
            });
          },
          onStompError: (frame) => {
            console.error('Broker reported error: ' + frame.headers['message']);
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

  // Compute dynamic stats based on live alert store
  const activeCount = alerts.filter((a) => a.status === 'ACTIVE').length;
  const containedCount = alerts.filter((a) => a.status === 'CONTAINED').length;
  const honeypotCount = alerts.filter((a) => a.status === 'HONEYPOT_DIVERTED').length;

  const computedRiskScore = activeCount > 0
    ? Math.min(100, Math.max(30, Math.round(alerts.reduce((acc, a) => acc + a.riskScore, 0) / alerts.length)))
    : (metrics.systemRiskScore !== undefined ? metrics.systemRiskScore : 0);

  const computedEbpfDrops = metrics.ebpfDropsCount !== undefined ? metrics.ebpfDropsCount : containedCount;
  const computedHoneypots = metrics.activeHoneypots !== undefined ? metrics.activeHoneypots : honeypotCount;

  return (
    <div className="space-y-6">
      {/* Page Title & Controls Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-slate-100 flex items-center gap-2 tracking-tight">
            SOC COMMAND CENTER OVERVIEW
          </h1>
          <p className="text-xs font-mono text-slate-400 mt-1">
            Closed-Loop Cyber Defense Telemetry & Autonomous Remediation Mesh
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/alerts">
            <Button size="sm" variant="secondary" rightIcon={<ChevronRight className="w-4 h-4 text-emerald-400" />}>
              Threat Triage Console
            </Button>
          </Link>
        </div>
      </div>

      {/* ROW 1: Key Metric Cards Grid — 4 Columns (Locked Heights & Baseline Alignment) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Risk Score Card */}
        <div className="soc-card p-5 flex flex-col justify-between group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 font-semibold uppercase tracking-wider">SYSTEM RISK SCORE</span>
            <div className={`p-2 rounded-xl border ${activeCount > 0 ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
              {activeCount > 0 ? <ShieldAlert className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className={`text-3xl font-extrabold font-mono tabular-nums ${activeCount > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
              {computedRiskScore}
            </span>
            <span className="text-slate-500 font-mono text-xs">/ 100</span>
            <span className={`ml-auto text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
              activeCount > 0
                ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
            }`}>
              {activeCount > 0 ? 'EVALUATED' : 'NOMINAL BASELINE'}
            </span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${activeCount > 0 ? 'bg-gradient-to-r from-amber-500 to-red-500' : 'bg-emerald-400'}`}
              style={{ width: `${computedRiskScore}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-400 font-mono mt-2 truncate">
            Risk Formula: [(Severity × Conf) / Mitigation] × 10
          </p>
        </div>

        {/* eBPF XDP Drops */}
        <div className="soc-card p-5 flex flex-col justify-between group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 font-semibold uppercase tracking-wider">eBPF DRIVER DROPS</span>
            <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              SIMULATED
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono tabular-nums text-emerald-400">
              {computedEbpfDrops}
            </span>
            <span className="text-emerald-400 text-xs font-mono flex items-center font-bold">
              <TrendingUp className="w-3.5 h-3.5 mr-0.5" /> +{containedCount}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 font-mono mt-3">
            Simulated Hardware NIC Layer Driver Drops
          </p>
        </div>


        {/* Honeypots Trapped */}
        <div className="soc-card p-5 flex flex-col justify-between group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 font-semibold uppercase tracking-wider">DECEPTION TRAPS</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Bug className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono tabular-nums text-amber-400">
              {computedHoneypots}
            </span>
            <span className="text-slate-400 font-mono text-xs">Active Traps</span>
          </div>
          <p className="text-[10px] text-slate-400 font-mono mt-3">
            SSH, Web, Telnet & FTP Ephemeral Containers
          </p>
        </div>

        {/* Self Heal Latency */}
        <div className="soc-card p-5 flex flex-col justify-between group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 font-semibold uppercase tracking-wider">SELF-HEAL LATENCY</span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono tabular-nums text-cyan-400">
              {metrics.selfHealingLatencyMs !== null && metrics.selfHealingLatencyMs !== undefined ? metrics.selfHealingLatencyMs : 'N/A'}
            </span>
            {metrics.selfHealingLatencyMs !== null && metrics.selfHealingLatencyMs !== undefined && (
              <span className="text-slate-400 font-mono text-xs">ms</span>
            )}
            <span className="ml-auto text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              {metrics.selfHealingLatencyMs !== null && metrics.selfHealingLatencyMs !== undefined ? 'SUB-SECOND' : 'REAL TIME'}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 font-mono mt-3">
            Threat Detection → Remediation Loop Cycle
          </p>
        </div>
      </div>

      {/* ROW 2: Threat Radar (40%) + Live STOMP Stream Table (60%) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
        <div className="xl:col-span-5">
          <ThreatRadar alerts={alerts} />
        </div>
        <div className="xl:col-span-7">
          <LiveFeedTable alerts={alerts} onSelectAlert={(alert) => setSelectedAlert(alert)} />
        </div>
      </div>

      {/* ROW 3: System Health Diagnostics Card (50%) + Global Geo Map (50%) */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-stretch">
        <SystemHealthCard />
        <GeoThreatMap alerts={alerts} />
      </div>

      {/* ROW 4: Integrated MITRE ATT&CK Matrix Quick Card Banner */}
      <div className="soc-card p-6 flex flex-col md:flex-row items-center justify-between gap-4 relative overflow-hidden group">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shrink-0">
            <Layers className="w-7 h-7" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-slate-100 font-sans tracking-tight">
              INTEGRATED MITRE ATT&CK FRAMEWORK (v14.1 ALIGNED)
            </h3>
            <p className="text-xs text-slate-400 font-mono mt-1">
              Real-time STIX 2.1 correlation across Tactics TA0001 (Initial Access) to TA0040 (Impact)
            </p>
          </div>
        </div>

        <Link href="/mitre">
          <Button size="md" variant="primary" rightIcon={<ArrowUpRight className="w-4 h-4" />}>
            OPEN MITRE HEATMAP MATRIX
          </Button>
        </Link>
      </div>

      {/* Alert Detail Modal Popup */}
      <AlertDetailModal alert={selectedAlert} onClose={() => setSelectedAlert(null)} />
    </div>
  );
}

