'use client';

import React from 'react';
import { ShieldCheck } from 'lucide-react';

export interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'NO OBSERVED ACTIVITY',
  description = 'No telemetry events recorded matching the current criteria.',
  icon = <ShieldCheck className="w-8 h-8 text-emerald-400" />,
  action,
  className = '',
}) => {
  return (
    <div
      className={`p-8 md:p-12 text-center font-mono space-y-3 flex flex-col items-center justify-center ${className}`}
    >
      <div className="p-3 rounded-xl bg-slate-900 border border-white/10 text-slate-300 shadow-sm">
        {icon}
      </div>
      <h4 className="font-bold text-xs md:text-sm text-slate-200 uppercase tracking-wider">
        {title}
      </h4>
      <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
        {description}
      </p>
      {action && <div className="pt-2">{action}</div>}
    </div>
  );
};
