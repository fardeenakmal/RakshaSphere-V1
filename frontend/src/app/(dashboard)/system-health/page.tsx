'use client';

import React, { useEffect } from 'react';
import {
  Activity,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Server,
  Cpu,
  Radio,
  Shield,
  HardDrive,
  Info,
  CheckCircle2,
  Zap
} from 'lucide-react';
import { useHealthStore } from '@/store/useHealthStore';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';

const cleanErrorMessage = (msg: any): string => {
  if (typeof msg !== 'string') return String(msg || '');
  if (msg.includes('<html') || msg.includes('<!DOCTYPE') || msg.includes('<head')) {
    if (msg.includes('502 Bad Gateway')) return 'AI Inference Microservice Unreachable (HTTP 502 Bad Gateway / Connection Timeout)';
    if (msg.includes('504 Gateway Timeout')) return 'AI Inference Microservice Connection Timeout (HTTP 504)';
    if (msg.includes('404')) return 'AI Inference Microservice Endpoint Not Found (HTTP 404)';
    return 'Service returned an invalid HTML error response';
  }
  if (msg.length > 200) {
    return msg.substring(0, 200) + '...';
  }
  return msg;
};

export default function SystemHealthPage() {
  const {
    healthData,
    isLoading: loading,
    lastUpdated: lastRefreshed,
    refresh: fetchHealthData,
    subscribeToPolling,
    unsubscribeFromPolling
  } = useHealthStore();

  const [systemInfo, setSystemInfo] = React.useState<any>(null);

  useEffect(() => {
    subscribeToPolling();
    import('@/services/api').then(({ apiService }) => {
      apiService.getSystemInfo()
        .then((info) => setSystemInfo(info))
        .catch((err) => console.warn('Could not fetch real system info:', err));
    });
    return () => unsubscribeFromPolling();
  }, [subscribeToPolling, unsubscribeFromPolling]);

  const services = healthData?.services || [];
  const summary = healthData?.summary || { healthy: 0, degraded: 0, down: 0, simulated: 0, total: 13 };
  const overallStatus = loading && !healthData
    ? 'LOADING'
    : healthData?.overallStatus || 'UNKNOWN';

  // Categorize services into 5 architectural groups
  const categories = [
    {
      name: 'CORE SERVICES',
      description: 'Primary compute, web tier, relational & key-value persistence engines',
      icon: Server,
      serviceIds: ['frontend', 'backend', 'mysql', 'redis']
    },
    {
      name: 'INTELLIGENCE',
      description: 'Machine learning inference engine and external threat intelligence feeds',
      icon: Cpu,
      serviceIds: ['ai-engine', 'virustotal', 'abuseipdb']
    },
    {
      name: 'MESSAGING & TELEMETRY',
      description: 'Real-time WebSocket event bus and IoT MQTT telemetry broker',
      icon: Radio,
      serviceIds: ['stomp-websocket', 'mqtt-broker', 'iot-agent']
    },
    {
      name: 'DEFENSE SUBSYSTEMS',
      description: 'Deception honeypot traps and kernel-level eBPF packet mitigation',
      icon: Shield,
      serviceIds: ['honeypot', 'ebpf']
    },
    {
      name: 'OPERATIONS & BACKUP',
      description: 'Automated database backups and disaster recovery readiness',
      icon: HardDrive,
      serviceIds: ['db-backup']
    }
  ];

  const getServiceById = (id: string) => services.find((s: any) => s.id === id);

  return (
    <div className="space-y-6 pb-12 font-mono">
      {/* Page Title & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl md:text-2xl font-extrabold text-slate-100 tracking-tight">
              SYSTEM HEALTH & DIAGNOSTICS
            </h1>
            <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold">
              13 NODES MONITORED
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-Time Multi-Tier Infrastructure Telemetry, Latency Profiling & Subsystem Auditing
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="secondary"
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-400' : ''}`} />}
            onClick={() => {
              fetchHealthData();
              import('@/services/api').then(({ apiService }) => {
                apiService.getSystemInfo().then((info) => setSystemInfo(info)).catch(() => {});
              });
            }}
          >
            Refreshed: {lastRefreshed || 'Just now'}
          </Button>
        </div>
      </div>

      {/* Overview Health & Resource Usage Header Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-stretch">
        {/* System Health Status Card */}
        <div className="xl:col-span-4 soc-card p-5 md:p-6 flex flex-col justify-between">
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">
              PLATFORM OPERATIONAL STATUS
            </span>
            <div className="mt-3 flex items-center gap-3">
              <StatusBadge status={overallStatus} size="lg" />
            </div>
            <p className="text-xs text-slate-400 mt-3 leading-relaxed">
              {overallStatus === 'HEALTHY' && 'All 13 core platform services and dependencies are nominal and operational.'}
              {overallStatus === 'DEGRADED' && 'Non-critical telemetry dependencies are currently degraded or simulated.'}
              {overallStatus === 'DOWN' && 'Critical platform backend service is unreachable.'}
              {!['HEALTHY', 'DEGRADED', 'DOWN'].includes(overallStatus) && 'Priority-Weighted Dependency Engine Active'}
            </p>
          </div>

          <div className="grid grid-cols-4 gap-2 mt-5 pt-4 border-t border-white/[0.06] text-center">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <span className="text-[10px] text-emerald-400 block font-bold">HEALTHY</span>
              <span className="text-base md:text-lg font-bold text-slate-100 tabular-nums">{summary.healthy}</span>
            </div>
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <span className="text-[10px] text-amber-400 block font-bold">DEGRADED</span>
              <span className="text-base md:text-lg font-bold text-slate-100 tabular-nums">{summary.degraded}</span>
            </div>
            <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20">
              <span className="text-[10px] text-rose-400 block font-bold">DOWN</span>
              <span className="text-base md:text-lg font-bold text-slate-100 tabular-nums">{summary.down}</span>
            </div>
            <div className="p-2 rounded-lg bg-slate-900 border border-white/10">
              <span className="text-[10px] text-slate-300 block font-bold">TOTAL</span>
              <span className="text-base md:text-lg font-bold text-slate-100 tabular-nums">{summary.total}</span>
            </div>
          </div>
        </div>

        {/* Resource Telemetry Diagnostics */}
        <div className="xl:col-span-8 soc-card p-5 md:p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
            <span className="text-xs font-extrabold text-slate-100 uppercase tracking-wider">
              HARDWARE RESOURCE & SYSTEM RUNTIME TELEMETRY
            </span>
            <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
              LIVE SYSTEM INFO
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-4 text-xs">
            {/* CPU & Host OS */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-emerald-400" /> Host Processors & OS:
                </span>
                <span className="text-emerald-400 font-bold tabular-nums">
                  {systemInfo ? `${systemInfo.availableProcessors} Cores` : 'Loading...'}
                </span>
              </div>
              <div className="w-full bg-slate-950 h-1.5 rounded-full border border-white/[0.06] overflow-hidden">
                <div className="bg-emerald-400 h-full w-[40%]" />
              </div>
              <span className="text-[10px] text-slate-500 truncate block">
                {systemInfo ? `${systemInfo.osName} (${systemInfo.osArch}) | Load Avg: ${systemInfo.systemLoadAverage}` : 'JVM Host Telemetry'}
              </span>
            </div>

            {/* RAM Memory */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Server className="w-3.5 h-3.5 text-cyan-400" /> RAM Memory Pool:
                </span>
                <span className="text-cyan-300 font-bold tabular-nums">
                  {systemInfo ? `${systemInfo.ramUsedMb} MB / ${systemInfo.ramTotalMb} MB (${systemInfo.ramUsedPct}%)` : 'Loading...'}
                </span>
              </div>
              <div className="w-full bg-slate-950 h-1.5 rounded-full border border-white/[0.06] overflow-hidden">
                <div className="bg-cyan-400 h-full" style={{ width: `${systemInfo?.ramUsedPct || 0}%` }} />
              </div>
              <span className="text-[10px] text-slate-500 truncate block">
                {systemInfo ? `Heap Allocated: ${systemInfo.ramUsedMb} MB` : 'JVM Memory Pool'}
              </span>
            </div>

            {/* Runtime Stack */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-amber-400" /> Runtime Environment:
                </span>
                <span className="text-amber-400 font-bold tabular-nums">
                  {systemInfo ? `Java ${systemInfo.javaVersion}` : 'Spring Boot'}
                </span>
              </div>
              <div className="w-full bg-slate-950 h-1.5 rounded-full border border-white/[0.06] overflow-hidden">
                <div className="bg-amber-400 h-full w-[75%]" />
              </div>
              <span className="text-[10px] text-slate-500 truncate block">
                {systemInfo ? `Spring Boot v${systemInfo.springBootVersion} | ${systemInfo.containerized ? 'Docker Container' : 'Host Node'}` : 'Stack details'}
              </span>
            </div>

            {/* Storage Disk */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <HardDrive className="w-3.5 h-3.5 text-emerald-400" /> Root Disk Storage:
                </span>
                <span className="text-emerald-400 font-bold tabular-nums">
                  {systemInfo ? `${systemInfo.diskUsedGb} GB / ${systemInfo.diskTotalGb} GB (${systemInfo.diskUsedPct}%)` : 'Loading...'}
                </span>
              </div>
              <div className="w-full bg-slate-950 h-1.5 rounded-full border border-white/[0.06] overflow-hidden">
                <div className="bg-emerald-400 h-full" style={{ width: `${systemInfo?.diskUsedPct || 0}%` }} />
              </div>
              <span className="text-[10px] text-slate-500 truncate block">
                {systemInfo ? `Node Host: ${systemInfo.hostname}` : 'Root Filesystem'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Categorized Subsystems Grid */}
      <div className="space-y-7">
        {categories.map((cat) => {
          const CatIcon = cat.icon;
          const catServices = cat.serviceIds.map((id) => getServiceById(id)).filter(Boolean);

          return (
            <div key={cat.name} className="space-y-3">
              <div className="flex items-center gap-2.5 border-b border-white/[0.06] pb-2">
                <div className="p-1.5 rounded-lg bg-slate-900 border border-white/10 text-emerald-400">
                  <CatIcon className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm md:text-base font-bold text-slate-100 tracking-wider">
                    {cat.name}
                  </h2>
                  <p className="text-[11px] text-slate-400">{cat.description}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {catServices.map((service: any) => {
                  const details = service.details || {};

                  return (
                    <div
                      key={service.id}
                      className="soc-card p-4 md:p-5 flex flex-col justify-between space-y-3"
                    >
                      <div>
                        {/* Service Header */}
                        <div className="flex items-start justify-between gap-3 pb-3 border-b border-white/[0.06]">
                          <div>
                            <h3 className="font-bold text-xs md:text-sm text-slate-100 flex items-center gap-2">
                              {service.name}
                            </h3>
                            <span className="text-[10px] text-slate-400 uppercase tracking-wider block mt-0.5">
                              Category: {service.category}
                            </span>
                          </div>
                          <StatusBadge status={service.status} size="xs" />
                        </div>

                        {/* Metrics Grid */}
                        <div className="grid grid-cols-2 gap-2.5 mt-3 text-xs">
                          <div className="bg-slate-950 p-2 rounded-lg border border-white/[0.04]">
                            <span className="text-slate-400 block text-[10px]">RESPONSE LATENCY</span>
                            <span className="text-slate-100 font-bold tabular-nums">
                              {service.latencyMs !== null && service.latencyMs !== undefined ? `${service.latencyMs} ms` : 'N/A'}
                            </span>
                          </div>

                          <div className="bg-slate-950 p-2 rounded-lg border border-white/[0.04]">
                            <span className="text-slate-400 block text-[10px]">LAST CHECKED</span>
                            <span className="text-slate-300 text-[11px] truncate block font-mono">
                              {service.lastChecked ? new Date(service.lastChecked).toLocaleTimeString() : 'N/A'}
                            </span>
                          </div>
                        </div>

                        {/* Operational Details & Diagnostic Alerts */}
                        <div className="mt-3 space-y-2 text-xs">
                          {service.lastSuccessfulCheck && (
                            <div className="text-slate-400 text-[11px] flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              <span>Last Successful: <strong className="text-slate-200">{new Date(service.lastSuccessfulCheck).toLocaleTimeString()}</strong></span>
                            </div>
                          )}

                          {details.issue && (
                            <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-start gap-2">
                              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                              <div>
                                <span className="font-bold block text-[10px] uppercase">OPERATIONAL ISSUE</span>
                                <span className="text-[11px] leading-relaxed">{cleanErrorMessage(details.issue)}</span>
                              </div>
                            </div>
                          )}

                          {details.error && (
                            <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2">
                              <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                              <div>
                                <span className="font-bold block text-[10px] uppercase">FAILURE REASON</span>
                                <span className="text-[11px] leading-relaxed">{cleanErrorMessage(details.error)}</span>
                              </div>
                            </div>
                          )}

                          {details.notice && (
                            <div className="p-2.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs flex items-start gap-2">
                              <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                              <div>
                                <span className="font-bold block text-[10px] uppercase">NOTICE</span>
                                <span className="text-[11px] leading-relaxed">{details.notice}</span>
                              </div>
                            </div>
                          )}

                          {/* Specific Component Telemetry Snippets */}
                          {service.id === 'mysql' && details.connectionPool && (
                            <div className="bg-slate-950 p-2.5 rounded-lg border border-white/[0.04] text-[11px] text-slate-400 space-y-1">
                              <div className="flex justify-between">
                                <span>HikariCP Pool:</span> <strong className="text-slate-200">{details.connectionPool.poolName}</strong>
                              </div>
                              <div className="flex justify-between">
                                <span>Active / Total Connections:</span> <strong className="text-emerald-400 tabular-nums">{details.connectionPool.activeConnections} / {details.connectionPool.totalConnections}</strong>
                              </div>
                            </div>
                          )}

                          {service.id === 'ai-engine' && details.manifest && (
                            <div className="bg-slate-950 p-2.5 rounded-lg border border-white/[0.04] text-[11px] text-slate-400 space-y-1">
                              <div className="flex justify-between">
                                <span>Model Architecture:</span> <strong className="text-slate-200">{details.manifest.modelName} (v{details.manifest.version})</strong>
                              </div>
                              <div className="flex justify-between">
                                <span>Evaluation Accuracy:</span> <strong className="text-emerald-400 tabular-nums">{details.manifest.accuracyPct}%</strong>
                              </div>
                            </div>
                          )}

                          {service.id === 'ebpf' && details && (
                            <div className="bg-slate-950 p-2.5 rounded-lg border border-white/[0.04] text-[11px] text-slate-400 space-y-1">
                              <div className="flex justify-between">
                                <span>NIC Hook Interface:</span> <strong className="text-slate-200">{details.interface || 'N/A'} ({details.xdpMode || 'NOT_ATTACHED'})</strong>
                              </div>
                              <div className="flex justify-between">
                                <span>Kernel Program:</span> <strong className="text-emerald-400">{details.programName || 'XDP Probe'} {details.programId ? `(#${details.programId})` : ''}</strong>
                              </div>
                              <div className="flex justify-between">
                                <span>Pass / Drop Packets:</span> <strong className="text-slate-200 tabular-nums"><span className="text-emerald-400">{details.passPackets || 0} PASS</span> / <span className="text-rose-400">{details.dropPackets || 0} DROP</span></strong>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-white/[0.06] flex items-center justify-between text-[10px] text-slate-400">
                        <span>Node ID: {service.id}</span>
                        <span>Auto-Refreshed (12s)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
