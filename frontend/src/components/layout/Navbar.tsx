'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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

export const Navbar: React.FC = () => {
  const router = useRouter();
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

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <header className="h-16 border-b border-white/5 bg-slate-950/40 backdrop-blur-xl sticky top-0 z-30 px-4 md:px-6 flex items-center justify-between shadow-[0_4px_30px_rgba(0,0,0,0.1)]">
      {/* Left side: Mobile Toggle & Global Search */}
      <div className="flex items-center gap-4 flex-1 max-w-md">
        <button
          onClick={toggleSidebar}
          className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="relative w-full hidden sm:block">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search IP, Attack Type, MITRE Tactic..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 transition shadow-inner"
          />
        </div>
      </div>

      {/* Right side: Live WebSocket Pill, Time, Role Display, User Profile */}
      <div className="flex items-center gap-3 md:gap-5">
        {/* Real-time WebSocket toggle pill */}
        <button
          onClick={toggleLiveFeed}
          className={`hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono border transition-all ${
            isLiveFeedActive
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
              : 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
          }`}
          title="Toggle WebSocket Live Stream"
        >
          <Radio className={`w-3.5 h-3.5 ${isLiveFeedActive ? 'animate-pulse text-emerald-400' : ''}`} />
          <span>{isLiveFeedActive ? 'WS STREAM: ACTIVE' : 'WS STREAM: PAUSED'}</span>
        </button>

        {/* Live Clock */}
        <div className="hidden md:flex items-center gap-1.5 text-xs font-mono text-slate-400 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          <span>{currentTime || '16:55:00'} UTC</span>
        </div>

        {/* Role Display Pill */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-200">
          <Shield className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden sm:inline font-semibold">{currentUser?.role || 'ROLE_ADMIN'}</span>
        </div>

        {/* User Info & Logout */}
        <div className="flex items-center gap-3 pl-2 border-l border-slate-800">
          <div className="flex items-center gap-2">
            <img
              src={currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
              alt={currentUser?.name || 'User'}
              className="w-8 h-8 rounded-full border border-emerald-500/40 object-cover"
            />
            <div className="hidden xl:flex flex-col">
              <span className="text-xs font-semibold text-slate-200">{currentUser?.name || 'SOC User'}</span>
              <span className="text-[10px] text-slate-400">{currentUser?.email || 'user@rakshasphere.internal'}</span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-slate-800 transition"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
