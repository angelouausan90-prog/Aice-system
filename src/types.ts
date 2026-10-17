/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'Super Admin' | 'Admin' | 'Franchisee' | 'Agent';
export type AccountStatus = 'Active' | 'Inactive' | 'Suspended';
export type FranchiseeStatus = 'Pending' | 'Active' | 'Under Warning' | 'Suspended' | 'Terminated';
export type RenewalStatus = 'Active' | 'Expiring Soon' | 'Expired' | 'Renewed' | 'Under Review';

export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: UserRole;
  accountStatus: AccountStatus;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FranchiseeWarning {
  id: string;
  franchiseeId: string;
  warningLevel: '1st' | '2nd' | 'Final';
  category: 'late payment' | 'low sales' | 'policy violation' | 'hygiene/quality' | 'other';
  message: string;
  resolutionDueDate?: string;
  issuedByUserId: string;
  issuedByName: string;
  isResolved?: boolean;
  createdAt: string;
}

export interface FranchiseeStatusHistory {
  id: string;
  franchiseeId: string;
  changedByUserId: string;
  changedByName: string;
  changedByRole: string;
  actionType: 'CREATE' | 'EDIT' | 'WARNING_ISSUED' | 'SUSPEND' | 'TERMINATE' | 'REINSTATE';
  previousStatus: string;
  newStatus: string;
  reason: string;
  createdAt: string;
}

export interface FranchiseeProfile {
  id: string;
  userId: string;
  franchiseName: string;
  representativeName: string;
  contactNumber: string;
  email: string;
  businessAddress: string;
  city: string;
  province: string;
  franchiseType: 'Pocket Store' | 'Standard Kiosk' | 'Commercial Parlor' | 'Mobile Cart';
  franchiseStartDate: string;
  agreementStartDate?: string;
  agreementEndDate?: string;
  renewalStatus?: RenewalStatus;
  status?: FranchiseeStatus;
  warningCount?: number;
  totalOrdersCount: number;
  freezerUnitsCount: number;
  totalSalesPhp?: number;
  pendingBalancePhp?: number;
  settlementFlag?: boolean;
  lastActivityAt?: string;
  softDeletedAt?: string;
  createdFromRecruitmentId?: string;
  accountStatus: AccountStatus;
  notes?: string;
  latitude?: number;
  longitude?: number;
  warnings?: FranchiseeWarning[];
  statusHistory?: FranchiseeStatusHistory[];
  createdAt: string;
  updatedAt: string;
}

export interface AgentProfile {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  contactNumber: string;
  assignedTerritory: string;
  accountStatus: AccountStatus;
  recruitsSubmittedCount: number;
  approvedRecruitsCount: number;
  rejectedRecruitsCount: number;
  verifiedReportsCount: number;
  commissionEarnedPhp: number;
  createdAt: string;
  updatedAt: string;
}

export type RecruitmentStatus = 
  | 'Pending Verification' 
  | 'Under Review' 
  | 'Approved' 
  | 'Rejected' 
  | 'Needs Revision';

export interface RecruitmentAttachment {
  id: string;
  recruitId: string;
  uploadedByUserId: string;
  originalFilename: string;
  mimeType: string;
  fileSize: number;
  description: string;
  dataUrl?: string; // base64 / preview URL
  createdAt: string;
}

export interface RecruitmentStatusHistory {
  id: string;
  recruitId: string;
  changedByUserId: string;
  changedByUserName: string;
  previousStatus: RecruitmentStatus;
  newStatus: RecruitmentStatus;
  comment: string;
  createdAt: string;
}

export interface Recruit {
  id: string;
  referenceNumber: string;
  agentId: string;
  agentName: string;
  prospectFullName: string;
  phone: string;
  email: string;
  city: string;
  province: string;
  businessAddress?: string;
  storeName?: string;
  latitude?: number;
  longitude?: number;
  preferredContactMethod: 'Phone Call' | 'WhatsApp/Viber' | 'Email' | 'In-Person';
  businessInterest: 'Pocket Store' | 'Standard Kiosk' | 'Commercial Parlor' | 'Mobile Cart';
  recruitmentSource: 'Direct Field Canvassing' | 'Social Media Inquiry' | 'Referral' | 'Local Trade Fair';
  initialContactDate: string;
  salesConversationNotes: string;
  prospectInterestLevel: 'High' | 'Moderate' | 'Evaluating';
  nextFollowUpDate?: string;
  prospectConsentConfirmed: boolean;
  status: RecruitmentStatus;
  submittedAt: string;
  updatedAt: string;
  approvedAt?: string;
  reviewingAdminId?: string;
  reviewingAdminName?: string;
  rejectionReason?: string;
  latestReviewComment?: string;
  convertedFranchiseeId?: string;
  attachments: RecruitmentAttachment[];
  statusHistory: RecruitmentStatusHistory[];
  aiEvaluation?: {
    feasibilityScore: number;
    summary: string;
    riskFlags: string[];
    suggestedQuestions: string[];
    marketDensityEstimate: string;
    evaluatedAt: string;
  };
}

