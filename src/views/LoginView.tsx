/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { User, FranchiseeProfile, AgentProfile } from '../types.ts';
import { Eye, EyeOff, ShieldCheck, UserCheck, Briefcase, Lock, User as UserIcon, AlertCircle } from 'lucide-react';

interface LoginViewProps {
  onLoginSuccess: (user: User, agentProfile?: AgentProfile, franchiseProfile?: FranchiseeProfile) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      onLoginSuccess(data.user, data.agentProfile, data.franchiseProfile);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const setQuickCredentials = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative Brand Circles */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#E52320]/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        {/* Brand Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#E52320] to-[#FF5252] shadow-xl shadow-red-500/30 text-white font-extrabold text-3xl mb-4">
            A
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Aice Philippines
          </h1>
          <p className="mt-1 text-sm text-slate-300 font-medium">
            Franchise Management & Recruitment System
          </p>
          <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/80 text-[11px] font-semibold text-slate-300">
            <span className="w-2 h-2 rounded-full bg-[#E52320] animate-pulse"></span>
            Internal Operations Portal (Authorized Personnel Only)
          </div>
        </div>

        {/* Login Card */}
        <div className="mt-8 bg-white/95 backdrop-blur-md py-8 px-6 shadow-2xl rounded-2xl sm:px-10 border border-slate-200">
          <form className="space-y-5" onSubmit={handleLogin}>
            {error && (
              <div className="rounded-xl bg-rose-50 border border-rose-200 p-3.5 flex items-start gap-3 text-rose-800 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Username or Official Email
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <UserIcon className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. admin or agent.reyes"
                  className="block w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#E52320] focus:border-transparent focus:bg-white text-slate-900 placeholder-slate-400 outline-hidden transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-10 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#E52320] focus:border-transparent focus:bg-white text-slate-900 placeholder-slate-400 outline-hidden transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-[#E52320] hover:bg-[#c91d1a] focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-[#E52320] transition-colors cursor-pointer disabled:opacity-50"
            >
              {isLoading ? 'Authenticating...' : 'Sign In to Portal'}
            </button>
          </form>

          {/* Quick Demo Login Pre-sets */}
          <div className="mt-6 pt-5 border-t border-slate-200">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center mb-3">
              One-Click Demo Account Login
            </p>
            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => setQuickCredentials('admin', 'admin123')}
                className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-rose-600" />
                  Admin Account
                </span>
                <span className="text-[10px] text-rose-600 font-mono">admin / admin123</span>
              </button>

              <button
                type="button"
                onClick={() => setQuickCredentials('agent.reyes', 'agent123')}
                className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200 transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-blue-600" />
                  Agent (Maria Reyes - Manila)
                </span>
                <span className="text-[10px] text-blue-600 font-mono">agent.reyes</span>
              </button>

              <button
                type="button"
                onClick={() => setQuickCredentials('franchise.valenzuela', 'franchise123')}
                className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-emerald-600" />
                  Franchisee (Elena Valenzuela)
                </span>
                <span className="text-[10px] text-emerald-600 font-mono">franchise.valenzuela</span>
              </button>
            </div>
          </div>
        </div>

        {/* Compliance Footer */}
        <p className="mt-6 text-center text-xs text-slate-400">
          Philippine Data Privacy Act (RA 10173) Compliant. Unofficial access is strictly logged and audited.
        </p>
      </div>
    </div>
  );
};
