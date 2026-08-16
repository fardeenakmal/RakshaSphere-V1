'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  Search,
  Shield,
  LogOut,
  Radio,
  Clock,
  Menu
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
      case '/alerts': return 'Threat Triage Feed';
      case '/honeypots': return 'Deception Honeypots';
      case '/mitre': return 'MITRE ATT&CK Matrix';
      case '/system-health': return 'System Health Diagnostics';
      case '/settings': return 'Settings & Governance';
      default: return 'SOC Console';
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <header className="h-16 border-b border-white/5 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-30 px-3 md:px-6 flex items-center justify-between shadow-[0_4px_24px_rgba(0,0,0,0.15)] min-w-0 select-none">
      {/* Left side: Mobile Toggle & Page Context Title */}
      <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
        <button
          onClick={toggleSidebar}
          className="md:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition shrink-0 cursor-pointer"
          aria-label="Toggle Navigation Sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex flex-col min-w-0 shrink">
          <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest truncate hidden sm:block">
            RakshaSphere Platform
          </span>
          <span className="font-extrabold text-xs md:text-sm text-slate-100 font-mono tracking-tight truncate">
            {getPageTitle(pathname)}
          </span>
        </div>

        {/* Global Search Box (Shrinks dynamically on tighter viewports) */}
        <div className="relative w-32 sm:w-44 md:w-56 lg:w-64 hidden sm:block shrink min-w-[90px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search IP, Attack..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 transition shadow-inner font-mono truncate"
          />
        </div>
      </div>

      {/* Right side: System Status, Live STOMP Stream, Clock, Role Switcher, Profile */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        {/* Priority 1: System Status Indicator */}
        <SystemStatusHeader />

        {/* Priority 2: Real-time WebSocket toggle pill */}
        <button
          onClick={toggleLiveFeed}
          className={`hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-mono border transition-all cursor-pointer ${
            isLiveFeedActive
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
              : 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
          }`}
          title="Toggle WebSocket Live Telemetry Stream"
        >
          <Radio className={`w-3.5 h-3.5 ${isLiveFeedActive ? 'animate-pulse text-emerald-400' : ''}`} />
          <span className="font-bold">{isLiveFeedActive ? 'LIVE' : 'PAUSED'}</span>
        </button>

        {/* Priority 3: Live UTC Clock */}
        <div className="hidden xl:flex items-center gap-1.5 text-xs font-mono text-slate-400 bg-slate-900 px-2.5 py-1.5 rounded-xl border border-slate-800">
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          <span className="tabular-nums">{currentTime || '16:55:00'} UTC</span>
        </div>

        {/* Priority 4: Role Display Badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-200">
          <Shield className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="font-bold text-emerald-400">
            {currentUser?.username || 'User'} ({currentUser?.role === 'ROLE_ADMIN' ? 'ADMIN' : currentUser?.role === 'ROLE_SOC_ANALYST' ? 'ANALYST' : 'OBSERVER'})
          </span>
        </div>

        {/* Priority 0: User Avatar & Logout */}
        <div className="flex items-center gap-1.5 pl-1.5 border-l border-slate-800/80">
          <img
            src={currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
            alt={currentUser?.name || 'User'}
            className="w-7 h-7 rounded-full border border-emerald-500/40 object-cover shrink-0"
            title={`${currentUser?.name || 'User'} (${currentUser?.role || 'ROLE_ADMIN'})`}
          />

          <button
            onClick={handleLogout}
            className="p-1.5 rounded-xl text-slate-400 hover:text-red-400 hover:bg-slate-800 transition cursor-pointer"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};


