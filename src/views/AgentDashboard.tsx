/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AgentProfile, Recruit, AgentWorkReport } from '../types.ts';
import { StatusBadge } from '../components/StatusBadge.tsx';
import { 
  UserPlus, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  Coins, 
  ArrowRight,
  TrendingUp,
  Clock
} from 'lucide-react';

interface AgentDashboardProps {
  agentProfile: AgentProfile;
  recruits: Recruit[];
  workReports: AgentWorkReport[];
  onNavigate: (tabId: string) => void;
  onOpenSubmitRecruit: () => void;
  onOpenSubmitReport: () => void;
  onSelectRecruit: (recruit: Recruit) => void;
}

export const AgentDashboard: React.FC<AgentDashboardProps> = ({
  agentProfile,
  recruits,
  workReports,
  onNavigate,
  onOpenSubmitRecruit,
  onOpenSubmitReport,
  onSelectRecruit,
}) => {
  // Calculate based exclusively on this Agent's private records
  const myRecruits = recruits.filter(r => r.agentId === agentProfile.id);
  const myWorkReports = workReports.filter(w => w.agentId === agentProfile.id);

  const pendingRecruits = myRecruits.filter(r => r.status === 'Pending Verification');
  const underReviewRecruits = myRecruits.filter(r => r.status === 'Under Review');
  const approvedRecruits = myRecruits.filter(r => r.status === 'Approved');
  const revisionRecruits = myRecruits.filter(r => r.status === 'Needs Revision');
  const rejectedRecruits = myRecruits.filter(r => r.status === 'Rejected');

  const pendingReports = myWorkReports.filter(w => w.status === 'Pending Review');
  const verifiedReports = myWorkReports.filter(w => w.status === 'Verified');

  return (
    <div className="space-y-6">
      {/* Agent Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-slate-900 to-indigo-950 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden border border-blue-800/40">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-blue-500 text-white">
                Authorized Field Agent
              </span>
              <span className="text-xs text-blue-200">
                Territory: {agentProfile.assignedTerritory}
              </span>
            </div>
            <h1 className="text-2xl font-black text-white mt-1">
              Welcome back, {agentProfile.fullName}!
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              Track your prospective franchisee submissions, review Admin verification decisions, submit weekly work reports, and monitor accrued recruitment commissions.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onOpenSubmitRecruit}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#E52320] hover:bg-[#c91d1a] text-white text-xs font-bold rounded-xl shadow-md transition-colors cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              Submit New Recruit
            </button>
            <button
              onClick={onOpenSubmitReport}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              File Work Report
            </button>
          </div>
        </div>
      </div>

      {/* Urgent Admin Revision Feedback Alert */}
      {revisionRecruits.length > 0 && (
        <div className="bg-orange-50 border-2 border-orange-300 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2.5 bg-orange-500 text-white rounded-xl shadow-xs shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-orange-950">
                Action Required: {revisionRecruits.length} Recruitment Record(s) Need Revision
              </h4>
              <p className="text-xs text-orange-800 mt-0.5">
                Admin Carlos Mendoza has requested additional documentation or clarification before approval can proceed.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('my-recruits')}
            className="px-3.5 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl shrink-0 transition-colors cursor-pointer shadow-xs"
          >
            Review & Resubmit Now
          </button>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Submitted */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">My Recruits</span>
            <span className="text-xs font-bold text-blue-600">{myRecruits.length} Total</span>
          </div>
          <div className="text-2xl font-black text-slate-900">{myRecruits.length}</div>
          <div className="flex items-center justify-between text-xs text-slate-500 mt-1">
            <span>Pending: {pendingRecruits.length}</span>
            <span>Under Review: {underReviewRecruits.length}</span>
          </div>
        </div>

        {/* Approved Recruits */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Approved Recruits</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600">{approvedRecruits.length}</div>
          <div className="text-xs text-slate-500 mt-1">
            Official Franchisee conversions
          </div>
        </div>

        {/* Work Reports */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Work Reports</span>
            <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-indigo-600">{myWorkReports.length}</div>
          <div className="flex items-center justify-between text-xs text-slate-500 mt-1">
            <span>Verified: <strong>{verifiedReports.length}</strong></span>
            <span>Pending: <strong>{pendingReports.length}</strong></span>
          </div>
        </div>

        {/* Commission Accrued */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Earned Commission</span>
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-600">
            Php {agentProfile.commissionEarnedPhp.toLocaleString()}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Php 15,000 per approved franchisee
          </div>
        </div>
      </div>

      {/* Recruits Pipeline & AI Coaching Widget */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recruits Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Recent Recruitment Submissions</h3>
              <p className="text-xs text-slate-500">Live verification status from Administration</p>
            </div>
            <button
              onClick={() => onNavigate('my-recruits')}
              className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer"
            >
              View Pipeline ({myRecruits.length}) <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-6 py-3">Ref #</th>
                  <th className="px-6 py-3">Prospect Name</th>
                  <th className="px-6 py-3">City</th>
                  <th className="px-6 py-3">Package</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {myRecruits.slice(0, 4).map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-3.5 font-mono font-bold text-slate-800">
                      {r.referenceNumber}
                    </td>
                    <td className="px-6 py-3.5 font-bold text-slate-900">
                      {r.prospectFullName}
                    </td>
                    <td className="px-6 py-3.5 text-slate-600">
                      {r.city}
                    </td>
                    <td className="px-6 py-3.5 text-slate-700">
                      {r.businessInterest}
                    </td>
                    <td className="px-6 py-3.5">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <button
                        onClick={() => onSelectRecruit(r)}
                        className="px-2.5 py-1 text-xs font-bold text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg cursor-pointer"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* AI Field Recruitment Assistant */}
        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-2xl p-6 text-white border border-indigo-800 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 bg-amber-400 text-slate-950 rounded-xl">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">AI Pitch & Objections Coach</h3>
                <p className="text-[11px] text-slate-300">Grounded in Aice franchise policies</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Stuck with prospect objections regarding freezer electricity costs or minimum initial cash outlay? The AI Coach provides proven field scripts tailored for sari-sari stores, kiosks, and food parlors.
            </p>

            <div className="mt-4 p-3 rounded-xl bg-indigo-950/70 border border-indigo-800 text-[11px] text-indigo-200">
              💡 <em>"Aice commercial inverter freezers consume only ~1.2 kWh/day (~Php 35 daily), easily offset by selling just 2 Sweet Corn sticks!"</em>
            </div>
          </div>

          <button
            onClick={() => onNavigate('ai-coach')}
            className="mt-6 w-full py-2.5 bg-[#E52320] hover:bg-[#c91d1a] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-md"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            Open Field AI Advisor
          </button>
        </div>
      </div>
    </div>
  );
};
