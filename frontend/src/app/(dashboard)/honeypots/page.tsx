'use client';

import React, { useEffect, useState } from 'react';
import { Bug, Plus } from 'lucide-react';
import { INITIAL_HONEYPOTS } from '@/data/mockHoneypots';
import { HoneypotTerminal } from '@/components/honeypots/HoneypotTerminal';
import { HoneypotSession } from '@/types';
import { PermissionGuard } from '@/components/common/PermissionGuard';
import { apiService } from '@/services/api';

export default function HoneypotsPage() {
  const [honeypots, setHoneypots] = useState<HoneypotSession[]>(INITIAL_HONEYPOTS);
  const [showDeployModal, setShowDeployModal] = useState(false);
  const [selectedService, setSelectedService] = useState<'SSH' | 'HTTP' | 'TELNET' | 'FTP'>('SSH');

  useEffect(() => {
    apiService.getHoneypots()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setHoneypots(data);
        }
      })
      .catch((err) => console.warn('Backend honeypots REST endpoint unreachable:', err));
  }, []);

  const handleDeployTrap = async (e: React.FormEvent) => {
    e.preventDefault();

    const ports: Record<string, number> = { SSH: 2222, HTTP: 8080, TELNET: 2323, FTP: 2121 };
    const attackerIp = '185.220.101.99';

    try {
      const res = await apiService.deployHoneypot(selectedService, attackerIp);
      if (res && res.id) {
        setHoneypots((prev) => [res, ...prev]);
        setShowDeployModal(false);
        return;
      }
    } catch (e) {
      console.warn('API deploy honeypot failed, using optimistic state update:', e);
    }

    const newHoneypot: HoneypotSession = {
      id: `HP-${selectedService}-${Math.floor(Math.random() * 90) + 10}`,
      service: selectedService,
      containerId: `docker-trap-${selectedService.toLowerCase()}-${Math.random().toString(36).substring(2, 6)}`,
      attackerIp: '185.220.101.99',
      port: ports[selectedService] || 2222,
      startTime: new Date().toISOString().replace('T', ' ').substring(0, 19),
      status: 'RUNNING',
      keystrokes: [
        `Incoming redirection for ${selectedService} trap`,
        'Probing default credentials...',
        'Session sandbox active'
      ],
      commandsExecuted: ['Initialization complete'],
      capturedPayloadsCount: 0,
      riskScore: 60
    };

    setHoneypots((prev) => [newHoneypot, ...prev]);
    setShowDeployModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-slate-100 flex items-center gap-2">
            ADAPTIVE HONEYPOT DECEPTION CONSOLE
          </h1>
          <p className="text-xs font-mono text-slate-400 mt-1">
            Dynamic Decoy Microservices & Attacker Telemetry Capture
          </p>
        </div>

        <PermissionGuard allowedRoles={['ROLE_ADMIN', 'ROLE_SOC_ANALYST']}>
          <button
            onClick={() => setShowDeployModal(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-extrabold text-xs hover:opacity-90 transition shadow-lg shadow-emerald-500/20 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>DEPLOY DECEPTION CONTAINER</span>
          </button>
        </PermissionGuard>
      </div>

      {/* Main Terminal Telemetry Console */}
      <HoneypotTerminal sessions={honeypots} />

      {/* Deploy Modal Popup */}
      {showDeployModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4 font-mono">
            <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
              <Bug className="w-4 h-4 text-emerald-400" /> DEPLOY EPHEMERAL DECEPTION CONTAINER
            </h3>

            <form onSubmit={handleDeployTrap} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Target Protocol Trap</label>
                <select
                  value={selectedService}
                  onChange={(e) => setSelectedService(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200"
                >
                  <option value="SSH">SSH Daemon Trap (Port 2222)</option>
                  <option value="HTTP">Vulnerable Web Application Trap (Port 8080)</option>
                  <option value="TELNET">IoT Telnet Interface Trap (Port 2323)</option>
                  <option value="FTP">FTP File Server Trap (Port 2121)</option>
                </select>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 space-y-1">
                <p>• Isolated Docker Container sandbox</p>
                <p>• Automatic NAT packet redirection</p>
                <p>• Cryptographic log recorder enabled</p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeployModal(false)}
                  className="px-3 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                >
                  Deploy Container
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
