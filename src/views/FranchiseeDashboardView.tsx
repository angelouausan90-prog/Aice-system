/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { FranchiseeProfile, SupplyRequest, SystemAnnouncement } from '../types.ts';
import { StatusBadge } from '../components/StatusBadge.tsx';
import { 
  Store, 
  Truck, 
  Package, 
  ThermometerSnowflake, 
  ArrowRight, 
  Bell, 
  Calendar, 
  Sparkles,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

interface FranchiseeDashboardViewProps {
  franchisee: FranchiseeProfile;
  supplyRequests: SupplyRequest[];
  announcements: SystemAnnouncement[];
  onNavigate: (tabId: string) => void;
  onOpenNewOrder: () => void;
}

export const FranchiseeDashboardView: React.FC<FranchiseeDashboardViewProps> = ({
  franchisee,
  supplyRequests,
  announcements,
  onNavigate,
  onOpenNewOrder,
}) => {
  // Only this Franchisee's supply orders
  const myOrders = supplyRequests.filter(s => s.franchiseeId === franchisee.id);
  const pendingOrders = myOrders.filter(s => s.status === 'Pending Review' || s.status === 'Processing');
  const fulfilledOrders = myOrders.filter(s => s.status === 'Fulfilled');

  return (
    <div className="space-y-6">
      {/* Franchise Store Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-950 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden border border-emerald-900/40">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500 text-white">
                Official Franchise Partner
              </span>
              <span className="text-xs text-emerald-300">
                Package: {franchisee.franchiseType}
              </span>
            </div>
            <h1 className="text-2xl font-black text-white mt-1">
              {franchisee.franchiseName}
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              Representative: <strong>{franchisee.representativeName}</strong> • {franchisee.businessAddress}, {franchisee.city}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onOpenNewOrder}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#E52320] hover:bg-[#c91d1a] text-white text-xs font-bold rounded-xl shadow-md transition-colors cursor-pointer"
            >
              <Truck className="w-4 h-4" />
              Order Restock Supplies
            </button>
            <button
              onClick={() => onNavigate('ai-advisor')}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              AI Store Advisor
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Freezers */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Freezer Units</span>
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <ThermometerSnowflake className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{franchisee.freezerUnitsCount} Units</div>
          <div className="text-xs text-slate-500 mt-1">
            Certified Sub-Zero -25°C
          </div>
        </div>

        {/* Card 2: Total Orders */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Supply Orders</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{myOrders.length}</div>
          <div className="text-xs text-slate-500 mt-1">
            {fulfilledOrders.length} Successfully Dispatched
          </div>
        </div>

        {/* Card 3: Pending Shipments */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Active Requests</span>
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-600">{pendingOrders.length}</div>
          <div className="text-xs text-slate-500 mt-1">
            Awaiting Admin Cold Dispatch
          </div>
        </div>

        {/* Card 4: Operating Since */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Partner Since</span>
            <div className="p-1.5 rounded-lg bg-slate-50 text-slate-600">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-sm font-black text-slate-900 mt-1">{franchisee.franchiseStartDate}</div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold mt-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Certified Good Standing
          </div>
        </div>
      </div>

      {/* Active Orders & Announcements Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Supply Requests */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Internal Supply Replenishment Orders</h3>
              <p className="text-xs text-slate-500">Direct dispatch orders from Aice central logistics</p>
            </div>
            <button
              onClick={() => onNavigate('franchisee-requests')}
              className="text-xs text-emerald-600 hover:text-emerald-800 font-bold flex items-center gap-1 cursor-pointer"
            >
              View All ({myOrders.length}) <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-6 py-3">Order Ref #</th>
                  <th className="px-6 py-3">Items Ordered</th>
                  <th className="px-6 py-3">Total Amount</th>
                  <th className="px-6 py-3">Order Date</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {myOrders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                      No supply orders placed yet.
                    </td>
                  </tr>
                ) : (
                  myOrders.slice(0, 4).map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-3.5 font-mono font-bold text-slate-900">
                        {order.referenceNumber}
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="font-semibold text-slate-800">
                          {order.items.map(i => `${i.productName} (${i.requestedQuantity})`).join(', ')}
                        </div>
                      </td>
                      <td className="px-6 py-3.5 font-bold text-slate-900">
                        Php {order.totalAmountPhp.toLocaleString()}
                      </td>
                      <td className="px-6 py-3.5 text-slate-500">
                        {new Date(order.requestedAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-3.5">
                        <StatusBadge status={order.status} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Company Announcements & Cold Chain Checklist */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
            <div className="flex items-center gap-2 mb-3">
              <Bell className="w-4 h-4 text-[#E52320]" />
              <h3 className="text-sm font-bold text-slate-900">Aice Operations Notices</h3>
            </div>
            <div className="space-y-3">
              {announcements.map((ann) => (
                <div key={ann.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                  <div className="font-bold text-slate-900 mb-1">{ann.title}</div>
                  <p className="text-slate-600 leading-relaxed text-[11px]">{ann.content}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-900 to-indigo-950 rounded-2xl p-5 text-white shadow-xs">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-blue-200">
                Daily Cold Chain Standard (SOP)
              </h4>
            </div>
            <ul className="space-y-1.5 text-xs text-slate-200">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                Maintain temperature between -22°C to -25°C.
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                Never unplug commercial freezers overnight.
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                Check door silicone gasket seals twice weekly.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
