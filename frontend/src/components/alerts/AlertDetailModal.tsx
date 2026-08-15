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
  Layers
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { Alert } from '@/types';
import { useAlertStore } from '@/store/useAlertStore';
import { PermissionGuard } from '@/components/common/PermissionGuard';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';

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
    <div className="flex items-center gap-3">
      <span>INCIDENT DOSSIER: {alert.id}</span>
      <StatusBadge status={alert.severity} size="sm" />
    </div>
  );

  const modalSubtitle = `Detected: ${new Date(alert.timestamp).toLocaleString()} | Vector: ${alert.attackType}`;

  const modalFooter = (
    <div className="w-full flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <PermissionGuard
          allowedRoles={['ROLE_ADMIN', 'ROLE_SOC_ANALYST']}
          fallback={
            <span className="text-amber-400 text-[11px] flex items-center gap-1 font-mono">
              <Lock className="w-3.5 h-3.5" /> Read-only role
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
              leftIcon={<RotateCcw className="w-3.5 h-3.5 text-red-400" />}
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
      icon={<ShieldAlert className="w-6 h-6 text-red-400" />}
      footer={modalFooter}
    >
      <div className="space-y-6 font-mono text-xs">
        {/* Navigation Tabs inside Modal */}
        <div className="flex border-b border-slate-800 space-x-4">
          <button
            onClick={() => setActiveTab('OVERVIEW')}
            className={`py-2 px-3 font-bold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'OVERVIEW'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" /> Overview & Risk
          </button>
          <button
            onClick={() => setActiveTab('EVIDENCE')}
            className={`py-2 px-3 font-bold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'EVIDENCE'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" /> AI Evidence & Features
          </button>
          <button
            onClick={() => setActiveTab('INTEL')}
            className={`py-2 px-3 font-bold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'INTEL'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe className="w-3.5 h-3.5" /> Threat Intelligence
          </button>
        </div>

        {/* Tab 1: Overview */}
        {activeTab === 'OVERVIEW' && (
          <div className="space-y-6">
            {/* Top Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
                <span className="text-slate-400 font-semibold text-[10px]">DYNAMIC RISK SCORE</span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-3xl font-extrabold text-red-400 tabular-nums">{alert.riskScore}</span>
                  <span className="text-slate-400 text-[10px]">/ 100</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div className="bg-gradient-to-r from-amber-500 to-red-500 h-full" style={{ width: `${alert.riskScore}%` }} />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
                <span className="text-slate-400 font-semibold text-[10px]">AI CONFIDENCE SCORE</span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-2xl font-bold text-cyan-400 tabular-nums">{(alert.confidence * 100).toFixed(0)}%</span>
                  <span className="text-slate-400 text-[10px]">Random Forest</span>
                </div>
                <span className="text-[10px] text-slate-400 mt-2">XGBoost & Autoencoder Ensembled</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
                <span className="text-slate-400 font-semibold text-[10px]">REMEDIATION STATE</span>
                <div className="mt-2">
                  <StatusBadge status={alert.status} size="md" />
                </div>
                <span className="text-[10px] text-slate-400 mt-2 truncate block">{alert.remediationAction}</span>
              </div>
            </div>

            {/* Network Telemetry & MITRE Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <h4 className="font-bold text-slate-200 text-xs border-b border-slate-800 pb-1 mb-2">
                  NETWORK INGRESS TELEMETRY
                </h4>
                <div className="flex justify-between">
                  <span className="text-slate-400">Attacker IP:</span>
                  <span className="text-emerald-400 font-bold">{alert.sourceIp}:{alert.sourcePort}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Target IP:</span>
                  <span className="text-slate-200 font-bold">{alert.destinationIp}:{alert.destinationPort}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Attack Vector:</span>
                  <span className="text-slate-200 font-bold">{alert.attackType}</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <h4 className="font-bold text-slate-200 text-xs border-b border-slate-800 pb-1 mb-2">
                  MITRE ATT&CK MATRIX MAPPING
                </h4>
                <div className="flex justify-between">
                  <span className="text-slate-400">Tactic Group:</span>
                  <span className="text-cyan-400 font-bold">{alert.mitreTactic}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Technique:</span>
                  <span className="text-slate-200 font-bold">{alert.mitreTechnique}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">STIX ID:</span>
                  <span className="text-emerald-400 font-bold">{alert.mitreId}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: AI Features & Evidence */}
        {activeTab === 'EVIDENCE' && (
          <div className="space-y-4">
            <h4 className="font-bold text-slate-200 text-xs">CICFLOWMETER 84-FEATURE INFERENCE VECTOR</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">FLOW DURATION</span>
                <span className="font-bold text-slate-200">{alert.flowFeatures?.flowDurationMs || 0} ms</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">TOTAL FWD PACKETS</span>
                <span className="font-bold text-slate-200">{alert.flowFeatures?.totalFwdPackets || 0}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">MEAN PACKET SIZE</span>
                <span className="font-bold text-slate-200">{alert.flowFeatures?.packetLengthMean || 0} B</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">ANOMALY SCORE</span>
                <span className="font-bold text-red-400">{alert.flowFeatures?.autoencoderAnomalyScore || 0}</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <span className="text-slate-400 text-[10px] block">AUTONOMOUS MITIGATION RECOMMENDATION</span>
              <p className="text-emerald-400 leading-relaxed bg-emerald-500/10 p-3 rounded-lg border border-emerald-500/30">
                Execute closed-loop eBPF XDP NIC drop rule for source IP <strong>{alert.sourceIp}</strong> or divert session to isolated Deception Honeypot trap container.
              </p>
            </div>
          </div>
        )}

        {/* Tab 3: Threat Intelligence */}
        {activeTab === 'INTEL' && alert.threatIntel && (
          <div className="space-y-4">
            <h4 className="font-bold text-slate-200 text-xs">EXTERNAL REPUTATION ENRICHMENT</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">VIRUSTOTAL REPUTATION</span>
                <span className="font-bold text-red-400">{alert.threatIntel.virusTotalScore}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">ABUSEIPDB CONFIDENCE</span>
                <span className="font-bold text-amber-400">{alert.threatIntel.abuseIpDbConfidence}%</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">GEO ORIGIN</span>
                <span className="font-bold text-slate-200">{alert.threatIntel.country}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">NETWORK ISP</span>
                <span className="font-bold text-slate-200 truncate block">{alert.threatIntel.isp}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

