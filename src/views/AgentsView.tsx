/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AgentProfile } from '../types.ts';
import { StatusBadge } from '../components/StatusBadge.tsx';
import { Modal } from '../components/Modal.tsx';
import { Users, Plus, Search, MapPin, Phone, Mail, Award, Coins, FileCheck2 } from 'lucide-react';

interface AgentsViewProps {
  agents: AgentProfile[];
  onAddAgent: (data: any) => Promise<void>;
}

export const AgentsView: React.FC<AgentsViewProps> = ({
  agents,
  onAddAgent,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<AgentProfile | null>(null);

  // Form
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [contactNumber, setContactNumber] = useState('+63 9');
  const [assignedTerritory, setAssignedTerritory] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filtered = agents.filter(a =>
    a.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.assignedTerritory.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await onAddAgent({
        fullName,
        email,
        contactNumber,
        assignedTerritory,
      });

      setShowAddModal(false);
      setFullName('');
      setEmail('');
      setContactNumber('+63 9');
      setAssignedTerritory('');
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
            Recruitment Agents ({agents.length})
          </h2>
          <p className="text-xs text-slate-500">
            Authorized regional field recruiters and territory performance management
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search agent or territory..."
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
            + Register Agent
          </button>
        </div>
      </div>

      {/* Agents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((agent) => (
          <div
            key={agent.id}
            onClick={() => setSelectedAgent(agent)}
            className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  Field Recruiter
                </span>
                <StatusBadge status={agent.accountStatus} />
              </div>

              <h3 className="font-bold text-slate-900 group-hover:text-[#E52320] transition-colors">
                {agent.fullName}
              </h3>

              <div className="mt-2.5 space-y-1.5 text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="font-semibold text-slate-700">{agent.assignedTerritory}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="font-mono">{agent.contactNumber}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-center text-xs">
              <div>
                <span className="text-[10px] text-slate-400 uppercase block">Approved</span>
                <span className="font-black text-emerald-600">{agent.approvedRecruitsCount}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase block">Submitted</span>
                <span className="font-black text-slate-800">{agent.recruitsSubmittedCount}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase block">Reports</span>
                <span className="font-black text-indigo-600">{agent.verifiedReportsCount}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* REGISTER AGENT MODAL */}
      {showAddModal && (
        <Modal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          title="Register New Field Recruitment Agent"
          subtitle="Provisions official agent credentials and assigns operational territory."
          maxWidth="md"
        >
          <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Agent Full Name *
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Roberto De Leon"
                className="w-full p-2.5 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-[#E52320]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Official Email Address *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. roberto.deleon@aice.ph"
                className="w-full p-2.5 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-[#E52320]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Mobile Contact Number *
              </label>
              <input
                type="text"
                required
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                placeholder="+63 917 123 4567"
                className="w-full p-2.5 border border-slate-300 rounded-xl text-xs text-slate-900 font-mono focus:ring-2 focus:ring-[#E52320]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Assigned Recruitment Territory *
              </label>
              <input
                type="text"
                required
                value={assignedTerritory}
                onChange={(e) => setAssignedTerritory(e.target.value)}
                placeholder="e.g. Cavite & Southern Tagalog"
                className="w-full p-2.5 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-[#E52320]"
              />
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
                {isSubmitting ? 'Registering Agent...' : 'Create Agent Account'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
