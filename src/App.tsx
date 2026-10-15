/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  User, FranchiseeProfile, AgentProfile, Recruit, AgentWorkReport, 
  Product, ProductCategory, Supplier, InventoryMovement, 
  SupplyRequest, InAppNotification, AuditLog, SystemAnnouncement, UserRole 
} from './types.ts';
import { Navbar } from './components/Navbar.tsx';
import { Sidebar } from './components/Sidebar.tsx';
import { LoginView } from './views/LoginView.tsx';
import { AdminDashboard } from './views/AdminDashboard.tsx';
import { RecruitmentQueueView } from './views/RecruitmentQueueView.tsx';
import { AgentDashboard } from './views/AgentDashboard.tsx';
import { AgentRecruitsView } from './views/AgentRecruitsView.tsx';
import { WorkReportsView } from './views/WorkReportsView.tsx';
import { FranchiseesView } from './views/FranchiseesView.tsx';
import { AgentsView } from './views/AgentsView.tsx';
import { ProductsInventoryView } from './views/ProductsInventoryView.tsx';
import { SupplyRequestsView } from './views/SupplyRequestsView.tsx';
import { FranchiseeDashboardView } from './views/FranchiseeDashboardView.tsx';
import { AiIntelligenceView } from './views/AiIntelligenceView.tsx';
import { FranchiseLocationMap } from './components/FranchiseLocationMap.tsx';
import { ReportsAnalyticsView } from './views/ReportsAnalyticsView.tsx';
import { AuditLogsView } from './views/AuditLogsView.tsx';
import { SqlExportView } from './views/SqlExportView.tsx';

