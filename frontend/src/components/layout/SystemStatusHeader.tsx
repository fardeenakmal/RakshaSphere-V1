'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Activity, AlertTriangle, XCircle, CheckCircle2, Shield } from 'lucide-react';
import { useHealthStore } from '@/store/useHealthStore';

export const SystemStatusHeader: React.FC = () => {
  const { healthData, isLoading, error, subscribeToPolling, unsubscribeFromPolling } = useHealthStore();

  useEffect(() => {
    subscribeToPolling();
    return () => unsubscribeFromPolling();
  }, [subscribeToPolling, unsubscribeFromPolling]);

  const overall = isLoading && !healthData
    ? 'LOADING'
    : error && !healthData
      ? 'UNKNOWN'
      : healthData?.overallStatus || 'UNKNOWN';

  const healthyCount = healthData?.summary?.healthy;
  const totalCount = healthData?.summary?.total;

  let badgeColor = 'bg-slate-800/80 text-slate-300 border-slate-700';
  let dotColor = 'bg-slate-400';
  let Icon = Activity;

  if (overall === 'HEALTHY') {
    badgeColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20';
    dotColor = 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]';
    Icon = CheckCircle2;
  } else if (overall === 'DEGRADED') {
    badgeColor = 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20';
    dotColor = 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]';
    Icon = AlertTriangle;
  } else if (overall === 'DOWN') {
    badgeColor = 'bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20';
    dotColor = 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse';
    Icon = XCircle;
  } else if (overall === 'LOADING') {
    badgeColor = 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
    dotColor = 'bg-cyan-400 animate-ping';
  }

  const summary = healthData?.summary;
  const tooltipText = isLoading && !healthData
    ? "Checking platform health..."
    : error && !healthData
      ? `Health telemetry unavailable (${error})`
      : `${healthyCount ?? 0} of ${totalCount ?? 13} monitored services operational.`;

  return (
    <Link
      href="/system-health"
      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-mono transition-all duration-300 group ${badgeColor}`}
      title={tooltipText}
    >
      <span className={`w-2 h-2 rounded-full ${dotColor}`} />
      <span className="font-semibold tracking-wide flex items-center gap-1.5">
        SYSTEM STATUS <span className="text-white/30">•</span> <span className="font-bold">{overall === 'LOADING' ? 'CHECKING...' : overall}</span>
      </span>
      {healthyCount !== undefined && healthyCount !== null && totalCount !== undefined && totalCount !== null && (
        <span className="text-[10px] text-slate-300 border-l border-white/20 pl-2 hidden sm:inline font-bold tabular-nums">
          {healthyCount}/{totalCount}
        </span>
      )}
    </Link>
  );
};

