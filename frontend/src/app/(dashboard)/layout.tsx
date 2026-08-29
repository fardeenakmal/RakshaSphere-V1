'use client';

import React from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Navbar } from '@/components/layout/Navbar';
import { useUIStore } from '@/store/useUIStore';
import { AuthGuard } from '@/components/auth/AuthGuard';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { sidebarOpen } = useUIStore();

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#030712] text-slate-100 flex relative">
        {/* Sidebar Navigation */}
        <Sidebar />

        {/* Main Content Shell */}
        <div
          className={`flex-1 flex flex-col transition-all duration-200 min-w-0 ${
            sidebarOpen ? 'md:ml-64' : 'md:ml-20'
          }`}
        >
          {/* Top Security Command Bar */}
          <Navbar />

          {/* Dynamic Route Page Container with fluid width */}
          <main className="flex-1 p-4 md:p-6 lg:p-7 max-w-[1600px] w-full mx-auto space-y-6 overflow-x-hidden">
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
