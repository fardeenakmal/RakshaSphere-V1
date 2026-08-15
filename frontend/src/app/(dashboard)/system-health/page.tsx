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
    <div className="space-y-6 pb-12">
      {/* Page Title & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-slate-100 flex items-center gap-2 tracking-tight">
            SYSTEM HEALTH & SUBSYSTEM DIAGNOSTICS
          </h1>
          <p className="text-xs font-mono text-slate-400 mt-1">
            Real-Time Multi-Tier Infrastructure Telemetry, Latency Profiling & Node State Auditing
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
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
        {/* System Health Status Card */}
        <div className="xl:col-span-4 soc-card p-6 flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold block">
              PLATFORM OPERATIONAL STATUS
            </span>
            <div className="mt-3 flex items-center gap-3">
              <StatusBadge status={overallStatus} size="lg" />
            </div>
            <p className="text-xs text-slate-400 font-mono mt-3 leading-relaxed">
              {overallStatus === 'HEALTHY' && 'All 13 core platform services and dependencies operational.'}
              {overallStatus === 'DEGRADED' && 'Non-critical telemetry dependencies are degraded.'}
              {overallStatus === 'DOWN' && 'Critical platform backend service is unreachable.'}
              {!['HEALTHY', 'DEGRADED', 'DOWN'].includes(overallStatus) && 'Priority-Weighted Dependency Engine Active'}
            </p>
          </div>

          <div className="grid grid-cols-4 gap-2 mt-6 pt-4 border-t border-slate-800 font-mono text-center">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <span className="text-[10px] text-emerald-400 block font-bold">HEALTHY</span>
              <span className="text-lg font-bold text-slate-100 tabular-nums">{summary.healthy}</span>
            </div>
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <span className="text-[10px] text-amber-400 block font-bold">DEGRADED</span>
              <span className="text-lg font-bold text-slate-100 tabular-nums">{summary.degraded}</span>
            </div>
            <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/20">
              <span className="text-[10px] text-red-400 block font-bold">DOWN</span>
              <span className="text-lg font-bold text-slate-100 tabular-nums">{summary.down}</span>
            </div>
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
              <span className="text-[10px] text-cyan-400 block font-bold">SIMULATED</span>
              <span className="text-lg font-bold text-slate-100 tabular-nums">{summary.simulated}</span>
            </div>
          </div>
        </div>

        {/* Resource Telemetry Diagnostics */}
        <div className="xl:col-span-8 soc-card p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-xs font-mono font-extrabold text-slate-100 uppercase tracking-wider">
              HARDWARE RESOURCE & SYSTEM TELEMETRY (REAL BACKEND METRICS)
            </span>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
              REAL SYSTEM INFO
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-4 font-mono text-xs">
            {/* CPU & Host OS */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-emerald-400" /> System Processors & OS:
                </span>
                <span className="text-emerald-400 font-bold tabular-nums">
                  {systemInfo ? `${systemInfo.availableProcessors} Cores` : 'Loading...'}
                </span>
              </div>
              <div className="w-full bg-slate-950 h-2 rounded-full border border-slate-800 overflow-hidden">
                <div className="bg-emerald-400 h-full w-[40%]" />
              </div>
              <span className="text-[10px] text-slate-500">
                {systemInfo ? `${systemInfo.osName} (${systemInfo.osArch}) | Load: ${systemInfo.systemLoadAverage}` : 'JVM Runtime Metrics'}
              </span>
            </div>

            {/* RAM Memory */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Server className="w-4 h-4 text-cyan-400" /> RAM Memory Pool:
                </span>
                <span className="text-cyan-400 font-bold tabular-nums">
                  {systemInfo ? `${systemInfo.ramUsedMb} MB / ${systemInfo.ramTotalMb} MB (${systemInfo.ramUsedPct}%)` : 'Loading...'}
                </span>
              </div>
              <div className="w-full bg-slate-950 h-2 rounded-full border border-slate-800 overflow-hidden">
                <div className="bg-cyan-400 h-full" style={{ width: `${systemInfo?.ramUsedPct || 0}%` }} />
              </div>
              <span className="text-[10px] text-slate-500">
                {systemInfo ? `JVM Heap Max: ${systemInfo.ramTotalMb} MB` : 'JVM Memory'}
              </span>
            </div>

            {/* Runtime Stack */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Radio className="w-4 h-4 text-amber-400" /> Runtime Environment:
                </span>
                <span className="text-amber-400 font-bold tabular-nums">
                  {systemInfo ? `Java ${systemInfo.javaVersion}` : 'Spring Boot'}
                </span>
              </div>
              <div className="w-full bg-slate-950 h-2 rounded-full border border-slate-800 overflow-hidden">
                <div className="bg-amber-400 h-full w-[80%]" />
              </div>
              <span className="text-[10px] text-slate-500">
                {systemInfo ? `Spring Boot v${systemInfo.springBootVersion} | ${systemInfo.containerized ? 'Docker Container' : 'Host Node'}` : 'Stack details'}
              </span>
            </div>

            {/* Storage Disk */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <HardDrive className="w-4 h-4 text-emerald-400" /> Root Disk Storage:
                </span>
                <span className="text-emerald-400 font-bold tabular-nums">
                  {systemInfo ? `${systemInfo.diskUsedGb} GB / ${systemInfo.diskTotalGb} GB (${systemInfo.diskUsedPct}%)` : 'Loading...'}
                </span>
              </div>
              <div className="w-full bg-slate-950 h-2 rounded-full border border-slate-800 overflow-hidden">
                <div className="bg-emerald-400 h-full" style={{ width: `${systemInfo?.diskUsedPct || 0}%` }} />
              </div>
              <span className="text-[10px] text-slate-500">
                {systemInfo ? `Node Host: ${systemInfo.hostname}` : 'Root Filesystem'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Categorized Subsystems Grid */}
      <div className="space-y-8">
        {categories.map((cat) => {
          const CatIcon = cat.icon;
          const catServices = cat.serviceIds.map((id) => getServiceById(id)).filter(Boolean);

          return (
            <div key={cat.name} className="space-y-4 font-mono">
              <div className="flex items-center gap-3 border-b border-slate-800 pb-2">
                <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-emerald-400">
                  <CatIcon className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-200 tracking-wider">
                    {cat.name}
                  </h2>
                  <p className="text-xs text-slate-400">{cat.description}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {catServices.map((service: any) => {
                  const details = service.details || {};

                  return (
                    <div
                      key={service.id}
                      className="soc-card p-5 flex flex-col justify-between space-y-4"
                    >
                      <div>
                        {/* Service Header */}
                        <div className="flex items-start justify-between gap-4 pb-3 border-b border-slate-800">
                          <div>
                            <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                              {service.name}
                            </h3>
                            <span className="text-[10px] text-slate-400 uppercase tracking-wider block mt-0.5">
                              Category: {service.category}
                            </span>
                          </div>
                          <StatusBadge status={service.status} size="sm" />
                        </div>

                        {/* Metrics Grid */}
                        <div className="grid grid-cols-2 gap-3 mt-4 text-xs">
                          <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                            <span className="text-slate-400 block text-[10px]">RESPONSE LATENCY</span>
                            <span className="text-slate-100 font-bold tabular-nums">
                              {service.latencyMs !== null && service.latencyMs !== undefined ? `${service.latencyMs} ms` : 'N/A'}
                            </span>
                          </div>

                          <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                            <span className="text-slate-400 block text-[10px]">LAST CHECKED</span>
                            <span className="text-slate-300 text-[11px] truncate block font-mono">
                              {service.lastChecked ? new Date(service.lastChecked).toLocaleTimeString() : 'N/A'}
                            </span>
                          </div>
                        </div>

                        {/* Operational Details & Issues */}
                        <div className="mt-4 space-y-2 text-xs">
                          {service.lastSuccessfulCheck && (
                            <div className="text-slate-400 text-[11px] flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Last Successful: <strong className="text-slate-200">{new Date(service.lastSuccessfulCheck).toLocaleTimeString()}</strong></span>
                            </div>
                          )}

                          {details.issue && (
                            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-start gap-2">
                              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                              <div>
                                <span className="font-bold block text-[11px]">OPERATIONAL ISSUE</span>
                                <span className="text-[11px] leading-relaxed">{details.issue}</span>
                              </div>
                            </div>
                          )}

                          {details.error && (
                            <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-start gap-2">
                              <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                              <div>
                                <span className="font-bold block text-[11px]">REASON / FAILURE</span>
                                <span className="text-[11px] leading-relaxed">{details.error}</span>
                              </div>
                            </div>
                          )}

                          {details.notice && (
                            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs flex items-start gap-2">
                              <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                              <div>
                                <span className="font-bold block text-[11px]">NOTICE</span>
                                <span className="text-[11px] leading-relaxed">{details.notice}</span>
                              </div>
                            </div>
                          )}

                          {/* Specific Component Telemetry Snippets */}
                          {service.id === 'mysql' && details.connectionPool && (
                            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
                              <div className="flex justify-between">
                                <span>HikariCP Pool:</span> <strong className="text-slate-200">{details.connectionPool.poolName}</strong>
                              </div>
                              <div className="flex justify-between">
                                <span>Active / Total:</span> <strong className="text-emerald-400 tabular-nums">{details.connectionPool.activeConnections} / {details.connectionPool.totalConnections}</strong>
                              </div>
                            </div>
                          )}

                          {service.id === 'ai-engine' && details.manifest && (
                            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
                              <div className="flex justify-between">
                                <span>Model Schema:</span> <strong className="text-slate-200">{details.manifest.modelName} (v{details.manifest.version})</strong>
                              </div>
                              <div className="flex justify-between">
                                <span>Accuracy Score:</span> <strong className="text-emerald-400 tabular-nums">{details.manifest.accuracyPct}%</strong>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
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

