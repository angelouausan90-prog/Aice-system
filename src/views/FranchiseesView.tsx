/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { 
  FranchiseeProfile, 
  User, 
  UserRole, 
  FranchiseeStatus, 
  RenewalStatus,
  FranchiseeWarning,
  FranchiseeStatusHistory 
} from '../types.ts';
import { StatusBadge } from '../components/StatusBadge.tsx';
import { FranchiseLocationMap } from '../components/FranchiseLocationMap.tsx';
import { Modal } from '../components/Modal.tsx';
import { 
  Store, 
  Search, 
  Plus, 
  MapPin, 
  Phone, 
  Mail, 
  Calendar, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  RotateCcw, 
  Ban, 
  ShieldAlert, 
  ShieldCheck, 
  Edit3, 
  Eye, 
  LayoutGrid, 
  Table as TableIcon, 
  Map as MapIcon, 
  History, 
  FileText, 
  Download, 
  Filter, 
  ArrowUpDown, 
  ChevronLeft, 
  ChevronRight, 
  DollarSign, 
  TrendingUp, 
  Package, 
  Clock, 
  Send, 
  AlertOctagon,
  Lock,
  Unlock,
  Check,
  Copy,
  Terminal,
  Database
} from 'lucide-react';

interface FranchiseesViewProps {
  currentUser?: User | null;
  onUpdateRole?: (newRole: UserRole) => void;
  franchisees: FranchiseeProfile[];
  onAddFranchisee: (data: any) => Promise<void>;
  onRefreshFranchisees?: () => Promise<void>;
  onNavigateToMap?: (franchiseeId: string) => void;
}

interface AuditLogItem {
  id: string;
  actor_name: string;
  actor_role: string;
  action: string;
  target_id: string;
  target_name?: string;
  reason?: string;
  created_at: string;
  old_values?: any;
  new_values?: any;
}

