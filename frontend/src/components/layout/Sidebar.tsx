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

interface NavGroup {
  groupName: string;
  items: {
    name: string;
    href: string;
    icon: React.ElementType;
    badge?: string;
  }[];
}

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar, setSidebarOpen } = useUIStore();

  const navGroups: NavGroup[] = [
    {
      groupName: 'COMMAND CENTER',
      items: [
        {
          name: 'Dashboard',
          href: '/dashboard',
          icon: LayoutDashboard,
        },
        {
          name: 'Threat Triage',
          href: '/alerts',
          icon: ShieldAlert,
          badge: 'Live'
        }
      ]
    },
    {
      groupName: 'DEFENSE',
      items: [
        {
          name: 'Honeypots',
          href: '/honeypots',
          icon: Bug,
          badge: 'Traps'
        },
        {
          name: 'MITRE ATT&CK',
          href: '/mitre',
          icon: Grid3X3
        }
      ]
    },
    {
      groupName: 'INFRASTRUCTURE',
      items: [
        {
          name: 'System Health',
          href: '/system-health',
          icon: Activity,
          badge: '13 Nodes'
        }
      ]
    },
    {
      groupName: 'ADMINISTRATION',
      items: [
        {
          name: 'Settings',
          href: '/settings',
          icon: Settings
        }
      ]
    }
  ];

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm md:hidden transition-opacity duration-300"
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-50 h-screen transition-all duration-300 border-r bg-slate-950/95 backdrop-blur-xl border-white/10 text-slate-200 flex flex-col justify-between shadow-[4px_0_24px_rgba(0,0,0,0.4)] select-none ${
          sidebarOpen
            ? 'w-64 translate-x-0'
            : '-translate-x-full md:translate-x-0 md:w-20'
        }`}
      >
        {/* Brand Header */}
        <div>
          <div className={`flex items-center h-16 border-b border-slate-800/80 ${sidebarOpen ? 'px-4 justify-between' : 'justify-center'}`}>
            <Link href="/dashboard" className={`flex items-center shrink-0 overflow-hidden ${sidebarOpen ? 'gap-3' : ''}`} title="RakshaSphere SOC Console">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shrink-0 shadow-lg shadow-emerald-500/10">
                <ShieldCheck className="w-6 h-6 animate-pulse" />
              </div>
              {sidebarOpen && (
                <div className="flex flex-col min-w-0">
                  <span className="font-extrabold text-base tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400 font-sans truncate">
                    RAKSHASPHERE
                  </span>
                  <span className="text-[9px] text-slate-400 tracking-widest font-mono uppercase truncate">
                    Enterprise SOC
                  </span>
                </div>
              )}
            </Link>

            <button
              onClick={toggleSidebar}
              className={`rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition cursor-pointer shrink-0 hidden md:block ${sidebarOpen ? 'p-1.5' : 'p-1 ml-1'}`}
              title={sidebarOpen ? 'Collapse Sidebar' : 'Expand Sidebar'}
            >
              {sidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            </button>
          </div>

          {/* Navigation Items Grouped into Sections */}
          <nav className="p-3 space-y-4 overflow-y-auto max-h-[calc(100vh-14rem)] custom-scrollbar">
            {navGroups.map((group) => (
              <div key={group.groupName} className="space-y-1">
                {sidebarOpen && (
                  <div className="text-[9px] font-mono font-bold tracking-widest text-slate-400/80 px-2.5 uppercase mb-1 truncate">
                    {group.groupName}
                  </div>
                )}

                {group.items.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={!sidebarOpen ? item.name : undefined}
                      className={`flex items-center gap-3 rounded-xl font-medium text-xs transition-all duration-200 group ${
                        isActive
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold shadow-[0_0_12px_rgba(16,185,129,0.15)]'
                          : 'text-slate-400 hover:text-slate-100 hover:bg-white/5 border border-transparent'
                      } ${
                        sidebarOpen
                          ? 'px-3 py-2.5 justify-start'
                          : 'w-11 h-11 mx-auto justify-center p-0'
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-emerald-400' : 'text-slate-400 group-hover:text-slate-200'}`} />
                      {sidebarOpen && <span className="truncate flex-1">{item.name}</span>}
                      {sidebarOpen && item.badge && (
                        <span
                          className={`ml-auto px-2 py-0.5 text-[9px] font-mono font-bold rounded-full shrink-0 ${
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
              </div>
            ))}
          </nav>
        </div>

        {/* System Status Footer */}
        {sidebarOpen ? (
          <div className="p-3.5 m-3 rounded-xl bg-slate-900/90 border border-slate-800/80 space-y-2.5">
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
              <span className="flex items-center gap-1.5" title="JNI prototype simulation — native kernel XDP enforcement not active.">
                <Zap className="w-3.5 h-3.5 text-cyan-400" /> eBPF XDP
              </span>
              <span className="text-cyan-400 font-bold text-[10px]" title="JNI prototype simulation — native kernel XDP enforcement not active.">SIMULATED</span>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
              <span className="flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" /> STOMP Stream
              </span>
              <span className="text-emerald-400 font-bold text-[10px]">CONNECTED</span>
            </div>

            <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-500 to-cyan-500 h-full w-[98%]" />
            </div>
          </div>
        ) : (
          <div className="p-3 flex justify-center border-t border-slate-800/80 mb-2" title="RakshaSphere Security Mesh Active">
            <Activity className="w-5 h-5 text-emerald-400 animate-pulse" />
          </div>
        )}
      </aside>
    </>
  );
};
