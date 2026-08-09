'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ShieldAlert,
  LayoutDashboard,
  Radio,
  Bug,
  Grid3X3,
  Settings,
  Activity,
  Zap,
  ChevronLeft,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { useUIStore } from '@/store/useUIStore';

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar } = useUIStore();

  const navItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      badge: 'Live'
    },
    {
      name: 'Threat Triage',
      href: '/alerts',
      icon: ShieldAlert,
      badge: 'Live'
    },
    {
      name: 'Honeypots',
      href: '/honeypots',
      icon: Bug,
      badge: '4 Traps'
    },
    {
      name: 'MITRE ATT&CK',
      href: '/mitre',
      icon: Grid3X3
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: Settings
    }
  ];

  return (
    <aside
      className={`fixed left-0 top-0 z-40 h-screen transition-all duration-300 border-r bg-slate-950/40 backdrop-blur-xl border-white/5 text-slate-200 flex flex-col justify-between shadow-[4px_0_24px_rgba(0,0,0,0.1)] ${
        sidebarOpen ? 'w-64' : 'w-20'
      }`}
    >
      {/* Brand Header */}
      <div>
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-800/80">
          <Link href="/dashboard" className="flex items-center gap-3 overflow-hidden">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shrink-0 shadow-lg shadow-emerald-500/10">
              <ShieldCheck className="w-6 h-6 animate-pulse" />
            </div>
            {sidebarOpen && (
              <div className="flex flex-col">
                <span className="font-extrabold text-lg tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400">
                  RAKSHASPHERE
                </span>
                <span className="text-[10px] text-slate-400 tracking-widest font-mono uppercase">
                  Autonomous Cyber Defense
                </span>
              </div>
            )}
          </Link>
          <button
            onClick={toggleSidebar}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Toggle Sidebar"
          >
            {sidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1.5 mt-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-300 group ${
                  isActive
                    ? 'bg-gradient-to-r from-emerald-500/10 to-cyan-500/5 text-emerald-400 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.15)] font-bold'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-white/5'
                } ${!sidebarOpen ? 'justify-center px-0' : ''}`}
              >
                <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                {sidebarOpen && <span className="truncate">{item.name}</span>}
                {sidebarOpen && item.badge && (
                  <span
                    className={`ml-auto px-2 py-0.5 text-[10px] font-mono font-bold rounded-full ${
                      item.badge === 'Live'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse'
                        : 'bg-slate-800 text-slate-300 border border-slate-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* System Status Footer */}
      {sidebarOpen ? (
        <div className="p-4 m-3 rounded-2xl bg-slate-900/80 border border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-emerald-400 animate-pulse" /> eBPF XDP Engine
            </span>
            <span className="text-emerald-400 font-bold">Active</span>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span className="flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-cyan-400" /> STOMP WS Feed
            </span>
            <span className="text-cyan-400 font-bold">Connected</span>
          </div>

          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-500 to-cyan-500 h-full w-[98%]" />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span>Self-Healing Latency</span>
            <span className="font-mono text-slate-300 font-semibold">112 ms</span>
          </div>
        </div>
      ) : (
        <div className="p-3 flex justify-center border-t border-slate-800">
          <Activity className="w-5 h-5 text-emerald-400 animate-pulse" />
        </div>
      )}
    </aside>
  );
};
