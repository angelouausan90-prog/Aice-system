/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Recruit, AgentProfile } from '../types.ts';
import { StatusBadge } from '../components/StatusBadge.tsx';
import { Modal } from '../components/Modal.tsx';
import { 
  Search, 
  Filter, 
  Sparkles, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  CheckCheck,
  Store,
  History,
  AlertCircle,
  MapPin
} from 'lucide-react';

interface RecruitmentQueueViewProps {
  recruits: Recruit[];
  agents: AgentProfile[];
  onUpdateStatus: (recruitId: string, newStatus: string, comment: string, rejectionReason?: string, locationDetails?: any) => Promise<void>;
  onConvertToFranchisee: (recruit: Recruit, packageDetails: any) => Promise<void>;
  onNavigateToMap?: (franchiseeId?: string) => void;
  selectedRecruitInitial?: Recruit | null;
  onClearSelectedRecruit?: () => void;
}

export const RecruitmentQueueView: React.FC<RecruitmentQueueViewProps> = ({
  recruits,
  agents,
  onUpdateStatus,
  onConvertToFranchisee,
  onNavigateToMap,
  selectedRecruitInitial,
  onClearSelectedRecruit,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [agentFilter, setAgentFilter] = useState('ALL');
  const [activeRecruit, setActiveRecruit] = useState<Recruit | null>(selectedRecruitInitial || null);

  // Review action modal state
  const [actionType, setActionType] = useState<'APPROVE' | 'REJECT' | 'REVISE' | 'UNDER_REVIEW' | null>(null);
  const [reviewComment, setReviewComment] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [approveStoreName, setApproveStoreName] = useState('');
  const [approveAddress, setApproveAddress] = useState('');
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  // Convert to franchisee modal state
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [convertFranchiseName, setConvertFranchiseName] = useState('');
  const [convertAddress, setConvertAddress] = useState('');
  const [convertType, setConvertType] = useState('Standard Kiosk');
  const [convertFreezers, setConvertFreezers] = useState(2);
  const [isConverting, setIsConverting] = useState(false);

  // AI Evaluation state
  const [isEvaluatingAi, setIsEvaluatingAi] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);

  // Filter logic
  const filteredRecruits = recruits.filter((r) => {
    const matchesSearch = 
      r.prospectFullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.referenceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.phone.includes(searchQuery);

    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
    const matchesAgent = agentFilter === 'ALL' || r.agentId === agentFilter;

    return matchesSearch && matchesStatus && matchesAgent;
  });

  const handleOpenRecruit = (recruit: Recruit) => {
    setActiveRecruit(recruit);
    setAiResult(recruit.aiEvaluation || null);
    setApproveStoreName(recruit.storeName || `Aice Store - ${recruit.city} (${recruit.prospectFullName.split(' ')[0]})`);
    setApproveAddress(recruit.businessAddress || `${recruit.city}, ${recruit.province}`);
  };

  const handleCloseRecruit = () => {
    setActiveRecruit(null);
    setActionType(null);
    setAiResult(null);
    if (onClearSelectedRecruit) onClearSelectedRecruit();
  };

  // Submit status update
  const handleConfirmAction = async () => {
    if (!activeRecruit || !actionType) return;
    setIsSubmittingAction(true);

    let newStatus = '';
    if (actionType === 'APPROVE') newStatus = 'Approved';
    if (actionType === 'REJECT') newStatus = 'Rejected';
    if (actionType === 'REVISE') newStatus = 'Needs Revision';
    if (actionType === 'UNDER_REVIEW') newStatus = 'Under Review';

    try {
      await onUpdateStatus(
        activeRecruit.id, 
        newStatus, 
        reviewComment, 
        rejectionReason,
        actionType === 'APPROVE' ? { storeName: approveStoreName, businessAddress: approveAddress } : undefined
      );
      setActionType(null);
      setReviewComment('');
      setRejectionReason('');
      // Refresh active recruit view
      const updated = recruits.find(r => r.id === activeRecruit.id);
      if (updated) setActiveRecruit({ ...updated, status: newStatus as any });
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // Run AI Evaluation
  const handleRunAiEvaluation = async () => {
    if (!activeRecruit) return;
    setIsEvaluatingAi(true);

    try {
      const res = await fetch('/api/gemini/evaluate-recruit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recruitId: activeRecruit.id,
          prospectName: activeRecruit.prospectFullName,
          city: activeRecruit.city,
          province: activeRecruit.province,
          businessInterest: activeRecruit.businessInterest,
          notes: activeRecruit.salesConversationNotes,
          source: activeRecruit.recruitmentSource,
        }),
      });

      const data = await res.json();
      setAiResult(data);
    } catch (err) {
      console.error('Failed to run AI evaluation:', err);
    } finally {
      setIsEvaluatingAi(false);
    }
  };

  // Handle convert to franchisee
  const handleConvertSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRecruit) return;
    setIsConverting(true);

    try {
      await onConvertToFranchisee(activeRecruit, {
        franchiseName: convertFranchiseName || `Aice Store - ${activeRecruit.city}`,
        businessAddress: convertAddress || `${activeRecruit.city}, ${activeRecruit.province}`,
        franchiseType: convertType,
        freezerUnitsCount: convertFreezers,
      });
      setShowConvertModal(false);
      handleCloseRecruit();
    } catch (err) {
      console.error(err);
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">
            Recruitment Verification Queue
          </h2>
          <p className="text-xs text-slate-500">
            Official administrative review portal for prospect submissions and franchise onboarding
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search candidate, phone, city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#E52320]"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-[#E52320]"
          >
            <option value="ALL">All Statuses</option>
            <option value="Pending Verification">Pending Verification</option>
            <option value="Under Review">Under Review</option>
            <option value="Approved">Approved</option>
            <option value="Needs Revision">Needs Revision</option>
            <option value="Rejected">Rejected</option>
          </select>

          {/* Agent Filter */}
          <select
            value={agentFilter}
            onChange={(e) => setAgentFilter(e.target.value)}
            className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-[#E52320]"
          >
            <option value="ALL">All Agents</option>
            {agents.map((a) => (
              <option key={a.id} value={a.id}>{a.fullName}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Recruits Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-6 py-3.5">Ref #</th>
                <th className="px-6 py-3.5">Prospect Name</th>
                <th className="px-6 py-3.5">Location</th>
                <th className="px-6 py-3.5">Package Interest</th>
                <th className="px-6 py-3.5">Recruiting Agent</th>
                <th className="px-6 py-3.5">Submitted Date</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecruits.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                    <Filter className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    No recruitment records match current search filters.
                  </td>
                </tr>
              ) : (
                filteredRecruits.map((recruit) => (
                  <tr key={recruit.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-slate-800">
                      {recruit.referenceNumber}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{recruit.prospectFullName}</div>
                      <div className="text-[11px] text-slate-500">{recruit.phone}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {recruit.city}, {recruit.province}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-semibold text-[11px]">
                        {recruit.businessInterest}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-700 font-medium">
                      {recruit.agentName}
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {new Date(recruit.submittedAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={recruit.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleOpenRecruit(recruit)}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-[#E52320] text-white font-bold rounded-lg transition-colors cursor-pointer text-xs"
                      >
                        Inspect Dossier
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAILED RECRUITMENT DOSSIER MODAL */}
      {activeRecruit && (
        <Modal
          isOpen={!!activeRecruit}
          onClose={handleCloseRecruit}
          title={`Recruitment Dossier: ${activeRecruit.prospectFullName}`}
          subtitle={`Reference Number: ${activeRecruit.referenceNumber} • Submitting Agent: ${activeRecruit.agentName}`}
          maxWidth="4xl"
        >
          <div className="space-y-6">
            {/* Top Status & Convert Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Current Status:
                </span>
                <StatusBadge status={activeRecruit.status} size="md" />
              </div>

              {/* Action Buttons for Admin */}
              <div className="flex flex-wrap items-center gap-2">
                {activeRecruit.status !== 'Approved' && (
                  <>
                    <button
                      onClick={() => setActionType('UNDER_REVIEW')}
                      className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                    >
                      Mark Under Review
                    </button>
                    <button
                      onClick={() => setActionType('REVISE')}
                      className="px-3 py-1.5 bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                    >
                      Request Revision
                    </button>
                    <button
                      onClick={() => setActionType('REJECT')}
                      className="px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                    >
                      Reject Submission
                    </button>
                    <button
                      onClick={() => setActionType('APPROVE')}
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Approve Prospect
                    </button>
                  </>
                )}

                {activeRecruit.status === 'Approved' && !activeRecruit.convertedFranchiseeId && (
                  <button
                    onClick={() => {
                      setConvertFranchiseName(`Aice Store - ${activeRecruit.city}`);
                      setConvertAddress(`${activeRecruit.city}, ${activeRecruit.province}`);
                      setShowConvertModal(true);
                    }}
                    className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-extrabold shadow-md transition-all cursor-pointer flex items-center gap-2"
                  >
                    <Store className="w-4 h-4" />
                    Onboard as Official Franchisee
                  </button>
                )}

                {activeRecruit.convertedFranchiseeId && (
                  <span className="px-3 py-1.5 bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold flex items-center gap-1.5">
                    <CheckCheck className="w-4 h-4" />
                    Already Onboarded as Franchisee
                  </span>
                )}
              </div>
            </div>

            {/* Applicant & Territory Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Prospect Details */}
              <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">
                  Prospect Demographics & Contact
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Full Name</span>
                    <span className="font-bold text-slate-900">{activeRecruit.prospectFullName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Contact Number</span>
                    <span className="font-bold text-slate-900 font-mono">{activeRecruit.phone}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Email Address</span>
                    <span className="font-medium text-slate-800">{activeRecruit.email || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Target City / Province</span>
                    <span className="font-bold text-slate-900">{activeRecruit.city}, {activeRecruit.province}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Preferred Contact</span>
                    <span className="font-medium text-slate-800">{activeRecruit.preferredContactMethod}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Consent Confirmed</span>
                    <span className="font-semibold text-emerald-600">Verified & Signed (RA 10173)</span>
                  </div>
                </div>
              </div>

              {/* Franchise Package & Conversation Notes */}
              <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">
                  Sales Conversation & Package Fit
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Franchise Package</span>
                    <span className="font-bold text-slate-900">{activeRecruit.businessInterest}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Lead Source</span>
                    <span className="font-medium text-slate-800">{activeRecruit.recruitmentSource}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Initial Contact</span>
                    <span className="font-medium text-slate-800">{activeRecruit.initialContactDate}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Interest Level</span>
                    <span className="font-bold text-emerald-600">{activeRecruit.prospectInterestLevel}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <span className="text-slate-400 block text-[10px] uppercase mb-1">Agent Field Pitch Notes:</span>
                  <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100 italic">
                    "{activeRecruit.salesConversationNotes}"
                  </p>
                </div>
              </div>
            </div>

            {/* REGISTERED BUSINESS LOCATION & MAP TRACKER STATUS */}
            <div className={`p-4 rounded-xl border transition-all ${
              activeRecruit.status === 'Approved'
                ? 'bg-emerald-50/80 border-emerald-300'
                : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className={`p-2.5 rounded-xl text-white shrink-0 ${activeRecruit.status === 'Approved' ? 'bg-emerald-600' : 'bg-slate-700'}`}>
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                        {activeRecruit.status === 'Approved' ? 'Registered Business Location on Map Tracker' : 'Proposed Storefront Location'}
                      </span>
                      {activeRecruit.status === 'Approved' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-200 text-emerald-900 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Live on Map Tracker
                        </span>
                      )}
                    </div>
                    <div className="text-sm font-black text-slate-900 mt-0.5">
                      {activeRecruit.storeName || `Aice Store - ${activeRecruit.city}`}
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">
                      {activeRecruit.businessAddress || `${activeRecruit.city}, ${activeRecruit.province}`}
                    </p>
                  </div>
                </div>

                {activeRecruit.status === 'Approved' ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (onNavigateToMap) {
                        handleCloseRecruit();
                        onNavigateToMap(activeRecruit.convertedFranchiseeId);
                      }
                    }}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer shrink-0"
                  >
                    <MapPin className="w-4 h-4" />
                    View on Map Tracker →
                  </button>
                ) : (
                  <div className="text-[11px] text-slate-500 max-w-xs text-left sm:text-right">
                    <span>Upon admin approval, this storefront location will automatically appear as an active pin on the live Franchise Map Tracker.</span>
                  </div>
                )}
              </div>
            </div>

            {/* AI CANDIDATE SUITABILITY & FRAUD RED FLAG EVALUATOR */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950 text-white border border-indigo-900 shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-amber-400 text-slate-950 rounded-lg">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">AI Candidate Feasibility & Fraud Check</h4>
                    <p className="text-[11px] text-slate-300">Powered by Gemini 3.8 Flash automated franchise assessment</p>
                  </div>
                </div>

                <button
                  onClick={handleRunAiEvaluation}
                  disabled={isEvaluatingAi}
                  className="px-3.5 py-1.5 bg-white text-slate-900 hover:bg-slate-100 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  {isEvaluatingAi ? 'Analyzing Candidate...' : aiResult ? 'Re-Evaluate' : 'Run AI Evaluation'}
                </button>
              </div>

              {aiResult ? (
                <div className="space-y-3 pt-3 border-t border-indigo-800/80 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Suitability & Territory Score:</span>
                    <span className={`text-sm font-black px-2.5 py-0.5 rounded-full ${aiResult.feasibilityScore >= 75 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}`}>
                      {aiResult.feasibilityScore} / 100
                    </span>
                  </div>

                  <p className="text-slate-200 bg-indigo-900/40 p-3 rounded-xl border border-indigo-800/50">
                    {aiResult.summary}
                  </p>

                  {aiResult.riskFlags && aiResult.riskFlags.length > 0 && (
                    <div>
                      <span className="text-[11px] font-bold text-amber-300 block mb-1">
                        Potential Risk Indicators to Verify:
                      </span>
                      <ul className="list-disc pl-4 space-y-0.5 text-slate-300 text-[11px]">
                        {aiResult.riskFlags.map((risk: string, i: number) => (
                          <li key={i}>{risk}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {aiResult.suggestedQuestions && aiResult.suggestedQuestions.length > 0 && (
                    <div>
                      <span className="text-[11px] font-bold text-indigo-300 block mb-1">
                        Recommended Admin Interview Questions:
                      </span>
                      <ul className="list-decimal pl-4 space-y-0.5 text-slate-300 text-[11px]">
                        {aiResult.suggestedQuestions.map((q: string, i: number) => (
                          <li key={i}>{q}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-400 mt-2">
                  Click 'Run AI Evaluation' to automatically analyze applicant risk factors, location suitability, and generate targeted interview prompts.
                </p>
              )}
            </div>

            {/* Supporting Attachments Evidence */}
            <div className="p-4 rounded-xl bg-white border border-slate-200">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center justify-between">
                <span>Supporting Verification Evidence ({activeRecruit.attachments.length} files)</span>
                <span className="text-[10px] text-slate-400 font-normal">Encrypted storage directory</span>
              </h4>

              {activeRecruit.attachments.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No supporting documents uploaded yet.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {activeRecruit.attachments.map((att) => (
                    <div key={att.id} className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <FileText className="w-5 h-5 text-[#E52320] shrink-0" />
                        <div className="truncate">
                          <div className="font-bold text-slate-900 truncate">{att.originalFilename}</div>
                          <div className="text-[10px] text-slate-500">{att.description || 'Verification Document'}</div>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-600 shrink-0">
                        {Math.round(att.fileSize / 1024)} KB
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Audit Status History */}
            <div className="p-4 rounded-xl bg-white border border-slate-200">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                <History className="w-4 h-4 text-slate-400" />
                Audit Trail: Verification History
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {activeRecruit.statusHistory.map((sh) => (
                  <div key={sh.id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                    <div className="flex items-center justify-between text-slate-500 text-[10px] mb-1">
                      <span className="font-bold text-slate-800">{sh.changedByUserName}</span>
                      <span>{new Date(sh.createdAt).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] text-slate-400">{sh.previousStatus}</span>
                      <span className="text-slate-400">→</span>
                      <StatusBadge status={sh.newStatus} />
                    </div>
                    <p className="text-slate-700 italic text-[11px]">"{sh.comment}"</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* CONFIRMATION / REVISION / REJECTION MODAL */}
      {actionType && activeRecruit && (
        <Modal
          isOpen={!!actionType}
          onClose={() => setActionType(null)}
          title={
            actionType === 'APPROVE' ? 'Confirm Recruitment Approval' :
            actionType === 'REJECT' ? 'Reject Recruitment Submission' :
            actionType === 'REVISE' ? 'Request Submission Revision' : 'Mark Under Review'
          }
          subtitle={`Prospect: ${activeRecruit.prospectFullName} (${activeRecruit.referenceNumber})`}
          maxWidth="md"
        >
          <div className="space-y-4 text-xs">
            {actionType === 'APPROVE' && (
              <div className="space-y-3">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 flex items-start gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold">Approve Application & Register Business Location on Map</div>
                    <div className="text-[11px] text-emerald-800 mt-0.5">
                      This will approve the application, credit Agent <strong>{activeRecruit.agentName}</strong> with an approved conversion (+Php 15,000 commission), provision an active Franchisee account, and automatically register this business location on the National Franchise Map Tracker!
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                  <span className="text-[10px] font-bold uppercase text-slate-500 block flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#E52320]" />
                    Registered Location Details for Map Tracker
                  </span>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Official Franchise Store Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={approveStoreName}
                      onChange={(e) => setApproveStoreName(e.target.value)}
                      placeholder={`Aice Store - ${activeRecruit.city}`}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-[#E52320]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Storefront Physical Street Address *
                    </label>
                    <input
                      type="text"
                      required
                      value={approveAddress}
                      onChange={(e) => setApproveAddress(e.target.value)}
                      placeholder={`${activeRecruit.city}, ${activeRecruit.province}`}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-[#E52320]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Approval Endorsement Comment (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="e.g. Identity and site credentials validated. Approved for onboarding, cold storage delivery, and live map plotting."
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-[#E52320]"
                  />
                </div>
              </div>
            )}

            {actionType === 'REJECT' && (
              <div className="space-y-2">
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 flex items-start gap-2.5">
                  <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold">Rejection Reason Required</div>
                    <div>Agent {activeRecruit.agentName} will be notified with this specific reason.</div>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Formal Rejection Reason *
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="e.g. Territory density saturated within 300m radius of existing Aice dealer..."
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-[#E52320]"
                  />
                </div>
              </div>
            )}

            {actionType === 'REVISE' && (
              <div className="space-y-2">
                <div className="p-3 bg-orange-50 border border-orange-200 rounded-xl text-orange-900 flex items-start gap-2.5">
                  <AlertTriangle className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold">Specify Corrections Required</div>
                    <div>The Agent will be permitted to update permitted fields and resubmit.</div>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Revision Instructions *
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="e.g. Please upload official DTI Business Name registration and photos of submeter..."
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-[#E52320]"
                  />
                </div>
              </div>
            )}

            {actionType === 'UNDER_REVIEW' && (
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Investigation Note / Review Comment
                </label>
                <textarea
                  rows={2}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="e.g. Currently cross-referencing GPS coordinates with Regional Cold Hub..."
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-[#E52320]"
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActionType(null)}
                className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmittingAction || (actionType === 'REJECT' && !rejectionReason.trim()) || (actionType === 'REVISE' && !reviewComment.trim())}
                onClick={handleConfirmAction}
                className="px-4 py-2 bg-[#E52320] hover:bg-[#c91d1a] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
              >
                {isSubmittingAction ? 'Processing Decision...' : 'Confirm Decision'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ONBOARD APPROVED PROSPECT TO FRANCHISEE MODAL */}
      {showConvertModal && activeRecruit && (
        <Modal
          isOpen={showConvertModal}
          onClose={() => setShowConvertModal(false)}
          title="Onboard Approved Prospect to Official Franchisee"
          subtitle={`Converting ${activeRecruit.prospectFullName} (${activeRecruit.city}) to an authorized franchise account.`}
          maxWidth="lg"
        >
          <form onSubmit={handleConvertSubmit} className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700">
              <div className="font-bold text-slate-900 mb-1">Franchisee Account Provisioning</div>
              <p className="text-[11px] text-slate-500">
                This will create a new Franchisee profile linked to recruitment record <strong>#{activeRecruit.referenceNumber}</strong>. The original agent attribution to <strong>{activeRecruit.agentName}</strong> is permanently preserved.
              </p>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Official Franchise Outlet / Store Name *
              </label>
              <input
                type="text"
                required
                value={convertFranchiseName}
                onChange={(e) => setConvertFranchiseName(e.target.value)}
                placeholder="e.g. Aice Ice Cream Parlor - SM Fairview Hub"
                className="w-full p-2.5 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-[#E52320]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Physical Store / Delivery Address *
              </label>
              <textarea
                required
                rows={2}
                value={convertAddress}
                onChange={(e) => setConvertAddress(e.target.value)}
                placeholder="Complete street, commercial building, barangay, and city..."
                className="w-full p-2.5 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-[#E52320]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Franchise Package Type
                </label>
                <select
                  value={convertType}
                  onChange={(e) => setConvertType(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-[#E52320]"
                >
                  <option value="Pocket Store">Pocket Store (1 Freezer)</option>
                  <option value="Standard Kiosk">Standard Kiosk (2-3 Freezers)</option>
                  <option value="Commercial Parlor">Commercial Parlor (4+ Freezers)</option>
                  <option value="Mobile Cart">Mobile Cart</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Initial Sub-Zero Freezers Assigned
                </label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={convertFreezers}
                  onChange={(e) => setConvertFreezers(parseInt(e.target.value || '1', 10))}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-[#E52320]"
                />
              </div>
            </div>

            {/* Geographical Map Tracker Auto-Registration Banner */}
            <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl text-emerald-950 flex items-start gap-2.5">
              <span className="text-base">🗺️</span>
              <div>
                <div className="font-bold text-[11px] text-emerald-900">
                  Automated Store Map Registration
                </div>
                <div className="text-[11px] text-emerald-800 leading-relaxed mt-0.5">
                  Upon account activation, this store will automatically register on the <strong>Live Franchise Store Locations Map</strong> with an active <strong>300m protected territory buffer</strong> centered around <em>{activeRecruit.city}, {activeRecruit.province}</em>.
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowConvertModal(false)}
                className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isConverting}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                {isConverting ? 'Activating Franchisee Account...' : 'Provision Franchisee Account'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
