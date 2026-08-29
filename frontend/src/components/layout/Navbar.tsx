'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  Search,
  Shield,
  LogOut,
  Radio,
  Clock,
  Menu,
  ChevronRight
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useUIStore } from '@/store/useUIStore';
import { useAlertStore } from '@/store/useAlertStore';
import { SystemStatusHeader } from './SystemStatusHeader';

export const Navbar: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { currentUser, logout } = useAuthStore();
  const { toggleSidebar, isLiveFeedActive, toggleLiveFeed } = useUIStore();
  const { searchQuery, setSearchQuery } = useAlertStore();

  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-US', { hour12: false }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const getPageTitle = (path: string) => {
    switch (path) {
      case '/dashboard': return 'Command Center Overview';
      case '/alerts': return 'Threat Triage Workspace';
      case '/honeypots': return 'Adaptive Honeypots';
      case '/mitre': return 'MITRE ATT&CK Matrix';
      case '/system-health': return 'Subsystem Diagnostics';
      case '/settings': return 'Settings & Governance';
      default: return 'SOC Console';
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <header className="h-14 border-b border-white/[0.06] bg-[#070b14]/90 backdrop-blur-md sticky top-0 z-30 flex items-center shadow-sm select-none overflow-hidden">
      {/* Left side: Mobile Toggle & Page Breadcrumb — fills remaining space */}
      <div className="flex items-center gap-2 min-w-0 flex-1 px-3 md:px-5">
        <button
          onClick={toggleSidebar}
          className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition shrink-0 cursor-pointer"
          aria-label="Toggle Navigation Sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-1.5 min-w-0 text-xs font-mono">
          <span className="text-slate-500 uppercase tracking-wider hidden lg:inline shrink-0">
            RAKSHA
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600 hidden lg:inline shrink-0" />
          <span className="font-bold text-slate-100 tracking-tight truncate text-xs md:text-sm">
            {getPageTitle(pathname)}
          </span>
        </div>

        {/* Global Search Box */}
        <div className="relative hidden sm:block shrink-0 ml-3" style={{ width: 'clamp(100px, 14vw, 220px)' }}>
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search IP, vector, ID..."
            className="w-full bg-slate-950/80 border border-white/10 rounded-lg pl-8 pr-3 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 transition font-mono"
          />
        </div>
      </div>

      {/* Right side: fixed shrink-0 controls */}
      <div className="flex items-center gap-1.5 shrink-0 font-mono text-xs pr-3 md:pr-5">
        {/* System Status */}
        <SystemStatusHeader />

        {/* Live STOMP Stream toggle */}
        <button
          onClick={toggleLiveFeed}
          className={`hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-colors cursor-pointer text-[11px] ${
            isLiveFeedActive
              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/15'
              : 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/15'
          }`}
          title="Toggle WebSocket Live Telemetry Stream"
        >
          <Radio className={`w-3.5 h-3.5 ${isLiveFeedActive ? 'text-emerald-400' : 'text-amber-400'}`} />
          <span className="font-bold">{isLiveFeedActive ? 'LIVE' : 'PAUSED'}</span>
        </button>

        {/* UTC Clock — only on very wide screens */}
        <div className="hidden 2xl:flex items-center gap-1.5 text-[11px] text-slate-400 bg-slate-950 px-2.5 py-1.5 rounded-lg border border-white/10">
          <Clock className="w-3 h-3 text-cyan-400 shrink-0" />
          <span className="tabular-nums">{currentTime || '00:00:00'} UTC</span>
        </div>

        {/* Role Badge */}
        <div className="hidden md:flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-slate-950 border border-white/10 text-[11px] max-w-[140px]">
          <Shield className="w-3 h-3 text-emerald-400 shrink-0" />
          <span className="text-slate-300 truncate">
            {currentUser?.username || 'User'}
          </span>
          <span className="text-emerald-400 font-bold text-[10px] border-l border-white/10 pl-1.5 shrink-0">
            {currentUser?.role === 'ROLE_ADMIN' ? 'ADMIN' : currentUser?.role === 'ROLE_SOC_ANALYST' ? 'ANALYST' : 'VIEW ONLY'}
          </span>
        </div>

        {/* Sign Out */}
        <button
          onClick={handleLogout}
          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition cursor-pointer border border-white/10"
          title="Sign Out"
          aria-label="Sign Out"
        >
          <LogOut className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};
