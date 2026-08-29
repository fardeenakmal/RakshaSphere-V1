'use client';

import React, { useState } from 'react';
import {
  ShieldAlert,
  Zap,
  Bug,
  Globe,
  RotateCcw,
  CheckCircle2,
  Lock,
  Download,
  Activity,
  Layers,
  Cpu,
  Server
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { Alert } from '@/types';
import { useAlertStore } from '@/store/useAlertStore';
import { PermissionGuard } from '@/components/common/PermissionGuard';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Tabs } from '@/components/ui/Tabs';

interface AlertDetailModalProps {
  alert: Alert | null;
  onClose: () => void;
}

export const AlertDetailModal: React.FC<AlertDetailModalProps> = ({ alert, onClose }) => {
  const { containAlert, divertToHoneypot, resolveAlert, revertAction } = useAlertStore();
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'EVIDENCE' | 'INTEL'>('OVERVIEW');

  if (!alert) return null;

  const exportDossierToPDF = () => {
    if (!alert) return;
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`RakshaSphere - Incident Dossier: ${alert.id}`, 14, 15);
    
    let currentY = 25;
    
    doc.setFontSize(12);
    doc.text(`Timestamp: ${new Date(alert.timestamp).toLocaleString()}`, 14, currentY); currentY += 8;
    doc.text(`Severity: ${alert.severity}`, 14, currentY); currentY += 8;
    doc.text(`Risk Score: ${alert.riskScore}`, 14, currentY); currentY += 8;
    doc.text(`Status: ${alert.status}`, 14, currentY); currentY += 12;
    
    doc.text(`Source IP: ${alert.sourceIp}:${alert.sourcePort}`, 14, currentY); currentY += 8;
    doc.text(`Destination IP: ${alert.destinationIp}:${alert.destinationPort}`, 14, currentY); currentY += 8;
    doc.text(`Attack Type: ${alert.attackType}`, 14, currentY); currentY += 12;
    
    doc.text(`MITRE Tactic: ${alert.mitreTactic}`, 14, currentY); currentY += 8;
    doc.text(`MITRE Technique: ${alert.mitreTechnique}`, 14, currentY); currentY += 8;
    doc.text(`MITRE ID: ${alert.mitreId}`, 14, currentY); currentY += 12;

    if (alert.threatIntel) {
      doc.text(`Threat Intel - Country: ${alert.threatIntel.country}`, 14, currentY); currentY += 8;
      doc.text(`Threat Intel - ISP: ${alert.threatIntel.isp}`, 14, currentY); currentY += 8;
      doc.text(`VirusTotal: ${alert.threatIntel.virusTotalScore}`, 14, currentY); currentY += 8;
      doc.text(`AbuseIPDB Confidence: ${alert.threatIntel.abuseIpDbConfidence}%`, 14, currentY); currentY += 8;
    }
    
    doc.save(`dossier_${alert.id}.pdf`);
  };

  const modalTitle = (
    <div className="flex items-center gap-2.5">
      <span>INCIDENT DOSSIER: {alert.id}</span>
      <StatusBadge status={alert.severity} size="xs" />
    </div>
  );

  const modalSubtitle = `Detected: ${new Date(alert.timestamp).toLocaleString()} | Attack: ${alert.attackType}`;

  const modalFooter = (
    <div className="w-full flex flex-wrap items-center justify-between gap-3 font-mono">
      <div className="flex items-center gap-2">
        <PermissionGuard
          allowedRoles={['ROLE_ADMIN', 'ROLE_SOC_ANALYST']}
          fallback={
            <span className="text-amber-400 text-[11px] flex items-center gap-1 font-mono">
              <Lock className="w-3.5 h-3.5" /> Read-only mode
            </span>
          }
        >
          {alert.status === 'ACTIVE' && (
            <Button
              size="sm"
              variant="success"
              leftIcon={<Zap className="w-3.5 h-3.5" />}
              onClick={() => containAlert(alert.id, 'eBPF / XDP Kernel Drop Rule Applied')}
            >
              Inject eBPF Drop
            </Button>
          )}

          {alert.status === 'ACTIVE' && (
            <Button
              size="sm"
              variant="danger"
              leftIcon={<Bug className="w-3.5 h-3.5" />}
              onClick={() => divertToHoneypot(alert.id)}
            >
              Divert to Honeypot
            </Button>
          )}

          {alert.status !== 'RESOLVED' && (
            <Button
              size="sm"
              variant="outline"
              leftIcon={<CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
              onClick={() => resolveAlert(alert.id)}
            >
              Mark Resolved
            </Button>
          )}
        </PermissionGuard>
      </div>

      <div className="flex items-center gap-2">
        <PermissionGuard requiredRole="ROLE_ADMIN">
          {alert.status === 'CONTAINED' && (
            <Button
              size="sm"
              variant="outline"
              leftIcon={<RotateCcw className="w-3.5 h-3.5 text-rose-400" />}
              onClick={() => revertAction(alert.id)}
            >
              Revert Rule
            </Button>
          )}
        </PermissionGuard>

        <Button
          size="sm"
          variant="secondary"
          leftIcon={<Download className="w-3.5 h-3.5" />}
          onClick={exportDossierToPDF}
        >
          Export PDF
        </Button>
      </div>
    </div>
  );

  return (
    <Modal
      isOpen={!!alert}
      onClose={onClose}
      title={modalTitle}
      subtitle={modalSubtitle}
      size="lg"
      icon={<ShieldAlert className="w-5 h-5 text-rose-400" />}
      footer={modalFooter}
    >
      <div className="space-y-5 font-mono text-xs">
        {/* Modal Navigation Tabs */}
        <Tabs
          tabs={[
            { id: 'OVERVIEW', label: 'Overview & Risk', icon: <Activity className="w-3.5 h-3.5" /> },
            { id: 'EVIDENCE', label: 'AI Evidence & Features', icon: <Layers className="w-3.5 h-3.5" /> },
            { id: 'INTEL', label: 'Threat Intelligence', icon: <Globe className="w-3.5 h-3.5" /> },
          ]}
          activeTab={activeTab}
          onChange={(tabId) => setActiveTab(tabId as any)}
          variant="pills"
        />

        {/* Tab 1: Overview */}
        {activeTab === 'OVERVIEW' && (
          <div className="space-y-4">
            {/* Metric Summary Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-lg bg-slate-950/80 border border-white/[0.06] flex flex-col justify-between">
                <span className="text-slate-400 font-semibold text-[10px] uppercase tracking-wider">
                  DYNAMIC RISK SCORE
                </span>
                <div className="flex items-baseline gap-2 mt-1.5">
                  <span className="text-2xl md:text-3xl font-extrabold text-rose-400 tabular-nums">
                    {alert.riskScore}
                  </span>
                  <span className="text-slate-500 text-[10px]">/ 100</span>
                </div>
                <div className="w-full bg-slate-900 h-1.5 rounded-full mt-2 overflow-hidden border border-white/[0.04]">
                  <div
                    className="bg-gradient-to-r from-amber-500 to-rose-500 h-full"
                    style={{ width: `${alert.riskScore}%` }}
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-950/80 border border-white/[0.06] flex flex-col justify-between">
                <span className="text-slate-400 font-semibold text-[10px] uppercase tracking-wider">
                  AI CONFIDENCE
                </span>
                <div className="flex items-baseline gap-2 mt-1.5">
                  <span className="text-2xl font-bold text-cyan-300 tabular-nums">
                    {(alert.confidence * 100).toFixed(0)}%
                  </span>
                  <span className="text-slate-400 text-[10px]">Random Forest</span>
                </div>
                <span className="text-[10px] text-slate-500 mt-2">
                  XGBoost & Autoencoder Ensembled
                </span>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-950/80 border border-white/[0.06] flex flex-col justify-between">
                <span className="text-slate-400 font-semibold text-[10px] uppercase tracking-wider">
                  REMEDIATION STATE
                </span>
                <div className="mt-1.5">
                  <StatusBadge status={alert.status} size="sm" />
                </div>
                <span className="text-[10px] text-slate-400 mt-2 truncate block">
                  {alert.remediationAction}
                </span>
              </div>
            </div>

            {/* Ingress Telemetry & MITRE Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-4 rounded-lg bg-slate-950/80 border border-white/[0.06] space-y-2">
                <h4 className="font-bold text-slate-200 text-xs border-b border-white/[0.06] pb-1.5 mb-2 uppercase">
                  NETWORK INGRESS TELEMETRY
                </h4>
                <div className="flex justify-between">
                  <span className="text-slate-400 text-[11px]">Attacker Source:</span>
                  <span className="text-emerald-400 font-bold tabular-nums">
                    {alert.sourceIp}:{alert.sourcePort}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 text-[11px]">Target Destination:</span>
                  <span className="text-slate-200 font-bold tabular-nums">
                    {alert.destinationIp}:{alert.destinationPort}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 text-[11px]">Attack Vector:</span>
                  <span className="text-slate-100 font-bold">{alert.attackType}</span>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-slate-950/80 border border-white/[0.06] space-y-2">
                <h4 className="font-bold text-slate-200 text-xs border-b border-white/[0.06] pb-1.5 mb-2 uppercase">
                  MITRE ATT&CK CORRELATION
                </h4>
                <div className="flex justify-between">
                  <span className="text-slate-400 text-[11px]">Tactic Group:</span>
                  <span className="text-cyan-300 font-bold">{alert.mitreTactic}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 text-[11px]">Technique:</span>
                  <span className="text-slate-200 font-bold">{alert.mitreTechnique}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 text-[11px]">STIX 2.1 ID:</span>
                  <span className="text-emerald-400 font-bold">{alert.mitreId}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: AI Features & Evidence */}
        {activeTab === 'EVIDENCE' && (
          <div className="space-y-4">
            <h4 className="font-bold text-slate-200 text-xs uppercase tracking-wider">
              CICFLOWMETER 84-FEATURE INFERENCE VECTOR
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 rounded-lg bg-slate-950/80 border border-white/[0.06]">
                <span className="text-[10px] text-slate-400 block uppercase">Flow Duration</span>
                <span className="font-bold text-slate-200 tabular-nums">
                  {alert.flowFeatures?.flowDurationMs || 0} ms
                </span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950/80 border border-white/[0.06]">
                <span className="text-[10px] text-slate-400 block uppercase">Total Fwd Packets</span>
                <span className="font-bold text-slate-200 tabular-nums">
                  {alert.flowFeatures?.totalFwdPackets || 0}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950/80 border border-white/[0.06]">
                <span className="text-[10px] text-slate-400 block uppercase">Mean Packet Size</span>
                <span className="font-bold text-slate-200 tabular-nums">
                  {alert.flowFeatures?.packetLengthMean || 0} B
                </span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950/80 border border-white/[0.06]">
                <span className="text-[10px] text-slate-400 block uppercase">Anomaly Score</span>
                <span className="font-bold text-rose-400 tabular-nums">
                  {alert.flowFeatures?.autoencoderAnomalyScore || 0}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-slate-950/80 border border-white/[0.06] space-y-1.5">
              <span className="text-slate-400 text-[10px] uppercase font-bold block">
                AUTONOMOUS MITIGATION RECOMMENDATION
              </span>
              <p className="text-emerald-300 leading-relaxed bg-emerald-500/10 p-3 rounded-lg border border-emerald-500/20 text-[11px]">
                Execute closed-loop eBPF XDP NIC drop rule for source IP <strong>{alert.sourceIp}</strong> or divert session to isolated Deception Honeypot trap container.
              </p>
            </div>
          </div>
        )}

        {/* Tab 3: Threat Intelligence */}
        {activeTab === 'INTEL' && alert.threatIntel && (
          <div className="space-y-4">
            <h4 className="font-bold text-slate-200 text-xs uppercase tracking-wider">
              EXTERNAL REPUTATION & GEO ENRICHMENT
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 rounded-lg bg-slate-950/80 border border-white/[0.06]">
                <span className="text-[10px] text-slate-400 block uppercase">VirusTotal v3</span>
                <span className="font-bold text-rose-400 tabular-nums">
                  {alert.threatIntel.virusTotalScore}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950/80 border border-white/[0.06]">
                <span className="text-[10px] text-slate-400 block uppercase">AbuseIPDB Confidence</span>
                <span className="font-bold text-amber-400 tabular-nums">
                  {alert.threatIntel.abuseIpDbConfidence}%
                </span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950/80 border border-white/[0.06]">
                <span className="text-[10px] text-slate-400 block uppercase">Country Origin</span>
                <span className="font-bold text-slate-200">{alert.threatIntel.country}</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950/80 border border-white/[0.06]">
                <span className="text-[10px] text-slate-400 block uppercase">Network ISP</span>
                <span className="font-bold text-slate-200 truncate block">{alert.threatIntel.isp}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
