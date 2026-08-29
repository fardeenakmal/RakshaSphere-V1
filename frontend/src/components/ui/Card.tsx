'use client';

import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'bordered';
  interactive?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  interactive = false,
  className = '',
  ...props
}) => {
  const variantClass =
    variant === 'elevated'
      ? 'bg-slate-900/95 border border-white/10 shadow-xl'
      : variant === 'bordered'
      ? 'bg-slate-950/80 border border-white/10'
      : 'soc-card';

  return (
    <div
      className={`${variantClass} ${interactive ? 'soc-card-interactive' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <div className={`soc-card-header ${className}`} {...props}>
      {children}
    </div>
  );
};

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <h3
      className={`font-mono text-xs md:text-sm font-bold text-slate-100 uppercase tracking-wider ${className}`}
      {...props}
    >
      {children}
    </h3>
  );
};

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <div className={`soc-card-body ${className}`} {...props}>
      {children}
    </div>
  );
};

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`px-5 py-3 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono text-slate-400 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

// High-Density Metric Card Helper
export interface MetricCardProps {
  label: string;
  value: React.ReactNode;
  subtext?: string;
  badge?: React.ReactNode;
  icon?: React.ReactNode;
  trend?: string;
  progress?: number;
  progressColor?: string;
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  subtext,
  badge,
  icon,
  trend,
  progress,
  progressColor = 'bg-emerald-400',
  className = '',
}) => {
  return (
    <div className={`soc-card p-4 md:p-5 flex flex-col justify-between ${className}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] md:text-[11px] font-mono text-slate-400 font-semibold uppercase tracking-wider truncate">
          {label}
        </span>
        {icon ? (
          <div className="p-1.5 rounded-lg bg-slate-900 border border-white/10 text-slate-300 shrink-0">
            {icon}
          </div>
        ) : (
          badge
        )}
      </div>

      <div className="mt-3 flex items-baseline justify-between gap-2">
        <div className="text-2xl md:text-3xl font-extrabold font-mono tabular-nums text-slate-100">
          {value}
        </div>
        {trend && (
          <span className="text-[11px] font-mono font-bold text-emerald-400 shrink-0">
            {trend}
          </span>
        )}
      </div>

      {progress !== undefined && (
        <div className="w-full bg-slate-900 h-1.5 rounded-full mt-3 overflow-hidden border border-white/5">
          <div
            className={`h-full transition-all duration-500 ${progressColor}`}
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      )}

      {subtext && (
        <p className="text-[10px] md:text-[11px] text-slate-400 font-mono mt-2 truncate">
          {subtext}
        </p>
      )}
    </div>
  );
};

// Section Header with Title & Action Controls
export interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  badge,
  actions,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.06] pb-3.5 ${className}`}
    >
      <div>
        <div className="flex items-center gap-2.5">
          <h2 className="text-base md:text-lg font-bold text-slate-100 tracking-tight">
            {title}
          </h2>
          {badge}
        </div>
        {subtitle && (
          <p className="text-xs font-mono text-slate-400 mt-0.5">
            {subtitle}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
};

// Key-Value Data Row
export interface DataRowProps {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
  className?: string;
}

export const DataRow: React.FC<DataRowProps> = ({
  label,
  value,
  mono = true,
  className = '',
}) => {
  return (
    <div
      className={`flex items-center justify-between py-1.5 text-xs border-b border-white/[0.04] last:border-0 ${className}`}
    >
      <span className="text-slate-400 font-mono text-[11px]">{label}</span>
      <span
        className={`font-semibold text-slate-200 ${
          mono ? 'font-mono tabular-nums' : ''
        }`}
      >
        {value}
      </span>
    </div>
  );
};
