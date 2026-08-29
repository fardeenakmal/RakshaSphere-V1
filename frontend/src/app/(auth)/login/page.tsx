'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
  Radio,
  Cpu,
  Layers,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';

export default function LoginPage() {
  const router = useRouter();
  const { loginAsync, skipLogin, isAuthenticated, isInitializing, initializeAuth } = useAuthStore();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showDemoAccess, setShowDemoAccess] = useState(false);

  // Recovery Modal
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);

  // MFA State
  const [requiresMfa, setRequiresMfa] = useState(false);
  const [mfaCode, setMfaCode] = useState('');

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (!isInitializing && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isInitializing, isAuthenticated, router]);

  const handleSkipLogin = () => {
    skipLogin();
    router.push('/dashboard');
  };

  // Keyboard Shortcuts for Demo Identities: Ctrl/Cmd + 1, 2, 3
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey) {
        if (e.key === '1') {
          e.preventDefault();
          setUsername('admin');
          setPassword('');
        } else if (e.key === '2') {
          e.preventDefault();
          setUsername('analyst_mike');
          setPassword('');
        } else if (e.key === '3') {
          e.preventDefault();
          setUsername('user');
          setPassword('');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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
    if (!pass) return { score: 0, label: 'NONE', color: 'bg-slate-800' };
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;

    if (score <= 1) return { score: 25, label: 'LOW', color: 'bg-rose-500' };
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
      console.error('Login failed:', err);
      const msg = err.message || '';
      if (msg.includes('MFA TOTP code required')) {
        setRequiresMfa(true);
        setErrorMsg('Two-Factor Authentication challenge active. Enter your 6-digit TOTP code.');
      } else {
        setErrorMsg(msg || 'Authentication failed. Check credentials or local backend connection.');
      }
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex items-center justify-center p-4 md:p-8 relative overflow-hidden font-sans select-none">
      {/* Background Architectural Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none" />

      {/* Main Container Card: Two-Column Split on Desktop */}
      <div className="relative z-10 w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 rounded-2xl border border-white/[0.08] bg-[#070b14]/95 shadow-2xl overflow-hidden backdrop-blur-xl">
        {/* LEFT COLUMN: RakshaSphere Brand Mission & Telemetry Highlights (5 cols) */}
        <div className="lg:col-span-5 p-6 md:p-8 bg-slate-950/80 border-b lg:border-b-0 lg:border-r border-white/[0.06] flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shadow-sm">
              <ShieldCheck className="w-6 h-6" />
            </div>

            <div>
              <h1 className="text-xl md:text-2xl font-extrabold text-slate-100 font-mono tracking-tight">
                RAKSHASPHERE
              </h1>
              <p className="text-xs font-mono text-emerald-400 uppercase tracking-widest mt-0.5">
                Autonomous SOC Gateway
              </p>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Enterprise closed-loop cyber defense operations platform with kernel-level eBPF mitigation, STIX 2.1 ATT&CK correlation, and adaptive deception honeypots.
            </p>
          </div>

          {/* Subsystem Telemetry Feature Badges */}
          <div className="space-y-2.5 font-mono text-xs pt-4 border-t border-white/[0.06]">
            <div className="flex items-center gap-2 text-slate-300">
              <Zap className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="text-[11px]">eBPF / XDP Zero-Copy Ingress Drops</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <Layers className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="text-[11px]">MITRE ATT&CK Matrix Correlation</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <Radio className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="text-[11px]">Real-Time STOMP Incident Stream</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <Cpu className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="text-[11px]">Autoencoder ML Flow Inference</span>
            </div>
          </div>

          <div className="text-[11px] font-mono text-slate-500 pt-2">
            Localhost Target • College Demo Environment
          </div>
        </div>

        {/* RIGHT COLUMN: Secure Login Panel (7 cols) */}
        <div className="lg:col-span-7 p-6 md:p-8 flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.06] mb-5">
              <div>
                <h2 className="text-base font-bold text-slate-100 font-mono tracking-tight">
                  SIGN IN TO CONSOLE
                </h2>
                <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                  Enter authorized analyst credentials
                </p>
              </div>

              {/* Developer Demo Quick Switcher Toggle */}
              <button
                type="button"
                onClick={() => setShowDemoAccess(!showDemoAccess)}
                className="text-[11px] font-mono text-slate-400 hover:text-emerald-400 flex items-center gap-1 transition px-2 py-1 rounded bg-slate-900 border border-white/10"
              >
                <span>Demo Access</span>
                {showDemoAccess ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            </div>

            {/* Collapsible Developer Quick Switcher */}
            {showDemoAccess && (
              <div className="mb-5 p-3 rounded-lg bg-slate-950/90 border border-white/10 space-y-2 animate-in fade-in duration-150 font-mono text-xs">
                <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase">
                  <span>Developer Quick Switcher</span>
                  <span className="text-slate-500">Ctrl + 1/2/3</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickRoleSelect('ADMIN')}
                    className="px-2 py-1.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20 transition text-[11px] font-bold"
                  >
                    ADMIN (1)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickRoleSelect('ANALYST')}
                    className="px-2 py-1.5 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20 transition text-[11px] font-bold"
                  >
                    ANALYST (2)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickRoleSelect('USER')}
                    className="px-2 py-1.5 rounded bg-slate-900 border border-white/10 text-slate-300 hover:bg-slate-800 transition text-[11px] font-bold"
                  >
                    OBSERVER (3)
                  </button>
                </div>
              </div>
            )}

            {/* Error Message */}
            {errorMsg && (
              <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4 font-mono">
              <Input
                label="Identity / Username"
                leftIcon={<UserIcon className="w-4 h-4" />}
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="admin"
              />

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowForgotPasswordModal(true)}
                    className="text-[11px] text-cyan-400 hover:underline cursor-pointer"
                  >
                    Recovery
                  </button>
                </div>

                <div className="relative">
                  <Input
                    leftIcon={<Lock className="w-4 h-4" />}
                    rightIcon={
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-slate-400 hover:text-slate-200 cursor-pointer"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    }
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••••••"
                  />
                </div>

                {password && (
                  <div className="pt-1 space-y-1 text-[10px]">
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Entropy:</span>
                      <span className="font-bold text-slate-200">{strength.label}</span>
                    </div>
                    <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden border border-white/[0.04]">
                      <div
                        className={`h-full transition-all duration-300 ${strength.color}`}
                        style={{ width: `${strength.score}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* MFA TOTP Challenge */}
              {requiresMfa && (
                <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 space-y-2">
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
                    className="w-full bg-slate-950 border border-emerald-500/50 rounded-lg px-3 py-2 text-center text-sm font-mono tracking-widest text-emerald-300 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                  />
                </div>
              )}

              <div className="flex items-center justify-between pt-1 text-xs">
                <label className="flex items-center gap-2 cursor-pointer text-slate-400">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded bg-slate-950 border-slate-700 text-emerald-500 focus:ring-0"
                  />
                  <span className="text-[11px]">Remember active session</span>
                </label>
              </div>

              <Button
                type="submit"
                size="md"
                variant="primary"
                className="w-full mt-2"
                disabled={isLoading}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                {isLoading ? 'Authenticating Credentials...' : 'SIGN IN TO SOC CONSOLE'}
              </Button>

              <div className="relative flex py-1 items-center my-1">
                <div className="flex-grow border-t border-white/[0.08]"></div>
                <span className="flex-shrink mx-3 text-[10px] text-slate-500 uppercase tracking-widest font-mono">or explore</span>
                <div className="flex-grow border-t border-white/[0.08]"></div>
              </div>

              <button
                type="button"
                id="skip-login-btn"
                onClick={handleSkipLogin}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-700/80 bg-slate-900/60 hover:bg-slate-800/80 hover:border-emerald-500/50 text-slate-300 hover:text-white text-xs font-mono font-medium transition-all flex items-center justify-between group shadow-sm cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                  <span>Skip Login — View Only Mode</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
              </button>
            </form>
          </div>

          {/* Bottom Link to Request Access */}
          <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between text-xs font-mono text-slate-400">
            <span>Need console provision?</span>
            <Link
              href="/request-access"
              className="text-emerald-400 font-bold hover:underline inline-flex items-center gap-1"
            >
              <UserPlus className="w-3.5 h-3.5" /> Request Access
            </Link>
          </div>
        </div>
      </div>

      {/* RECOVERY MODAL */}
      <Modal
        isOpen={showForgotPasswordModal}
        onClose={() => setShowForgotPasswordModal(false)}
        title="ACCOUNT RECOVERY DIRECTIVE"
        subtitle="Enterprise Identity Security Policy"
        icon={<HelpCircle className="w-5 h-5 text-cyan-400" />}
        size="sm"
        footer={
          <Button variant="secondary" size="sm" onClick={() => setShowForgotPasswordModal(false)}>
            Acknowledge
          </Button>
        }
      >
        <div className="space-y-3 font-mono text-xs">
          <p className="text-slate-300 leading-relaxed bg-slate-950 p-3.5 rounded-lg border border-white/10">
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
