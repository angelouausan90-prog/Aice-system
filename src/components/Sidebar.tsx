/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { UserRole } from '../types.ts';
import { 
  LayoutDashboard, 
  UserCheck, 
  FileCheck2, 
  Store, 
  Users, 
  Package, 
  Truck, 
  Sparkles, 
  BarChart3, 
  History, 
  Database,
  FilePlus2,
  ListOrdered,
  FileSpreadsheet,
  HelpCircle,
  MapPin
} from 'lucide-react';

interface SidebarProps {
  currentRole: UserRole;
  activeTab: string;
  onTabChange: (tabId: string) => void;
  pendingRecruitsCount?: number;
  pendingReportsCount?: number;
  pendingSuppliesCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentRole,
  activeTab,
  onTabChange,
  pendingRecruitsCount = 0,
  pendingReportsCount = 0,
  pendingSuppliesCount = 0,
}) => {
  interface NavItem {
    id: string;
    label: string;
    icon: React.ElementType;
    badgeCount?: number;
    badgeColor?: string;
  }

  let navItems: NavItem[] = [];

  if (currentRole === 'Admin' || currentRole === 'Super Admin') {
    navItems = [
      { id: 'admin-dashboard', label: 'Admin Dashboard', icon: LayoutDashboard },
      { id: 'franchise-map', label: 'Store Locations Map', icon: MapPin },
      { id: 'recruits-queue', label: 'Recruitment Queue', icon: UserCheck, badgeCount: pendingRecruitsCount, badgeColor: 'bg-amber-500' },
      { id: 'work-reports', label: 'Agent Work Reports', icon: FileCheck2, badgeCount: pendingReportsCount, badgeColor: 'bg-blue-500' },
      { id: 'franchisees', label: 'Franchisees Directory', icon: Store },
      { id: 'agents', label: 'Recruitment Agents', icon: Users },
      { id: 'products-inventory', label: 'Products & Inventory', icon: Package },
      { id: 'supply-requests', label: 'Internal Supply Orders', icon: Truck, badgeCount: pendingSuppliesCount, badgeColor: 'bg-emerald-500' },
      { id: 'ai-intelligence', label: 'AI Intelligence Suite', icon: Sparkles },
      { id: 'reports-analytics', label: 'Reports & CSV Export', icon: BarChart3 },
      { id: 'audit-logs', label: 'Audit Trail Logs', icon: History },
      { id: 'sql-export', label: 'MySQL Schema & XAMPP', icon: Database },
    ];
  } else if (currentRole === 'Agent') {
    navItems = [
      { id: 'agent-dashboard', label: 'Agent Dashboard', icon: LayoutDashboard },
      { id: 'franchise-map', label: 'Store Locations Map', icon: MapPin },
      { id: 'submit-recruit', label: '+ Submit New Recruit', icon: FilePlus2 },
      { id: 'my-recruits', label: 'My Recruits & Pipeline', icon: ListOrdered },
      { id: 'submit-work-report', label: '+ File Work Report', icon: FileSpreadsheet },
      { id: 'my-work-reports', label: 'My Work Reports', icon: FileCheck2 },
      { id: 'ai-coach', label: 'AI Pitch & Location Coach', icon: Sparkles },
    ];
  } else if (currentRole === 'Franchisee') {
    navItems = [
      { id: 'franchisee-dashboard', label: 'Franchise Dashboard', icon: LayoutDashboard },
      { id: 'franchise-map', label: 'Franchise Network Map', icon: MapPin },
      { id: 'franchisee-supplies', label: 'Products & Equipment', icon: Package },
      { id: 'franchisee-requests', label: 'My Supply Requests', icon: Truck },
      { id: 'ai-advisor', label: 'AI Operations Advisor', icon: Sparkles },
      { id: 'franchisee-guide', label: 'SOPs & Freezers Guide', icon: HelpCircle },
    ];
  }

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 min-h-[calc(100vh-4rem)] border-r border-slate-800">
      {/* Role Banner */}
      <div className="px-5 py-3 border-b border-slate-800/80 bg-slate-950/40">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          Navigation Portal
        </div>
        <div className="text-sm font-semibold text-white mt-0.5">
          {currentRole === 'Super Admin' && 'Super Administration'}
          {currentRole === 'Admin' && 'System Administration'}
          {currentRole === 'Agent' && 'Recruitment Field Agent'}
          {currentRole === 'Franchisee' && 'Franchise Operations'}
        </div>
      </div>

      {/* Nav List */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all text-left cursor-pointer ${
                isActive
                  ? 'bg-[#E52320] text-white shadow-md shadow-red-600/30 font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <span className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                {item.label}
              </span>
              {item.badgeCount !== undefined && item.badgeCount > 0 && (
                <span
                  className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full text-white ${
                    isActive ? 'bg-black/30' : item.badgeColor || 'bg-red-500'
                  }`}
                >
                  {item.badgeCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800/80 text-[11px] text-slate-400">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-slate-300">Aice Philippines</span>
          <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">v2.4.0</span>
        </div>
        <p className="text-[10px] text-slate-500 mt-1">
          Confidential Franchise Portal
        </p>
      </div>
    </aside>
  );
};
