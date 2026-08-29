'use client';

import React from 'react';
import { ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options?: SelectOption[];
  selectSize?: 'sm' | 'md' | 'lg';
  error?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      options,
      children,
      selectSize = 'md',
      error,
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    const sizeStyles = {
      sm: 'py-1.5 text-xs',
      md: 'py-2 text-xs',
      lg: 'py-2.5 text-sm',
    };

    return (
      <div className="w-full space-y-1.5 font-mono">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider"
          >
            {label}
          </label>
        )}

        <div className="relative flex items-center">
          <select
            id={selectId}
            ref={ref}
            className={`w-full bg-slate-950/90 text-slate-200 border rounded-lg pl-3 pr-8 transition-all duration-150 font-mono appearance-none cursor-pointer focus:outline-none ${
              error
                ? 'border-rose-500/60 focus:border-rose-400 focus:ring-1 focus:ring-rose-500/30'
                : 'border-white/10 hover:border-white/20 focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30'
            } ${sizeStyles[selectSize]} ${className}`}
            {...props}
          >
            {options
              ? options.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-slate-900 text-slate-200">
                    {opt.label}
                  </option>
                ))
              : children}
          </select>
          <ChevronDown className="w-4 h-4 absolute right-2.5 text-slate-400 pointer-events-none" />
        </div>

        {error && <p className="text-[11px] text-rose-400 font-mono">{error}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';
