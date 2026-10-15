/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Recruit, AgentWorkReport, FranchiseeProfile, Product } from '../types.ts';
import { 
  BarChart3, 
  Download, 
  TrendingUp, 
  Users, 
  Store, 
  CheckCircle2, 
  Calendar,
  Layers
} from 'lucide-react';

interface ReportsAnalyticsViewProps {
  recruits: Recruit[];
  workReports: AgentWorkReport[];
  franchisees: FranchiseeProfile[];
  products: Product[];
}

export const ReportsAnalyticsView: React.FC<ReportsAnalyticsViewProps> = ({
  recruits,
  workReports,
  franchisees,
  products,
}) => {
  const [reportType, setReportType] = useState<'recruits' | 'work-reports' | 'inventory' | 'franchisees'>('recruits');

  const totalSubmitted = recruits.length;
  const approvedCount = recruits.filter(r => r.status === 'Approved').length;
  const conversionRate = totalSubmitted > 0 ? Math.round((approvedCount / totalSubmitted) * 100) : 0;

  const totalInventoryValuation = products.reduce((acc, p) => acc + (p.stockQuantity * p.internalPricePhp), 0);
  const totalProspectsReported = workReports.reduce((acc, w) => acc + w.prospectsContacted, 0);

  const handleDownloadCsv = (type: string) => {
    window.location.href = `/api/export-csv?type=${type}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">
            Business Intelligence & CSV Exports
          </h2>
          <p className="text-xs text-slate-500">
            Executive performance analytics, recruitment metrics, and one-click data downloads
          </p>
        </div>

        {/* CSV Export Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleDownloadCsv('recruits')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-[#E52320] text-white rounded-xl text-xs font-bold transition-colors shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Export Recruits CSV
          </button>
          <button
            onClick={() => handleDownloadCsv('work-reports')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-[#E52320] text-white rounded-xl text-xs font-bold transition-colors shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Export Work Reports CSV
          </button>
          <button
            onClick={() => handleDownloadCsv('inventory')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-[#E52320] text-white rounded-xl text-xs font-bold transition-colors shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Export Inventory CSV
          </button>
        </div>
      </div>

      {/* Analytics Highlights */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Overall Conversion Rate
          </span>
          <div className="text-2xl font-black text-emerald-600">{conversionRate}%</div>
          <span className="text-xs text-slate-500 mt-1 block">
            {approvedCount} approved out of {totalSubmitted} leads
          </span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Warehouse Inventory Value
          </span>
          <div className="text-2xl font-black text-slate-900">
            Php {totalInventoryValuation.toLocaleString()}
          </div>
          <span className="text-xs text-slate-500 mt-1 block">
            Wholesale internal valuation
          </span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Total Field Contacts
          </span>
          <div className="text-2xl font-black text-indigo-600">
            {totalProspectsReported} Contacts
          </div>
          <span className="text-xs text-slate-500 mt-1 block">
            Across {workReports.length} agent field logs
          </span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Active Outlets Network
          </span>
          <div className="text-2xl font-black text-slate-900">
            {franchisees.length} Outlets
          </div>
          <span className="text-xs text-emerald-600 font-semibold mt-1 block">
            Across Luzon, Visayas & Mindanao
          </span>
        </div>
      </div>

      {/* Report Explorer Preview */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Report Explorer & Data Audit</h3>
            <p className="text-xs text-slate-500">Live preview of exportable database tables</p>
          </div>

          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => setReportType('recruits')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                reportType === 'recruits' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Recruits ({recruits.length})
            </button>
            <button
              onClick={() => setReportType('work-reports')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                reportType === 'work-reports' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Work Reports ({workReports.length})
            </button>
            <button
              onClick={() => setReportType('inventory')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                reportType === 'inventory' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Inventory ({products.length})
            </button>
            <button
              onClick={() => setReportType('franchisees')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                reportType === 'franchisees' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Franchisees ({franchisees.length})
            </button>
          </div>
        </div>

        {/* Data Preview Table */}
        <div className="overflow-x-auto max-h-80 overflow-y-auto">
          {reportType === 'recruits' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px]">
                <tr>
                  <th className="px-4 py-2.5">Ref #</th>
                  <th className="px-4 py-2.5">Prospect Name</th>
                  <th className="px-4 py-2.5">City</th>
                  <th className="px-4 py-2.5">Agent</th>
                  <th className="px-4 py-2.5">Package</th>
                  <th className="px-4 py-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recruits.map(r => (
                  <tr key={r.id}>
                    <td className="px-4 py-2 font-mono">{r.referenceNumber}</td>
                    <td className="px-4 py-2 font-bold text-slate-900">{r.prospectFullName}</td>
                    <td className="px-4 py-2 text-slate-600">{r.city}</td>
                    <td className="px-4 py-2 text-slate-600">{r.agentName}</td>
                    <td className="px-4 py-2">{r.businessInterest}</td>
                    <td className="px-4 py-2 font-semibold">{r.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === 'work-reports' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px]">
                <tr>
                  <th className="px-4 py-2.5">Ref #</th>
                  <th className="px-4 py-2.5">Agent</th>
                  <th className="px-4 py-2.5">Title</th>
                  <th className="px-4 py-2.5">Prospects Contacted</th>
                  <th className="px-4 py-2.5">Meetings</th>
                  <th className="px-4 py-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {workReports.map(w => (
                  <tr key={w.id}>
                    <td className="px-4 py-2 font-mono">{w.referenceNumber}</td>
                    <td className="px-4 py-2 font-bold text-slate-900">{w.agentName}</td>
                    <td className="px-4 py-2 text-slate-700">{w.title}</td>
                    <td className="px-4 py-2 font-bold text-center">{w.prospectsContacted}</td>
                    <td className="px-4 py-2 font-bold text-center">{w.meetingsConducted}</td>
                    <td className="px-4 py-2 font-semibold">{w.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === 'inventory' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px]">
                <tr>
                  <th className="px-4 py-2.5">SKU</th>
                  <th className="px-4 py-2.5">Product Name</th>
                  <th className="px-4 py-2.5">Category</th>
                  <th className="px-4 py-2.5">Stock</th>
                  <th className="px-4 py-2.5">Wholesale (PHP)</th>
                  <th className="px-4 py-2.5">Total Value (PHP)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map(p => (
                  <tr key={p.id}>
                    <td className="px-4 py-2 font-mono font-bold text-slate-800">{p.sku}</td>
                    <td className="px-4 py-2 font-bold text-slate-900">{p.name}</td>
                    <td className="px-4 py-2 text-slate-600">{p.categoryName}</td>
                    <td className="px-4 py-2 font-bold">{p.stockQuantity} {p.unitOfMeasure}</td>
                    <td className="px-4 py-2 font-mono">Php {p.internalPricePhp.toLocaleString()}</td>
                    <td className="px-4 py-2 font-mono font-bold text-slate-900">
                      Php {(p.stockQuantity * p.internalPricePhp).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === 'franchisees' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px]">
                <tr>
                  <th className="px-4 py-2.5">Franchise Name</th>
                  <th className="px-4 py-2.5">Representative</th>
                  <th className="px-4 py-2.5">Location</th>
                  <th className="px-4 py-2.5">Package</th>
                  <th className="px-4 py-2.5">Freezers</th>
                  <th className="px-4 py-2.5">Start Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {franchisees.map(f => (
                  <tr key={f.id}>
                    <td className="px-4 py-2 font-bold text-slate-900">{f.franchiseName}</td>
                    <td className="px-4 py-2 text-slate-700">{f.representativeName}</td>
                    <td className="px-4 py-2 text-slate-600">{f.city}, {f.province}</td>
                    <td className="px-4 py-2">{f.franchiseType}</td>
                    <td className="px-4 py-2 font-bold">{f.freezerUnitsCount} Units</td>
                    <td className="px-4 py-2 text-slate-500">{f.franchiseStartDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
