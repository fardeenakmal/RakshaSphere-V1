'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { CheckCircle2, AlertTriangle, XCircle, Activity } from 'lucide-react';
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

  let badgeColor = 'bg-slate-900 text-slate-300 border-white/10';
  let dotColor = 'bg-slate-400';

  if (overall === 'HEALTHY') {
    badgeColor = 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/15';
    dotColor = 'bg-emerald-400';
  } else if (overall === 'DEGRADED') {
    badgeColor = 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/15';
    dotColor = 'bg-amber-400';
  } else if (overall === 'DOWN') {
    badgeColor = 'bg-rose-500/10 text-rose-300 border-rose-500/30 hover:bg-rose-500/15';
    dotColor = 'bg-rose-400 animate-pulse';
  } else if (overall === 'LOADING') {
    badgeColor = 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30';
    dotColor = 'bg-cyan-400 animate-pulse';
  }

  const tooltipText = isLoading && !healthData
    ? "Checking platform health..."
    : error && !healthData
      ? `Health telemetry unavailable (${error})`
      : `${healthyCount ?? 0} of ${totalCount ?? 13} monitored services operational. Click for diagnostics.`;

  return (
    <Link
      href="/system-health"
      className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs font-mono transition-colors ${badgeColor}`}
      title={tooltipText}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`} />
      <span className="font-semibold tracking-tight text-[11px] hidden sm:inline">
        SYSTEM
      </span>
      <span className="font-bold text-[11px]">
        {overall === 'LOADING' ? 'CHECKING...' : overall}
      </span>
      {healthyCount !== undefined && healthyCount !== null && totalCount !== undefined && totalCount !== null && (
        <span className="text-[10px] text-slate-400 border-l border-white/10 pl-1.5 font-mono tabular-nums">
          {healthyCount}/{totalCount}
        </span>
      )}
    </Link>
  );
};
