'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'outline' | 'icon';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'secondary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-mono font-medium transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 focus-visible:ring-offset-1 focus-visible:ring-offset-slate-950 disabled:opacity-40 disabled:cursor-not-allowed select-none cursor-pointer tracking-tight';

  const sizeStyles = {
    xs: 'px-2 py-1 text-[11px] rounded-md gap-1',
    sm: 'px-2.5 py-1.5 text-xs rounded-lg gap-1.5',
    md: 'px-3.5 py-2 text-xs rounded-lg gap-2 font-semibold',
    lg: 'px-5 py-2.5 text-sm rounded-lg gap-2.5 font-bold',
  };

  const variantStyles = {
    primary: 'bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 font-bold border border-emerald-400/40 shadow-sm shadow-emerald-500/10',
    secondary: 'bg-slate-900/90 hover:bg-slate-800 active:bg-slate-900 text-slate-200 border border-white/10 hover:border-white/20',
    outline: 'bg-transparent hover:bg-slate-900/80 active:bg-slate-900 text-slate-300 border border-slate-700 hover:border-slate-500',
    ghost: 'bg-transparent hover:bg-slate-800/60 active:bg-slate-800 text-slate-400 hover:text-slate-100',
    danger: 'bg-rose-500/15 hover:bg-rose-500/25 active:bg-rose-500/30 text-rose-300 border border-rose-500/30 hover:border-rose-500/50',
    success: 'bg-emerald-500/15 hover:bg-emerald-500/25 active:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 hover:border-emerald-500/50',
    icon: 'p-2 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-slate-400 hover:text-slate-100 border border-white/10',
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin text-current shrink-0" />
      ) : (
        leftIcon && <span className="shrink-0">{leftIcon}</span>
      )}
      {children && <span>{children}</span>}
      {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
    </button>
  );
};
