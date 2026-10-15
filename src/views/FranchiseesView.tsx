/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { FranchiseeProfile } from '../types.ts';
import { StatusBadge } from '../components/StatusBadge.tsx';
import { FranchiseLocationMap } from '../components/FranchiseLocationMap.tsx';
import { Modal } from '../components/Modal.tsx';
import { Store, Search, Plus, MapPin, Phone, Mail, Calendar, CheckCircle2, LayoutGrid, Map as MapIcon } from 'lucide-react';

interface FranchiseesViewProps {
  franchisees: FranchiseeProfile[];
  onAddFranchisee: (data: any) => Promise<void>;
}

export const FranchiseesView: React.FC<FranchiseesViewProps> = ({
  franchisees,
  onAddFranchisee,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedFranchisee, setSelectedFranchisee] = useState<FranchiseeProfile | null>(null);
  const [viewMode, setViewMode] = useState<'CARDS' | 'MAP'>('CARDS');

  // Form State
  const [franchiseName, setFranchiseName] = useState('');
  const [representativeName, setRepresentativeName] = useState('');
  const [email, setEmail] = useState('');
  const [contactNumber, setContactNumber] = useState('+63 9');
  const [businessAddress, setBusinessAddress] = useState('');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('Metro Manila');
  const [franchiseType, setFranchiseType] = useState<'Pocket Store' | 'Standard Kiosk' | 'Commercial Parlor' | 'Mobile Cart'>('Standard Kiosk');
  const [freezerUnitsCount, setFreezerUnitsCount] = useState(2);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filtered = franchisees.filter(f => 
    f.franchiseName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.representativeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await onAddFranchisee({
        franchiseName,
        representativeName,
        email,
        contactNumber,
        businessAddress,
        city,
        province,
        franchiseType,
        freezerUnitsCount,
        notes,
      });

      setShowAddModal(false);
      setFranchiseName('');
      setRepresentativeName('');
      setEmail('');
      setContactNumber('+63 9');
      setBusinessAddress('');
      setCity('');
      setNotes('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">
            Franchisees Directory ({franchisees.length})
          </h2>
          <p className="text-xs text-slate-500">
            Official Aice retail operators, commercial store locations, and assigned cold chain equipment
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Toggle: Cards or Map */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode('CARDS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'CARDS' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Cards
            </button>
            <button
              type="button"
              onClick={() => setViewMode('MAP')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'MAP' ? 'bg-[#E52320] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <MapIcon className="w-3.5 h-3.5" />
              Locations Map
            </button>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search store or partner..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-[#E52320]"
            />
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#E52320] hover:bg-[#c91d1a] text-white rounded-xl text-xs font-bold transition-colors shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            + Add Franchisee
          </button>
        </div>
      </div>

      {/* Conditionally render Interactive Map Tracker or Cards */}
      {viewMode === 'MAP' ? (
        <FranchiseLocationMap
          franchisees={franchisees}
          onSelectFranchisee={setSelectedFranchisee}
          height="560px"
        />
      ) : (
        /* Franchisees Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((franchise) => (
          <div
            key={franchise.id}
            onClick={() => setSelectedFranchisee(franchise)}
            className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                  {franchise.franchiseType}
                </span>
                <StatusBadge status={franchise.accountStatus} />
              </div>

              <h3 className="font-bold text-slate-900 group-hover:text-[#E52320] transition-colors line-clamp-1">
                {franchise.franchiseName}
              </h3>
              <p className="text-xs font-semibold text-slate-600 mt-0.5">
                {franchise.representativeName}
              </p>

              <div className="mt-3 space-y-1.5 text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{franchise.city}, {franchise.province}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="font-mono">{franchise.contactNumber}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Freezers: <strong className="text-slate-900">{franchise.freezerUnitsCount} Units</strong></span>
              <span className="text-[11px] font-medium text-emerald-600">Active Account</span>
            </div>
          </div>
        ))}
      </div>
      )}

      {/* ADD FRANCHISEE MODAL */}
      {showAddModal && (
        <Modal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          title="Direct Franchisee Account Creation"
          subtitle="Provision a certified Aice business partner account."
          maxWidth="lg"
        >
          <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Franchise Store / Outpost Name *
              </label>
              <input
                type="text"
                required
                value={franchiseName}
                onChange={(e) => setFranchiseName(e.target.value)}
                placeholder="e.g. Aice Ice Cream Hub - Commonwealth"
                className="w-full p-2.5 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-[#E52320]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Representative Name *
                </label>
                <input
                  type="text"
                  required
                  value={representativeName}
                  onChange={(e) => setRepresentativeName(e.target.value)}
                  placeholder="e.g. Teresa Santos"
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-[#E52320]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Contact Number *
                </label>
                <input
                  type="text"
                  required
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  placeholder="+63 917 123 4567"
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-[#E52320]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Official Business Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="franchise.hub@aice.ph"
                className="w-full p-2.5 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-[#E52320]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Physical Store Address *
              </label>
              <textarea
                required
                rows={2}
                value={businessAddress}
                onChange={(e) => setBusinessAddress(e.target.value)}
                placeholder="Street address, building, or market stall..."
                className="w-full p-2.5 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-[#E52320]"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  City *
                </label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Quezon City"
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-[#E52320]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Package
                </label>
                <select
                  value={franchiseType}
                  onChange={(e: any) => setFranchiseType(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-[#E52320]"
                >
                  <option value="Pocket Store">Pocket Store</option>
                  <option value="Standard Kiosk">Standard Kiosk</option>
                  <option value="Commercial Parlor">Commercial Parlor</option>
                  <option value="Mobile Cart">Mobile Cart</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Freezers Assigned
                </label>
                <input
                  type="number"
                  min={1}
                  max={12}
                  value={freezerUnitsCount}
                  onChange={(e) => setFreezerUnitsCount(parseInt(e.target.value || '1', 10))}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-[#E52320]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-[#E52320] hover:bg-[#c91d1a] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? 'Creating Franchisee Account...' : 'Save & Provision Account'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* FRANCHISEE DETAILS MODAL */}
      {selectedFranchisee && (
        <Modal
          isOpen={!!selectedFranchisee}
          onClose={() => setSelectedFranchisee(null)}
          title={selectedFranchisee.franchiseName}
          subtitle={`Representative: ${selectedFranchisee.representativeName}`}
          maxWidth="md"
        >
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="font-bold text-slate-700">Account Status</span>
              <StatusBadge status={selectedFranchisee.accountStatus} size="md" />
            </div>

            <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Franchise Package:</span>
                <span className="font-bold text-slate-900">{selectedFranchisee.franchiseType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Contact Number:</span>
                <span className="font-bold text-slate-900 font-mono">{selectedFranchisee.contactNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Email:</span>
                <span className="font-medium text-slate-900">{selectedFranchisee.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Freezer Units:</span>
                <span className="font-bold text-slate-900">{selectedFranchisee.freezerUnitsCount} Units</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Start Date:</span>
                <span className="font-medium text-slate-900">{selectedFranchisee.franchiseStartDate}</span>
              </div>
              {selectedFranchisee.createdFromRecruitmentId && (
                <div className="flex justify-between pt-2 border-t border-slate-100">
                  <span className="text-slate-500">Converted From Recruit:</span>
                  <span className="font-mono font-bold text-blue-600">#{selectedFranchisee.createdFromRecruitmentId}</span>
                </div>
              )}
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-400 uppercase text-[10px] block font-bold mb-1">Physical Location</span>
              <p className="text-slate-800">{selectedFranchisee.businessAddress}, {selectedFranchisee.city}, {selectedFranchisee.province}</p>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
