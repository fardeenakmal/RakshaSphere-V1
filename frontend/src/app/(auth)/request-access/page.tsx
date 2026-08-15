'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  UserPlus,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Building,
  Mail,
  User,
  Lock,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function RequestAccessPage() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [org, setOrg] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [reason, setReason] = useState('');
  const [requestedRole, setRequestedRole] = useState('ROLE_SOC_ANALYST');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    if (password !== confirmPassword) {
      setErrorMsg('Password confirmation does not match.');
      setIsLoading(false);
      return;
    }

    try {
      const { apiService } = await import('@/services/api');
      await apiService.register({
        username: email.split('@')[0],
        name,
        email,
        password,
        confirmPassword,
        requestedRole,
      });

      setSuccessMsg(`Registration request submitted successfully for ${email}. Account status: PENDING APPROVAL by SOC Administrator.`);
      setIsLoading(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit registration request.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070a11] text-slate-100 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background Cyber Grid Backdrop */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a15_1px,transparent_1px),linear-gradient(to_bottom,#0f172a15_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Main Request Form Container */}
      <div className="relative z-10 w-full max-w-lg soc-card p-8 shadow-2xl backdrop-blur-2xl my-8">
        <Link href="/login" className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-emerald-400 mb-6 transition">
          <ArrowLeft className="w-4 h-4" /> Back to Console Login
        </Link>

        {/* Header Branding */}
        <div className="text-center space-y-2 mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shadow-xl shadow-emerald-500/10 mb-1">
            <UserPlus className="w-6 h-6 animate-pulse" />
          </div>
          <h1 className="text-xl font-extrabold tracking-tight text-slate-100">
            REQUEST ENTERPRISE SOC ACCESS
          </h1>
          <p className="text-xs font-mono text-slate-400">
            Submit credentials for administrator review and RBAC role provision
          </p>
        </div>

        {/* Status Alerts */}
        {successMsg && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono space-y-2">
            <div className="flex items-center gap-2 font-bold">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>REQUEST SUBMITTED FOR REVIEW</span>
            </div>
            <p className="text-slate-300">{successMsg}</p>
            <div className="pt-2">
              <Button size="sm" variant="primary" onClick={() => router.push('/login')}>
                Return to Login Page
              </Button>
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {!successMsg && (
          <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-slate-400 block mb-1">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Alex Morgan"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Corporate Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alex@enterprise.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-slate-200"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-slate-400 block mb-1">Organization / Dept</label>
                <div className="relative">
                  <Building className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={org}
                    onChange={(e) => setOrg(e.target.value)}
                    placeholder="Cyber Operations"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Requested Role</label>
                <select
                  value={requestedRole}
                  onChange={(e) => setRequestedRole(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 font-mono font-bold focus:outline-none"
                >
                  <option value="ROLE_SOC_ANALYST">ROLE_SOC_ANALYST (Tier-2 Analyst)</option>
                  <option value="ROLE_USER">ROLE_USER (Observer Read-Only)</option>
                  <option value="ROLE_ADMIN">ROLE_ADMIN (Super Administrator)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-slate-400 block mb-1">Account Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Confirm Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-slate-200"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Reason for Access</label>
              <div className="relative">
                <FileText className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <textarea
                  rows={2}
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Provide brief justification for SOC portal access..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-slate-200"
                />
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 space-y-1">
              <p>• Lifecycle status: <strong className="text-amber-400">PENDING APPROVAL</strong></p>
              <p>• Super Admin will review organization credentials before account activation.</p>
            </div>

            <Button
              type="submit"
              size="lg"
              variant="primary"
              className="w-full mt-2"
              disabled={isLoading}
            >
              {isLoading ? 'Submitting Registration...' : 'SUBMIT ACCESS REQUEST'}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