export const FranchiseesView: React.FC<FranchiseesViewProps> = ({
  currentUser,
  onUpdateRole,
  franchisees,
  onAddFranchisee,
  onRefreshFranchisees,
  onNavigateToMap,
}) => {
  // Current Role (Default: Super Admin or Admin)
  const activeRole: UserRole = currentUser?.role || 'Super Admin';
  const isSuperAdmin = activeRole === 'Super Admin';
  const isAdmin = activeRole === 'Admin' || isSuperAdmin;
  const isBlockedRole = !isAdmin;

  // View Layout State
  const [viewMode, setViewMode] = useState<'TABLE' | 'CARDS' | 'MAP' | 'AUDIT'>('TABLE');

  // Filters & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | FranchiseeStatus>('All');
  const [sortBy, setSortBy] = useState<'name' | 'join_date' | 'warning_count' | 'last_activity' | 'sales'>('last_activity');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modals State
  const [inspectModalOpen, setInspectModalOpen] = useState(false);
  const [inspectData, setInspectData] = useState<any>(null);
  const [isLoadingInspect, setIsLoadingInspect] = useState(false);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingFranchisee, setEditingFranchisee] = useState<FranchiseeProfile | null>(null);

  const [warningModalOpen, setWarningModalOpen] = useState(false);
  const [targetFranchiseeForWarning, setTargetFranchiseeForWarning] = useState<FranchiseeProfile | null>(null);

  const [actionConfirmModalOpen, setActionConfirmModalOpen] = useState(false);
  const [actionType, setActionType] = useState<'SUSPEND' | 'TERMINATE' | 'REINSTATE' | null>(null);
  const [actionTargetFranchisee, setActionTargetFranchisee] = useState<FranchiseeProfile | null>(null);
  const [actionReason, setActionReason] = useState('');

  const [showAddModal, setShowAddModal] = useState(false);
  const [showXamppHelpModal, setShowXamppHelpModal] = useState(false);

  // Notifications / Feedback
  const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'error' | 'warning'; text: string } | null>(null);

  // Audit Logs State
  const [auditLogsList, setAuditLogsList] = useState<AuditLogItem[]>([]);
  const [isLoadingAudit, setIsLoadingAudit] = useState(false);

  // Warning Form State
  const [warnLevel, setWarnLevel] = useState<'1st' | '2nd' | 'Final'>('1st');
  const [warnCategory, setWarnCategory] = useState<'late payment' | 'low sales' | 'policy violation' | 'hygiene/quality' | 'other'>('late payment');
  const [warnMessage, setWarnMessage] = useState('');
  const [warnDueDate, setWarnDueDate] = useState('');
  const [isSubmittingWarning, setIsSubmittingWarning] = useState(false);

  // Edit Form State
  const [editForm, setEditForm] = useState({
    franchiseName: '',
    representativeName: '',
    contactNumber: '',
    email: '',
    businessAddress: '',
    city: '',
    province: '',
    franchiseType: 'Standard Kiosk' as any,
    agreementStartDate: '',
    agreementEndDate: '',
    renewalStatus: 'Active' as RenewalStatus,
    notes: '',
  });
  const [editErrors, setEditErrors] = useState<string[]>([]);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // Add Form State
  const [addFranchiseName, setAddFranchiseName] = useState('');
  const [addRepresentativeName, setAddRepresentativeName] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addContactNumber, setAddContactNumber] = useState('+63 9');
  const [addBusinessAddress, setAddBusinessAddress] = useState('');
  const [addCity, setAddCity] = useState('');
  const [addProvince, setAddProvince] = useState('Metro Manila');
  const [addFranchiseType, setAddFranchiseType] = useState<'Pocket Store' | 'Standard Kiosk' | 'Commercial Parlor' | 'Mobile Cart'>('Standard Kiosk');
  const [addFreezers, setAddFreezers] = useState(2);
  const [addNotes, setAddNotes] = useState('');
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false);

  // Auto-dismiss alert banner
  useEffect(() => {
    if (alertMessage) {
      const timer = setTimeout(() => setAlertMessage(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [alertMessage]);

  // Fetch Audit Logs when Audit tab is activated
  useEffect(() => {
    if (viewMode === 'AUDIT') {
      fetchAuditLogs();
    }
  }, [viewMode]);

  const fetchAuditLogs = async () => {
    setIsLoadingAudit(true);
    try {
      const res = await fetch('/api/audit-logs');
      if (res.ok) {
        const data = await res.json();
        // Normalize audit log data
        const normalized = data.map((d: any) => ({
          id: d.id,
          actor_name: d.userName || d.actor_name || 'Admin',
          actor_role: d.userRole || d.actor_role || 'Admin',
          action: d.action,
          target_id: d.entityId || d.target_id || '',
          target_name: d.description || d.target_name || '',
          reason: d.description || d.reason || '',
          created_at: d.createdAt || d.created_at || new Date().toISOString(),
        }));
        setAuditLogsList(normalized);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingAudit(false);
    }
  };

  // 1. FILTERING, SEARCHING, SORTING
  const filteredFranchisees = useMemo(() => {
    let list = [...franchisees];

    // Status filter
    if (statusFilter !== 'All') {
      list = list.filter(f => (f.status || f.accountStatus) === statusFilter);
    }

    // Search query
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      list = list.filter(f => 
        f.franchiseName.toLowerCase().includes(q) ||
        f.representativeName.toLowerCase().includes(q) ||
        f.city.toLowerCase().includes(q) ||
        f.businessAddress.toLowerCase().includes(q) ||
        (f.province && f.province.toLowerCase().includes(q))
      );
    }

    // Sort
    list.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'name') {
        comparison = a.franchiseName.localeCompare(b.franchiseName);
      } else if (sortBy === 'join_date') {
        comparison = new Date(a.franchiseStartDate).getTime() - new Date(b.franchiseStartDate).getTime();
      } else if (sortBy === 'warning_count') {
        comparison = (a.warningCount || 0) - (b.warningCount || 0);
      } else if (sortBy === 'sales') {
        comparison = (a.totalSalesPhp || 0) - (b.totalSalesPhp || 0);
      } else {
        // last_activity
        const timeA = a.lastActivityAt ? new Date(a.lastActivityAt).getTime() : new Date(a.updatedAt).getTime();
        const timeB = b.lastActivityAt ? new Date(b.lastActivityAt).getTime() : new Date(b.updatedAt).getTime();
        comparison = timeA - timeB;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return list;
  }, [franchisees, statusFilter, searchQuery, sortBy, sortDirection]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredFranchisees.length / itemsPerPage) || 1;
  const paginatedFranchisees = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredFranchisees.slice(start, start + itemsPerPage);
  }, [filteredFranchisees, currentPage, itemsPerPage]);

  // Status counts for badge tabs
  const statusCounts = useMemo(() => {
    const counts = {
      all: franchisees.length,
      Active: 0,
      'Under Warning': 0,
      Suspended: 0,
      Terminated: 0,
      Pending: 0,
    };
    franchisees.forEach(f => {
      const st = (f.status || f.accountStatus) as FranchiseeStatus;
      if (counts[st] !== undefined) {
        counts[st]++;
      }
    });
    return counts;
  }, [franchisees]);

  // 2. INSPECT FRANCHISEE
  const handleOpenInspect = async (franchisee: FranchiseeProfile) => {
    setIsLoadingInspect(true);
    setInspectModalOpen(true);
    setInspectData(null);

    try {
      const res = await fetch(`/api/franchisees/${franchisee.id}/inspect`, {
        headers: {
          'X-User-Role': activeRole,
          'X-User-Id': currentUser?.id || 'usr-admin-1',
          'X-User-Name': currentUser?.fullName || 'Admin',
        }
      });
      if (res.ok) {
        const data = await res.json();
        setInspectData(data);
      } else {
        // Fallback to local profile info if server returns non-200
        setInspectData({
          profile: franchisee,
          agreement: {
            startDate: franchisee.agreementStartDate || franchisee.franchiseStartDate,
            endDate: franchisee.agreementEndDate || '2027-03-01',
            renewalStatus: franchisee.renewalStatus || 'Active',
            franchiseType: franchisee.franchiseType,
          },
          performance: {
            totalSalesPhp: franchisee.totalSalesPhp || 0,
            totalOrdersCount: franchisee.totalOrdersCount || 0,
            freezerUnitsCount: franchisee.freezerUnitsCount || 1,
            estimatedStockTubs: (franchisee.freezerUnitsCount || 1) * 120,
            pendingBalancePhp: franchisee.pendingBalancePhp || 0,
            settlementFlag: franchisee.settlementFlag || false,
            recentOrders: [],
          },
          mapLocation: {
            latitude: franchisee.latitude || 14.5995,
            longitude: franchisee.longitude || 120.9842,
            businessAddress: franchisee.businessAddress,
            city: franchisee.city,
            province: franchisee.province,
          },
          warnings: franchisee.warnings || [],
          statusHistory: franchisee.statusHistory || [],
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingInspect(false);
    }
  };

  // 3. EDIT FRANCHISEE
  const handleOpenEdit = (franchisee: FranchiseeProfile) => {
    setEditingFranchisee(franchisee);
    setEditForm({
      franchiseName: franchisee.franchiseName,
      representativeName: franchisee.representativeName,
      contactNumber: franchisee.contactNumber,
      email: franchisee.email,
      businessAddress: franchisee.businessAddress,
      city: franchisee.city,
      province: franchisee.province || 'Metro Manila',
      franchiseType: franchisee.franchiseType,
      agreementStartDate: franchisee.agreementStartDate || franchisee.franchiseStartDate,
      agreementEndDate: franchisee.agreementEndDate || '2027-03-01',
      renewalStatus: franchisee.renewalStatus || 'Active',
      notes: franchisee.notes || '',
    });
    setEditErrors([]);
    setEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFranchisee) return;

    // Client-side validation
    const errs: string[] = [];
    if (editForm.franchiseName.trim().length < 3) errs.push('Store name must be at least 3 characters.');
    if (editForm.representativeName.trim().length < 2) errs.push('Representative name is required.');
    if (!editForm.email.includes('@')) errs.push('A valid email address is required.');
    if (!editForm.contactNumber) errs.push('Contact number is required.');
    if (!editForm.businessAddress) errs.push('Business location address is required.');
    if (!editForm.agreementStartDate || !editForm.agreementEndDate) errs.push('Agreement start and end dates are required.');

    if (errs.length > 0) {
      setEditErrors(errs);
      return;
    }

    setIsSubmittingEdit(true);
    setEditErrors([]);

    try {
      const res = await fetch(`/api/franchisees/${editingFranchisee.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Role': activeRole,
          'X-User-Id': currentUser?.id || 'usr-admin-1',
          'X-User-Name': currentUser?.fullName || 'Admin',
        },
        body: JSON.stringify(editForm),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || 'Failed to update franchisee details.');
      }

      setAlertMessage({
        type: 'success',
        text: `Successfully updated ${editForm.franchiseName}. Changes recorded in audit log.`,
      });
      setEditModalOpen(false);
      if (onRefreshFranchisees) await onRefreshFranchisees();
    } catch (err: any) {
      setEditErrors([err.message || 'An error occurred while saving.']);
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  // 4. SEND WARNING
  const handleOpenWarning = (franchisee: FranchiseeProfile) => {
    setTargetFranchiseeForWarning(franchisee);
    // Suggest next warning level
    const currentWarnings = franchisee.warningCount || 0;
    if (currentWarnings === 0) setWarnLevel('1st');
    else if (currentWarnings === 1) setWarnLevel('2nd');
    else setWarnLevel('Final');

    setWarnCategory('late payment');
    setWarnMessage('');
    // Default due date: 7 days from now
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    setWarnDueDate(nextWeek.toISOString().split('T')[0]);
    setWarningModalOpen(true);
  };

  const handleSubmitWarning = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetFranchiseeForWarning) return;

    if (!warnMessage.trim() || warnMessage.trim().length < 10) {
      alert('Please provide a detailed warning explanation (minimum 10 characters).');
      return;
    }

    setIsSubmittingWarning(true);

    try {
      const res = await fetch(`/api/franchisees/${targetFranchiseeForWarning.id}/warning`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Role': activeRole,
          'X-User-Id': currentUser?.id || 'usr-admin-1',
          'X-User-Name': currentUser?.fullName || 'Admin',
        },
        body: JSON.stringify({
          warningLevel: warnLevel,
          category: warnCategory,
          message: warnMessage,
          resolutionDueDate: warnDueDate || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to issue warning.');
      }

      setWarningModalOpen(false);
      setAlertMessage({
        type: data.suggestEscalation ? 'warning' : 'success',
        text: data.escalationMessage || `Issued ${warnLevel} Warning to ${targetFranchiseeForWarning.franchiseName}. Status changed to Under Warning.`,
      });

      if (onRefreshFranchisees) await onRefreshFranchisees();
    } catch (err: any) {
      alert(err.message || 'Failed to send warning.');
    } finally {
      setIsSubmittingWarning(false);
    }
  };

  // 5. SUSPEND / TERMINATE / REINSTATE
  const handleOpenActionConfirm = (franchisee: FranchiseeProfile, type: 'SUSPEND' | 'TERMINATE' | 'REINSTATE') => {
    // Access control check: Only Super Admin can Terminate or Reinstate!
    if ((type === 'TERMINATE' || type === 'REINSTATE') && !isSuperAdmin) {
      setAlertMessage({
        type: 'error',
        text: `Action Blocked: Only Super Admin has authorization to ${type.toLowerCase()} a franchisee agreement. Regular Admin role cannot perform this operation.`,
      });
      return;
    }

    setActionTargetFranchisee(franchisee);
    setActionType(type);
    setActionReason('');
    setActionConfirmModalOpen(true);
  };

  const handleExecuteAction = async () => {
    if (!actionTargetFranchisee || !actionType) return;
    if (!actionReason.trim() || actionReason.trim().length < 5) {
      alert('A valid reason is required (minimum 5 characters).');
      return;
    }

    const endpoint = `/api/franchisees/${actionTargetFranchisee.id}/${actionType.toLowerCase()}`;

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Role': activeRole,
          'X-User-Id': currentUser?.id || 'usr-admin-1',
          'X-User-Name': currentUser?.fullName || 'Admin',
        },
        body: JSON.stringify({ reason: actionReason.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `Failed to execute ${actionType}.`);
      }

      setActionConfirmModalOpen(false);
      setAlertMessage({
        type: 'success',
        text: data.message || `Franchisee status successfully updated to ${data.franchisee?.status || actionType}.`,
      });

      if (onRefreshFranchisees) await onRefreshFranchisees();
    } catch (err: any) {
      alert(err.message || `Failed to execute ${actionType}.`);
    }
  };

  // 6. ADD NEW FRANCHISEE SUBMISSION
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingAdd(true);

    try {
      await onAddFranchisee({
        franchiseName: addFranchiseName,
        representativeName: addRepresentativeName,
        email: addEmail,
        contactNumber: addContactNumber,
        businessAddress: addBusinessAddress,
        city: addCity,
        province: addProvince,
        franchiseType: addFranchiseType,
        freezerUnitsCount: addFreezers,
        notes: addNotes,
      });

      setShowAddModal(false);
      setAddFranchiseName('');
      setAddRepresentativeName('');
      setAddEmail('');
      setAddContactNumber('+63 9');
      setAddBusinessAddress('');
      setAddCity('');
      setAddNotes('');
      setAlertMessage({
        type: 'success',
        text: 'New Franchisee successfully created and initialized.',
      });
    } catch (err: any) {
      alert(err.message || 'Failed to add franchisee.');
    } finally {
      setIsSubmittingAdd(false);
    }
  };

  // Blocked Role View (Agent / Franchisee)
  if (isBlockedRole) {
    return (
      <div className="p-8 max-w-2xl mx-auto my-12 bg-white rounded-2xl border border-rose-200 shadow-lg text-center">
        <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <span className="px-3 py-1 bg-rose-100 text-rose-800 text-xs font-black uppercase rounded-full tracking-wider">
          HTTP 403 Forbidden
        </span>
        <h2 className="text-2xl font-black text-slate-900 mt-3">
          Administrative Authorization Required
        </h2>
        <p className="text-slate-600 text-sm mt-2 leading-relaxed">
          The <strong>Franchisee Management Module</strong> is strictly reserved for Headquarters Administrators.
          Your current session role is <strong>{activeRole}</strong>, which lacks administrative privilege.
        </p>

        {/* Quick Role Switcher for Capstone Defense Testing */}
        {onUpdateRole && (
          <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-200 text-left">
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-blue-600" />
              Capstone Defense Role Switcher (Test Access Control)
            </div>
            <p className="text-xs text-slate-500 mb-3">
              Switch role to test server-side and client-side authorization gates:
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onUpdateRole('Super Admin')}
                className="px-3 py-1.5 bg-[#E52320] hover:bg-[#c91d1a] text-white text-xs font-bold rounded-lg shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Unlock className="w-3.5 h-3.5" />
                Switch to Super Admin (Full Access)
              </button>
              <button
                type="button"
                onClick={() => onUpdateRole('Admin')}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Unlock className="w-3.5 h-3.5" />
                Switch to Admin (Restricted Terminate)
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner: Module Header & Capstone Role Switcher */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-red-100 text-[#E52320] border border-red-200">
              HQ Administration Module
            </span>
            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
              isSuperAdmin 
                ? 'bg-purple-50 text-purple-700 border-purple-200' 
                : 'bg-blue-50 text-blue-700 border-blue-200'
            }`}>
              {isSuperAdmin ? '👑 Super Admin Authority' : '🛡️ Standard Admin Authority'}
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Franchisee Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Oversee official Aice franchise agreements, operational compliance, warnings escalation, financial settlement, and lifecycle status.
          </p>
        </div>

        {/* Capstone Role Switcher & XAMPP Helper */}
        <div className="flex flex-wrap items-center gap-2">
          {onUpdateRole && (
            <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs">
              <span className="px-2 py-1 text-[11px] font-bold text-slate-500 uppercase">
                Simulate Role:
              </span>
              <button
                type="button"
                onClick={() => onUpdateRole('Super Admin')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  isSuperAdmin ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Super Admin: Full access including Terminate and Reinstate"
              >
                Super Admin
              </button>
              <button
                type="button"
                onClick={() => onUpdateRole('Admin')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  activeRole === 'Admin' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Admin: View, edit, warn, suspend (Terminate blocked)"
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => onUpdateRole('Agent')}
                className="px-2.5 py-1 rounded-lg font-bold text-slate-600 hover:text-rose-600 transition-all cursor-pointer"
                title="Test 403 Forbidden check"
              >
                Agent (Blocked)
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowXamppHelpModal(true)}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Database className="w-3.5 h-3.5 text-blue-600" />
            PHP / XAMPP Defense Kit
          </button>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#E52320] hover:bg-[#c91d1a] text-white rounded-xl text-xs font-bold transition-colors shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            + New Franchisee
          </button>
        </div>
      </div>

      {/* Global Alert Notification Banner */}
      {alertMessage && (
        <div className={`p-4 rounded-xl border flex items-start justify-between gap-3 shadow-xs animate-in fade-in slide-in-from-top-2 duration-200 ${
          alertMessage.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
            : alertMessage.type === 'warning'
            ? 'bg-amber-50 border-amber-300 text-amber-900'
            : 'bg-rose-50 border-rose-300 text-rose-900'
        }`}>
          <div className="flex items-center gap-2.5 text-xs font-semibold">
            {alertMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
            {alertMessage.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />}
            {alertMessage.type === 'error' && <XCircle className="w-4 h-4 text-rose-600 shrink-0" />}
            <span>{alertMessage.text}</span>
          </div>
          <button 
            type="button" 
            onClick={() => setAlertMessage(null)}
            className="text-xs font-bold opacity-60 hover:opacity-100 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Sub-Header: Filter Tabs, View Switcher, and Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Status Filter Tabs (Pending, Active, Under Warning, Suspended, Terminated) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          {(['All', 'Active', 'Under Warning', 'Suspended', 'Terminated', 'Pending'] as const).map((st) => {
            const count = st === 'All' ? statusCounts.all : (statusCounts[st] || 0);
            const isSelected = statusFilter === st;
            return (
              <button
                key={st}
                type="button"
                onClick={() => {
                  setStatusFilter(st);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <span>{st}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* View Mode Switcher & Search Bar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Toggle: Table, Cards, Map, Audit */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode('TABLE')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                viewMode === 'TABLE' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Table View (Default)"
            >
              <TableIcon className="w-3.5 h-3.5" />
              Table
            </button>
            <button
              type="button"
              onClick={() => setViewMode('CARDS')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                viewMode === 'CARDS' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Grid Cards View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Cards
            </button>
            <button
              type="button"
              onClick={() => setViewMode('MAP')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                viewMode === 'MAP' ? 'bg-[#E52320] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Interactive Map View"
            >
              <MapIcon className="w-3.5 h-3.5" />
              Map
            </button>
            <button
              type="button"
              onClick={() => setViewMode('AUDIT')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                viewMode === 'AUDIT' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Audit Trail Logs"
            >
              <History className="w-3.5 h-3.5" />
              Audit Log
            </button>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search store, partner, city..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-[#E52320] w-48 lg:w-56"
            />
          </div>
        </div>
      </div>

      {/* VIEW MODE 1: TABLE VIEW */}
      {viewMode === 'TABLE' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th scope="col" className="px-4 py-3.5">
                    <button 
                      type="button" 
                      onClick={() => {
                        if (sortBy === 'name') setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
                        else { setSortBy('name'); setSortDirection('asc'); }
                      }}
                      className="flex items-center gap-1 cursor-pointer font-bold hover:text-slate-900"
                    >
                      Franchise Name & Partner
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </button>
                  </th>
                  <th scope="col" className="px-4 py-3.5">Branch / Location</th>
                  <th scope="col" className="px-4 py-3.5">Status</th>
                  <th scope="col" className="px-4 py-3.5">
                    <button 
                      type="button" 
                      onClick={() => {
                        if (sortBy === 'warning_count') setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
                        else { setSortBy('warning_count'); setSortDirection('desc'); }
                      }}
                      className="flex items-center gap-1 cursor-pointer font-bold hover:text-slate-900"
                    >
                      Warnings
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </button>
                  </th>
                  <th scope="col" className="px-4 py-3.5">
                    <button 
                      type="button" 
                      onClick={() => {
                        if (sortBy === 'join_date') setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
                        else { setSortBy('join_date'); setSortDirection('desc'); }
                      }}
                      className="flex items-center gap-1 cursor-pointer font-bold hover:text-slate-900"
                    >
                      Agreement Start
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </button>
                  </th>
                  <th scope="col" className="px-4 py-3.5">
                    <button 
                      type="button" 
                      onClick={() => {
                        if (sortBy === 'last_activity') setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
                        else { setSortBy('last_activity'); setSortDirection('desc'); }
                      }}
                      className="flex items-center gap-1 cursor-pointer font-bold hover:text-slate-900"
                    >
                      Last Activity
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </button>
                  </th>
                  <th scope="col" className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedFranchisees.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                      <Store className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                      <p className="font-semibold text-sm text-slate-600">No franchisees match your criteria</p>
                      <p className="text-xs text-slate-400">Try adjusting your search query or status filter.</p>
                    </td>
                  </tr>
                ) : (
                  paginatedFranchisees.map((f) => {
                    const status = (f.status || f.accountStatus) as FranchiseeStatus;
                    const warnCount = f.warningCount || 0;
                    const isTerminated = status === 'Terminated';
                    const isSuspended = status === 'Suspended';

                    return (
                      <tr 
                        key={f.id} 
                        className={`hover:bg-slate-50/80 transition-colors ${
                          isTerminated ? 'bg-slate-50/50 opacity-75' : ''
                        }`}
                      >
                        {/* Name & Partner */}
                        <td className="px-4 py-3.5">
                          <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                            <span className="truncate max-w-[220px]" title={f.franchiseName}>
                              {f.franchiseName}
                            </span>
                            {f.settlementFlag && (
                              <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 text-[10px] font-black rounded" title="Flagged for financial settlement">
                                Settlement
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <span>{f.representativeName}</span>
                            <span>•</span>
                            <span className="text-slate-400">{f.franchiseType}</span>
                          </div>
                        </td>

                        {/* Branch / Location */}
                        <td className="px-4 py-3.5">
                          <div className="text-xs font-semibold text-slate-800 flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-[#E52320] shrink-0" />
                            <span>{f.city}</span>
                          </div>
                          <div className="text-[11px] text-slate-400 truncate max-w-[200px]" title={f.businessAddress}>
                            {f.businessAddress}
                          </div>
                        </td>

                        {/* Status Badge */}
                        <td className="px-4 py-3.5">
                          <StatusBadge status={status} />
                        </td>

                        {/* Warning Count */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full font-bold text-xs ${
                              warnCount === 0 
                                ? 'bg-slate-100 text-slate-500' 
                                : warnCount === 1
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : warnCount === 2
                                ? 'bg-orange-100 text-orange-800 border border-orange-300 font-black'
                                : 'bg-rose-100 text-rose-800 border border-rose-300 font-black animate-pulse'
                            }`}>
                              {warnCount} {warnCount === 1 ? 'Warning' : 'Warnings'}
                            </span>
                            {warnCount >= 2 && (
                              <span className="text-[10px] text-rose-600 font-bold" title="Escalation recommended">
                                ⚠️ Review
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Agreement Start Date */}
                        <td className="px-4 py-3.5">
                          <div className="text-xs text-slate-700 font-medium flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>{f.agreementStartDate || f.franchiseStartDate}</span>
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Renew: {f.renewalStatus || 'Active'}
                          </div>
                        </td>

                        {/* Last Activity */}
                        <td className="px-4 py-3.5">
                          <div className="text-xs text-slate-700 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>
                              {f.lastActivityAt 
                                ? new Date(f.lastActivityAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                                : 'Recently'}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Orders: {f.totalOrdersCount}
                          </div>
                        </td>

                        {/* Actions Toolbar */}
                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {/* Inspect Detail */}
                            <button
                              type="button"
                              onClick={() => handleOpenInspect(f)}
                              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                              title="Inspect Franchisee Details & Performance"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {/* Edit Details */}
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(f)}
                              className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                              title="Edit Franchisee Information"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>

                            {/* Send Warning (Disabled if Terminated) */}
                            {!isTerminated && (
                              <button
                                type="button"
                                onClick={() => handleOpenWarning(f)}
                                className="p-1.5 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                                title="Send Official Warning Notice"
                              >
                                <AlertTriangle className="w-4 h-4" />
                              </button>
                            )}

                            {/* Suspend or Reinstate Button */}
                            {isSuspended ? (
                              <button
                                type="button"
                                onClick={() => handleOpenActionConfirm(f, 'REINSTATE')}
                                className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                                title={isSuperAdmin ? "Reinstate Franchisee" : "Only Super Admin can reinstate"}
                              >
                                <RotateCcw className="w-4 h-4" />
                              </button>
                            ) : !isTerminated ? (
                              <button
                                type="button"
                                onClick={() => handleOpenActionConfirm(f, 'SUSPEND')}
                                className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Suspend Franchisee"
                              >
                                <Ban className="w-4 h-4" />
                              </button>
                            ) : null}

                            {/* Terminate (Super Admin Only) */}
                            {!isTerminated && (
                              <button
                                type="button"
                                onClick={() => handleOpenActionConfirm(f, 'TERMINATE')}
                                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                  isSuperAdmin
                                    ? 'text-slate-500 hover:text-rose-700 hover:bg-rose-50'
                                    : 'text-slate-300 hover:text-slate-400 hover:bg-slate-100 cursor-not-allowed'
                                }`}
                                title={isSuperAdmin ? "Terminate Franchisee Agreement (Soft Delete)" : "Terminate: Restricted to Super Admin"}
                              >
                                <AlertOctagon className="w-4 h-4" />
                              </button>
                            )}

                            {/* If Terminated: Reinstatement (Super Admin Only) */}
                            {isTerminated && (
                              <button
                                type="button"
                                onClick={() => handleOpenActionConfirm(f, 'REINSTATE')}
                                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                  isSuperAdmin
                                    ? 'text-purple-600 hover:text-purple-800 hover:bg-purple-50'
                                    : 'text-slate-300 cursor-not-allowed'
                                }`}
                                title={isSuperAdmin ? "Reinstate Terminated Franchisee" : "Reinstate: Restricted to Super Admin"}
                              >
                                <RotateCcw className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
            <div>
              Showing {filteredFranchisees.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} to{' '}
              {Math.min(currentPage * itemsPerPage, filteredFranchisees.length)} of {filteredFranchisees.length} franchisees
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className="p-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-bold text-slate-700">
                Page {currentPage} of {totalPages}
              </span>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                className="p-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODE 2: CARDS VIEW */}
      {viewMode === 'CARDS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFranchisees.map((f) => {
            const status = (f.status || f.accountStatus) as FranchiseeStatus;
            const warnCount = f.warningCount || 0;
            return (
              <div 
                key={f.id}
                className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h3 className="font-black text-slate-900 text-sm leading-snug">
                        {f.franchiseName}
                      </h3>
                      <p className="text-xs text-slate-500 font-medium">
                        Rep: {f.representativeName}
                      </p>
                    </div>
                    <StatusBadge status={status} />
                  </div>

                  <div className="space-y-1.5 my-3 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#E52320]" />
                      <span className="truncate">{f.businessAddress}, {f.city}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>Agreement: {f.agreementStartDate || f.franchiseStartDate}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5 text-slate-400" />
                      <span>{f.freezerUnitsCount} Freezer Units • {f.totalOrdersCount} Supply Orders</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-slate-500 font-medium">Warning Record:</span>
                    <span className={`px-2 py-0.5 rounded-full font-bold ${
                      warnCount === 0 ? 'bg-slate-100 text-slate-600' : 'bg-orange-100 text-orange-800'
                    }`}>
                      {warnCount} active
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenInspect(f)}
                    className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Inspect
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(f)}
                    className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    title="Edit Franchisee"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  {status !== 'Terminated' && (
                    <button
                      type="button"
                      onClick={() => handleOpenWarning(f)}
                      className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                      title="Send Warning"
                    >
                      <AlertTriangle className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW MODE 3: MAP VIEW */}
      {viewMode === 'MAP' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div className="text-xs text-slate-600">
              <strong className="text-slate-900 font-bold">Interactive Geographic Tracking:</strong> All approved and active franchisee stores rendered on Leaflet open street map with non-compete radius buffer.
            </div>
            <button
              type="button"
              onClick={() => setViewMode('TABLE')}
              className="text-xs font-bold text-[#E52320] hover:underline cursor-pointer"
            >
              ← Back to Table View
            </button>
          </div>
          <FranchiseLocationMap
            franchisees={filteredFranchisees}
            height="620px"
          />
        </div>
      )}

      {/* VIEW MODE 4: AUDIT LOG TABLE */}
      {viewMode === 'AUDIT' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <History className="w-4 h-4 text-slate-600" />
                Administrative Actions Audit Trail
              </h3>
              <p className="text-xs text-slate-500">
                Permanent immutable record of all franchisee edits, warnings issued, suspensions, and terminations.
              </p>
            </div>
            <button
              type="button"
              onClick={fetchAuditLogs}
              className="px-3 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 transition-colors cursor-pointer"
            >
              Refresh Logs
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th scope="col" className="px-4 py-3">Timestamp</th>
                  <th scope="col" className="px-4 py-3">Actor</th>
                  <th scope="col" className="px-4 py-3">Action</th>
                  <th scope="col" className="px-4 py-3">Target Franchisee</th>
                  <th scope="col" className="px-4 py-3">Reason / Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoadingAudit ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                      Loading audit records...
                    </td>
                  </tr>
                ) : auditLogsList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                      No administrative audit entries found.
                    </td>
                  </tr>
                ) : (
                  auditLogsList.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/80">
                      <td className="px-4 py-3 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-bold text-slate-900 block">{log.actor_name}</span>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">{log.actor_role}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-800 rounded font-mono text-[11px] font-bold">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-800">
                        {log.target_name || log.target_id || 'Franchisee'}
                      </td>
                      <td className="px-4 py-3 text-slate-600 max-w-xs truncate" title={log.reason}>
                        {log.reason || 'Administrative update completed.'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 1: INSPECT FRANCHISEE DETAIL VIEW                  */}
      {/* ======================================================== */}
      <Modal
        isOpen={inspectModalOpen}
        onClose={() => setInspectModalOpen(false)}
        title="Franchisee Comprehensive Inspection & Performance Snapshot"
        maxWidth="4xl"
      >
        {isLoadingInspect ? (
          <div className="p-12 text-center text-slate-400">
            <Clock className="w-8 h-8 animate-spin mx-auto mb-2 text-[#E52320]" />
            <p className="text-xs font-semibold">Retrieving franchisee profile and compliance history...</p>
          </div>
        ) : inspectData ? (
          <div className="space-y-6 text-xs text-slate-700">
            {/* Header Snapshot Card */}
            <div className="p-4 bg-slate-900 text-white rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 bg-white/20 text-white rounded text-[10px] font-bold uppercase tracking-wider">
                    {inspectData.profile.franchiseType}
                  </span>
                  <StatusBadge status={inspectData.profile.status || inspectData.profile.accountStatus} />
                </div>
                <h2 className="text-xl font-black text-white">{inspectData.profile.franchiseName}</h2>
                <p className="text-slate-300 text-xs mt-0.5">
                  Operating Partner: <strong>{inspectData.profile.representativeName}</strong> • Member since {inspectData.profile.franchiseStartDate}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setInspectModalOpen(false);
                    if (onNavigateToMap) onNavigateToMap(inspectData.profile.id);
                    else setViewMode('MAP');
                  }}
                  className="px-3 py-2 bg-[#E52320] hover:bg-[#c91d1a] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  <MapPin className="w-4 h-4" />
                  View on Map Tracker
                </button>
              </div>
            </div>

            {/* Grid 1: Agreement Terms & Performance Snapshot */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Agreement Terms Card */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <h4 className="text-xs font-black uppercase text-slate-900 tracking-wider mb-3 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-blue-600" />
                  Franchise Agreement Terms
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-200/60">
                    <span className="text-slate-500 font-medium">Contract Start Date:</span>
                    <span className="font-bold text-slate-800">{inspectData.agreement.startDate}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/60">
                    <span className="text-slate-500 font-medium">Contract Expiration:</span>
                    <span className="font-bold text-slate-800">{inspectData.agreement.endDate}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/60">
                    <span className="text-slate-500 font-medium">Renewal Status:</span>
                    <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {inspectData.agreement.renewalStatus}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500 font-medium">Cold Chain Units Assigned:</span>
                    <span className="font-bold text-slate-800">{inspectData.performance.freezerUnitsCount} Aice Deep Freezers</span>
                  </div>
                </div>
              </div>

              {/* Performance Snapshot Card */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <h4 className="text-xs font-black uppercase text-slate-900 tracking-wider mb-3 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  Financial & Operational Snapshot
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Gross Sales</span>
                    <span className="text-base font-black text-slate-900 block mt-0.5">
                      ₱{(inspectData.performance.totalSalesPhp || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Supply Orders</span>
                    <span className="text-base font-black text-slate-900 block mt-0.5">
                      {inspectData.performance.totalOrdersCount} Completed
                    </span>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Est. Stock In Freezers</span>
                    <span className="text-sm font-bold text-blue-700 block mt-0.5">
                      ~{inspectData.performance.estimatedStockTubs} Tubs / Units
                    </span>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Outstanding Balance</span>
                    <span className={`text-sm font-bold block mt-0.5 ${
                      inspectData.performance.pendingBalancePhp > 0 ? 'text-rose-600' : 'text-emerald-700'
                    }`}>
                      ₱{(inspectData.performance.pendingBalancePhp || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Profile & Location Card */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200">
              <h4 className="text-xs font-black uppercase text-slate-900 tracking-wider mb-2 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#E52320]" />
                Registered Business Location & Contact Coordinates
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Phone & Email</span>
                  <p className="font-semibold text-slate-800">{inspectData.profile.contactNumber}</p>
                  <p className="text-slate-500">{inspectData.profile.email}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Physical Street Address</span>
                  <p className="font-semibold text-slate-800">{inspectData.mapLocation.businessAddress}</p>
                  <p className="text-slate-500">{inspectData.mapLocation.city}, {inspectData.mapLocation.province}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Geographic Coordinates</span>
                  <p className="font-mono text-slate-800">Lat: {inspectData.mapLocation.latitude}</p>
                  <p className="font-mono text-slate-800">Lng: {inspectData.mapLocation.longitude}</p>
                </div>
              </div>
            </div>

            {/* Warning History & Status Change History Timelines */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Warnings History Card */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200">
                <h4 className="text-xs font-black uppercase text-slate-900 tracking-wider mb-3 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    Warning History ({inspectData.warnings?.length || 0})
                  </span>
                  {inspectData.profile.status !== 'Terminated' && (
                    <button
                      type="button"
                      onClick={() => {
                        setInspectModalOpen(false);
                        handleOpenWarning(inspectData.profile);
                      }}
                      className="text-[11px] font-bold text-amber-600 hover:underline cursor-pointer"
                    >
                      + Issue Warning
                    </button>
                  )}
                </h4>

                {(!inspectData.warnings || inspectData.warnings.length === 0) ? (
                  <p className="text-xs text-slate-400 italic py-4 text-center">
                    No warnings on record. Exemplary compliance history.
                  </p>
                ) : (
                  <div className="space-y-2.5 max-h-52 overflow-y-auto pr-1">
                    {inspectData.warnings.map((w: any) => (
                      <div key={w.id} className="p-3 bg-amber-50/60 rounded-xl border border-amber-200 text-xs">
                        <div className="flex items-center justify-between font-bold text-amber-900 mb-1">
                          <span className="uppercase text-[10px] bg-amber-200 text-amber-900 px-1.5 py-0.2 rounded font-black">
                            {w.warningLevel || w.warning_level} Warning
                          </span>
                          <span className="text-slate-400 text-[10px] font-normal">
                            {new Date(w.createdAt || w.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="font-semibold text-slate-800 mb-0.5 capitalize">Category: {w.category}</p>
                        <p className="text-slate-600 leading-relaxed">{w.message}</p>
                        {(w.resolutionDueDate || w.resolution_due_date) && (
                          <div className="text-[10px] text-amber-800 font-bold mt-1">
                            Resolution Target Date: {w.resolutionDueDate || w.resolution_due_date}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Status Change History Timeline Card */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200">
                <h4 className="text-xs font-black uppercase text-slate-900 tracking-wider mb-3 flex items-center gap-1.5">
                  <History className="w-4 h-4 text-purple-600" />
                  Status Change Timeline
                </h4>

                {(!inspectData.statusHistory || inspectData.statusHistory.length === 0) ? (
                  <p className="text-xs text-slate-400 italic py-4 text-center">
                    No historical status transitions recorded.
                  </p>
                ) : (
                  <div className="space-y-2.5 max-h-52 overflow-y-auto pr-1">
                    {inspectData.statusHistory.map((h: any) => (
                      <div key={h.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-slate-900">
                            {h.previousStatus || h.previous_status} → <span className="text-[#E52320]">{h.newStatus || h.new_status}</span>
                          </span>
                          <span className="text-slate-400 text-[10px]">
                            {new Date(h.createdAt || h.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-slate-600 leading-snug">{h.reason}</p>
                        <div className="text-[10px] text-slate-400 mt-1 font-semibold">
                          Authorized by: {h.changedByName || h.changed_by_name} ({h.changedByRole || h.changed_by_role})
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setInspectModalOpen(false)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 cursor-pointer"
              >
                Close Inspection Modal
              </button>
            </div>
          </div>
        ) : null}
      </Modal>

      {/* ======================================================== */}
      {/* MODAL 2: EDIT FRANCHISEE FORM MODAL                      */}
      {/* ======================================================== */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title={`Edit Franchisee Profile: ${editingFranchisee?.franchiseName}`}
        maxWidth="2xl"
      >
        <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
          {editErrors.length > 0 && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl space-y-1">
              {editErrors.map((err, i) => (
                <div key={i} className="flex items-center gap-1.5 font-semibold">
                  <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  <span>{err}</span>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Franchise Business Name *</label>
              <input
                type="text"
                required
                value={editForm.franchiseName}
                onChange={(e) => setEditForm({ ...editForm, franchiseName: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-[#E52320]"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Representative Full Name *</label>
              <input
                type="text"
                required
                value={editForm.representativeName}
                onChange={(e) => setEditForm({ ...editForm, representativeName: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-[#E52320]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Contact Phone Number *</label>
              <input
                type="text"
                required
                value={editForm.contactNumber}
                onChange={(e) => setEditForm({ ...editForm, contactNumber: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-[#E52320]"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Official Email Address *</label>
              <input
                type="email"
                required
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-[#E52320]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">Physical Street Address *</label>
              <input
                type="text"
                required
                value={editForm.businessAddress}
                onChange={(e) => setEditForm({ ...editForm, businessAddress: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-[#E52320]"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">City *</label>
              <input
                type="text"
                required
                value={editForm.city}
                onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-[#E52320]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Province / Region</label>
              <input
                type="text"
                value={editForm.province}
                onChange={(e) => setEditForm({ ...editForm, province: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-[#E52320]"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Agreement Start Date *</label>
              <input
                type="date"
                required
                value={editForm.agreementStartDate}
                onChange={(e) => setEditForm({ ...editForm, agreementStartDate: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-[#E52320]"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Agreement End Date *</label>
              <input
                type="date"
                required
                value={editForm.agreementEndDate}
                onChange={(e) => setEditForm({ ...editForm, agreementEndDate: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-[#E52320]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Renewal Status</label>
              <select
                value={editForm.renewalStatus}
                onChange={(e) => setEditForm({ ...editForm, renewalStatus: e.target.value as RenewalStatus })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-[#E52320]"
              >
                <option value="Active">Active</option>
                <option value="Expiring Soon">Expiring Soon</option>
                <option value="Expired">Expired</option>
                <option value="Renewed">Renewed</option>
                <option value="Under Review">Under Review</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Franchise Package Type</label>
              <select
                value={editForm.franchiseType}
                onChange={(e) => setEditForm({ ...editForm, franchiseType: e.target.value as any })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-[#E52320]"
              >
                <option value="Pocket Store">Pocket Store</option>
                <option value="Standard Kiosk">Standard Kiosk</option>
                <option value="Commercial Parlor">Commercial Parlor</option>
                <option value="Mobile Cart">Mobile Cart</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Administrative Notes</label>
            <textarea
              rows={2}
              value={editForm.notes}
              onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-[#E52320]"
              placeholder="Internal compliance notes or agreement remarks..."
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <History className="w-3.5 h-3.5" />
              All changes will be logged in audit trail.
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingEdit}
                className="px-5 py-2 bg-[#E52320] hover:bg-[#c91d1a] text-white font-bold rounded-xl text-xs shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isSubmittingEdit ? 'Saving Changes...' : 'Save & Record Audit'}
              </button>
            </div>
          </div>
        </form>
      </Modal>

      {/* ======================================================== */}
      {/* MODAL 3: SEND WARNING FORM MODAL                         */}
      {/* ======================================================== */}
      <Modal
        isOpen={warningModalOpen}
        onClose={() => setWarningModalOpen(false)}
        title={`Send Administrative Warning: ${targetFranchiseeForWarning?.franchiseName}`}
        maxWidth="xl"
      >
        <form onSubmit={handleSubmitWarning} className="space-y-4 text-xs">
          {/* Warning Counter Notice */}
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 flex items-center justify-between">
            <div>
              <span className="font-bold block">Current Warning Count: {targetFranchiseeForWarning?.warningCount || 0}</span>
              <span className="text-[11px] text-amber-800">
                Issuing this notice will increment count and transition franchisee status to <strong>Under Warning</strong>.
              </span>
            </div>
            {(targetFranchiseeForWarning?.warningCount || 0) >= 1 && (
              <span className="px-2 py-1 bg-amber-200 text-amber-900 rounded-lg text-[10px] font-black uppercase tracking-wider">
                Escalation Alert
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Warning Level *</label>
              <select
                value={warnLevel}
                onChange={(e) => setWarnLevel(e.target.value as any)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-bold focus:ring-2 focus:ring-[#E52320]"
              >
                <option value="1st">1st Warning (Informal Notice)</option>
                <option value="2nd">2nd Warning (Formal Warning)</option>
                <option value="Final">Final Warning (Final Notice before Suspension)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Violation Category *</label>
              <select
                value={warnCategory}
                onChange={(e) => setWarnCategory(e.target.value as any)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-bold focus:ring-2 focus:ring-[#E52320]"
              >
                <option value="late payment">Late Payment / Outstanding Balance</option>
                <option value="low sales">Low Sales / Minimum Quota Breach</option>
                <option value="policy violation">Policy Violation / Brand Guideline Breach</option>
                <option value="hygiene/quality">Hygiene / Freezer Temperature Quality</option>
                <option value="other">Other Operational Non-Compliance</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Optional Due Date to Resolve Violation</label>
            <input
              type="date"
              value={warnDueDate}
              onChange={(e) => setWarnDueDate(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-[#E52320]"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Official Warning Message & Directives *</label>
            <textarea
              required
              rows={4}
              value={warnMessage}
              onChange={(e) => setWarnMessage(e.target.value)}
              placeholder="State the observed breach, specific required corrective action, and consequence if unaddressed..."
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-[#E52320]"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">
              Delivers in-app alert to franchisee.
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setWarningModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingWarning}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                {isSubmittingWarning ? 'Sending Notice...' : 'Issue Warning Notice'}
              </button>
            </div>
          </div>
        </form>
      </Modal>

      {/* ======================================================== */}
      {/* MODAL 4: SUSPEND / TERMINATE / REINSTATE CONFIRMATION    */}
      {/* ======================================================== */}
      <Modal
        isOpen={actionConfirmModalOpen}
        onClose={() => setActionConfirmModalOpen(false)}
        title={
          actionType === 'SUSPEND'
            ? 'Confirm Franchisee Suspension'
            : actionType === 'TERMINATE'
            ? 'Confirm Franchise Agreement Termination (Soft Delete)'
            : 'Confirm Franchisee Reinstatement'
        }
        maxWidth="lg"
      >
        <div className="space-y-4 text-xs">
          {/* Header Description */}
          <div className={`p-4 rounded-xl border ${
            actionType === 'TERMINATE' 
              ? 'bg-rose-50 border-rose-200 text-rose-900' 
              : actionType === 'SUSPEND'
              ? 'bg-amber-50 border-amber-200 text-amber-900'
              : 'bg-emerald-50 border-emerald-200 text-emerald-900'
          }`}>
            <h4 className="font-bold text-sm mb-1 flex items-center gap-1.5">
              {actionType === 'TERMINATE' && <AlertOctagon className="w-4 h-4 text-rose-600" />}
              {actionType === 'SUSPEND' && <Ban className="w-4 h-4 text-amber-600" />}
              {actionType === 'REINSTATE' && <RotateCcw className="w-4 h-4 text-emerald-600" />}
              {actionTargetFranchisee?.franchiseName}
            </h4>
            <p className="leading-relaxed">
              {actionType === 'SUSPEND' && 
                'Suspension is a temporary administrative lock. It immediately blocks the franchisee from logging in and submitting new replenishment supply requests while preserving all historical records.'}
              {actionType === 'TERMINATE' && 
                'Termination is a SOFT DELETE ONLY (never hard deleted). It disables user login, marks status as Terminated, automatically cancels pending orders, and flags remaining inventory/balance for final settlement.'}
              {actionType === 'REINSTATE' && 
                'Reinstatement restores a suspended or terminated franchisee back to Active status, re-enables user portal login, and logs the justification in the audit trail.'}
            </p>
          </div>

          <div>
            <label className="block font-bold text-slate-800 mb-1">
              Required Justification / Reason *
            </label>
            <textarea
              required
              rows={3}
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
              placeholder={`Enter formal reason for ${actionType?.toLowerCase()}...`}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-[#E52320]"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setActionConfirmModalOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleExecuteAction}
              className={`px-5 py-2 text-white font-bold rounded-xl text-xs shadow-xs cursor-pointer ${
                actionType === 'TERMINATE'
                  ? 'bg-rose-600 hover:bg-rose-700'
                  : actionType === 'SUSPEND'
                  ? 'bg-amber-600 hover:bg-amber-700'
                  : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              Confirm {actionType}
            </button>
          </div>
        </div>
      </Modal>

      {/* ======================================================== */}
      {/* MODAL 5: ADD NEW FRANCHISEE MODAL                        */}
      {/* ======================================================== */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Provision New Official Aice Franchisee"
        maxWidth="2xl"
      >
        <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Franchise Outlet Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Aice Parlor - SM Megamall"
                value={addFranchiseName}
                onChange={(e) => setAddFranchiseName(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-[#E52320]"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Partner / Representative *</label>
              <input
                type="text"
                required
                placeholder="Full Name"
                value={addRepresentativeName}
                onChange={(e) => setAddRepresentativeName(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-[#E52320]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Email Address *</label>
              <input
                type="email"
                required
                value={addEmail}
                onChange={(e) => setAddEmail(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-[#E52320]"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Contact Number *</label>
              <input
                type="text"
                required
                value={addContactNumber}
                onChange={(e) => setAddContactNumber(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-[#E52320]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">Business Address *</label>
              <input
                type="text"
                required
                placeholder="Complete street, mall wing, or barangay"
                value={addBusinessAddress}
                onChange={(e) => setAddBusinessAddress(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-[#E52320]"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">City *</label>
              <input
                type="text"
                required
                placeholder="e.g. Quezon City"
                value={addCity}
                onChange={(e) => setAddCity(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-[#E52320]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Province / Region</label>
              <input
                type="text"
                value={addProvince}
                onChange={(e) => setAddProvince(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-[#E52320]"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Package Model</label>
              <select
                value={addFranchiseType}
                onChange={(e) => setAddFranchiseType(e.target.value as any)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-[#E52320]"
              >
                <option value="Pocket Store">Pocket Store</option>
                <option value="Standard Kiosk">Standard Kiosk</option>
                <option value="Commercial Parlor">Commercial Parlor</option>
                <option value="Mobile Cart">Mobile Cart</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Freezer Units</label>
              <input
                type="number"
                min={1}
                max={10}
                value={addFreezers}
                onChange={(e) => setAddFreezers(parseInt(e.target.value, 10) || 1)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-[#E52320]"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmittingAdd}
              className="px-5 py-2 bg-[#E52320] hover:bg-[#c91d1a] text-white font-bold rounded-xl text-xs shadow-xs cursor-pointer disabled:opacity-50"
            >
              {isSubmittingAdd ? 'Provisioning...' : 'Provision Franchisee'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ======================================================== */}
      {/* MODAL 6: XAMPP / PHP CAPSTONE DEFENSE KIT MODAL          */}
      {/* ======================================================== */}
      <Modal
        isOpen={showXamppHelpModal}
        onClose={() => setShowXamppHelpModal(false)}
        title="Capstone Defense Kit: Procedural PHP + MySQL (XAMPP)"
        maxWidth="4xl"
      >
        <div className="space-y-4 text-xs text-slate-700">
          <div className="p-4 bg-slate-900 text-white rounded-2xl">
            <div className="flex items-center gap-2 text-xs font-black uppercase text-amber-400 mb-1">
              <Terminal className="w-4 h-4" />
              XAMPP Local Deployment & Architecture Overview
            </div>
            <p className="text-slate-300 text-xs leading-relaxed">
              This module is engineered with a clean dual-stack interface: an interactive React + TypeScript interface for live browser preview, and <strong>100% plain procedural PHP files + MySQL (InnoDB)</strong> designed for presentation and submission in an academic or capstone defense on XAMPP.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <h4 className="font-bold text-slate-900 text-xs uppercase mb-2">
                📁 PHP Files Created in <code>backend_php/</code>:
              </h4>
              <ul className="space-y-1 font-mono text-[11px] text-slate-600">
                <li>• <code>config/database.php</code> (PDO connection)</li>
                <li>• <code>includes/auth_check.php</code> (Role check RBAC)</li>
                <li>• <code>api/franchisees/list.php</code> (Search, filter, page)</li>
                <li>• <code>api/franchisees/inspect.php</code> (Detail snapshot)</li>
                <li>• <code>api/franchisees/edit.php</code> (Validation + audit)</li>
                <li>• <code>api/franchisees/send_warning.php</code> (Warn & escalate)</li>
                <li>• <code>api/franchisees/suspend.php</code> (Suspend + lock)</li>
                <li>• <code>api/franchisees/terminate.php</code> (Super Admin only)</li>
                <li>• <code>api/franchisees/reinstate.php</code> (Super Admin restore)</li>
                <li>• <code>api/audit_logs/list.php</code> (Admin audit trail)</li>
              </ul>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <h4 className="font-bold text-slate-900 text-xs uppercase mb-2">
                🗄️ Relational MySQL Schema:
              </h4>
              <p className="text-xs text-slate-600 mb-2">
                SQL file created at <code>database/franchisee_management_tables.sql</code> with:
              </p>
              <ul className="space-y-1 font-mono text-[11px] text-slate-600">
                <li>• <code>franchisees</code> (with status ENUM & timestamps)</li>
                <li>• <code>franchisee_warnings</code> (levels, categories, FK)</li>
                <li>• <code>franchisee_status_history</code> (immutable timeline)</li>
                <li>• <code>audit_log</code> (actor, action, JSON old/new values)</li>
              </ul>
            </div>
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
            <h4 className="font-bold text-blue-900 text-xs uppercase mb-1">
              🚀 3 Steps to Test Locally on XAMPP:
            </h4>
            <ol className="list-decimal list-inside space-y-1 text-blue-900 text-xs">
              <li>Open XAMPP Control Panel and click <strong>Start</strong> for Apache & MySQL.</li>
              <li>Go to <code>http://localhost/phpmyadmin/</code>, open <code>aice_franchise_system</code>, and import <code>database/franchisee_management_tables.sql</code>.</li>
              <li>Place the project folder into <code>C:/xampp/htdocs/</code> and test endpoints like <code>http://localhost/backend_php/api/franchisees/list.php</code>.</li>
            </ol>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={() => setShowXamppHelpModal(false)}
              className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 cursor-pointer"
            >
              Close Defense Kit
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
