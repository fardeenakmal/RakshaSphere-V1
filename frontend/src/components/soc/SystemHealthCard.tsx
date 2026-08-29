'use client';

import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import Link from 'next/link';
import { Activity, RefreshCw, ExternalLink, Clock, X, ChevronRight, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { useHealthStore } from '@/store/useHealthStore';
import { StatusBadge } from '@/components/ui/StatusBadge';

export const SystemHealthCard: React.FC = () => {
  const { 
    healthData, 
    isLoading: loading, 
    error,
    lastUpdated: lastRefreshed, 
    notification, 
    refresh: fetchHealth,
    subscribeToPolling,
    unsubscribeFromPolling
  } = useHealthStore();

  const [selectedService, setSelectedService] = useState<any>(null);
  const [isBrowser, setIsBrowser] = useState(false);

  useEffect(() => {
    subscribeToPolling();
    return () => unsubscribeFromPolling();
  }, [subscribeToPolling, unsubscribeFromPolling]);

  useEffect(() => { setIsBrowser(true); }, []);

  const statusPriority: Record<string, number> = {
    'DOWN': 1,
    'DEGRADED': 2,
    'SIMULATED': 3,
    'HEALTHY': 4,
    'UNKNOWN': 5
  };

  const services = [...(healthData?.services || [])].sort((a: any, b: any) => {
    const priorityA = statusPriority[a.status] || 99;
    const priorityB = statusPriority[b.status] || 99;
    return priorityA - priorityB;
  });

  const displayServices = services.slice(0, 6);
  const healthyCount = healthData?.summary?.healthy;
  const totalCount = healthData?.summary?.total;
  const overall = loading && !healthData
    ? 'LOADING'
    : error && !healthData
    ? 'UNKNOWN'
    : healthData?.overallStatus || 'UNKNOWN';

  const modalContent = selectedService ? (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
      onClick={() => setSelectedService(null)}
    >
      <div
        className="w-full max-w-md bg-slate-900 border border-white/10 rounded-xl shadow-2xl flex flex-col overflow-hidden font-mono text-xs"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between p-4 border-b border-white/[0.08] bg-slate-950/80">
          <h3 className="font-bold text-slate-100 uppercase truncate pr-3">
            {selectedService.name}
          </h3>
          <button
            onClick={() => setSelectedService(null)}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2.5 rounded-lg bg-slate-950 border border-white/[0.06]">
              <span className="text-slate-500 text-[10px] block mb-1">STATUS</span>
              <StatusBadge status={selectedService.status} size="xs" />
            </div>
            <div className="p-2.5 rounded-lg bg-slate-950 border border-white/[0.06]">
              <span className="text-slate-500 text-[10px] block mb-1">LATENCY</span>
              <span className="text-slate-200 font-bold tabular-nums">
                {selectedService.latencyMs !== null ? `${selectedService.latencyMs} ms` : 'N/A'}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-950 border border-white/[0.06] space-y-1">
            <span className="text-slate-500 text-[10px] block uppercase">DIAGNOSTIC LOG</span>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              {selectedService.details?.error || selectedService.details?.issue || selectedService.details?.notice || 'Service status reported by backend health telemetry daemon.'}
            </p>
          </div>
        </div>

        <div className="p-3 border-t border-white/[0.08] bg-slate-950/60 flex justify-end">
          <button
            onClick={() => setSelectedService(null)}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition text-xs cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <div className="soc-card p-5 flex flex-col justify-between relative h-full min-h-[380px]">
      {/* Notification Toast */}
      {notification && (
        <div className="absolute -top-9 left-1/2 -translate-x-1/2 bg-slate-800 text-slate-200 text-[10px] font-mono px-3 py-1 rounded-full border border-white/10 shadow-lg animate-in fade-in duration-200 z-50">
          {notification}
        </div>
      )}

      <div>
        {/* Card Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-xs md:text-sm text-slate-100 font-mono tracking-wide">
                  SYSTEM HEALTH
                </h3>
                <StatusBadge status={overall} size="xs" />
              </div>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                {healthyCount !== undefined && totalCount !== undefined ? (
                  <>
                    <strong className="text-emerald-400 tabular-nums">{healthyCount}</strong>/{totalCount} SUBSYSTEMS OPERATIONAL
                  </>
                ) : (
                  'POLLING PLATFORM DIAGNOSTICS...'
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={fetchHealth}
              disabled={loading}
              className="p-1.5 rounded-lg bg-slate-900 border border-white/10 text-slate-400 hover:text-white transition cursor-pointer"
              title="Refresh Health Telemetry"
              aria-label="Refresh Health"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
            </button>
            <Link
              href="/system-health"
              className="p-1.5 rounded-lg bg-slate-900 border border-white/10 text-slate-400 hover:text-emerald-400 transition flex items-center gap-1"
              title="Open Detailed System Diagnostics"
              aria-label="Open Diagnostics"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Services Health Grid */}
        <div className="mt-3 space-y-1.5 max-h-[240px] overflow-y-auto pr-1 custom-scrollbar">
          {loading && !healthData ? (
            <div className="py-8 text-center space-y-2 font-mono">
              <div className="w-5 h-5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-slate-400">Querying platform subsystem status...</p>
            </div>
          ) : services.length === 0 ? (
            <div className="py-6 text-center text-xs font-mono text-slate-400 bg-slate-950/60 rounded-lg border border-white/10">
              No registered services returned by health daemon.
            </div>
          ) : (
            displayServices.map((service: any) => (
              <button
                key={service.id}
                onClick={() => {
                  if (['DEGRADED', 'DOWN', 'SIMULATED'].includes(service.status)) {
                    setSelectedService(service);
                  }
                }}
                className={`flex items-center justify-between px-3 py-2 rounded-lg bg-slate-950/60 border border-white/[0.04] transition text-left w-full ${
                  ['DEGRADED', 'DOWN', 'SIMULATED'].includes(service.status)
                    ? 'cursor-pointer hover:border-white/20 hover:bg-slate-900/80'
                    : 'cursor-default hover:border-white/10'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
                  <StatusBadge status={service.status} size="xs" showIcon={false} />
                  <span className="text-xs font-medium text-slate-200 truncate font-sans">
                    {service.name}
                  </span>
                </div>

                <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400 shrink-0">
                  {service.latencyMs !== null && service.latencyMs !== undefined ? (
                    <span className="text-slate-300 bg-slate-900 px-1.5 py-0.5 rounded border border-white/[0.06] tabular-nums">
                      {service.latencyMs === 0 ? '<1' : service.latencyMs} ms
                    </span>
                  ) : (
                    <span className="text-slate-500 italic">N/A</span>
                  )}
                  {['DEGRADED', 'DOWN', 'SIMULATED'].includes(service.status) && (
                    <ChevronRight className="w-3 h-3 text-slate-500" />
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Card Footer */}
      <div className="mt-3 pt-3 border-t border-white/[0.06] flex items-center justify-between text-[10px] text-slate-400 font-mono">
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3 text-cyan-400" />
          Refreshed: {lastRefreshed || 'Just now'}
        </span>
        <Link href="/system-health" className="text-emerald-400 hover:underline font-semibold flex items-center gap-1">
          Full Diagnostics &rarr;
        </Link>
      </div>

      {/* Diagnostic Modal — rendered via portal to escape parent transform stacking context */}
      {isBrowser && selectedService && ReactDOM.createPortal(modalContent, document.body)}
    </div>
  );
};
