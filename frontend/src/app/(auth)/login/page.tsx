'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  Lock,
  User as UserIcon,
  ArrowRight,
  Zap,
  Eye,
  EyeOff,
  UserPlus,
  HelpCircle,
  CheckCircle2,
  AlertTriangle,
  Building,
  Mail,
  FileText,
  UserCheck
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { StatusBadge } from '@/components/ui/StatusBadge';

export default function LoginPage() {
  const router = useRouter();
  const { loginAsync, isAuthenticated, isInitializing, initializeAuth } = useAuthStore();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Drawers / Modals
  const [showRequestAccessModal, setShowRequestAccessModal] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [accessSuccessMsg, setAccessSuccessMsg] = useState('');

  // Request Access Form State
  const [reqName, setReqName] = useState('');
  const [reqEmail, setReqEmail] = useState('');
  const [reqOrg, setReqOrg] = useState('');
  const [reqPassword, setReqPassword] = useState('');
  const [reqConfirmPassword, setReqConfirmPassword] = useState('');
  const [reqReason, setReqReason] = useState('');
  const [reqError, setReqError] = useState('');

  // MFA State
  const [requiresMfa, setRequiresMfa] = useState(false);
  const [mfaCode, setMfaCode] = useState('');

  React.useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  React.useEffect(() => {
    if (!isInitializing && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isInitializing, isAuthenticated, router]);

  // Quick Role Username Selectors (Populates username only, password remains empty)
  const handleQuickRoleSelect = (role: 'ADMIN' | 'ANALYST' | 'USER') => {
    if (role === 'ADMIN') {
      setUsername('admin');
    } else if (role === 'ANALYST') {
      setUsername('analyst_mike');
    } else {
      setUsername('user');
    }
    setPassword('');
  };

  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: 'Weak', color: 'bg-slate-700' };
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;

    if (score <= 1) return { score: 25, label: 'WEAK', color: 'bg-red-500' };
    if (score === 2) return { score: 50, label: 'FAIR', color: 'bg-amber-500' };
    if (score === 3) return { score: 75, label: 'STRONG', color: 'bg-cyan-400' };
    return { score: 100, label: 'ENTERPRISE SECURE', color: 'bg-emerald-400' };
  };

  const strength = getPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
      await loginAsync(username, password, requiresMfa ? mfaCode : undefined, rememberMe);
      router.push('/dashboard');
    } catch (err: any) {
      console.error("Login failed:", err);
      const msg = err.message || '';
      if (msg.includes('MFA TOTP code required')) {
        setRequiresMfa(true);
        setErrorMsg('Two-Factor Authentication Enabled. Please enter your 6-digit TOTP code.');
      } else {
        setErrorMsg(msg || 'Authentication failed. Check credentials or connection.');
      }
      setIsLoading(false);
    }
  };

  const handleRequestAccessSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setReqError('');

    if (reqPassword !== reqConfirmPassword) {
      setReqError('Password confirmation does not match.');
      return;
    }

    try {
      const { apiService } = await import('@/services/api');
      await apiService.register({
        username: reqEmail.split('@')[0],
        name: reqName,
        email: reqEmail,
        password: reqPassword,
        confirmPassword: reqConfirmPassword,
        requestedRole: 'ROLE_SOC_ANALYST',
      });

      setAccessSuccessMsg(`Access request submitted for ${reqEmail}! Account Status: PENDING APPROVAL by SOC Administrator.`);
      setShowRequestAccessModal(false);
      setReqName('');
      setReqEmail('');
      setReqOrg('');
      setReqPassword('');
      setReqConfirmPassword('');
      setReqReason('');
    } catch (err: any) {
      setReqError(err.message || 'Failed to submit registration request.');
    }
  };

  return (
    <div className="min-h-screen bg-[#070a11] text-slate-100 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background Cyber Grid Backdrop */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a15_1px,transparent_1px),linear-gradient(to_bottom,#0f172a15_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Login Card */}
      <div className="relative z-10 w-full max-w-md soc-card p-8 shadow-2xl backdrop-blur-2xl">
        {/* Header Branding */}
        <div className="text-center space-y-3 mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shadow-xl shadow-emerald-500/10 mb-1">
            <ShieldCheck className="w-8 h-8 animate-pulse" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400 font-sans">
            RAKSHASPHERE
          </h1>
          <p className="text-xs font-mono text-slate-400 uppercase tracking-wider">
            Autonomous Cyber Defense SOC Platform
          </p>
        </div>

        {/* Demo Fast Role Selectors */}
        <div className="mb-6 p-3 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block text-center font-bold">
            ⚡ QUICK DEMO IDENTITY SELECTOR
          </span>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickRoleSelect('ADMIN')}
              className="px-2 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 transition text-[10px] font-mono font-bold"
            >
              ADMIN
            </button>
            <button
              type="button"
              onClick={() => handleQuickRoleSelect('ANALYST')}
              className="px-2 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 transition text-[10px] font-mono font-bold"
            >
              ANALYST
            </button>
            <button
              type="button"
              onClick={() => handleQuickRoleSelect('USER')}
              className="px-2 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 transition text-[10px] font-mono font-bold"
            >
              OBSERVER
            </button>
          </div>
        </div>

        {/* Status Alerts */}
        {accessSuccessMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{accessSuccessMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-slate-400">Username / Identity</label>
            <div className="relative">
              <UserIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="admin@rakshasphere.internal"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 transition font-mono"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono text-slate-400">Password</label>
              <button
                type="button"
                onClick={() => setShowForgotPasswordModal(true)}
                className="text-[11px] font-mono text-cyan-400 hover:underline"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••••••"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-10 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 transition font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Password Strength Meter */}
            {password && (
              <div className="pt-1 space-y-1">
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <span>Strength:</span>
                  <span className="font-bold">{strength.label}</span>
                </div>
                <div className="w-full bg-slate-950 h-1 rounded-full overflow-hidden">
                  <div className={`h-full transition-all duration-300 ${strength.color}`} style={{ width: `${strength.score}%` }} />
                </div>
              </div>
            )}
          </div>

          {/* MFA TOTP Step */}
          {requiresMfa && (
            <div className="space-y-1.5 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 animate-in fade-in">
              <label className="text-xs font-mono text-emerald-400 font-bold flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" /> 6-Digit TOTP Authenticator Code
              </label>
              <input
                type="text"
                maxLength={6}
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value)}
                required
                placeholder="123456"
                className="w-full bg-slate-950 border border-emerald-500/50 rounded-xl px-4 py-2.5 text-center text-sm font-mono tracking-widest text-emerald-300 focus:outline-none focus:ring-1 focus:ring-emerald-400"
              />
            </div>
          )}

          {/* Remember Session */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-mono text-slate-400">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded bg-slate-950 border-slate-800 text-emerald-500 focus:ring-0"
              />
              <span>Remember active SOC session</span>
            </label>
          </div>

          <Button
            type="submit"
            size="lg"
            variant="primary"
            className="w-full mt-4"
            disabled={isLoading}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            {isLoading ? 'Authenticating Credentials...' : 'SIGN IN TO SOC CONSOLE'}
          </Button>
        </form>

        {/* Enterprise Request Access Option */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 text-center space-y-3">
          <div className="text-xs font-mono text-slate-400 flex items-center justify-center gap-1.5">
            <span>Need SOC Console Access?</span>
            <button
              onClick={() => setShowRequestAccessModal(true)}
              className="text-emerald-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" /> Request Access
            </button>
          </div>

          <div className="text-[10px] font-mono text-slate-400 flex items-center justify-center gap-1.5">
            <Zap className="w-3 h-3 text-emerald-400 animate-pulse" />
            <span>Closed-Loop eBPF Cyber Defense Security Mesh</span>
          </div>
        </div>
      </div>

      {/* REQUEST ACCESS MODAL */}
      <Modal
        isOpen={showRequestAccessModal}
        onClose={() => setShowRequestAccessModal(false)}
        title="REQUEST ENTERPRISE SOC ACCESS"
        subtitle="Submit request for SOC analyst role provision"
        icon={<UserPlus className="w-5 h-5 text-emerald-400" />}
        size="md"
      >
        <form onSubmit={handleRequestAccessSubmit} className="space-y-3 font-mono text-xs">
          {reqError && (
            <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
              {reqError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 block mb-1">Full Name</label>
              <input
                type="text"
                required
                value={reqName}
                onChange={(e) => setReqName(e.target.value)}
                placeholder="Alex Morgan"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 font-mono"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Corporate Email</label>
              <input
                type="email"
                required
                value={reqEmail}
                onChange={(e) => setReqEmail(e.target.value)}
                placeholder="alex@enterprise.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Organization / Department</label>
            <input
              type="text"
              required
              value={reqOrg}
              onChange={(e) => setReqOrg(e.target.value)}
              placeholder="Cyber Threat Operations Center"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 block mb-1">Password</label>
              <input
                type="password"
                required
                value={reqPassword}
                onChange={(e) => setReqPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 font-mono"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Confirm Password</label>
              <input
                type="password"
                required
                value={reqConfirmPassword}
                onChange={(e) => setReqConfirmPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Reason for Access</label>
            <textarea
              rows={2}
              required
              value={reqReason}
              onChange={(e) => setReqReason(e.target.value)}
              placeholder="Require SOC Tier-2 Incident Triage permissions..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 font-mono"
            />
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 space-y-1">
            <p>• Account status will be set to: <strong className="text-amber-400">PENDING APPROVAL</strong></p>
            <p>• Super Admin will review organization credentials before activation.</p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
            <Button type="button" variant="ghost" onClick={() => setShowRequestAccessModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              SUBMIT REQUEST
            </Button>
          </div>
        </form>
      </Modal>

      {/* FORGOT PASSWORD MODAL */}
      <Modal
        isOpen={showForgotPasswordModal}
        onClose={() => setShowForgotPasswordModal(false)}
        title="ACCOUNT RECOVERY DIRECTIVE"
        subtitle="Enterprise Identity Security Policy"
        icon={<HelpCircle className="w-5 h-5 text-cyan-400" />}
        size="sm"
        footer={
          <div className="w-full flex justify-end">
            <Button variant="secondary" onClick={() => setShowForgotPasswordModal(false)}>
              Acknowledge
            </Button>
          </div>
        }
      >
        <div className="space-y-3 font-mono text-xs">
          <p className="text-slate-300 leading-relaxed bg-slate-950 p-4 rounded-xl border border-slate-800">
            For security compliance, automated self-service password resets are disabled on the RakshaSphere Autonomous Defense Mesh.
          </p>
          <p className="text-slate-400">
            Please contact your Designated System Administrator or internal SOC Help Desk with your Employee ID for identity verification.
          </p>
        </div>
      </Modal>
    </div>
  );
}

