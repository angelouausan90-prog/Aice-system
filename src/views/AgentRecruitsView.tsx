/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Recruit, AgentProfile } from '../types.ts';
import { StatusBadge } from '../components/StatusBadge.tsx';
import { Modal } from '../components/Modal.tsx';
import { 
  UserPlus, 
  Search, 
  Filter, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  Upload, 
  Send,
  History,
  Lock,
  Calendar,
  AlertCircle,
  MapPin,
  Store
} from 'lucide-react';

interface AgentRecruitsViewProps {
  agentProfile: AgentProfile;
  recruits: Recruit[];
  onSubmitRecruit: (formData: any) => Promise<void>;
  onResubmitRecruit: (recruitId: string, updateData: any) => Promise<void>;
  isSubmitModalOpenInitially?: boolean;
  onCloseSubmitModal?: () => void;
}

export const AgentRecruitsView: React.FC<AgentRecruitsViewProps> = ({
  agentProfile,
  recruits,
  onSubmitRecruit,
  onResubmitRecruit,
  isSubmitModalOpenInitially = false,
  onCloseSubmitModal,
}) => {
  const [showSubmitModal, setShowSubmitModal] = useState(isSubmitModalOpenInitially);
  const [selectedRecruit, setSelectedRecruit] = useState<Recruit | null>(null);
  const [showResubmitModal, setShowResubmitModal] = useState(false);

  // Search & filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Submit Form State
  const [prospectName, setProspectName] = useState('');
  const [phone, setPhone] = useState('+63 9');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('Metro Manila');
  const [storeName, setStoreName] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [contactMethod, setContactMethod] = useState<'Phone Call' | 'WhatsApp/Viber' | 'Email' | 'In-Person'>('Phone Call');
  const [packageInterest, setPackageInterest] = useState<'Pocket Store' | 'Standard Kiosk' | 'Commercial Parlor' | 'Mobile Cart'>('Pocket Store');
  const [source, setSource] = useState<'Direct Field Canvassing' | 'Social Media Inquiry' | 'Referral' | 'Local Trade Fair'>('Direct Field Canvassing');
  const [contactDate, setContactDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [interestLevel, setInterestLevel] = useState<'High' | 'Moderate' | 'Evaluating'>('High');
  const [nextFollowUp, setNextFollowUp] = useState('');
  const [consentConfirmed, setConsentConfirmed] = useState(false);
  const [evidenceDescription, setEvidenceDescription] = useState('Storefront photo & business permit');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Resubmit Form State
  const [resubmitNotes, setResubmitNotes] = useState('');
  const [resubmitComment, setResubmitComment] = useState('');
  const [resubmitFollowUp, setResubmitFollowUp] = useState('');
  const [isResubmitting, setIsResubmitting] = useState(false);

  // Filter only this Agent's recruits (Agents can NEVER see other Agents' private leads)
  const myRecruits = recruits.filter((r) => r.agentId === agentProfile.id);

  const filteredRecruits = myRecruits.filter((r) => {
    const matchesSearch = 
      r.prospectFullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.referenceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.city.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleSubmitNewRecruit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!consentConfirmed) {
      setSubmitError('You must confirm applicant privacy consent under RA 10173 to submit.');
      return;
    }

    if (!phone || phone.length < 10) {
      setSubmitError('Please enter a valid Philippine contact number.');
      return;
    }

    setIsSubmitting(true);

    try {
      const attachments = [
        {
          id: `att-${Date.now()}`,
          recruitId: '',
          uploadedByUserId: agentProfile.userId,
          originalFilename: `${prospectName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_storefront.jpg`,
          mimeType: 'image/jpeg',
          fileSize: 312000,
          description: evidenceDescription,
          createdAt: new Date().toISOString(),
        }
      ];

      await onSubmitRecruit({
        agentId: agentProfile.id,
        agentName: agentProfile.fullName,
        prospectFullName: prospectName,
        phone,
        email,
        city,
        province,
        storeName: storeName || `Aice Store - ${city} (${prospectName.split(' ')[0]})`,
        businessAddress: businessAddress || `${city}, ${province}`,
        preferredContactMethod: contactMethod,
        businessInterest: packageInterest,
        recruitmentSource: source,
        initialContactDate: contactDate,
        salesConversationNotes: notes,
        prospectInterestLevel: interestLevel,
        nextFollowUpDate: nextFollowUp,
        prospectConsentConfirmed: true,
        attachments,
      });

      // Reset form
      setShowSubmitModal(false);
      if (onCloseSubmitModal) onCloseSubmitModal();
      setProspectName('');
      setPhone('+63 9');
      setEmail('');
      setCity('');
      setStoreName('');
      setBusinessAddress('');
      setNotes('');
      setConsentConfirmed(false);
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to submit recruit. Check for duplicate numbers.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenResubmit = (recruit: Recruit) => {
    setSelectedRecruit(recruit);
    setResubmitNotes(recruit.salesConversationNotes);
    setResubmitFollowUp(recruit.nextFollowUpDate || '');
    setResubmitComment('');
    setShowResubmitModal(true);
  };

  const handleResubmitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecruit) return;
    setIsResubmitting(true);

    try {
      await onResubmitRecruit(selectedRecruit.id, {
        salesConversationNotes: resubmitNotes,
        nextFollowUpDate: resubmitFollowUp,
        agentComment: resubmitComment || 'Resubmitted with requested revisions and supplemental evidence.',
        attachments: [
          {
            id: `att-resub-${Date.now()}`,
            recruitId: selectedRecruit.id,
            uploadedByUserId: agentProfile.userId,
            originalFilename: 'supplemental_lease_proof.pdf',
            mimeType: 'application/pdf',
            fileSize: 420000,
            description: 'Supplemental Lease & Electrical Documentation',
            createdAt: new Date().toISOString(),
          }
        ]
      });

      setShowResubmitModal(false);
      setSelectedRecruit(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsResubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and New Recruit Button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">
            My Prospective Recruits ({myRecruits.length})
          </h2>
          <p className="text-xs text-slate-500">
            Manage your prospective franchisee dossiers, track Admin review decisions, and resubmit revisions
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search my leads..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#E52320]"
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

          {/* Submit Action */}
          <button
            onClick={() => setShowSubmitModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#E52320] hover:bg-[#c91d1a] text-white rounded-xl text-xs font-bold transition-colors shadow-md cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            + Submit New Recruit
          </button>
        </div>
      </div>

      {/* Recruits List Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-6 py-3.5">Ref #</th>
                <th className="px-6 py-3.5">Prospect Name</th>
                <th className="px-6 py-3.5">Location</th>
                <th className="px-6 py-3.5">Target Package</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Latest Admin Feedback</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecruits.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    <Filter className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    No recruits match your search criteria.
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
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-[11px]">
                        {recruit.businessInterest}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={recruit.status} />
                    </td>
                    <td className="px-6 py-4 max-w-xs truncate">
                      {recruit.status === 'Needs Revision' ? (
                        <span className="text-orange-700 font-semibold flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                          <span className="truncate">{recruit.latestReviewComment || 'Revision requested'}</span>
                        </span>
                      ) : recruit.status === 'Rejected' ? (
                        <span className="text-rose-600 font-medium truncate block">
                          Reason: {recruit.rejectionReason || 'Did not meet criteria'}
                        </span>
                      ) : recruit.latestReviewComment ? (
                        <span className="text-slate-600 truncate block">
                          "{recruit.latestReviewComment}"
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Awaiting Admin decision</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => setSelectedRecruit(recruit)}
                        className="px-2.5 py-1 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg cursor-pointer"
                      >
                        Details
                      </button>

                      {recruit.status === 'Needs Revision' && (
                        <button
                          onClick={() => handleOpenResubmit(recruit)}
                          className="px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer"
                        >
                          Resubmit
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SUBMIT NEW RECRUIT MODAL */}
      {showSubmitModal && (
        <Modal
          isOpen={showSubmitModal}
          onClose={() => {
            setShowSubmitModal(false);
            if (onCloseSubmitModal) onCloseSubmitModal();
          }}
          title="Submit Prospective Franchisee"
          subtitle="Agent Field Submission Form • Automatically signed and attributed to Maria Reyes"
          maxWidth="2xl"
        >
          <form onSubmit={handleSubmitNewRecruit} className="space-y-4 text-xs">
            {submitError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{submitError}</span>
              </div>
            )}

            {/* Prospect Information */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                1. Prospect Information
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Full Legal Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={prospectName}
                    onChange={(e) => setProspectName(e.target.value)}
                    placeholder="e.g. Juanita Del Rosario"
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-[#E52320]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Contact Number (Phone / Mobile) *
                  </label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+63 917 123 4567"
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 font-mono focus:ring-2 focus:ring-[#E52320]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Email Address (Optional)
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. juanita@gmail.com"
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-[#E52320]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Preferred Contact Channel
                  </label>
                  <select
                    value={contactMethod}
                    onChange={(e: any) => setContactMethod(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-[#E52320]"
                  >
                    <option value="Phone Call">Phone Call</option>
                    <option value="WhatsApp/Viber">WhatsApp / Viber</option>
                    <option value="Email">Email</option>
                    <option value="In-Person">In-Person Site Meeting</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    City / Municipality *
                  </label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Quezon City, Cebu City, Davao"
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-[#E52320]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Province
                  </label>
                  <input
                    type="text"
                    value={province}
                    onChange={(e) => setProvince(e.target.value)}
                    placeholder="e.g. Metro Manila, Cebu, Laguna"
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-[#E52320]"
                  />
                </div>

                <div className="col-span-1 sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Proposed Store / Business Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    placeholder="e.g. Aice Store - Fairview Ayala Hub"
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-[#E52320]"
                  />
                </div>

                <div className="col-span-1 sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Storefront Physical Street Address *
                  </label>
                  <input
                    type="text"
                    required
                    value={businessAddress}
                    onChange={(e) => setBusinessAddress(e.target.value)}
                    placeholder="e.g. 128 Commonwealth Ave, Brgy. Holy Spirit"
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-[#E52320]"
                  />
                  <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1 font-medium">
                    <MapPin className="w-3 h-3 text-[#E52320] shrink-0" />
                    When approved by Admin, this registered location will automatically appear on the live Franchise Map Tracker.
                  </p>
                </div>
              </div>
            </div>

            {/* Franchise Recruitment Details */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                2. Franchise Package & Field Pitch Notes
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Intended Franchise Package *
                  </label>
                  <select
                    value={packageInterest}
                    onChange={(e: any) => setPackageInterest(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-[#E52320]"
                  >
                    <option value="Pocket Store">Pocket Store (Sari-Sari / 1 Freezer)</option>
                    <option value="Standard Kiosk">Standard Kiosk (Mall / Strip 2-3 Freezers)</option>
                    <option value="Commercial Parlor">Commercial Parlor (4+ Freezers)</option>
                    <option value="Mobile Cart">Mobile Cart / Event Dispenser</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Recruitment Source
                  </label>
                  <select
                    value={source}
                    onChange={(e: any) => setSource(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-[#E52320]"
                  >
                    <option value="Direct Field Canvassing">Direct Field Canvassing</option>
                    <option value="Social Media Inquiry">Social Media Inquiry</option>
                    <option value="Referral">Existing Franchisee Referral</option>
                    <option value="Local Trade Fair">Local Trade / Food Expo</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Interest Level
                  </label>
                  <select
                    value={interestLevel}
                    onChange={(e: any) => setInterestLevel(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-[#E52320]"
                  >
                    <option value="High">High - Ready Capital & Location</option>
                    <option value="Moderate">Moderate - Evaluating electrical specs</option>
                    <option value="Evaluating">Evaluating - Needs follow-up call</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Sales Conversation & Commercial Space Notes *
                </label>
                <textarea
                  required
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Detail the location foot-traffic (e.g. proximity to schools, churches, market), proposed submeter, capitalization status, and applicant questions..."
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-[#E52320]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Initial Contact Date
                  </label>
                  <input
                    type="date"
                    value={contactDate}
                    onChange={(e) => setContactDate(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-[#E52320]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Next Follow-up Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={nextFollowUp}
                    onChange={(e) => setNextFollowUp(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-[#E52320]"
                  />
                </div>
              </div>
            </div>

            {/* Evidence & Consent Checkbox */}
            <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-3">
              <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5 text-slate-400" />
                3. Supporting Evidence & Verification Documents
              </h4>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Attached Evidence Description:
                </label>
                <input
                  type="text"
                  value={evidenceDescription}
                  onChange={(e) => setEvidenceDescription(e.target.value)}
                  placeholder="e.g. Storefront photo, Barangay clearance, Lease intent"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consentConfirmed}
                    onChange={(e) => setConsentConfirmed(e.target.checked)}
                    className="mt-0.5 w-4 h-4 text-[#E52320] rounded border-slate-300 focus:ring-[#E52320]"
                  />
                  <span className="text-[11px] text-emerald-950 leading-relaxed font-medium">
                    <strong>Mandatory Privacy Consent (RA 10173):</strong> I certify that the prospective franchisee has explicitly authorized and consented to the collection and submission of their contact information and site details for Aice franchise evaluation and administrative verification.
                  </span>
                </label>
              </div>
            </div>

            {/* Submit Action */}
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
                disabled={isSubmitting || !consentConfirmed}
                className="px-5 py-2.5 bg-[#E52320] hover:bg-[#c91d1a] text-white rounded-xl text-xs font-bold transition-colors shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                {isSubmitting ? 'Transmitting Dossier...' : 'Submit to Admin Queue'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* INSPECT DETAILS MODAL */}
      {selectedRecruit && !showResubmitModal && (
        <Modal
          isOpen={!!selectedRecruit}
          onClose={() => setSelectedRecruit(null)}
          title={`Recruit Record: ${selectedRecruit.prospectFullName}`}
          subtitle={`Reference: ${selectedRecruit.referenceNumber} • Status: ${selectedRecruit.status}`}
          maxWidth="lg"
        >
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="font-bold text-slate-700">Verification Status</span>
              <StatusBadge status={selectedRecruit.status} size="md" />
            </div>

            {selectedRecruit.latestReviewComment && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                <span className="font-bold text-amber-900 block mb-1">
                  Admin Review Note ({selectedRecruit.reviewingAdminName || 'Carlos Mendoza'}):
                </span>
                <p className="text-amber-800 italic">
                  "{selectedRecruit.latestReviewComment}"
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 p-3 bg-white border border-slate-200 rounded-xl">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Contact Number</span>
                <span className="font-bold text-slate-900">{selectedRecruit.phone}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Email</span>
                <span className="font-medium text-slate-800">{selectedRecruit.email || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Target Location</span>
                <span className="font-bold text-slate-900">{selectedRecruit.city}, {selectedRecruit.province}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Package</span>
                <span className="font-bold text-slate-900">{selectedRecruit.businessInterest}</span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-slate-500 block text-[10px] uppercase mb-1">Field Pitch Notes:</span>
              <p className="text-slate-800 italic">
                "{selectedRecruit.salesConversationNotes}"
              </p>
            </div>

            {/* Audit Status History */}
            <div className="p-3 bg-white border border-slate-200 rounded-xl">
              <h4 className="text-[11px] font-bold text-slate-700 uppercase mb-2 flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-slate-400" />
                Status History Log
              </h4>
              <div className="space-y-1.5">
                {selectedRecruit.statusHistory.map((sh) => (
                  <div key={sh.id} className="p-2 rounded bg-slate-50 text-[11px]">
                    <div className="flex justify-between text-slate-500 text-[10px]">
                      <span>{sh.changedByUserName}</span>
                      <span>{new Date(sh.createdAt).toLocaleString()}</span>
                    </div>
                    <div className="font-semibold text-slate-800 mt-0.5">{sh.newStatus}: "{sh.comment}"</div>
                  </div>
                ))}
              </div>
            </div>

            {selectedRecruit.status === 'Needs Revision' && (
              <button
                onClick={() => handleOpenResubmit(selectedRecruit)}
                className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Open Revision Editor & Resubmit
              </button>
            )}
          </div>
        </Modal>
      )}

      {/* RESUBMIT MODAL (WHEN NEEDS REVISION) */}
      {showResubmitModal && selectedRecruit && (
        <Modal
          isOpen={showResubmitModal}
          onClose={() => setShowResubmitModal(false)}
          title={`Correct & Resubmit: ${selectedRecruit.prospectFullName}`}
          subtitle={`Reference: ${selectedRecruit.referenceNumber}`}
          maxWidth="md"
        >
          <form onSubmit={handleResubmitSubmit} className="space-y-4 text-xs">
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-xl text-orange-900">
              <div className="font-bold mb-1">Admin Revision Instructions:</div>
              <p className="italic">"{selectedRecruit.latestReviewComment}"</p>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Updated Sales Conversation & Site Notes *
              </label>
              <textarea
                required
                rows={4}
                value={resubmitNotes}
                onChange={(e) => setResubmitNotes(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-[#E52320]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Agent Resubmission Explanation Note *
              </label>
              <textarea
                required
                rows={2}
                value={resubmitComment}
                onChange={(e) => setResubmitComment(e.target.value)}
                placeholder="Explain what has been updated or attached..."
                className="w-full p-2.5 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-[#E52320]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowResubmitModal(false)}
                className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isResubmitting}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
              >
                {isResubmitting ? 'Submitting Revisions...' : 'Resubmit for Admin Review'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
