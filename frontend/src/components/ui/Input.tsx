'use client';

import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  inputSize?: 'sm' | 'md' | 'lg';
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      hint,
      leftIcon,
      rightIcon,
      inputSize = 'md',
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    const sizeStyles = {
      sm: 'py-1.5 text-xs',
      md: 'py-2 text-xs',
      lg: 'py-2.5 text-sm',
    };

    return (
      <div className="w-full space-y-1.5 font-mono">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider"
          >
            {label}
          </label>
        )}

        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3 text-slate-400 pointer-events-none flex items-center shrink-0">
              {leftIcon}
            </div>
          )}

          <input
            id={inputId}
            ref={ref}
            className={`w-full bg-slate-950/90 text-slate-100 placeholder-slate-500 border rounded-lg transition-all duration-150 font-mono focus:outline-none ${
              error
                ? 'border-rose-500/60 focus:border-rose-400 focus:ring-1 focus:ring-rose-500/30'
                : 'border-white/10 hover:border-white/20 focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30'
            } ${leftIcon ? 'pl-9' : 'pl-3'} ${rightIcon ? 'pr-9' : 'pr-3'} ${
              sizeStyles[inputSize]
            } ${className}`}
            {...props}
          />

          {rightIcon && (
            <div className="absolute right-3 text-slate-400 flex items-center shrink-0">
              {rightIcon}
            </div>
          )}
        </div>

        {error && (
          <p className="text-[11px] text-rose-400 font-mono flex items-center gap-1">
            {error}
          </p>
        )}

        {!error && hint && (
          <p className="text-[10px] text-slate-400 font-mono">{hint}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