export default function App() {
  // Authentication State
  const [currentUser, setCurrentUser] = useState<User | null>({
    id: 'usr-admin-1',
    username: 'admin',
    email: 'admin@aice.ph',
    fullName: 'Carlos Mendoza',
    role: 'Admin',
    accountStatus: 'Active',
    createdAt: '2026-01-10T08:00:00.000Z',
    updatedAt: new Date().toISOString(),
  });
  const [currentAgentProfile, setCurrentAgentProfile] = useState<AgentProfile | null>(null);
  const [currentFranchiseProfile, setCurrentFranchiseProfile] = useState<FranchiseeProfile | null>(null);

  // App Navigation
  const [activeTab, setActiveTab] = useState('admin-dashboard');

  // Shared Data State
  const [recruits, setRecruits] = useState<Recruit[]>([]);
  const [workReports, setWorkReports] = useState<AgentWorkReport[]>([]);
  const [franchisees, setFranchisees] = useState<FranchiseeProfile[]>([]);
  const [agents, setAgents] = useState<AgentProfile[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [inventoryMovements, setInventoryMovements] = useState<InventoryMovement[]>([]);
  const [supplyRequests, setSupplyRequests] = useState<SupplyRequest[]>([]);
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [announcements, setAnnouncements] = useState<SystemAnnouncement[]>([]);

  // Selection states across views
  const [selectedRecruitInitial, setSelectedRecruitInitial] = useState<Recruit | null>(null);
  const [selectedMapFranchiseeId, setSelectedMapFranchiseeId] = useState<string | null>(null);
  const [isSubmitRecruitOpen, setIsSubmitRecruitOpen] = useState(false);
  const [isSubmitReportOpen, setIsSubmitReportOpen] = useState(false);
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);

  // Fetch initial data
  const refreshAllData = async () => {
    try {
      const [
        recruitsRes, reportsRes, franchiseesRes, agentsRes, 
        productsRes, categoriesRes, suppliersRes, movementsRes, 
        requestsRes, notificationsRes, logsRes, announcementsRes
      ] = await Promise.all([
        fetch('/api/recruits').then(r => r.json()),
        fetch('/api/work-reports').then(r => r.json()),
        fetch('/api/franchisees').then(r => r.json()),
        fetch('/api/agents').then(r => r.json()),
        fetch('/api/products').then(r => r.json()),
        fetch('/api/categories').then(r => r.json()),
        fetch('/api/suppliers').then(r => r.json()),
        fetch('/api/inventory/movements').then(r => r.json()),
        fetch('/api/supply-requests').then(r => r.json()),
        fetch('/api/notifications').then(r => r.json()),
        fetch('/api/audit-logs').then(r => r.json()),
        fetch('/api/announcements').then(r => r.json()),
      ]);

      setRecruits(recruitsRes || []);
      setWorkReports(reportsRes || []);
      setFranchisees(franchiseesRes || []);
      setAgents(agentsRes || []);
      setProducts(productsRes || []);
      setCategories(categoriesRes || []);
      setSuppliers(suppliersRes || []);
      setInventoryMovements(movementsRes || []);
      setSupplyRequests(requestsRes || []);
      setNotifications(notificationsRes || []);
      setAuditLogs(logsRes || []);
      setAnnouncements(announcementsRes || []);
    } catch (err) {
      console.error('Failed to load initial data:', err);
    }
  };

  useEffect(() => {
    refreshAllData();
  }, []);

  // Update current profiles when user changes
  useEffect(() => {
    if (!currentUser) {
      setCurrentAgentProfile(null);
      setCurrentFranchiseProfile(null);
      return;
    }

    if (currentUser.role === 'Agent') {
      const found = agents.find(a => a.userId === currentUser.id);
      setCurrentAgentProfile(found || agents[0] || null);
    } else if (currentUser.role === 'Franchisee') {
      const found = franchisees.find(f => f.userId === currentUser.id);
      setCurrentFranchiseProfile(found || franchisees[0] || null);
    }
  }, [currentUser, agents, franchisees]);

  // Handler for Role Switching in UI
  const handleSwitchRole = (role: UserRole) => {
    if (role === 'Admin') {
      setCurrentUser({
        id: 'usr-admin-1',
        username: 'admin',
        email: 'admin@aice.ph',
        fullName: 'Carlos Mendoza',
        role: 'Admin',
        accountStatus: 'Active',
        createdAt: '2026-01-10T08:00:00.000Z',
        updatedAt: new Date().toISOString(),
      });
      setActiveTab('admin-dashboard');
    } else if (role === 'Agent') {
      const agt = agents[0] || {
        id: 'agt-1',
        userId: 'usr-agent-1',
        fullName: 'Maria Reyes',
        email: 'agent.reyes@aice.ph',
        contactNumber: '+63 917 555 0192',
        assignedTerritory: 'Metro Manila & Rizal',
        accountStatus: 'Active',
        recruitsSubmittedCount: 14,
        approvedRecruitsCount: 8,
        rejectedRecruitsCount: 2,
        verifiedReportsCount: 12,
        commissionEarnedPhp: 120000,
        createdAt: '2026-01-15T09:30:00.000Z',
        updatedAt: new Date().toISOString(),
      };
      setCurrentUser({
        id: agt.userId,
        username: 'agent.reyes',
        email: agt.email,
        fullName: agt.fullName,
        role: 'Agent',
        accountStatus: 'Active',
        createdAt: '2026-01-15T09:30:00.000Z',
        updatedAt: new Date().toISOString(),
      });
      setCurrentAgentProfile(agt);
      setActiveTab('agent-dashboard');
    } else if (role === 'Franchisee') {
      const fran = franchisees[0] || {
        id: 'frn-1',
        userId: 'usr-fran-1',
        franchiseName: 'Aice Ice Cream Parlor - SM Fairview Hub',
        representativeName: 'Elena Valenzuela',
        contactNumber: '+63 920 333 1188',
        email: 'franchise.valenzuela@aice.ph',
        businessAddress: 'Ground Floor, Commercial Strip, SM City Fairview, Quirino Hwy',
        city: 'Quezon City',
        province: 'Metro Manila',
        franchiseType: 'Commercial Parlor' as const,
        franchiseStartDate: '2026-03-01',
        accountStatus: 'Active' as const,
        totalOrdersCount: 28,
        freezerUnitsCount: 4,
        createdAt: '2026-02-15T11:00:00.000Z',
        updatedAt: new Date().toISOString(),
      };
      setCurrentUser({
        id: fran.userId,
        username: 'franchise.valenzuela',
        email: fran.email,
        fullName: fran.representativeName,
        role: 'Franchisee',
        accountStatus: 'Active',
        createdAt: '2026-02-15T11:00:00.000Z',
        updatedAt: new Date().toISOString(),
      });
      setCurrentFranchiseProfile(fran);
      setActiveTab('franchisee-dashboard');
    }
  };

  const handleLoginSuccess = (user: User, agentProfile?: AgentProfile, franchiseProfile?: FranchiseeProfile) => {
    setCurrentUser(user);
    if (agentProfile) setCurrentAgentProfile(agentProfile);
    if (franchiseProfile) setCurrentFranchiseProfile(franchiseProfile);

    if (user.role === 'Admin') setActiveTab('admin-dashboard');
    else if (user.role === 'Agent') setActiveTab('agent-dashboard');
    else if (user.role === 'Franchisee') setActiveTab('franchisee-dashboard');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentAgentProfile(null);
    setCurrentFranchiseProfile(null);
  };

  // Actions
  const handleUpdateRecruitStatus = async (
    recruitId: string, 
    newStatus: string, 
    comment: string, 
    rejectionReason?: string,
    locationDetails?: { storeName?: string; businessAddress?: string }
  ) => {
    const res = await fetch(`/api/recruits/${recruitId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        newStatus,
        comment,
        rejectionReason,
        adminId: currentUser?.id,
        adminName: currentUser?.fullName,
        storeName: locationDetails?.storeName,
        businessAddress: locationDetails?.businessAddress,
      }),
    });
    if (!res.ok) throw new Error('Status update failed');
    await refreshAllData();
  };

  const handleResubmitRecruit = async (recruitId: string, updateData: any) => {
    const res = await fetch(`/api/recruits/${recruitId}/resubmit`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData),
    });
    if (!res.ok) throw new Error('Resubmit failed');
    await refreshAllData();
  };

  const handleConvertToFranchisee = async (recruit: Recruit, packageDetails: any) => {
    const res = await fetch('/api/franchisees', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        representativeName: recruit.prospectFullName,
        email: recruit.email,
        contactNumber: recruit.phone,
        city: recruit.city,
        province: recruit.province,
        createdFromRecruitmentId: recruit.id,
        ...packageDetails,
        adminId: currentUser?.id,
      }),
    });
    if (!res.ok) throw new Error('Franchisee onboarding failed');
    await refreshAllData();
  };

  const handleNavigateToMap = (franchiseeId?: string) => {
    setSelectedMapFranchiseeId(franchiseeId || null);
    setActiveTab('franchise-map');
  };

  const handleSubmitNewRecruit = async (formData: any) => {
    const res = await fetch('/api/recruits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to submit recruit');
    }
    await refreshAllData();
  };

  const handleSubmitWorkReport = async (formData: any) => {
    const res = await fetch('/api/work-reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    if (!res.ok) throw new Error('Failed to submit work report');
    await refreshAllData();
  };

  const handleVerifyWorkReport = async (reportId: string, newStatus: string, comment: string) => {
    const res = await fetch(`/api/work-reports/${reportId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        newStatus,
        comment,
        adminId: currentUser?.id,
        adminName: currentUser?.fullName,
      }),
    });
    if (!res.ok) throw new Error('Failed to verify work report');
    await refreshAllData();
  };

  const handleAddStockMovement = async (data: any) => {
    const res = await fetch('/api/inventory/movements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        userId: currentUser?.id,
        userName: currentUser?.fullName,
      }),
    });
    if (!res.ok) throw new Error('Failed to record stock movement');
    await refreshAllData();
  };

  const handleSubmitSupplyRequest = async (data: any) => {
    const res = await fetch('/api/supply-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to submit supply request');
    await refreshAllData();
  };

  const handleUpdateSupplyStatus = async (requestId: string, newStatus: string, reviewComment?: string, deliveryNotes?: string) => {
    const res = await fetch(`/api/supply-requests/${requestId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        newStatus,
        reviewComment,
        deliveryNotes,
        adminId: currentUser?.id,
        adminName: currentUser?.fullName,
      }),
    });
    if (!res.ok) throw new Error('Failed to update supply request');
    await refreshAllData();
  };

  const handleAddFranchisee = async (data: any) => {
    const res = await fetch('/api/franchisees', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, adminId: currentUser?.id }),
    });
    if (!res.ok) throw new Error('Failed to add franchisee');
    await refreshAllData();
  };

  const handleAddAgent = async (data: any) => {
    const res = await fetch('/api/agents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, adminId: currentUser?.id }),
    });
    if (!res.ok) throw new Error('Failed to add agent');
    await refreshAllData();
  };

  const handleMarkNotificationRead = async (id: string) => {
    await fetch(`/api/notifications/${id}/read`, { method: 'PUT' });
    setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const handleMarkAllNotificationsRead = async () => {
    await fetch('/api/notifications/read-all', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUser?.id }),
    });
    setNotifications(notifications.map(n => ({ ...n, isRead: true })));
  };

  if (!currentUser) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  // Pending counts for sidebar badges
  const pendingRecruitsCount = recruits.filter(r => r.status === 'Pending Verification').length;
  const pendingReportsCount = workReports.filter(w => w.status === 'Pending Review').length;
  const pendingSuppliesCount = supplyRequests.filter(s => s.status === 'Pending Review').length;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar
        currentUser={currentUser}
        notifications={notifications.filter(n => n.userId === currentUser.id || currentUser.role === 'Admin')}
        onLogout={handleLogout}
        onSwitchRole={handleSwitchRole}
        onMarkNotificationRead={handleMarkNotificationRead}
        onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Role-based Sidebar */}
        <Sidebar
          currentRole={currentUser.role}
          activeTab={activeTab}
          onTabChange={(tab) => {
            setActiveTab(tab);
            setSelectedRecruitInitial(null);
          }}
          pendingRecruitsCount={pendingRecruitsCount}
          pendingReportsCount={pendingReportsCount}
          pendingSuppliesCount={pendingSuppliesCount}
        />

        {/* Main Content Area */}
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
          {/* ADMIN VIEWS */}
          {currentUser.role === 'Admin' && (
            <>
              {activeTab === 'admin-dashboard' && (
                <AdminDashboard
                  franchisees={franchisees}
                  agents={agents}
                  recruits={recruits}
                  workReports={workReports}
                  products={products}
                  supplyRequests={supplyRequests}
                  onNavigate={setActiveTab}
                  onSelectRecruit={(r) => {
                    setSelectedRecruitInitial(r);
                    setActiveTab('recruits-queue');
                  }}
                  onSelectWorkReport={() => setActiveTab('work-reports')}
                />
              )}

              {activeTab === 'recruits-queue' && (
                <RecruitmentQueueView
                  recruits={recruits}
                  agents={agents}
                  onUpdateStatus={handleUpdateRecruitStatus}
                  onConvertToFranchisee={handleConvertToFranchisee}
                  onNavigateToMap={handleNavigateToMap}
                  selectedRecruitInitial={selectedRecruitInitial}
                  onClearSelectedRecruit={() => setSelectedRecruitInitial(null)}
                />
              )}

              {activeTab === 'work-reports' && (
                <WorkReportsView
                  currentRole={currentUser.role}
                  workReports={workReports}
                  agents={agents}
                  recruits={recruits}
                  onSubmitWorkReport={handleSubmitWorkReport}
                  onVerifyWorkReport={handleVerifyWorkReport}
                />
              )}

              {activeTab === 'franchisees' && (
                <FranchiseesView
                  franchisees={franchisees}
                  onAddFranchisee={handleAddFranchisee}
                />
              )}

              {activeTab === 'agents' && (
                <AgentsView
                  agents={agents}
                  onAddAgent={handleAddAgent}
                />
              )}

              {activeTab === 'products-inventory' && (
                <ProductsInventoryView
                  currentRole={currentUser.role}
                  products={products}
                  categories={categories}
                  movements={inventoryMovements}
                  suppliers={suppliers}
                  onAddStockMovement={handleAddStockMovement}
                />
              )}

              {activeTab === 'supply-requests' && (
                <SupplyRequestsView
                  currentRole={currentUser.role}
                  supplyRequests={supplyRequests}
                  products={products}
                  onSubmitSupplyRequest={handleSubmitSupplyRequest}
                  onUpdateSupplyStatus={handleUpdateSupplyStatus}
                />
              )}

              {activeTab === 'ai-intelligence' && (
                <AiIntelligenceView />
              )}

              {activeTab === 'reports-analytics' && (
                <ReportsAnalyticsView
                  recruits={recruits}
                  workReports={workReports}
                  franchisees={franchisees}
                  products={products}
                />
              )}

              {activeTab === 'audit-logs' && (
                <AuditLogsView auditLogs={auditLogs} />
              )}

              {activeTab === 'franchise-map' && (
                <div className="space-y-4">
                  <FranchiseLocationMap
                    franchisees={franchisees}
                    selectedFranchiseeId={selectedMapFranchiseeId}
                    height="620px"
                  />
                </div>
              )}

              {activeTab === 'sql-export' && (
                <SqlExportView />
              )}
            </>
          )}

          {/* AGENT VIEWS */}
          {currentUser.role === 'Agent' && currentAgentProfile && (
            <>
              {activeTab === 'agent-dashboard' && (
                <AgentDashboard
                  agentProfile={currentAgentProfile}
                  recruits={recruits}
                  workReports={workReports}
                  onNavigate={setActiveTab}
                  onOpenSubmitRecruit={() => setIsSubmitRecruitOpen(true)}
                  onOpenSubmitReport={() => setIsSubmitReportOpen(true)}
                  onSelectRecruit={() => setActiveTab('my-recruits')}
                />
              )}

              {activeTab === 'franchise-map' && (
                <div className="space-y-4">
                  <FranchiseLocationMap
                    franchisees={franchisees}
                    selectedFranchiseeId={selectedMapFranchiseeId}
                    height="620px"
                  />
                </div>
              )}

              {(activeTab === 'my-recruits' || activeTab === 'submit-recruit') && (
                <AgentRecruitsView
                  agentProfile={currentAgentProfile}
                  recruits={recruits}
                  onSubmitRecruit={handleSubmitNewRecruit}
                  onResubmitRecruit={handleResubmitRecruit}
                  isSubmitModalOpenInitially={activeTab === 'submit-recruit' || isSubmitRecruitOpen}
                  onCloseSubmitModal={() => {
                    setIsSubmitRecruitOpen(false);
                    if (activeTab === 'submit-recruit') setActiveTab('my-recruits');
                  }}
                />
              )}

              {(activeTab === 'my-work-reports' || activeTab === 'submit-work-report') && (
                <WorkReportsView
                  currentRole={currentUser.role}
                  currentAgentProfile={currentAgentProfile}
                  workReports={workReports}
                  agents={agents}
                  recruits={recruits}
                  onSubmitWorkReport={handleSubmitWorkReport}
                  onVerifyWorkReport={handleVerifyWorkReport}
                  isSubmitModalOpenInitially={activeTab === 'submit-work-report' || isSubmitReportOpen}
                  onCloseSubmitModal={() => {
                    setIsSubmitReportOpen(false);
                    if (activeTab === 'submit-work-report') setActiveTab('my-work-reports');
                  }}
                />
              )}

              {activeTab === 'ai-coach' && (
                <AiIntelligenceView />
              )}
            </>
          )}

          {/* FRANCHISEE VIEWS */}
          {currentUser.role === 'Franchisee' && currentFranchiseProfile && (
            <>
              {activeTab === 'franchisee-dashboard' && (
                <FranchiseeDashboardView
                  franchisee={currentFranchiseProfile}
                  supplyRequests={supplyRequests}
                  announcements={announcements}
                  onNavigate={setActiveTab}
                  onOpenNewOrder={() => setIsNewOrderOpen(true)}
                />
              )}

              {activeTab === 'franchise-map' && (
                <div className="space-y-4">
                  <FranchiseLocationMap
                    franchisees={franchisees}
                    selectedFranchiseeId={currentFranchiseProfile.id}
                    height="620px"
                  />
                </div>
              )}

              {activeTab === 'franchisee-supplies' && (
                <ProductsInventoryView
                  currentRole={currentUser.role}
                  products={products}
                  categories={categories}
                  movements={inventoryMovements}
                  suppliers={suppliers}
                  onAddStockMovement={handleAddStockMovement}
                />
              )}

              {activeTab === 'franchisee-requests' && (
                <SupplyRequestsView
                  currentRole={currentUser.role}
                  currentFranchisee={currentFranchiseProfile}
                  supplyRequests={supplyRequests}
                  products={products}
                  onSubmitSupplyRequest={handleSubmitSupplyRequest}
                  onUpdateSupplyStatus={handleUpdateSupplyStatus}
                  isNewOrderModalOpenInitially={isNewOrderOpen}
                  onCloseNewOrderModal={() => setIsNewOrderOpen(false)}
                />
              )}

              {activeTab === 'ai-advisor' && (
                <AiIntelligenceView />
              )}

              {activeTab === 'franchisee-guide' && (
                <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
                  <h3 className="text-base font-bold text-slate-900">
                    Aice Franchise Operations SOP & Freezer Guidelines
                  </h3>
                  <div className="space-y-3 text-xs text-slate-700 leading-relaxed">
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                      <h4 className="font-bold text-slate-900 mb-1">1. Temperature Preservation (-22°C to -25°C)</h4>
                      <p>Aice ice cream requires constant sub-zero temperatures. Ice crystal deformation occurs if freezers fluctuate above -18°C. Do not load ambient-temperature items into ice cream display freezers.</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                      <h4 className="font-bold text-slate-900 mb-1">2. Restocking Best Practice (FIFO Method)</h4>
                      <p>Always move older carton inventory to the top basket before loading fresh delivery boxes at the bottom. Check box seal integrity immediately upon cold truck handoff.</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                      <h4 className="font-bold text-slate-900 mb-1">3. Power Failure Protocol</h4>
                      <p>In case of scheduled brownouts or generator delays, do not open sliding glass doors. Aice commercial insulation preserves frozen consistency for up to 8 hours unopened.</p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
