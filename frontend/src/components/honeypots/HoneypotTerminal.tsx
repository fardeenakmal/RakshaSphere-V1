'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Terminal, Shield, Play, Pause, Square, Search } from 'lucide-react';
import { HoneypotSession } from '@/types';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';

interface HoneypotTerminalProps {
  sessions: HoneypotSession[];
  onStopSession?: (session: HoneypotSession) => void;
  onDeployHoneypot?: () => void;
}

interface LiveEvent {
  type: string;
  sessionId: string;
  eventType: string;
  sourceIp: string;
  command: string;
  username: string;
  timestamp: string;
}

export const HoneypotTerminal: React.FC<HoneypotTerminalProps> = ({ sessions, onStopSession, onDeployHoneypot }) => {
  const [selectedSessionId, setSelectedSessionId] = useState<string>(sessions[0]?.id || '');
  const [isStreaming, setIsStreaming] = useState<boolean>(true);
  const [logFilter, setLogFilter] = useState<string>('');
  const [liveEvents, setLiveEvents] = useState<Map<string, LiveEvent[]>>(new Map());
  const [stompConnected, setStompConnected] = useState(false);
  const stompClientRef = useRef<any>(null);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  const selectedSession = sessions.find((s) => s.id === selectedSessionId) || sessions[0];

  // Connect to STOMP for live honeypot events
  useEffect(() => {
    let client: any = null;

    import('@stomp/stompjs').then(({ Client }) => {
      const getBrokerUrl = (): string => {
        if (process.env.NEXT_PUBLIC_WS_URL) {
          const wsUrl = process.env.NEXT_PUBLIC_WS_URL.replace(/^http:/, 'ws:').replace(/^https:/, 'wss:');
          return wsUrl.endsWith('/websocket') ? wsUrl : `${wsUrl.replace(/\/+$/, '')}/websocket`;
        }
        if (process.env.NEXT_PUBLIC_API_URL) {
          const clean = process.env.NEXT_PUBLIC_API_URL.replace(/\/+$/, '').replace(/\/api\/v1$/, '').replace(/^http:/, 'ws:').replace(/^https:/, 'wss:');
          return `${clean}/ws-soc/websocket`;
        }
        const protocol = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
        const isLocal = host === 'localhost' || host === '127.0.0.1';
        return `${protocol}//${host}${isLocal ? ':8080' : ''}/ws-soc/websocket`;
      };

      const token = typeof window !== 'undefined' ? (localStorage.getItem('rakshasphere_token') || sessionStorage.getItem('rakshasphere_token')) : null;
      const brokerURL = getBrokerUrl();
      client = new Client({
        brokerURL,
        connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
        reconnectDelay: 5000,
        onConnect: () => {
          setStompConnected(true);
          client.subscribe('/topic/honeypot-events', (message: any) => {
            try {
              const event: LiveEvent = JSON.parse(message.body);
              if (event.sessionId && isStreaming) {
                setLiveEvents((prev) => {
                  const updated = new Map(prev);
                  const existing = updated.get(event.sessionId) || [];
                  const newEvents = [...existing, event].slice(-200);
                  updated.set(event.sessionId, newEvents);
                  return updated;
                });
              }
            } catch (e) {
              // Ignore malformed
            }
          });
        },
        onDisconnect: () => setStompConnected(false),
        onStompError: () => setStompConnected(false),
      });

      client.activate();
      stompClientRef.current = client;
    }).catch(() => {
      // Static fallback
    });

    return () => {
      if (client) {
        try { client.deactivate(); } catch (e) { /* ignore */ }
      }
    };
  }, [isStreaming]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (terminalEndRef.current && isStreaming) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [liveEvents, isStreaming]);

  // Merge static DB data + live STOMP events
  const getDisplayKeystrokes = useCallback((): string[] => {
    if (!selectedSession) return [];

    const dbKeystrokes = selectedSession.keystrokes || [];
    const sessionLiveEvents = liveEvents.get(selectedSession.id) || [];
    const liveKeystrokes = sessionLiveEvents
      .filter((e) => e.command || e.eventType)
      .map((e) => {
        if (e.eventType?.includes('login.success')) {
          return `[AUTH_SUCCESS] ${e.username || 'root'} from ${e.sourceIp || '?'}`;
        }
        if (e.eventType?.includes('login.failed')) {
          return `[AUTH_FAIL] ${e.username || 'unknown'} from ${e.sourceIp || '?'}`;
        }
        if (e.eventType?.includes('command')) {
          return `[CMD] ${e.command || e.eventType}`;
        }
        if (e.eventType?.includes('session.connect')) {
          return `[CONNECT] Ingress connection from ${e.sourceIp || '?'}`;
        }
        if (e.eventType?.includes('session.closed')) {
          return `[DISCONNECT] Attacker session closed: ${e.sourceIp || '?'}`;
        }
        if (e.eventType?.includes('file_download')) {
          return `[DOWNLOAD] Payload binary retrieved: ${e.command || 'payload.bin'}`;
        }
        return e.command || e.eventType || '';
      })
      .filter(Boolean);

    const merged = [...dbKeystrokes, ...liveKeystrokes];
    if (!logFilter) return merged;
    return merged.filter(cmd => cmd.toLowerCase().includes(logFilter.toLowerCase()));
  }, [selectedSession, liveEvents, logFilter]);

  const computeSessionHash = useCallback((): string => {
    if (!selectedSession) return '0x0000000000000000';
    const events = liveEvents.get(selectedSession.id) || [];
    if (events.length === 0) {
      let hash = 0;
      const str = selectedSession.id + selectedSession.containerId;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0;
      }
      return '0x' + Math.abs(hash).toString(16).padStart(16, '0').slice(0, 16);
    }
    let hash = 0;
    const str = JSON.stringify(events[events.length - 1]);
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return '0x' + Math.abs(hash).toString(16).padStart(16, '0').slice(0, 16);
  }, [selectedSession, liveEvents]);

  const displayKeystrokes = getDisplayKeystrokes();

  return (
    <div className="soc-card overflow-hidden flex flex-col min-h-[580px] shadow-2xl font-mono">
      {/* Top Console Header */}
      <div className="px-4 py-3 bg-[#070b14] border-b border-white/[0.06] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-200 font-bold border-l border-white/10 pl-3">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span>HONEYPOT DECEPTION TERMINAL</span>
            {stompConnected && (
              <span className="px-2 py-0.5 text-[9px] rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                LIVE STOMP
              </span>
            )}
          </div>
        </div>

        {/* Console Controls */}
        <div className="flex items-center gap-2">
          {/* Quick Search inside terminal logs */}
          <div className="relative w-32 sm:w-44">
            <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={logFilter}
              onChange={(e) => setLogFilter(e.target.value)}
              placeholder="Filter logs..."
              className="w-full bg-slate-950 border border-white/10 rounded-lg pl-7 pr-2 py-1 text-[11px] text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/60"
            />
          </div>

          <Button
            size="xs"
            variant="outline"
            leftIcon={isStreaming ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            onClick={() => setIsStreaming(!isStreaming)}
          >
            {isStreaming ? 'STREAMING' : 'PAUSED'}
          </Button>

          {selectedSession && onStopSession && (
            <Button
              size="xs"
              variant="danger"
              leftIcon={<Square className="w-3 h-3" />}
              onClick={() => onStopSession(selectedSession)}
            >
              STOP CONTAINER
            </Button>
          )}
        </div>
      </div>

      {/* Main Terminal Grid View */}
      <div className="grid grid-cols-1 md:grid-cols-4 flex-1 overflow-hidden text-xs">
        {/* Session Selector Sidebar */}
        <div className="p-3 bg-slate-950/90 border-r border-white/[0.06] space-y-2 overflow-y-auto max-h-[520px] custom-scrollbar">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block px-2 mb-1">
            Active Containers ({sessions.length})
          </span>

          {sessions.map((s) => {
            const isSelected = s.id === (selectedSession?.id || '');
            const sessionEvents = liveEvents.get(s.id) || [];
            const hasLiveData = sessionEvents.length > 0;
            return (
              <button
                key={s.id}
                onClick={() => setSelectedSessionId(s.id)}
                className={`w-full text-left p-3 rounded-lg border transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300 font-bold'
                    : 'bg-slate-900/60 border-white/[0.06] text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs">{s.id}</span>
                  <div className="flex items-center gap-1.5">
                    {hasLiveData && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    )}
                    <span className="px-1.5 py-0.5 text-[9px] rounded bg-slate-950 text-cyan-300 border border-white/10">
                      {s.service}
                    </span>
                  </div>
                </div>
                <div className="text-[10px] text-slate-400 mt-1 font-semibold truncate font-mono">
                  {s.attackerIp}
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2">
                  <span>Risk: <strong className="text-slate-200 tabular-nums">{s.riskScore}</strong></span>
                  <StatusBadge status={s.status} size="xs" showIcon={false} />
                </div>
              </button>
            );
          })}
        </div>

        {/* Keystrokes & Command Output Window */}
        <div className="md:col-span-3 p-4 md:p-5 bg-slate-950 flex flex-col justify-between overflow-hidden">
          {selectedSession ? (
            <div className="space-y-3 overflow-y-auto pr-1 flex-1 custom-scrollbar">
              {/* Container Details Pill */}
              <div className="p-3 rounded-lg bg-slate-900/80 border border-white/[0.06] grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 text-[10px] block uppercase">CONTAINER ID</span>
                  <span className="font-bold text-emerald-400 truncate block">{selectedSession.containerId}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block uppercase">ATTACKER IP</span>
                  <span className="font-bold text-amber-400 truncate block">{selectedSession.attackerIp}:{selectedSession.port}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block uppercase">SERVICE TRAP</span>
                  <span className="font-bold text-cyan-300 truncate block">{selectedSession.service} (Port {selectedSession.port})</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block uppercase">PAYLOADS</span>
                  <span className="font-bold text-rose-400 truncate block">{selectedSession.capturedPayloadsCount} Binaries</span>
                </div>
              </div>

              {/* Terminal Screen Stream */}
              <div className="p-4 rounded-lg bg-[#02050b] border border-white/[0.06] font-mono text-xs leading-relaxed space-y-2 min-h-[340px] overflow-x-auto">
                <div className="text-slate-500 text-[10px] border-b border-white/[0.06] pb-2 mb-3 flex items-center justify-between">
                  <span>--- LOG RECORDING [{selectedSession.startTime}] ---</span>
                  <span>Docker Sandbox Isolation: Active</span>
                </div>

                {displayKeystrokes.map((cmd, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="text-slate-500 select-none text-[11px]">&gt;</span>
                    <span className={`font-semibold ${
                      cmd.startsWith('[AUTH_FAIL]') || cmd.startsWith('[LOGIN FAILED]') ? 'text-rose-400' :
                      cmd.startsWith('[AUTH_SUCCESS]') || cmd.startsWith('[LOGIN SUCCESS]') ? 'text-amber-400' :
                      cmd.startsWith('[CONNECT]') || cmd.startsWith('[NEW CONNECTION]') ? 'text-cyan-400' :
                      cmd.startsWith('[DISCONNECT]') || cmd.startsWith('[SESSION CLOSED]') ? 'text-slate-400' :
                      cmd.startsWith('[DOWNLOAD]') || cmd.startsWith('[FILE DOWNLOAD]') ? 'text-rose-300' :
                      'text-emerald-300'
                    }`}>{cmd}</span>
                  </div>
                ))}

                {isStreaming && selectedSession.status === 'RUNNING' && (
                  <div className="flex items-center gap-2 text-cyan-400 pt-2 animate-pulse">
                    <span>root@trap-{selectedSession.service.toLowerCase()}-sandbox:~#</span>
                    <span className="w-2 h-4 bg-emerald-400 inline-block" />
                  </div>
                )}

                <div ref={terminalEndRef} />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center min-h-[380px] p-6 text-center space-y-3 bg-slate-950 rounded-lg border border-white/10">
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                <Terminal className="w-8 h-8" />
              </div>
              <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
                NO ACTIVE DECEPTION SESSIONS
              </h3>
              <p className="text-[11px] text-slate-400 max-w-sm leading-relaxed">
                Deploy an ephemeral honeypot container to begin capturing attacker keystrokes, login attempts, and payload binaries.
              </p>
              {onDeployHoneypot && (
                <Button variant="primary" size="sm" onClick={onDeployHoneypot}>
                  DEPLOY HONEYPOT
                </Button>
              )}
            </div>
          )}

          {/* Terminal Footer Status Bar */}
          <div className="mt-3 pt-2.5 border-t border-white/[0.06] flex items-center justify-between text-[10px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-400" /> Isolated Ephemeral Container Sandbox
            </span>
            <span>Integrity: {computeSessionHash()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
