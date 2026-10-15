/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AgentWorkReport, AgentProfile, Recruit, UserRole } from '../types.ts';
import { StatusBadge } from '../components/StatusBadge.tsx';
import { Modal } from '../components/Modal.tsx';
import { 
  FileCheck2, 
  FileSpreadsheet, 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Calendar, 
  Users, 
  History,
  Send,
  Eye
} from 'lucide-react';

interface WorkReportsViewProps {
  currentRole: UserRole;
  currentAgentProfile?: AgentProfile;
  workReports: AgentWorkReport[];
  agents: AgentProfile[];
  recruits: Recruit[];
  onSubmitWorkReport: (data: any) => Promise<void>;
  onVerifyWorkReport: (reportId: string, newStatus: string, comment: string) => Promise<void>;
  isSubmitModalOpenInitially?: boolean;
  onCloseSubmitModal?: () => void;
}

export const WorkReportsView: React.FC<WorkReportsViewProps> = ({
  currentRole,
  currentAgentProfile,
  workReports,
  agents,
  recruits,
  onSubmitWorkReport,
  onVerifyWorkReport,
  isSubmitModalOpenInitially = false,
  onCloseSubmitModal,
}) => {
  const [showSubmitModal, setShowSubmitModal] = useState(isSubmitModalOpenInitially);
  const [activeReport, setActiveReport] = useState<AgentWorkReport | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [agentFilter, setAgentFilter] = useState('ALL');

  // Admin Review action modal
  const [actionStatus, setActionStatus] = useState<string | null>(null);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Agent Form State
  const [title, setTitle] = useState('');
  const [activityDate, setActivityDate] = useState(new Date().toISOString().split('T')[0]);
  const [periodStart, setPeriodStart] = useState(new Date().toISOString().split('T')[0]);
  const [periodEnd, setPeriodEnd] = useState(new Date().toISOString().split('T')[0]);
  const [activityType, setActivityType] = useState<'Field Pitching' | 'Franchise Seminar' | 'Client Follow-Up' | 'Site Inspection'>('Field Pitching');
  const [prospectsContacted, setProspectsContacted] = useState(15);
  const [meetingsConducted, setMeetingsConducted] = useState(4);
  const [recruitsSubmittedCount, setRecruitsSubmittedCount] = useState(1);
  const [activityDescription, setActivityDescription] = useState('');
  const [outcomes, setOutcomes] = useState('');
  const [challenges, setChallenges] = useState('');
  const [nextSteps, setNextSteps] = useState('');
  const [associatedRecruits, setAssociatedRecruits] = useState<string[]>([]);
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  // Filter based on role (Agents only see their own, Admin sees all)
  const visibleReports = currentRole === 'Agent' && currentAgentProfile
    ? workReports.filter(w => w.agentId === currentAgentProfile.id)
    : workReports;

  const filteredReports = visibleReports.filter(w => {
    const matchesSearch = 
      w.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.referenceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.agentName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || w.status === statusFilter;
    const matchesAgent = agentFilter === 'ALL' || w.agentId === agentFilter;
    return matchesSearch && matchesStatus && matchesAgent;
  });

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentAgentProfile) return;
    setIsSubmittingReport(true);

    try {
      await onSubmitWorkReport({
        agentId: currentAgentProfile.id,
        agentName: currentAgentProfile.fullName,
        title,
        activityDate,
        periodStart,
        periodEnd,
        activityType,
        prospectsContacted,
        meetingsConducted,
        recruitsSubmittedCount,
        activityDescription,
        outcomes,
        challenges,
        nextSteps,
        associatedRecruitIds: associatedRecruits,
      });

      setShowSubmitModal(false);
      if (onCloseSubmitModal) onCloseSubmitModal();
      setTitle('');
      setActivityDescription('');
      setOutcomes('');
      setChallenges('');
      setNextSteps('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const handleConfirmReview = async () => {
    if (!activeReport || !actionStatus) return;
    setIsSubmittingReview(true);

    try {
      await onVerifyWorkReport(activeReport.id, actionStatus, reviewComment);
      setActionStatus(null);
      setReviewComment('');
      // update active report status in local view
      const updated = workReports.find(w => w.id === activeReport.id);
      if (updated) setActiveReport({ ...updated, status: actionStatus as any });
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">
            {currentRole === 'Admin' ? 'Agent Work Reports Queue' : 'My Field Work Reports'}
          </h2>
          <p className="text-xs text-slate-500">
            {currentRole === 'Admin'
              ? 'Verify reported agent field canvassing, seminar attendance, and prospect conversion metrics'
              : 'Submit daily and weekly logs of field recruitment activities, outcomes, and prospect discussions'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search reports..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-[#E52320]"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:ring-2 focus:ring-[#E52320]"
          >
            <option value="ALL">All Statuses</option>
            <option value="Pending Review">Pending Review</option>
            <option value="Under Review">Under Review</option>
            <option value="Verified">Verified</option>
            <option value="Needs Revision">Needs Revision</option>
            <option value="Rejected">Rejected</option>
          </select>

          {/* Admin Agent Filter */}
          {currentRole === 'Admin' && (
            <select
              value={agentFilter}
              onChange={(e) => setAgentFilter(e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:ring-2 focus:ring-[#E52320]"
            >
              <option value="ALL">All Agents</option>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>{a.fullName}</option>
              ))}
            </select>
          )}

          {/* Agent Submit Button */}
          {currentRole === 'Agent' && (
            <button
              onClick={() => setShowSubmitModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#E52320] hover:bg-[#c91d1a] text-white rounded-xl text-xs font-bold transition-colors shadow-md cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              + File Work Report
            </button>
          )}
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-6 py-3.5">Ref #</th>
                <th className="px-6 py-3.5">Report Title</th>
                <th className="px-6 py-3.5">Agent</th>
                <th className="px-6 py-3.5">Activity Type</th>
                <th className="px-6 py-3.5 text-center">Prospects</th>
                <th className="px-6 py-3.5 text-center">Meetings</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                    <Filter className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    No work reports found matching the criteria.
                  </td>
                </tr>
              ) : (
                filteredReports.map((report) => (
                  <tr key={report.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-slate-800">
                      {report.referenceNumber}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900 max-w-xs truncate">
                      {report.title}
                      <div className="text-[10px] text-slate-400 font-normal">
                        Date: {report.activityDate}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-700 font-medium">
                      {report.agentName}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold text-[11px]">
                        {report.activityType}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-slate-900">
                      {report.prospectsContacted}
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-slate-900">
                      {report.meetingsConducted}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={report.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setActiveReport(report)}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-[#E52320] text-white font-bold rounded-lg transition-colors cursor-pointer text-xs"
                      >
                        Inspect Report
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* REPORT INSPECTION & VERIFICATION MODAL */}
      {activeReport && (
        <Modal
          isOpen={!!activeReport}
          onClose={() => { setActiveReport(null); setActionStatus(null); }}
          title={`Work Report: ${activeReport.referenceNumber}`}
          subtitle={`Submitted by ${activeReport.agentName} on ${new Date(activeReport.submittedAt).toLocaleDateString()}`}
          maxWidth="2xl"
        >
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Report Status</span>
                <StatusBadge status={activeReport.status} size="md" />
              </div>

              {/* Admin Verification Decision Buttons */}
              {currentRole === 'Admin' && activeReport.status !== 'Verified' && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActionStatus('Needs Revision')}
                    className="px-3 py-1.5 bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200 rounded-lg font-bold cursor-pointer"
                  >
                    Request Revision
                  </button>
                  <button
                    onClick={() => setActionStatus('Rejected')}
                    className="px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-lg font-bold cursor-pointer"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => setActionStatus('Verified')}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Verify Report
                  </button>
                </div>
              )}
            </div>

            {/* Metrics Ribbon */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Prospects Contacted</span>
                <span className="text-xl font-black text-slate-900">{activeReport.prospectsContacted}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Meetings Held</span>
                <span className="text-xl font-black text-slate-900">{activeReport.meetingsConducted}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Recruits Formally Filed</span>
                <span className="text-xl font-black text-slate-900">{activeReport.recruitsSubmittedCount}</span>
              </div>
            </div>

            {/* Content Breakdown */}
            <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3">
              <div>
                <span className="font-bold text-slate-700 uppercase text-[10px] block mb-1">Activity Description</span>
                <p className="text-slate-800 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  {activeReport.activityDescription}
                </p>
              </div>

              <div>
                <span className="font-bold text-slate-700 uppercase text-[10px] block mb-1">Key Outcomes & Results</span>
                <p className="text-slate-800 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  {activeReport.outcomes || 'No special outcomes noted.'}
                </p>
              </div>

              <div>
                <span className="font-bold text-slate-700 uppercase text-[10px] block mb-1">Field Challenges Encountered</span>
                <p className="text-slate-800 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  {activeReport.challenges || 'No critical bottlenecks encountered.'}
                </p>
              </div>

              <div>
                <span className="font-bold text-slate-700 uppercase text-[10px] block mb-1">Next Follow-Up Steps</span>
                <p className="text-slate-800 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  {activeReport.nextSteps || 'Standard territory schedule.'}
                </p>
              </div>
            </div>

            {/* Admin Review Note if any */}
            {activeReport.reviewComment && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                <span className="font-bold text-emerald-900 block mb-1">
                  Admin Verification Review ({activeReport.reviewedByAdminName || 'Carlos Mendoza'}):
                </span>
                <p className="text-emerald-800 italic">
                  "{activeReport.reviewComment}"
                </p>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* CONFIRM VERIFY / REJECT ACTION MODAL */}
      {actionStatus && activeReport && (
        <Modal
          isOpen={!!actionStatus}
          onClose={() => setActionStatus(null)}
          title={`Confirm Action: ${actionStatus}`}
          subtitle={`Report #${activeReport.referenceNumber} by ${activeReport.agentName}`}
          maxWidth="md"
        >
          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Admin Review Comment / Verification Note *
              </label>
              <textarea
                required
                rows={3}
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Enter feedback or validation rationale..."
                className="w-full p-2.5 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-[#E52320]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActionStatus(null)}
                className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmittingReview || !reviewComment.trim()}
                onClick={handleConfirmReview}
                className="px-4 py-2 bg-[#E52320] hover:bg-[#c91d1a] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
              >
                {isSubmittingReview ? 'Recording Decision...' : 'Confirm Status Update'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* SUBMIT WORK REPORT MODAL (AGENT ONLY) */}
      {showSubmitModal && (
        <Modal
          isOpen={showSubmitModal}
          onClose={() => {
            setShowSubmitModal(false);
            if (onCloseSubmitModal) onCloseSubmitModal();
          }}
          title="Submit Field Activity Work Report"
          subtitle="Document your weekly recruitment activities, meetings, and prospect discussions."
          maxWidth="2xl"
        >
          <form onSubmit={handleSubmitReport} className="space-y-4 text-xs">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Report Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Weekly Field Recruitment - Fairview & Novaliches Corridors"
                className="w-full p-2.5 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-[#E52320]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Activity Date
                </label>
                <input
                  type="date"
                  value={activityDate}
                  onChange={(e) => setActivityDate(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-[#E52320]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Period Start
                </label>
                <input
                  type="date"
                  value={periodStart}
                  onChange={(e) => setPeriodStart(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-[#E52320]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Period End
                </label>
                <input
                  type="date"
                  value={periodEnd}
                  onChange={(e) => setPeriodEnd(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-[#E52320]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Activity Type
                </label>
                <select
                  value={activityType}
                  onChange={(e: any) => setActivityType(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-[#E52320]"
                >
                  <option value="Field Pitching">Field Pitching</option>
                  <option value="Franchise Seminar">Franchise Seminar</option>
                  <option value="Client Follow-Up">Client Follow-Up</option>
                  <option value="Site Inspection">Site Inspection</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Prospects Contacted
                </label>
                <input
                  type="number"
                  min={0}
                  value={prospectsContacted}
                  onChange={(e) => setProspectsContacted(parseInt(e.target.value || '0', 10))}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-[#E52320]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Meetings Conducted
                </label>
                <input
                  type="number"
                  min={0}
                  value={meetingsConducted}
                  onChange={(e) => setMeetingsConducted(parseInt(e.target.value || '0', 10))}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-[#E52320]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Recruits Submitted
                </label>
                <input
                  type="number"
                  min={0}
                  value={recruitsSubmittedCount}
                  onChange={(e) => setRecruitsSubmittedCount(parseInt(e.target.value || '0', 10))}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-[#E52320]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Detailed Activity Description *
              </label>
              <textarea
                required
                rows={3}
                value={activityDescription}
                onChange={(e) => setActivityDescription(e.target.value)}
                placeholder="Describe which corridors, commercial spots, or sari-sari stores were visited..."
                className="w-full p-2.5 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-[#E52320]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Outcomes & Lead Generation
                </label>
                <textarea
                  rows={2}
                  value={outcomes}
                  onChange={(e) => setOutcomes(e.target.value)}
                  placeholder="Key responses, prospective sign-ups..."
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-[#E52320]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Challenges Encountered
                </label>
                <textarea
                  rows={2}
                  value={challenges}
                  onChange={(e) => setChallenges(e.target.value)}
                  placeholder="e.g. Electric submeter hesitation, competitor ice cream kiosks..."
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-[#E52320]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Next Steps & Follow-Up Targets
              </label>
              <input
                type="text"
                value={nextSteps}
                onChange={(e) => setNextSteps(e.target.value)}
                placeholder="e.g. Schedule Saturday meeting with sari-sari cooperative president..."
                className="w-full p-2.5 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-[#E52320]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setShowSubmitModal(false);
                  if (onCloseSubmitModal) onCloseSubmitModal();
                }}
                className="px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingReport}
                className="px-5 py-2.5 bg-[#E52320] hover:bg-[#c91d1a] text-white rounded-xl text-xs font-bold transition-colors shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                {isSubmittingReport ? 'Submitting Work Report...' : 'Transmit Report to Admin'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
