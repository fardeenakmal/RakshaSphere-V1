'use client';

import React, { useEffect, useState } from 'react';
import { Bug, Plus, Shield, Terminal, AlertTriangle, Cpu, Layers } from 'lucide-react';
import { HoneypotTerminal } from '@/components/honeypots/HoneypotTerminal';
import { HoneypotSession } from '@/types';
import { PermissionGuard } from '@/components/common/PermissionGuard';
import { apiService } from '@/services/api';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Select } from '@/components/ui/Select';

export default function HoneypotsPage() {
  const [honeypots, setHoneypots] = useState<HoneypotSession[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showDeployModal, setShowDeployModal] = useState(false);
  const [showConfirmStopModal, setShowConfirmStopModal] = useState<HoneypotSession | null>(null);
  const [selectedService, setSelectedService] = useState<'SSH' | 'HTTP' | 'TELNET' | 'FTP'>('SSH');
  const [deployError, setDeployError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    apiService.getHoneypots()
      .then((data) => {
        if (Array.isArray(data)) {
          setHoneypots(data);
        }
      })
      .catch((err) => console.warn('Backend honeypots REST endpoint unreachable:', err))
      .finally(() => setLoading(false));
  }, []);

  const handleDeployTrap = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeployError(null);

    const attackerIp = '185.220.101.99';

    try {
      const res = await apiService.deployHoneypot(selectedService, attackerIp);
      if (res && (res.id || res.containerId)) {
        setHoneypots((prev) => [res, ...prev]);
        setShowDeployModal(false);
        return;
      }
    } catch (e: any) {
      console.error('API deploy honeypot failed:', e);
      setDeployError(e.message || 'Failed to deploy honeypot container. Backend service unavailable.');
    }
  };

  const handleStopContainer = async (session: HoneypotSession) => {
    try {
      await apiService.stopHoneypot(session.id);
      setHoneypots((prev) =>
        prev.map((s) => (s.id === session.id ? { ...s, status: 'TERMINATED' } : s))
      );
    } catch (e: any) {
      console.error('Failed to stop honeypot session on backend:', e);
      setHoneypots((prev) =>
        prev.map((s) => (s.id === session.id ? { ...s, status: 'TERMINATED' } : s))
      );
    }
    setShowConfirmStopModal(null);
  };

  const totalPayloads = honeypots.reduce((acc, h) => acc + (h.capturedPayloadsCount || 0), 0);
  const activeContainersCount = honeypots.filter((h) => h.status === 'RUNNING').length;

  return (
    <div className="space-y-5 pb-8 font-mono">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl md:text-2xl font-extrabold text-slate-100 tracking-tight">
              ADAPTIVE DECEPTION CONSOLE
            </h1>
            <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-bold">
              CONTAINER SANDBOX
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Dynamic Decoy Microservices, Ephemeral Containers & Attacker Telemetry Capture
          </p>
        </div>

        <PermissionGuard allowedRoles={['ROLE_ADMIN', 'ROLE_SOC_ANALYST']}>
          <Button
            size="sm"
            variant="primary"
            leftIcon={<Plus className="w-3.5 h-3.5" />}
            onClick={() => setShowDeployModal(true)}
          >
            DEPLOY DECEPTION CONTAINER
          </Button>
        </PermissionGuard>
      </div>

      {/* Top Deception Summary Cards (4 Columns) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
        <div className="soc-card p-4 flex flex-col justify-between">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold">
            DECEPTION CONTAINERS
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl md:text-3xl font-extrabold font-mono text-emerald-400 tabular-nums">
              {activeContainersCount}
            </span>
            <span className="text-slate-400 text-xs">/ {honeypots.length} Active</span>
          </div>
          <span className="text-[10px] text-slate-500 mt-2">Isolated Docker Sandbox</span>
        </div>

        <div className="soc-card p-4 flex flex-col justify-between">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold">
            TRAPPED SESSIONS
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl md:text-3xl font-extrabold font-mono text-amber-400 tabular-nums">
              {honeypots.length}
            </span>
            <span className="text-slate-400 text-xs">Active Streams</span>
          </div>
          <span className="text-[10px] text-slate-500 mt-2">SSH, HTTP, Telnet, FTP Decoys</span>
        </div>

        <div className="soc-card p-4 flex flex-col justify-between">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold">
            CAPTURED PAYLOADS
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl md:text-3xl font-extrabold font-mono text-rose-400 tabular-nums">
              {totalPayloads}
            </span>
            <span className="text-slate-400 text-xs">Payload Binaries</span>
          </div>
          <span className="text-[10px] text-slate-500 mt-2">SHA-256 Forensics Hashed</span>
        </div>

        <div className="soc-card p-4 flex flex-col justify-between">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold">
            EXECUTION ENVIRONMENT
          </span>
          <div className="mt-2">
            <StatusBadge status="HEALTHY" size="sm" labelOverride="DOCKER SANDBOX" />
          </div>
          <span className="text-[10px] text-slate-500 mt-2">Cryptographic Log Integrity</span>
        </div>
      </div>

      {/* Main Terminal Telemetry Console */}
      <HoneypotTerminal
        sessions={honeypots}
        onStopSession={(session) => setShowConfirmStopModal(session)}
        onDeployHoneypot={() => setShowDeployModal(true)}
      />

      {/* Deploy Modal */}
      <Modal
        isOpen={showDeployModal}
        onClose={() => setShowDeployModal(false)}
        title="DEPLOY EPHEMERAL DECEPTION CONTAINER"
        subtitle="Provision isolated Docker trap sandbox with NAT packet redirection"
        icon={<Bug className="w-5 h-5 text-emerald-400" />}
        size="md"
      >
        <form onSubmit={handleDeployTrap} className="space-y-4 font-mono text-xs">
          {deployError && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              {deployError}
            </div>
          )}

          <Select
            label="Target Decoy Protocol Trap"
            value={selectedService}
            onChange={(e) => setSelectedService(e.target.value as any)}
            options={[
              { value: 'SSH', label: 'SSH Daemon Trap (Port 2222)' },
              { value: 'HTTP', label: 'Vulnerable Web Application Trap (Port 8080)' },
              { value: 'TELNET', label: 'IoT Telnet Interface Trap (Port 2323)' },
              { value: 'FTP', label: 'FTP File Server Trap (Port 2121)' },
            ]}
          />

          <div className="p-3 rounded-lg bg-slate-950 border border-white/[0.06] text-[11px] text-slate-400 space-y-1">
            <p className="text-slate-300">• <strong className="text-emerald-400">Isolated Docker Container</strong> sandbox</p>
            <p>• Automatic iptables NAT packet redirection</p>
            <p>• Cryptographic SHA-256 log recorder enabled</p>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-white/[0.06]">
            <Button type="button" variant="ghost" size="sm" onClick={() => setShowDeployModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Deploy Container
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirm Stop Container Modal */}
      <Modal
        isOpen={!!showConfirmStopModal}
        onClose={() => setShowConfirmStopModal(null)}
        title="CONFIRM CONTAINER TERMINATION"
        subtitle="Terminating deception container sandbox"
        icon={<AlertTriangle className="w-5 h-5 text-rose-400" />}
        size="md"
      >
        <div className="space-y-4 font-mono text-xs">
          <p className="text-slate-300 leading-relaxed bg-slate-950 p-3.5 rounded-lg border border-white/10">
            Are you sure you want to terminate deception container <strong className="text-white">{showConfirmStopModal?.containerId}</strong> ({showConfirmStopModal?.service} Trap)?
          </p>
          <p className="text-slate-400 text-[11px]">
            This action will sever the attacker session from {showConfirmStopModal?.attackerIp} and flush the transient memory sandbox.
          </p>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-white/[0.06]">
            <Button variant="ghost" size="sm" onClick={() => setShowConfirmStopModal(null)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" onClick={() => showConfirmStopModal && handleStopContainer(showConfirmStopModal)}>
              Confirm Termination
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
