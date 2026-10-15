/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Recruit, AgentWorkReport, FranchiseeProfile, AgentProfile, Product, SupplyRequest 
} from '../types.ts';
import { StatusBadge } from '../components/StatusBadge.tsx';
import { FranchiseLocationMap } from '../components/FranchiseLocationMap.tsx';
import { 
  Users, 
  Store, 
  UserCheck, 
  FileCheck2, 
  AlertTriangle, 
  TrendingUp, 
  ArrowRight, 
  Sparkles, 
  CheckCircle2, 
  Package,
  MapPin
} from 'lucide-react';

interface AdminDashboardProps {
  franchisees: FranchiseeProfile[];
  agents: AgentProfile[];
  recruits: Recruit[];
  workReports: AgentWorkReport[];
  products: Product[];
  supplyRequests: SupplyRequest[];
  onNavigate: (tabId: string) => void;
  onSelectRecruit: (recruit: Recruit) => void;
  onSelectWorkReport: (report: AgentWorkReport) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  franchisees,
  agents,
  recruits,
  workReports,
  products,
  supplyRequests,
  onNavigate,
  onSelectRecruit,
  onSelectWorkReport,
}) => {
  const pendingRecruits = recruits.filter(r => r.status === 'Pending Verification');
  const underReviewRecruits = recruits.filter(r => r.status === 'Under Review');
  const approvedRecruits = recruits.filter(r => r.status === 'Approved');
  const rejectedRecruits = recruits.filter(r => r.status === 'Rejected');
  const revisionRecruits = recruits.filter(r => r.status === 'Needs Revision');

  const pendingReports = workReports.filter(w => w.status === 'Pending Review');
  const verifiedReports = workReports.filter(w => w.status === 'Verified');

  const lowStockProducts = products.filter(p => p.stockQuantity <= p.lowStockThreshold);
  const pendingSupplies = supplyRequests.filter(s => s.status === 'Pending Review');

  const totalRecruits = recruits.length;
  const approvalRate = totalRecruits > 0 ? Math.round((approvedRecruits.length / totalRecruits) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden border border-slate-700/50">
        <div className="absolute right-0 top-0 w-80 h-full bg-[#E52320]/10 transform skew-x-12 pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-[#E52320] text-white">
                Admin Control Center
              </span>
              <span className="text-xs text-slate-400 font-medium">
                Real-time Aice Franchise Ledger
              </span>
            </div>
            <h1 className="text-2xl font-black text-white mt-1">
              National Operations & Recruitment Command
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              Monitor active franchise partners, verify agent field recruitment dossiers, track sub-zero inventory dispatch, and deploy AI market viability analysis.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => onNavigate('franchise-map')}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-colors cursor-pointer"
            >
              <MapPin className="w-4 h-4" />
              Store Locations Map
            </button>
            <button
              onClick={() => onNavigate('recruits-queue')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#E52320] hover:bg-[#c91d1a] text-white text-xs font-bold rounded-xl shadow-md transition-colors cursor-pointer"
            >
              <UserCheck className="w-4 h-4" />
              Verify Recruits ({pendingRecruits.length})
            </button>
            <button
              onClick={() => onNavigate('ai-intelligence')}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              AI Market Intel
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Active Franchisees */}
        <div 
          onClick={() => onNavigate('franchisees')}
          className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Official Franchisees</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 group-hover:scale-110 transition-transform">
              <Store className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{franchisees.length}</div>
          <div className="flex items-center justify-between text-xs text-slate-500 mt-1">
            <span>Operating Outlets</span>
            <span className="text-emerald-600 font-semibold flex items-center gap-0.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> 100% Active
            </span>
          </div>
        </div>

        {/* Card 2: Active Field Agents */}
        <div 
          onClick={() => onNavigate('agents')}
          className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Recruitment Agents</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 group-hover:scale-110 transition-transform">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{agents.length}</div>
          <div className="flex items-center justify-between text-xs text-slate-500 mt-1">
            <span>Across Regions</span>
            <span className="text-blue-600 font-semibold">
              {agents.reduce((acc, a) => acc + a.recruitsSubmittedCount, 0)} Total Leads
            </span>
          </div>
        </div>

        {/* Card 3: Pending Verification */}
        <div 
          onClick={() => onNavigate('recruits-queue')}
          className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all cursor-pointer group relative overflow-hidden"
        >
          {pendingRecruits.length > 0 && (
            <div className="absolute top-0 right-0 w-2 h-full bg-amber-500"></div>
          )}
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Pending Recruits</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600 group-hover:scale-110 transition-transform">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-600">{pendingRecruits.length}</div>
          <div className="flex items-center justify-between text-xs text-slate-500 mt-1">
            <span>Under Review: {underReviewRecruits.length}</span>
            <span className="text-amber-700 font-semibold">Action Required</span>
          </div>
        </div>

        {/* Card 4: Work Reports */}
        <div 
          onClick={() => onNavigate('work-reports')}
          className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Agent Work Reports</span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 group-hover:scale-110 transition-transform">
              <FileCheck2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{pendingReports.length}</div>
          <div className="flex items-center justify-between text-xs text-slate-500 mt-1">
            <span>Pending Review</span>
            <span className="text-indigo-600 font-semibold">{verifiedReports.length} Verified</span>
          </div>
        </div>
      </div>

      {/* Critical Action Alerts */}
      {(lowStockProducts.length > 0 || pendingSupplies.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {lowStockProducts.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-500 text-white rounded-xl shadow-xs">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-amber-900">
                    Low Inventory Warning ({lowStockProducts.length} items)
                  </h4>
                  <p className="text-xs text-amber-700">
                    {lowStockProducts.map(p => `${p.name} (${p.stockQuantity} ${p.unitOfMeasure})`).join(', ')}
                  </p>
                </div>
              </div>
              <button
                onClick={() => onNavigate('products-inventory')}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shrink-0 transition-colors cursor-pointer"
              >
                Restock Stock
              </button>
            </div>
          )}

          {pendingSupplies.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-xs">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-blue-900">
                    Internal Supply Requests Pending ({pendingSupplies.length})
                  </h4>
                  <p className="text-xs text-blue-700">
                    Franchisees awaiting cold chain ice cream dispatch approval.
                  </p>
                </div>
              </div>
              <button
                onClick={() => onNavigate('supply-requests')}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shrink-0 transition-colors cursor-pointer"
              >
                Review Orders
              </button>
            </div>
          )}
        </div>
      )}

      {/* Recruitment Status Breakdown & Top Agents */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recruitment Pipeline */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Recruitment Verification Pipeline</h3>
              <p className="text-xs text-slate-500">Live breakdown of prospective franchisee verification statuses</p>
            </div>
            <div className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
              {approvalRate}% Conversion Rate
            </div>
          </div>

          {/* Progress Bar Pipeline */}
          <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden flex mb-6">
            <div 
              style={{ width: `${(pendingRecruits.length / Math.max(1, totalRecruits)) * 100}%` }}
              className="bg-amber-500 h-full transition-all"
              title={`Pending: ${pendingRecruits.length}`}
            />
            <div 
              style={{ width: `${(underReviewRecruits.length / Math.max(1, totalRecruits)) * 100}%` }}
              className="bg-blue-500 h-full transition-all"
              title={`Under Review: ${underReviewRecruits.length}`}
            />
            <div 
              style={{ width: `${(approvedRecruits.length / Math.max(1, totalRecruits)) * 100}%` }}
              className="bg-emerald-500 h-full transition-all"
              title={`Approved: ${approvedRecruits.length}`}
            />
            <div 
              style={{ width: `${(revisionRecruits.length / Math.max(1, totalRecruits)) * 100}%` }}
              className="bg-orange-500 h-full transition-all"
              title={`Needs Revision: ${revisionRecruits.length}`}
            />
            <div 
              style={{ width: `${(rejectedRecruits.length / Math.max(1, totalRecruits)) * 100}%` }}
              className="bg-rose-500 h-full transition-all"
              title={`Rejected: ${rejectedRecruits.length}`}
            />
          </div>

          {/* Legend and Numbers */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-100 text-center">
              <span className="text-[11px] font-bold text-amber-700 block">Pending</span>
              <span className="text-xl font-black text-amber-900">{pendingRecruits.length}</span>
            </div>
            <div className="p-3 rounded-xl bg-blue-50 border border-blue-100 text-center">
              <span className="text-[11px] font-bold text-blue-700 block">Under Review</span>
              <span className="text-xl font-black text-blue-900">{underReviewRecruits.length}</span>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-center">
              <span className="text-[11px] font-bold text-emerald-700 block">Approved</span>
              <span className="text-xl font-black text-emerald-900">{approvedRecruits.length}</span>
            </div>
            <div className="p-3 rounded-xl bg-orange-50 border border-orange-100 text-center">
              <span className="text-[11px] font-bold text-orange-700 block">Needs Revision</span>
              <span className="text-xl font-black text-orange-900">{revisionRecruits.length}</span>
            </div>
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-center">
              <span className="text-[11px] font-bold text-rose-700 block">Rejected</span>
              <span className="text-xl font-black text-rose-900">{rejectedRecruits.length}</span>
            </div>
          </div>
        </div>

        {/* Top Agent Leaderboard */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Agent Performance</h3>
              <p className="text-xs text-slate-500">Recruitment conversions</p>
            </div>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>

          <div className="space-y-4">
            {agents.map((agent) => (
              <div key={agent.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-900">{agent.fullName}</span>
                  <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                    Php {agent.commissionEarnedPhp.toLocaleString()}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 mb-2">
                  Territory: {agent.assignedTerritory}
                </div>
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span>Approved: <strong>{agent.approvedRecruitsCount}</strong></span>
                  <span>Submitted: <strong>{agent.recruitsSubmittedCount}</strong></span>
                  <span>Reports: <strong>{agent.verifiedReportsCount}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Interactive Franchise Business Location Map Tracker */}
      <div className="space-y-2">
        <FranchiseLocationMap
          franchisees={franchisees}
          height="400px"
          onSelectFranchisee={() => {}}
        />
      </div>

      {/* Recent Recruitment Submissions Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Recent Prospect Submissions</h3>
            <p className="text-xs text-slate-500">Requires verification before franchisee account provisioning</p>
          </div>
          <button
            onClick={() => onNavigate('recruits-queue')}
            className="text-xs text-[#E52320] hover:text-[#c91d1a] font-bold flex items-center gap-1 cursor-pointer"
          >
            View All ({recruits.length}) <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-6 py-3">Reference #</th>
                <th className="px-6 py-3">Prospect Name</th>
                <th className="px-6 py-3">Territory</th>
                <th className="px-6 py-3">Package Interest</th>
                <th className="px-6 py-3">Submitting Agent</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recruits.slice(0, 5).map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-6 py-3.5 font-mono font-semibold text-slate-800">
                    {r.referenceNumber}
                  </td>
                  <td className="px-6 py-3.5 font-bold text-slate-900">
                    {r.prospectFullName}
                    <div className="text-[10px] font-normal text-slate-400">{r.phone}</div>
                  </td>
                  <td className="px-6 py-3.5 text-slate-600">
                    {r.city}, {r.province}
                  </td>
                  <td className="px-6 py-3.5">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-[11px]">
                      {r.businessInterest}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-slate-600">
                    {r.agentName}
                  </td>
                  <td className="px-6 py-3.5">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="px-6 py-3.5 text-right">
                    <button
                      onClick={() => onSelectRecruit(r)}
                      className="px-3 py-1 bg-slate-900 hover:bg-[#E52320] text-white font-bold rounded-lg transition-colors cursor-pointer text-xs"
                    >
                      Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
