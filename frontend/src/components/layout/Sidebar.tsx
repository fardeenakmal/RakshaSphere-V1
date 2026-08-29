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
  ShieldCheck,
  X
} from 'lucide-react';
import { useUIStore } from '@/store/useUIStore';
import { useHealthStore } from '@/store/useHealthStore';

interface NavGroup {
  groupName: string;
  items: {
    name: string;
    href: string;
    icon: React.ElementType;
    badge?: string;
    dotColor?: string;
  }[];
}

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar, setSidebarOpen } = useUIStore();
  const { healthData } = useHealthStore();

  const summary = healthData?.summary || { healthy: 13, total: 13 };
  const healthPercent = summary.total > 0
    ? Math.round((summary.healthy / summary.total) * 100)
    : 100;

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
          badge: 'Live',
          dotColor: 'bg-rose-400'
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
          badge: 'Traps',
          dotColor: 'bg-amber-400'
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
          badge: `${summary.healthy}/${summary.total}`,
          dotColor: 'bg-emerald-400'
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
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm md:hidden transition-opacity duration-200"
          aria-hidden="true"
        />
      )}

      <aside
        id="soc-sidebar"
        aria-label="SOC Navigation"
        className={`fixed left-0 top-0 z-50 h-screen transition-all duration-200 border-r bg-[#070b14] border-white/[0.06] text-slate-200 flex flex-col justify-between shadow-[4px_0_24px_rgba(0,0,0,0.5)] select-none ${
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
                  <span className="font-bold text-sm tracking-wider text-slate-100 font-mono truncate">
                    RAKSHASPHERE
                  </span>
                  <span className="text-[9px] text-emerald-400 font-mono tracking-widest uppercase truncate">
                    ENTERPRISE SOC
                  </span>
                </div>
              )}
            </Link>

            {/* Desktop Collapse Toggle */}
            <button
              onClick={toggleSidebar}
              className={`rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition cursor-pointer shrink-0 hidden md:block ${sidebarOpen ? 'p-1.5' : 'p-1 ml-1'}`}
              title={sidebarOpen ? 'Collapse Sidebar' : 'Expand Sidebar'}
              aria-label={sidebarOpen ? 'Collapse Sidebar' : 'Expand Sidebar'}
            >
              {sidebarOpen ? (
                <ChevronLeft className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>

            {/* Mobile Close Button */}
            {sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer shrink-0 md:hidden"
                aria-label="Close navigation"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Navigation Items Grouped into Sections */}
          <nav className="p-3 space-y-3 overflow-y-auto max-h-[calc(100vh-14rem)] custom-scrollbar">
            {navGroups.map((group, groupIdx) => (
              <div key={group.groupName} className="space-y-1">
                {sidebarOpen ? (
                  <div className="text-[10px] font-mono font-bold tracking-wider text-slate-500 px-2.5 uppercase mb-1 truncate">
                    {group.groupName}
                  </div>
                ) : (
                  groupIdx > 0 && <div className="my-2 border-t border-white/[0.06]" />
                )}

                {group.items.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => {
                        // Close sidebar on mobile when navigating
                        if (typeof window !== 'undefined' && window.innerWidth < 768) {
                          setSidebarOpen(false);
                        }
                      }}
                      title={!sidebarOpen ? item.name : undefined}
                      className={`flex items-center gap-3 rounded-lg font-mono text-xs transition-all duration-150 relative group ${
                        isActive
                          ? 'bg-emerald-500/10 text-emerald-300 font-bold border border-emerald-500/30'
                          : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.04] border border-transparent'
                      } ${
                        sidebarOpen
                          ? 'px-3 py-2 justify-start'
                          : 'w-10 h-10 mx-auto justify-center p-0'
                      }`}
                    >
                      <Icon
                        className={`w-4 h-4 shrink-0 ${
                          isActive
                            ? 'text-emerald-400'
                            : 'text-slate-400 group-hover:text-slate-200'
                        }`}
                      />

                      {sidebarOpen ? (
                        <>
                          <span className="truncate flex-1 font-sans text-xs">
                            {item.name}
                          </span>
                          {item.badge && (
                            <span
                              className={`ml-auto px-1.5 py-0.5 text-[9px] font-mono font-bold rounded shrink-0 border ${
                                item.badge === 'Live'
                                  ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                                  : 'bg-slate-900 text-slate-300 border-white/10'
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                        </>
                      ) : (
                        item.dotColor && (
                          <span
                            className={`absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full ${item.dotColor}`}
                          />
                        )
                      )}
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>
        </div>

        {/* Dynamic System Status Footer */}
        {sidebarOpen ? (
          <div className="p-3 m-3 rounded-lg bg-slate-950/80 border border-white/[0.06] space-y-2 font-mono">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> eBPF XDP
              </span>
              <span className="text-emerald-400 font-bold text-[10px]">
                ACTIVE
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Mesh Health
              </span>
              <span className="text-slate-200 font-bold text-[10px] tabular-nums">
                {summary.healthy}/{summary.total} ({healthPercent}%)
              </span>
            </div>

            <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-white/[0.04]">
              <div
                className="bg-emerald-400 h-full transition-all duration-500"
                style={{ width: `${healthPercent}%` }}
              />
            </div>
          </div>
        ) : (
          <div
            className="p-3 flex justify-center border-t border-white/[0.06] mb-2"
            title={`System Health: ${summary.healthy}/${summary.total} Operational (${healthPercent}%)`}
          >
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
        )}
      </aside>
    </>
  );
};
