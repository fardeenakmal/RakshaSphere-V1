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
  FileText,
  ShieldCheck
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';

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
    <div className="min-h-screen bg-[#030712] text-slate-100 flex items-center justify-center p-4 md:p-8 relative overflow-hidden font-sans select-none">
      {/* Background Architectural Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none" />

      {/* Main Request Form Container */}
      <div className="relative z-10 w-full max-w-xl rounded-2xl border border-white/[0.08] bg-[#070b14]/95 p-6 md:p-8 shadow-2xl backdrop-blur-xl">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-emerald-400 mb-5 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Console Login
        </Link>

        {/* Header Branding */}
        <div className="space-y-1.5 pb-4 border-b border-white/[0.06] mb-5">
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shadow-sm">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-100 font-mono">
                REQUEST SOC OPERATIONAL ACCESS
              </h1>
              <p className="text-xs font-mono text-slate-400">
                Submit credentials for administrator RBAC approval
              </p>
            </div>
          </div>
        </div>

        {/* Status Alerts */}
        {successMsg && (
          <div className="mb-6 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono space-y-3">
            <div className="flex items-center gap-2 font-bold">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>REQUEST SUBMITTED FOR APPROVAL</span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">{successMsg}</p>
            <div>
              <Button size="sm" variant="primary" onClick={() => router.push('/login')}>
                Return to Sign In
              </Button>
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {!successMsg && (
          <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Full Name"
                leftIcon={<User className="w-3.5 h-3.5" />}
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex Morgan"
              />

              <Input
                label="Corporate Email"
                leftIcon={<Mail className="w-3.5 h-3.5" />}
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex@enterprise.com"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Department / Org"
                leftIcon={<Building className="w-3.5 h-3.5" />}
                type="text"
                required
                value={org}
                onChange={(e) => setOrg(e.target.value)}
                placeholder="Cyber Operations Center"
              />

              <Select
                label="Requested Role"
                value={requestedRole}
                onChange={(e) => setRequestedRole(e.target.value)}
                options={[
                  { value: 'ROLE_SOC_ANALYST', label: 'ROLE_SOC_ANALYST (Triage)' },
                  { value: 'ROLE_USER', label: 'ROLE_USER (Observer)' },
                  { value: 'ROLE_ADMIN', label: 'ROLE_ADMIN (Administrator)' },
                ]}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Password"
                leftIcon={<Lock className="w-3.5 h-3.5" />}
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
              />

              <Input
                label="Confirm Password"
                leftIcon={<Lock className="w-3.5 h-3.5" />}
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••••••"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                Justification for Access
              </label>
              <textarea
                rows={2}
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Specify incident triage responsibilities or reason for SOC console access..."
                className="w-full bg-slate-950/90 text-slate-100 placeholder-slate-500 border border-white/10 rounded-lg p-2.5 text-xs font-mono focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30"
              />
            </div>

            <div className="p-3 rounded-lg bg-slate-950/80 border border-white/[0.06] text-[11px] text-slate-400 space-y-1">
              <p>• Account status will be initialized to: <strong className="text-amber-400">PENDING APPROVAL</strong></p>
              <p>• Designated SOC Administrator must approve identity before token issuance.</p>
            </div>

            <Button
              type="submit"
              size="md"
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