export type WorkReportStatus = 
  | 'Pending Review' 
  | 'Under Review' 
  | 'Verified' 
  | 'Needs Revision' 
  | 'Rejected';

export interface WorkReportStatusHistory {
  id: string;
  workReportId: string;
  changedByUserId: string;
  changedByUserName: string;
  previousStatus: WorkReportStatus;
  newStatus: WorkReportStatus;
  comment: string;
  createdAt: string;
}

export interface AgentWorkReport {
  id: string;
  referenceNumber: string;
  agentId: string;
  agentName: string;
  title: string;
  activityDate: string;
  periodStart: string;
  periodEnd: string;
  activityType: 'Field Pitching' | 'Franchise Seminar' | 'Client Follow-Up' | 'Site Inspection';
  prospectsContacted: number;
  meetingsConducted: number;
  recruitsSubmittedCount: number;
  activityDescription: string;
  outcomes: string;
  challenges: string;
  nextSteps: string;
  status: WorkReportStatus;
  submittedAt: string;
  reviewedByAdminId?: string;
  reviewedByAdminName?: string;
  reviewedAt?: string;
  reviewComment?: string;
  associatedRecruitIds: string[];
  statusHistory: WorkReportStatusHistory[];
  attachmentsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductCategory {
  id: string;
  name: string;
  description: string;
  itemCount: number;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  categoryId: string;
  categoryName: string;
  description: string;
  unitOfMeasure: 'Box (24 pcs)' | 'Carton (40 pcs)' | 'Tub (5 Liters)' | 'Unit' | 'Pack (100 pcs)';
  internalPricePhp: number;
  costPricePhp: number;
  stockQuantity: number;
  lowStockThreshold: number;
  imageUrl: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Supplier {
  id: string;
  supplierName: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  suppliedCategories: string[];
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryMovement {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  movementType: 'STOCK_IN' | 'STOCK_OUT' | 'ADJUSTMENT' | 'SUPPLY_REQUEST_FULFILLMENT';
  quantity: number; // positive or negative
  previousStock: number;
  newStock: number;
  referenceType: 'PO' | 'DISPATCH' | 'AUDIT' | 'SUPPLY_REQUEST';
  referenceId: string;
  notes: string;
  createdByUserId: string;
  createdByUserName: string;
  createdAt: string;
}

export type SupplyRequestStatus = 
  | 'Pending Review' 
  | 'Approved' 
  | 'Processing' 
  | 'Fulfilled' 
  | 'Rejected' 
  | 'Cancelled';

export interface SupplyRequestItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  requestedQuantity: number;
  approvedQuantity: number;
  fulfilledQuantity: number;
  unitPricePhp: number;
  unitOfMeasure: string;
}

export interface SupplyRequest {
  id: string;
  referenceNumber: string;
  franchiseeId: string;
  franchiseName: string;
  representativeName: string;
  status: SupplyRequestStatus;
  items: SupplyRequestItem[];
  totalAmountPhp: number;
  requestedAt: string;
  reviewedByAdminId?: string;
  reviewedByAdminName?: string;
  reviewedAt?: string;
  reviewComment?: string;
  fulfilledAt?: string;
  deliveryNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InAppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  notificationType: 'RECRUITMENT' | 'WORK_REPORT' | 'SUPPLY_REQUEST' | 'SYSTEM' | 'ACCOUNT';
  relatedRecordType?: 'RECRUIT' | 'WORK_REPORT' | 'SUPPLY_REQUEST' | 'FRANCHISEE';
  relatedRecordId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  entityType: string;
  entityId: string;
  description: string;
  createdAt: string;
}

export interface SystemAnnouncement {
  id: string;
  title: string;
  content: string;
  targetRole: 'All' | 'Franchisee' | 'Agent';
  priority: 'Normal' | 'Urgent';
  publishedAt: string;
}
