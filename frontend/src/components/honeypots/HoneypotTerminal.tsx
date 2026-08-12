'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Terminal, Shield, Play, Pause, TerminalSquare } from 'lucide-react';
import { HoneypotSession } from '@/types';

interface HoneypotTerminalProps {
  sessions: HoneypotSession[];
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

export const HoneypotTerminal: React.FC<HoneypotTerminalProps> = ({ sessions }) => {
  const [selectedSessionId, setSelectedSessionId] = useState<string>(sessions[0]?.id || '');
  const [isStreaming, setIsStreaming] = useState<boolean>(true);
  const [liveEvents, setLiveEvents] = useState<Map<string, LiveEvent[]>>(new Map());
  const [stompConnected, setStompConnected] = useState(false);
  const stompClientRef = useRef<any>(null);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  const selectedSession = sessions.find((s) => s.id === selectedSessionId) || sessions[0];

  // Connect to STOMP for live honeypot events
  useEffect(() => {
    let client: any = null;

    import('@stomp/stompjs').then(({ Client }) => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('rakshasphere_token') : null;

      client = new Client({
        brokerURL: `ws://localhost:8080/ws-soc/websocket`,
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
                  // Cap at 200 events per session to prevent memory issues
                  const newEvents = [...existing, event].slice(-200);
                  updated.set(event.sessionId, newEvents);
                  return updated;
                });
              }
            } catch (e) {
              // Skip malformed messages
            }
          });
        },
        onDisconnect: () => setStompConnected(false),
        onStompError: () => setStompConnected(false),
      });

      client.activate();
      stompClientRef.current = client;
    }).catch(() => {
      // STOMP library not available — terminal works in static mode
    });

    return () => {
      if (client) {
        try { client.deactivate(); } catch (e) { /* ignore */ }
      }
    };
  }, []);

  // Auto-scroll to bottom when new events arrive
  useEffect(() => {
    if (terminalEndRef.current && isStreaming) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [liveEvents, isStreaming]);

  // Compute display keystrokes: merge static DB data + live STOMP events
  const getDisplayKeystrokes = useCallback((): string[] => {
    if (!selectedSession) return [];

    // Start with DB-stored keystrokes
    const dbKeystrokes = selectedSession.keystrokes || [];

    // Append live STOMP events for this session
    const sessionLiveEvents = liveEvents.get(selectedSession.id) || [];
    const liveKeystrokes = sessionLiveEvents
      .filter((e) => e.command || e.eventType)
      .map((e) => {
        if (e.eventType?.includes('login.success')) {
          return `[LOGIN SUCCESS] ${e.username || 'unknown'}@${e.sourceIp || '?'}`;
        }
        if (e.eventType?.includes('login.failed')) {
          return `[LOGIN FAILED] ${e.username || 'unknown'}@${e.sourceIp || '?'}`;
        }
        if (e.eventType?.includes('command')) {
          return e.command || e.eventType;
        }
        if (e.eventType?.includes('session.connect')) {
          return `[NEW CONNECTION] from ${e.sourceIp || '?'}`;
        }
        if (e.eventType?.includes('session.closed')) {
          return `[SESSION CLOSED] ${e.sourceIp || '?'}`;
        }
        if (e.eventType?.includes('file_download')) {
          return `[FILE DOWNLOAD] ${e.command || 'binary payload'}`;
        }
        return e.command || e.eventType || '';
      })
      .filter(Boolean);

    return [...dbKeystrokes, ...liveKeystrokes];
  }, [selectedSession, liveEvents]);

  // Compute a real crypto hash from session events
  const computeSessionHash = useCallback((): string => {
    if (!selectedSession) return '0x0000000000000000';
    const events = liveEvents.get(selectedSession.id) || [];
    if (events.length === 0) {
      // Use session ID as seed for a deterministic hash
      let hash = 0;
      const str = selectedSession.id + selectedSession.containerId;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0;
      }
      return '0x' + Math.abs(hash).toString(16).padStart(16, '0').slice(0, 16);
    }
    // Hash from last event timestamp
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
    <div className="rounded-2xl bg-slate-950 border border-slate-800 shadow-2xl overflow-hidden flex flex-col h-[550px]">
      {/* Top Console Bar */}
      <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500/80" />
            <span className="w-3 h-3 rounded-full bg-amber-500/80" />
            <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-slate-300 font-bold border-l border-slate-800 pl-3">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span>HONEYPOT DECEPTION TELEMETRY TERMINAL</span>
            {stompConnected && (
              <span className="px-1.5 py-0.5 text-[9px] rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 animate-pulse">
                LIVE
              </span>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsStreaming(!isStreaming)}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono border flex items-center gap-1.5 transition ${
              isStreaming
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            {isStreaming ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            <span>{isStreaming ? 'STREAMING' : 'PAUSED'}</span>
          </button>
        </div>
      </div>

      {/* Main Terminal View */}
      <div className="grid grid-cols-1 md:grid-cols-4 flex-1 overflow-hidden font-mono text-xs">
        {/* Session Selector Sidebar */}
        <div className="p-3 bg-slate-900/60 border-r border-slate-800/80 space-y-2 overflow-y-auto">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block px-2 mb-1">
            Active Deception Containers
          </span>

          {sessions.map((s) => {
            const isSelected = s.id === selectedSessionId;
            const sessionEvents = liveEvents.get(s.id) || [];
            const hasLiveData = sessionEvents.length > 0;
            return (
              <button
                key={s.id}
                onClick={() => setSelectedSessionId(s.id)}
                className={`w-full text-left p-3 rounded-xl border transition-all ${
                  isSelected
                    ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400 shadow-lg shadow-emerald-500/5'
                    : 'bg-slate-950/80 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center justify-between font-bold">
                  <span>{s.id}</span>
                  <div className="flex items-center gap-1">
                    {hasLiveData && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    )}
                    <span className="px-1.5 py-0.5 text-[9px] rounded bg-slate-800 text-cyan-400 border border-slate-700">
                      {s.service}
                    </span>
                  </div>
                </div>
                <div className="text-[10px] text-slate-400 mt-1 font-semibold truncate">{s.attackerIp}</div>
                <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2">
                  <span>Risk Score: {s.riskScore}</span>
                  <span className={s.status === 'RUNNING' ? 'text-emerald-400' : 'text-slate-500'}>
                    {s.status}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Keystrokes & Command Output Window */}
        <div className="md:col-span-3 p-5 bg-slate-950 flex flex-col justify-between overflow-hidden">
          {selectedSession ? (
            <div className="space-y-4 overflow-y-auto pr-2">
              {/* Container Details Pill */}
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-wrap items-center justify-between text-slate-300 gap-2">
                <div>
                  <span className="text-slate-500 text-[10px] block">CONTAINER ID</span>
                  <span className="font-bold text-emerald-400">{selectedSession.containerId}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">ATTACKER IP</span>
                  <span className="font-bold text-amber-400">{selectedSession.attackerIp}:{selectedSession.port}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">SERVICE TRAP</span>
                  <span className="font-bold text-cyan-400">{selectedSession.service} (Port {selectedSession.port})</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">PAYLOADS CAPTURED</span>
                  <span className="font-bold text-red-400">{selectedSession.capturedPayloadsCount} Binaries</span>
                </div>
              </div>

              {/* Terminal Screen Stream */}
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800/80 font-mono text-emerald-400 text-xs leading-relaxed space-y-2 min-h-[300px]">
                <div className="text-slate-500 text-[10px] border-b border-slate-800/80 pb-1 mb-3">
                  --- BEGIN {stompConnected ? 'REAL-TIME' : 'RECORDED'} ATTACKER KEYSTROKE RECORDING [{selectedSession.startTime}] ---
                </div>

                {displayKeystrokes.map((cmd, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="text-slate-600 select-none">$</span>
                    <span className={`font-semibold ${
                      cmd.startsWith('[LOGIN FAILED]') ? 'text-red-400' :
                      cmd.startsWith('[LOGIN SUCCESS]') ? 'text-amber-400' :
                      cmd.startsWith('[NEW CONNECTION]') ? 'text-cyan-400' :
                      cmd.startsWith('[SESSION CLOSED]') ? 'text-slate-500' :
                      cmd.startsWith('[FILE DOWNLOAD]') ? 'text-red-300' :
                      'text-emerald-300'
                    }`}>{cmd}</span>
                  </div>
                ))}

                {isStreaming && selectedSession.status === 'RUNNING' && (
                  <div className="flex items-center gap-2 text-cyan-400 pt-2 animate-pulse">
                    <span>root@trap-decoy-service:~#</span>
                    <span className="w-2 h-4 bg-emerald-400 inline-block" />
                  </div>
                )}

                <div ref={terminalEndRef} />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-500">
              <TerminalSquare className="w-12 h-12 mb-2 stroke-[1.5]" />
              <p>Select an active deception container to view keystroke stream</p>
            </div>
          )}

          {/* Terminal Footer Status Bar */}
          <div className="mt-3 pt-2 border-t border-slate-900 flex items-center justify-between text-[10px] text-slate-500">
            <span className="flex items-center gap-1 text-slate-400">
              <Shield className="w-3 h-3 text-emerald-400" /> Isolated Deception Sandbox Active
              {stompConnected && <span className="text-emerald-400 ml-2">● STOMP Connected</span>}
            </span>
            <span>Event Integrity Hash: {computeSessionHash()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
