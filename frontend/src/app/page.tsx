'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { ShieldCheck } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, isInitializing, initializeAuth } = useAuthStore();

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (!isInitializing) {
      if (isAuthenticated) {
        router.replace('/dashboard');
      } else {
        router.replace('/login');
      }
    }
  }, [isInitializing, isAuthenticated, router]);

  return (
    <div className="min-h-screen bg-[#070a11] text-slate-100 flex flex-col items-center justify-center space-y-4 font-mono text-xs">
      <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
        <ShieldCheck className="w-8 h-8 animate-pulse" />
      </div>
      <p className="text-slate-400 uppercase tracking-widest animate-pulse">
        Initializing RakshaSphere Operations Mesh...
      </p>
    </div>
  );
}
