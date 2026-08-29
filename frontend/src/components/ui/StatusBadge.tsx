'use client';

import React from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  Zap,
  Bug,
  Activity,
  Info
} from 'lucide-react';

export type StatusVariant =
  | 'CRITICAL'
  | 'HIGH'
  | 'MEDIUM'
  | 'LOW'
  | 'INFO'
  | 'HEALTHY'
  | 'DEGRADED'
  | 'DOWN'
  | 'SIMULATED'
  | 'ACTIVE'
  | 'CONTAINED'
  | 'HONEYPOT_DIVERTED'
  | 'RESOLVED';

interface StatusBadgeProps {
  status: StatusVariant | string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  showDot?: boolean;
  labelOverride?: string;
  title?: string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  showIcon = true,
  showDot = true,
  labelOverride,
  title,
  className = ''
}) => {
  const normStatus = (status || '').toUpperCase();

  const sizeStyles = {
    xs: 'px-1.5 py-0.5 text-[10px] gap-1 rounded',
    sm: 'px-2 py-0.5 text-[11px] gap-1.5 rounded-md font-semibold',
    md: 'px-2.5 py-1 text-xs gap-1.5 rounded-lg font-semibold',
    lg: 'px-3 py-1.5 text-xs gap-2 rounded-lg font-bold',
  };

  let styleConfig = {
    bg: 'bg-slate-900 text-slate-300 border-white/10',
    dot: 'bg-slate-400',
    icon: Info,
    label: normStatus
  };

  switch (normStatus) {
    case 'CRITICAL':
      styleConfig = {
        bg: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
        dot: 'bg-rose-400 animate-pulse',
        icon: ShieldAlert,
        label: 'CRITICAL'
      };
      break;

    case 'HIGH':
      styleConfig = {
        bg: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
        dot: 'bg-amber-400',
        icon: AlertTriangle,
        label: 'HIGH'
      };
      break;

    case 'MEDIUM':
      styleConfig = {
        bg: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',
        dot: 'bg-yellow-400',
        icon: Info,
        label: 'MEDIUM'
      };
      break;

    case 'LOW':
      styleConfig = {
        bg: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
        dot: 'bg-sky-400',
        icon: Info,
        label: 'LOW'
      };
      break;

    case 'HEALTHY':
      styleConfig = {
        bg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
        dot: 'bg-emerald-400',
        icon: CheckCircle2,
        label: 'HEALTHY'
      };
      break;

    case 'DEGRADED':
      styleConfig = {
        bg: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
        dot: 'bg-amber-400',
        icon: AlertTriangle,
        label: 'DEGRADED'
      };
      break;

    case 'DOWN':
      styleConfig = {
        bg: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
        dot: 'bg-rose-400 animate-pulse',
        icon: XCircle,
        label: 'DOWN'
      };
      break;

    case 'SIMULATED':
      styleConfig = {
        bg: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
        dot: 'bg-cyan-400',
        icon: Activity,
        label: 'SIMULATED'
      };
      break;

    case 'NOT_DEPLOYED':
    case 'NOT DEPLOYED':
      styleConfig = {
        bg: 'bg-slate-900 text-slate-400 border-white/10',
        dot: 'bg-slate-500',
        icon: Info,
        label: 'NOT DEPLOYED'
      };
      break;

    case 'ACTIVE':
      styleConfig = {
        bg: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
        dot: 'bg-rose-400 animate-pulse',
        icon: Zap,
        label: 'ACTIVE THREAT'
      };
      break;

    case 'CONTAINED':
      styleConfig = {
        bg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
        dot: 'bg-emerald-400',
        icon: ShieldCheck,
        label: 'CONTAINED (eBPF)'
      };
      break;

    case 'HONEYPOT_DIVERTED':
      styleConfig = {
        bg: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
        dot: 'bg-amber-400',
        icon: Bug,
        label: 'HONEYPOT TRAPPED'
      };
      break;

    case 'RESOLVED':
      styleConfig = {
        bg: 'bg-slate-900 text-slate-300 border-white/10',
        dot: 'bg-slate-500',
        icon: CheckCircle2,
        label: 'RESOLVED'
      };
      break;
  }

  const IconComponent = styleConfig.icon;
  const labelText = labelOverride || styleConfig.label;

  return (
    <span
      className={`inline-flex items-center font-mono border transition-colors select-none ${sizeStyles[size]} ${styleConfig.bg} ${className}`}
      title={title || (normStatus === 'SIMULATED' ? 'JNI Prototype Simulation — native kernel/hardware component not active.' : undefined)}
    >
      {showDot && (
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${styleConfig.dot}`} />
      )}
      {showIcon && <IconComponent className="w-3.5 h-3.5 shrink-0" />}
      <span className="truncate">{labelText}</span>
    </span>
  );
};
