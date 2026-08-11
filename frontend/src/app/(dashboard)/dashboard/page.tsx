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

export default function DashboardPage() {
  const { alerts, selectedAlert, setSelectedAlert, addLiveAlert, fetchAlerts } = useAlertStore();
  const { isLiveFeedActive } = useUIStore();
  const [metrics, setMetrics] = useState({
    systemRiskScore: 0,
    ebpfDropsCount: 0,
    activeHoneypots: 0,
    selfHealingLatencyMs: 112,
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
        client = new Client({
          webSocketFactory: () => new SockJS.default('http://localhost:8080/ws-soc'),
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
      {/* Page Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-slate-100 flex items-center gap-2">
            SOC COMMAND CENTER OVERVIEW
          </h1>
          <p className="text-xs font-mono text-slate-400 mt-1">
            Closed-Loop Cyber Defense Telemetry & Autonomous Remediation
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/alerts"
            className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-mono text-slate-200 font-semibold transition flex items-center gap-1.5"
          >
            <span>Threat Triage Console</span>
            <ChevronRight className="w-4 h-4 text-emerald-400" />
          </Link>
        </div>
      </div>

      {/* Top Stat Cards Grid — Responsive 1 col -> 2 col -> 4 col */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Risk Score Card */}
        <div className="p-5 rounded-2xl bg-white/[0.02] backdrop-blur-md border border-white/10 shadow-[0_4px_24px_rgba(0,0,0,0.2)] hover:shadow-[0_0_20px_rgba(16,185,129,0.1)] hover:-translate-y-1 hover:border-white/20 transition-all duration-300 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 font-semibold">SYSTEM RISK SCORE</span>
            <div className={`p-2 rounded-xl border ${activeCount > 0 ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
              {activeCount > 0 ? <ShieldAlert className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className={`text-3xl font-extrabold font-mono ${activeCount > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
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
          <p className="text-[10px] text-slate-500 font-mono mt-2 truncate">
            Formula: [(Severity × Conf × Criticality) / Mitigation] × 10
          </p>
        </div>

        {/* eBPF XDP Drops */}
        <div className="p-5 rounded-2xl bg-white/[0.02] backdrop-blur-md border border-white/10 shadow-[0_4px_24px_rgba(0,0,0,0.2)] hover:shadow-[0_0_20px_rgba(16,185,129,0.15)] hover:-translate-y-1 hover:border-emerald-500/30 transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 font-semibold">eBPF DRIVER DROPS</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Zap className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-emerald-400">
              {computedEbpfDrops}
            </span>
            <span className="text-emerald-400 text-xs font-mono flex items-center font-bold">
              <TrendingUp className="w-3.5 h-3.5 mr-0.5" /> +{containedCount}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 font-mono mt-3">
            Hardware NIC Layer Autonomous Invalidation
          </p>
        </div>

        {/* Honeypots Trapped */}
        <div className="p-5 rounded-2xl bg-white/[0.02] backdrop-blur-md border border-white/10 shadow-[0_4px_24px_rgba(0,0,0,0.2)] hover:shadow-[0_0_20px_rgba(245,158,11,0.15)] hover:-translate-y-1 hover:border-amber-500/30 transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 font-semibold">DECEPTION TRAPS</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Bug className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-amber-400">
              {computedHoneypots}
            </span>
            <span className="text-slate-400 font-mono text-xs">Active Microservices</span>
          </div>
          <p className="text-[10px] text-slate-400 font-mono mt-3">
            SSH, Web, Telnet & FTP Traps
          </p>
        </div>

        {/* Self Heal Latency */}
        <div className="p-5 rounded-2xl bg-white/[0.02] backdrop-blur-md border border-white/10 shadow-[0_4px_24px_rgba(0,0,0,0.2)] hover:shadow-[0_0_20px_rgba(6,182,212,0.15)] hover:-translate-y-1 hover:border-cyan-500/30 transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 font-semibold">SELF-HEAL LATENCY</span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-cyan-400">
              {metrics.selfHealingLatencyMs}
            </span>
            <span className="text-slate-400 font-mono text-xs">ms</span>
            <span className="ml-auto text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              SUB-SECOND
            </span>
          </div>
          <p className="text-[10px] text-slate-400 font-mono mt-3">
            Avg Threat Detection → Remediation Cycle
          </p>
        </div>
      </div>

      {/* Main SOC Dashboard Grid — Responsive 1 col on tablet -> 3 col on large desktops */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column: Threat Radar Widget & Geo Map */}
        <div className="xl:col-span-1 flex flex-col gap-6">
          <ThreatRadar alerts={alerts} />
          <GeoThreatMap alerts={alerts} />
        </div>

        {/* Right Column: Live STOMP Feed Table */}
        <div className="xl:col-span-2">
          <LiveFeedTable alerts={alerts} onSelectAlert={(alert) => setSelectedAlert(alert)} />
        </div>
      </div>

      {/* MITRE ATT&CK Matrix Quick Card Banner */}
      <div className="p-6 rounded-2xl bg-white/[0.02] backdrop-blur-md border border-white/10 hover:border-cyan-500/30 transition-all duration-300 flex flex-col md:flex-row items-center justify-between gap-4 shadow-[0_4px_24px_rgba(0,0,0,0.2)] relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shrink-0">
            <Layers className="w-8 h-8" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-100">
              INTEGRATED MITRE ATT&CK FRAMEWORK (v14.1 ALIGNED)
            </h3>
            <p className="text-xs text-slate-400 font-mono mt-1">
              Real-time correlation across Tactics TA0001 (Initial Access) to TA0040 (Impact)
            </p>
          </div>
        </div>

        <Link
          href="/mitre"
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-extrabold text-xs hover:opacity-90 transition shadow-lg shadow-emerald-500/20 flex items-center gap-2 whitespace-nowrap"
        >
          <span>OPEN MITRE HEATMAP MATRIX</span>
          <ArrowUpRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Alert Detail Modal Popup */}
      <AlertDetailModal alert={selectedAlert} onClose={() => setSelectedAlert(null)} />
    </div>
  );
}
