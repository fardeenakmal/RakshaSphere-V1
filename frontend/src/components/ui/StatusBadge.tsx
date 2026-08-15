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
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  labelOverride?: string;
  title?: string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  showIcon = true,
  labelOverride,
  title,
  className = ''
}) => {
  const normStatus = (status || '').toUpperCase();

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-[10px] gap-1 rounded',
    md: 'px-2.5 py-1 text-xs gap-1.5 rounded-lg',
    lg: 'px-3 py-1.5 text-xs gap-2 rounded-xl font-bold',
  };

  let styleConfig = {
    bg: 'bg-slate-800/80 text-slate-300 border-slate-700',
    dot: 'bg-slate-400',
    icon: Info,
    label: normStatus
  };

  switch (normStatus) {
    case 'CRITICAL':
      styleConfig = {
        bg: 'bg-red-500/10 text-red-400 border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.15)]',
        dot: 'bg-red-500 animate-pulse',
        icon: ShieldAlert,
        label: 'CRITICAL'
      };
      break;

    case 'HIGH':
      styleConfig = {
        bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.15)]',
        dot: 'bg-amber-400',
        icon: AlertTriangle,
        label: 'HIGH'
      };
      break;

    case 'MEDIUM':
      styleConfig = {
        bg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
        dot: 'bg-cyan-400',
        icon: Info,
        label: 'MEDIUM'
      };
      break;

    case 'LOW':
      styleConfig = {
        bg: 'bg-slate-800 text-slate-400 border-slate-700',
        dot: 'bg-slate-400',
        icon: Info,
        label: 'LOW'
      };
      break;

    case 'HEALTHY':
      styleConfig = {
        bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.15)]',
        dot: 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]',
        icon: CheckCircle2,
        label: 'HEALTHY'
      };
      break;

    case 'DEGRADED':
      styleConfig = {
        bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.15)]',
        dot: 'bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.8)]',
        icon: AlertTriangle,
        label: 'DEGRADED'
      };
      break;

    case 'DOWN':
      styleConfig = {
        bg: 'bg-red-500/10 text-red-400 border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.2)]',
        dot: 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.8)] animate-pulse',
        icon: XCircle,
        label: 'DOWN'
      };
      break;

    case 'SIMULATED':
      styleConfig = {
        bg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30 shadow-[0_0_10px_rgba(6,182,212,0.15)]',
        dot: 'bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.8)]',
        icon: Activity,
        label: 'SIMULATED'
      };
      break;

    case 'ACTIVE':
      styleConfig = {
        bg: 'bg-red-500/10 text-red-400 border-red-500/30 animate-pulse',
        dot: 'bg-red-500',
        icon: Zap,
        label: 'ACTIVE THREAT'
      };
      break;

    case 'CONTAINED':
      styleConfig = {
        bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
        dot: 'bg-emerald-400',
        icon: ShieldCheck,
        label: 'CONTAINED (eBPF)'
      };
      break;

    case 'HONEYPOT_DIVERTED':
      styleConfig = {
        bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
        dot: 'bg-amber-400',
        icon: Bug,
        label: 'HONEYPOT TRAPPED'
      };
      break;

    case 'RESOLVED':
      styleConfig = {
        bg: 'bg-slate-800/90 text-slate-400 border-slate-700',
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
      className={`inline-flex items-center font-mono font-bold border transition-all ${sizeStyles[size]} ${styleConfig.bg} ${className}`}
      title={title || (normStatus === 'SIMULATED' ? 'JNI Prototype Simulation — native kernel/hardware component not active.' : undefined)}
    >
      {showIcon && <IconComponent className="w-3.5 h-3.5 shrink-0" />}
      <span className="truncate">{labelText}</span>
    </span>
  );
};
