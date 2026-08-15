'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Activity, ShieldCheck, AlertTriangle, RefreshCw, ExternalLink, Clock, X, ChevronRight } from 'lucide-react';
import { useHealthStore } from '@/store/useHealthStore';

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

  useEffect(() => {
    subscribeToPolling();
    return () => unsubscribeFromPolling();
  }, [subscribeToPolling, unsubscribeFromPolling]);

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



  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'HEALTHY':
        return (
          <span className="flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            HEALTHY
          </span>
        );
      case 'DEGRADED':
        return (
          <span className="flex items-center gap-1.5 text-xs font-mono font-bold text-amber-400">
            <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
            DEGRADED
          </span>
        );
      case 'DOWN':
        return (
          <span className="flex items-center gap-1.5 text-xs font-mono font-bold text-red-400">
            <span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse" />
            DOWN
          </span>
        );
      case 'SIMULATED':
        return (
          <span className="flex items-center gap-1.5 text-xs font-mono font-bold text-cyan-400" title="Prototype/simulated implementation. Not a verified production kernel/hardware component.">
            <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
            SIMULATED
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1.5 text-xs font-mono font-bold text-slate-400">
            <span className="w-2 h-2 rounded-full bg-slate-500" />
            {status}
          </span>
        );
    }
  };

  return (
    <div className="bg-slate-950/40 backdrop-blur-xl border border-white/5 rounded-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.12)] flex flex-col justify-between relative">
      {/* Subtle Notification */}
      {notification && (
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-slate-200 text-[10px] font-mono px-3 py-1.5 rounded-full border border-slate-700 shadow-lg animate-in slide-in-from-bottom-2 fade-in duration-300 z-50">
          {notification}
        </div>
      )}
      
      <div>
        {/* Card Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Activity className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-200 tracking-wide flex items-center gap-2">
                SYSTEM HEALTH
                <span className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded-full border ${
                  overall === 'HEALTHY' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                  overall === 'DEGRADED' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                  overall === 'DOWN' ? 'bg-red-500/10 text-red-400 border-red-500/30' :
                  overall === 'LOADING' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30 animate-pulse' :
                  'bg-slate-800 text-slate-400 border-slate-700'
                }`}>
                  {overall === 'LOADING' ? 'CHECKING...' : overall}
                </span>
              </h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                {healthyCount !== undefined && healthyCount !== null && totalCount !== undefined && totalCount !== null ? (
                  <>
                    <span className="text-emerald-400 font-bold tabular-nums">{healthyCount}</span>/{totalCount} SERVICES OPERATIONAL
                  </>
                ) : overall === 'LOADING' ? (
                  <span className="text-cyan-400 font-bold animate-pulse">POLLING SYSTEM DIAGNOSTICS...</span>
                ) : (
                  <span className="text-amber-400 font-bold">HEALTH TELEMETRY UNAVAILABLE</span>
                )}
              </p>

            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchHealth}
              disabled={loading}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition"
              title="Refresh Health Status"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
            </button>
            <Link
              href="/system-health"
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-emerald-400 transition flex items-center gap-1 text-xs font-mono"
              title="Open Detailed System Health Page"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Services Health Grid */}
        <div className="mt-4 space-y-2 max-h-[320px] overflow-y-auto pr-1 custom-scrollbar">
          {loading && !healthData ? (
            <div className="py-8 text-center space-y-3 font-mono">
              <div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-slate-400">Polling platform subsystem diagnostics...</p>
            </div>
          ) : error && !healthData ? (
            <div className="p-4 rounded-xl bg-slate-950 border border-red-500/20 text-center space-y-3 font-mono">
              <div className="flex items-center justify-center gap-2 text-red-400 text-xs font-bold">
                <AlertTriangle className="w-4 h-4" />
                <span>HEALTH DATA UNAVAILABLE</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Unable to establish connection to core health monitor telemetry daemon.
              </p>
              <button
                onClick={() => fetchHealth()}
                className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition flex items-center gap-1.5 mx-auto cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" /> RETRY DIAGNOSTICS
              </button>
            </div>
          ) : services.length === 0 ? (
            <div className="py-6 text-center text-xs font-mono text-slate-400 bg-slate-950 rounded-xl border border-slate-800">
              No registered services returned by health monitor.
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
                className={`flex items-center justify-between px-3 py-2 rounded-xl bg-slate-900/60 border border-slate-800/80 transition text-left w-full ${
                  ['DEGRADED', 'DOWN', 'SIMULATED'].includes(service.status) ? 'cursor-pointer hover:border-slate-600/80 hover:bg-slate-800/60' : 'cursor-default hover:border-slate-700/80'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2" title={service.name}>
                  <div className="shrink-0">{getStatusBadge(service.status)}</div>
                  <span className="text-xs font-medium text-slate-200 truncate">{service.name}</span>
                </div>

                <div className="flex items-center gap-3 font-mono text-[11px] text-slate-400 shrink-0">
                  {service.latencyMs !== null && service.latencyMs !== undefined ? (
                    <span className="text-slate-300 bg-slate-800/60 px-1.5 py-0.5 rounded border border-slate-700/50">
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
      <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400 font-mono">
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3 text-cyan-400" />
          Refreshed: {lastRefreshed || 'Just now'}
        </span>
        <Link href="/system-health" className="text-emerald-400 hover:underline font-semibold flex items-center gap-1">
          Diagnostics &rarr;
        </Link>
      </div>

      {/* Diagnostic Drawer / Modal */}
      {selectedService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedService(null)}>
          <div 
            className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-800/50">
              <h3 className="font-bold text-slate-200 font-mono text-sm truncate pr-4">{selectedService.name.toUpperCase()}</h3>
              <button 
                onClick={() => setSelectedService(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-4 space-y-4 font-mono text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-500 block mb-1">STATUS</span>
                  {getStatusBadge(selectedService.status)}
                </div>
                <div>
                  <span className="text-slate-500 block mb-1">LATENCY</span>
                  <span className="text-slate-200">{selectedService.latencyMs !== null ? `${selectedService.latencyMs === 0 ? '<1' : selectedService.latencyMs} ms` : 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block mb-1">LAST CHECKED</span>
                  <span className="text-slate-200">{selectedService.lastChecked ? new Date(selectedService.lastChecked).toLocaleTimeString() : 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block mb-1">LAST SUCCESS</span>
                  <span className="text-slate-200">{selectedService.lastSuccessfulCheck ? new Date(selectedService.lastSuccessfulCheck).toLocaleTimeString() : '--'}</span>
                </div>
              </div>

              <div className="space-y-2 mt-4">
                <span className="text-slate-500 block">REASON / DIAGNOSTIC</span>
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-slate-300">
                  {selectedService.details?.error || selectedService.details?.issue || selectedService.details?.notice || 'No detailed reason available. Service may be unreachable or intentionally disabled.'}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-800/30 flex justify-between gap-3">
              <button 
                onClick={() => { fetchHealth(); }}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition text-xs font-mono"
              >
                REFRESH
              </button>
              <button 
                onClick={() => setSelectedService(null)}
                className="px-4 py-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 transition text-xs font-mono font-bold"
              >
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
