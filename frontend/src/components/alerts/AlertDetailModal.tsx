'use client';

import React from 'react';
import {
  X,
  ShieldAlert,
  ShieldCheck,
  Zap,
  Bug,
  Globe,
  Activity,
  RotateCcw,
  CheckCircle2,
  Lock,
  Download
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { Alert } from '@/types';
import { useAlertStore } from '@/store/useAlertStore';
import { PermissionGuard } from '@/components/common/PermissionGuard';

interface AlertDetailModalProps {
  alert: Alert | null;
  onClose: () => void;
}

export const AlertDetailModal: React.FC<AlertDetailModalProps> = ({ alert, onClose }) => {
  const { containAlert, divertToHoneypot, resolveAlert, revertAction } = useAlertStore();

  if (!alert) return null;

  const exportDossierToPDF = () => {
    if (!alert) return;
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`RakshaSphere - Incident Dossier: ${alert.id}`, 14, 15);
    
    let currentY = 25;
    
    // Alert Details
    doc.setFontSize(12);
    doc.text(`Timestamp: ${new Date(alert.timestamp).toLocaleString()}`, 14, currentY); currentY += 8;
    doc.text(`Severity: ${alert.severity}`, 14, currentY); currentY += 8;
    doc.text(`Risk Score: ${alert.riskScore}`, 14, currentY); currentY += 8;
    doc.text(`Status: ${alert.status}`, 14, currentY); currentY += 12;
    
    // Network Info
    doc.text(`Source IP: ${alert.sourceIp}:${alert.sourcePort}`, 14, currentY); currentY += 8;
    doc.text(`Destination IP: ${alert.destinationIp}:${alert.destinationPort}`, 14, currentY); currentY += 8;
    doc.text(`Attack Type: ${alert.attackType}`, 14, currentY); currentY += 12;
    
    // MITRE Info
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-xl border ${
                alert.severity === 'CRITICAL'
                  ? 'bg-red-500/10 border-red-500/30 text-red-400'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
              }`}
            >
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-mono font-bold text-lg text-slate-100">{alert.id}</h2>
                <span className="px-2 py-0.5 text-xs font-mono font-bold rounded bg-slate-800 text-emerald-400 border border-slate-700">
                  {alert.attackType}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Detected: {new Date(alert.timestamp).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={exportDossierToPDF}
              className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white transition flex items-center gap-1.5 text-xs font-bold"
              title="Export Dossier to PDF"
            >
              <Download className="w-4 h-4" /> Export PDF
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs font-mono">
          {/* Top Risk & Status Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
              <span className="text-slate-400 font-semibold">DYNAMIC RISK SCORE</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-extrabold text-red-400">{alert.riskScore}</span>
                <span className="text-slate-500">/ 100</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-amber-500 to-red-500 h-full"
                  style={{ width: `${alert.riskScore}%` }}
                />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
              <span className="text-slate-400 font-semibold">AI CONFIDENCE & ANOMALY</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-2xl font-bold text-cyan-400">{(alert.confidence * 100).toFixed(0)}%</span>
                <span className="text-slate-500">Autoencoder: {alert.flowFeatures?.autoencoderAnomalyScore}</span>
              </div>
              <span className="text-[10px] text-slate-500 mt-2">CICFlowMeter 84-Feature Extraction</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
              <span className="text-slate-400 font-semibold">CURRENT REMEDIATION STATUS</span>
              <div className="mt-2 font-bold">
                {alert.status === 'CONTAINED' && <span className="text-emerald-400">🛡️ eBPF DROP ACTIVE</span>}
                {alert.status === 'HONEYPOT_DIVERTED' && <span className="text-amber-400">🪤 TRAPPED IN HONEYPOT</span>}
                {alert.status === 'ACTIVE' && <span className="text-red-400 animate-pulse">⚡ ACTIVE INTRUSION</span>}
                {alert.status === 'RESOLVED' && <span className="text-slate-400">✅ RESOLVED</span>}
              </div>
              <span className="text-[10px] text-slate-400 mt-2 truncate">{alert.remediationAction}</span>
            </div>
          </div>

          {/* Network & MITRE Mapping */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
              <h4 className="font-bold text-slate-200 text-sm border-b border-slate-800 pb-1 mb-2">
                NETWORK INGRESS TELEMETRY
              </h4>
              <div className="flex justify-between">
                <span className="text-slate-400">Source IP:</span>
                <span className="text-emerald-400 font-bold">{alert.sourceIp}:{alert.sourcePort}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Destination IP:</span>
                <span className="text-slate-200 font-bold">{alert.destinationIp}:{alert.destinationPort}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Flow Duration:</span>
                <span className="text-slate-300">{alert.flowFeatures?.flowDurationMs} ms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Packet Mean Size:</span>
                <span className="text-slate-300">{alert.flowFeatures?.packetLengthMean} bytes</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
              <h4 className="font-bold text-slate-200 text-sm border-b border-slate-800 pb-1 mb-2">
                MITRE ATT&CK MATRIX MAPPING
              </h4>
              <div className="flex justify-between">
                <span className="text-slate-400">Tactic:</span>
                <span className="text-cyan-400 font-bold">{alert.mitreTactic}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Technique:</span>
                <span className="text-slate-200 font-bold">{alert.mitreTechnique}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">MITRE ID:</span>
                <span className="text-emerald-400 font-mono font-bold">{alert.mitreId}</span>
              </div>
            </div>
          </div>

          {/* External Threat Intelligence Enrichment */}
          {alert.threatIntel && (
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
              <h4 className="font-bold text-slate-200 text-sm flex items-center gap-2">
                <Globe className="w-4 h-4 text-cyan-400" /> EXTERNAL THREAT INTELLIGENCE ENRICHMENT
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">VIRUSTOTAL SCORE</span>
                  <span className="font-bold text-red-400">{alert.threatIntel.virusTotalScore}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">ABUSEIPDB CONFIDENCE</span>
                  <span className="font-bold text-amber-400">{alert.threatIntel.abuseIpDbConfidence}%</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">GEO LOCATION</span>
                  <span className="font-bold text-slate-200">{alert.threatIntel.country}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">NETWORK ISP</span>
                  <span className="font-bold text-slate-300 truncate block">{alert.threatIntel.isp}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Footer (Protected by PermissionGuard for Admin/Analyst) */}
        <div className="p-5 border-t border-slate-800 bg-slate-950/90 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <PermissionGuard
              allowedRoles={['ROLE_ADMIN', 'ROLE_SOC_ANALYST']}
              fallback={
                <span className="text-amber-400/80 text-[11px] flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5" /> Read-only role (Switch role in Navbar to test remediation)
                </span>
              }
            >
              <button
                onClick={() => containAlert(alert.id, 'eBPF / XDP Kernel Drop Rule Applied')}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition flex items-center gap-1.5 shadow-lg shadow-emerald-600/20"
              >
                <Zap className="w-4 h-4" /> Inject eBPF Drop
              </button>

              <button
                onClick={() => divertToHoneypot(alert.id)}
                className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold transition flex items-center gap-1.5 shadow-lg shadow-amber-600/20"
              >
                <Bug className="w-4 h-4" /> Divert to Honeypot
              </button>

              <button
                onClick={() => resolveAlert(alert.id)}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition flex items-center gap-1.5 border border-slate-700"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Mark Resolved
              </button>
            </PermissionGuard>
          </div>

          <PermissionGuard requiredRole="ROLE_ADMIN">
            <button
              onClick={() => revertAction(alert.id)}
              className="px-3 py-2 rounded-xl bg-red-950/60 border border-red-500/30 text-red-300 hover:bg-red-900/60 font-semibold transition flex items-center gap-1.5 ml-auto"
            >
              <RotateCcw className="w-4 h-4" /> Revert eBPF Rule
            </button>
          </PermissionGuard>
        </div>
      </div>
    </div>
  );
};
