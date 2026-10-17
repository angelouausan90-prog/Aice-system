/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import { 
  User, FranchiseeProfile, AgentProfile, Recruit, AgentWorkReport, 
  Product, ProductCategory, Supplier, InventoryMovement, 
  SupplyRequest, InAppNotification, AuditLog, SystemAnnouncement,
  RecruitmentStatus, WorkReportStatus, SupplyRequestStatus
} from './src/types.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '15mb' }));

// Initialize Google Gen AI
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// ==========================================
// IN-MEMORY DATABASE STATE (Seed Data)
// ==========================================

const users: User[] = [
  {
    id: 'usr-admin-1',
    username: 'admin',
    email: 'admin@aice.ph',
    fullName: 'Carlos Mendoza',
    role: 'Admin',
    accountStatus: 'Active',
    lastLoginAt: new Date().toISOString(),
    createdAt: '2026-01-10T08:00:00.000Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'usr-agent-1',
    username: 'agent.reyes',
    email: 'agent.reyes@aice.ph',
    fullName: 'Maria Reyes',
    role: 'Agent',
    accountStatus: 'Active',
    lastLoginAt: new Date().toISOString(),
    createdAt: '2026-01-15T09:30:00.000Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'usr-agent-2',
    username: 'agent.santos',
    email: 'agent.santos@aice.ph',
    fullName: 'Juan Santos',
    role: 'Agent',
    accountStatus: 'Active',
    lastLoginAt: '2026-10-14T14:20:00.000Z',
    createdAt: '2026-02-01T10:00:00.000Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'usr-fran-1',
    username: 'franchise.valenzuela',
    email: 'franchise.valenzuela@aice.ph',
    fullName: 'Elena Valenzuela',
    role: 'Franchisee',
    accountStatus: 'Active',
    lastLoginAt: new Date().toISOString(),
    createdAt: '2026-02-15T11:00:00.000Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'usr-fran-2',
    username: 'franchise.davao',
    email: 'franchise.davao@aice.ph',
    fullName: 'Mark Dalisay',
    role: 'Franchisee',
    accountStatus: 'Active',
    lastLoginAt: '2026-10-13T16:45:00.000Z',
    createdAt: '2026-03-01T08:30:00.000Z',
    updatedAt: new Date().toISOString(),
  },
];

const agents: AgentProfile[] = [
  {
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
  },
  {
    id: 'agt-2',
    userId: 'usr-agent-2',
    fullName: 'Juan Santos',
    email: 'agent.santos@aice.ph',
    contactNumber: '+63 918 888 4421',
    assignedTerritory: 'Cebu & Central Visayas',
    accountStatus: 'Active',
    recruitsSubmittedCount: 9,
    approvedRecruitsCount: 5,
    rejectedRecruitsCount: 1,
    verifiedReportsCount: 7,
    commissionEarnedPhp: 75000,
    createdAt: '2026-02-01T10:00:00.000Z',
    updatedAt: new Date().toISOString(),
  },
];

interface WarningRecord {
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

interface StatusHistoryRecord {
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

const franchiseeWarnings: WarningRecord[] = [
  {
    id: 'warn-101',
    franchiseeId: 'frn-2',
    warningLevel: '1st',
    category: 'late payment',
    message: 'Delayed royalty and supply settlement for September 2026 cycle. Balance outstanding: Php 18,500.',
    resolutionDueDate: '2026-10-25',
    issuedByUserId: 'usr-admin-1',
    issuedByName: 'Carlos Mendoza',
    createdAt: '2026-10-12T10:00:00.000Z',
  },
  {
    id: 'warn-102',
    franchiseeId: 'frn-5',
    warningLevel: '1st',
    category: 'hygiene/quality',
    message: 'Freezer temperature exceeded optimal storage range (-12°C recorded instead of -18°C). Required immediate recalibration.',
    resolutionDueDate: '2026-09-15',
    issuedByUserId: 'usr-admin-1',
    issuedByName: 'Carlos Mendoza',
    createdAt: '2026-09-08T14:30:00.000Z',
  },
  {
    id: 'warn-103',
    franchiseeId: 'frn-5',
    warningLevel: '2nd',
    category: 'policy violation',
    message: 'Unauthorized display of third-party frozen novelties inside official Aice branded deep freezer unit.',
    resolutionDueDate: '2026-10-05',
    issuedByUserId: 'usr-admin-1',
    issuedByName: 'Carlos Mendoza',
    createdAt: '2026-10-01T09:15:00.000Z',
  },
];

const franchiseeStatusHistory: StatusHistoryRecord[] = [
  {
    id: 'fsh-1',
    franchiseeId: 'frn-1',
    changedByUserId: 'usr-admin-1',
    changedByName: 'Carlos Mendoza',
    changedByRole: 'Admin',
    actionType: 'CREATE',
    previousStatus: 'Pending',
    newStatus: 'Active',
    reason: 'Initial franchise onboarding agreement signed and verified.',
    createdAt: '2026-02-15T11:00:00.000Z',
  },
  {
    id: 'fsh-2',
    franchiseeId: 'frn-2',
    changedByUserId: 'usr-admin-1',
    changedByName: 'Carlos Mendoza',
    changedByRole: 'Admin',
    actionType: 'WARNING_ISSUED',
    previousStatus: 'Active',
    newStatus: 'Under Warning',
    reason: 'Issued 1st Warning for late payment of September supply settlement invoice.',
    createdAt: '2026-10-12T10:00:00.000Z',
  },
  {
    id: 'fsh-3',
    franchiseeId: 'frn-5',
    changedByUserId: 'usr-admin-1',
    changedByName: 'Carlos Mendoza',
    changedByRole: 'Admin',
    actionType: 'SUSPEND',
    previousStatus: 'Under Warning',
    newStatus: 'Suspended',
    reason: 'Temporary administrative suspension pending audit of contract compliance after 2nd warning.',
    createdAt: '2026-10-10T16:00:00.000Z',
  },
  {
    id: 'fsh-4',
    franchiseeId: 'frn-6',
    changedByUserId: 'usr-admin-1',
    changedByName: 'Carlos Mendoza',
    changedByRole: 'Super Admin',
    actionType: 'TERMINATE',
    previousStatus: 'Suspended',
    newStatus: 'Terminated',
    reason: 'Mutual contract termination and mall kiosk space deconsolidation.',
    createdAt: '2026-10-01T10:00:00.000Z',
  },
];

const franchisees: FranchiseeProfile[] = [
  {
    id: 'frn-1',
    userId: 'usr-fran-1',
    franchiseName: 'Aice Ice Cream Parlor - SM Fairview Hub',
    representativeName: 'Elena Valenzuela',
    contactNumber: '+63 920 333 1188',
    email: 'franchise.valenzuela@aice.ph',
    businessAddress: 'Ground Floor, Commercial Strip, SM City Fairview, Quirino Hwy',
    city: 'Quezon City',
    province: 'Metro Manila',
    franchiseType: 'Commercial Parlor',
    franchiseStartDate: '2026-03-01',
    agreementStartDate: '2026-03-01',
    agreementEndDate: '2027-03-01',
    renewalStatus: 'Active',
    status: 'Active',
    warningCount: 0,
    createdFromRecruitmentId: 'rec-101',
    accountStatus: 'Active',
    notes: 'Premier flagship parlor with heavy weekend foot traffic.',
    totalOrdersCount: 28,
    freezerUnitsCount: 4,
    totalSalesPhp: 485000,
    pendingBalancePhp: 0,
    settlementFlag: false,
    latitude: 14.7338,
    longitude: 121.0583,
    lastActivityAt: '2026-10-16T14:30:00.000Z',
    createdAt: '2026-02-15T11:00:00.000Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'frn-2',
    userId: 'usr-fran-2',
    franchiseName: 'Aice Kiosk - Davao City Plaza',
    representativeName: 'Mark Dalisay',
    contactNumber: '+63 919 777 6622',
    email: 'franchise.davao@aice.ph',
    businessAddress: 'Claveria St, Poblacion District, near City Hall',
    city: 'Davao City',
    province: 'Davao del Sur',
    franchiseType: 'Standard Kiosk',
    franchiseStartDate: '2026-04-10',
    agreementStartDate: '2026-04-10',
    agreementEndDate: '2027-04-10',
    renewalStatus: 'Active',
    status: 'Under Warning',
    warningCount: 1,
    createdFromRecruitmentId: 'rec-102',
    accountStatus: 'Active',
    notes: 'High school and office corridor location.',
    totalOrdersCount: 19,
    freezerUnitsCount: 2,
    totalSalesPhp: 312000,
    pendingBalancePhp: 18500,
    settlementFlag: false,
    latitude: 7.0736,
    longitude: 125.6128,
    lastActivityAt: '2026-10-15T09:15:00.000Z',
    createdAt: '2026-03-01T08:30:00.000Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'frn-3',
    userId: 'usr-fran-3',
    franchiseName: 'Aice Kiosk - Makati Bel-Air Lobby',
    representativeName: 'Patricia Lim',
    contactNumber: '+63 917 889 0012',
    email: 'patricia.lim@gmail.com',
    businessAddress: 'Commercial Arcade, Makati Ave cor Sen. Gil Puyat',
    city: 'Makati City',
    province: 'Metro Manila',
    franchiseType: 'Standard Kiosk',
    franchiseStartDate: '2026-10-08',
    agreementStartDate: '2026-10-08',
    agreementEndDate: '2027-10-08',
    renewalStatus: 'Under Review',
    status: 'Pending',
    warningCount: 0,
    createdFromRecruitmentId: 'rec-204',
    accountStatus: 'Active',
    notes: 'Approved from recruit REC-2026-00204. High-rise condominium commercial lobby.',
    totalOrdersCount: 5,
    freezerUnitsCount: 2,
    totalSalesPhp: 82000,
    pendingBalancePhp: 0,
    settlementFlag: false,
    latitude: 14.5547,
    longitude: 121.0244,
    lastActivityAt: '2026-10-16T11:20:00.000Z',
    createdAt: '2026-10-08T15:30:00.000Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'frn-4',
    userId: 'usr-fran-4',
    franchiseName: 'Aice Parlor - Cebu IT Park Hub',
    representativeName: 'Ramon Garcia',
    contactNumber: '+63 932 456 7890',
    email: 'ramon.garcia.cebu@yahoo.com',
    businessAddress: 'The Walk Commercial Strip, Cebu IT Park, Lahug',
    city: 'Cebu City',
    province: 'Cebu',
    franchiseType: 'Commercial Parlor',
    franchiseStartDate: '2026-05-12',
    agreementStartDate: '2026-05-12',
    agreementEndDate: '2027-05-12',
    renewalStatus: 'Active',
    status: 'Active',
    warningCount: 0,
    accountStatus: 'Active',
    notes: '24/7 BPO corridor location with high night-shift impulse purchases.',
    totalOrdersCount: 14,
    freezerUnitsCount: 3,
    totalSalesPhp: 265000,
    pendingBalancePhp: 0,
    settlementFlag: false,
    latitude: 10.3297,
    longitude: 123.9066,
    lastActivityAt: '2026-10-16T18:00:00.000Z',
    createdAt: '2026-05-12T09:00:00.000Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'frn-5',
    userId: 'usr-fran-5',
    franchiseName: 'Aice Pocket Store - Pasig Kapitolyo',
    representativeName: 'Lourdes Bautista',
    contactNumber: '+63 928 345 6789',
    email: 'lourdes.b@outlook.com',
    businessAddress: 'East Capitol Drive, Kapitolyo',
    city: 'Pasig City',
    province: 'Metro Manila',
    franchiseType: 'Pocket Store',
    franchiseStartDate: '2026-07-20',
    agreementStartDate: '2026-07-20',
    agreementEndDate: '2027-07-20',
    renewalStatus: 'Expiring Soon',
    status: 'Suspended',
    warningCount: 2,
    accountStatus: 'Suspended',
    notes: 'Sari-sari store transformation. Suspended due to unaddressed 2nd warning.',
    totalOrdersCount: 11,
    freezerUnitsCount: 1,
    totalSalesPhp: 148000,
    pendingBalancePhp: 24200,
    settlementFlag: false,
    latitude: 14.5764,
    longitude: 121.0611,
    lastActivityAt: '2026-10-10T16:00:00.000Z',
    createdAt: '2026-07-20T10:00:00.000Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'frn-6',
    userId: 'usr-fran-6',
    franchiseName: 'Aice Cart - Alabang Town Center',
    representativeName: 'Benjamin Santos',
    contactNumber: '+63 915 222 3344',
    email: 'benjamin.s@gmail.com',
    businessAddress: 'Upper Ground Activity Center, Alabang-Zapote Rd, Muntinlupa',
    city: 'Muntinlupa City',
    province: 'Metro Manila',
    franchiseType: 'Mobile Cart',
    franchiseStartDate: '2026-01-10',
    agreementStartDate: '2026-01-10',
    agreementEndDate: '2026-10-01',
    renewalStatus: 'Expired',
    status: 'Terminated',
    warningCount: 3,
    accountStatus: 'Suspended',
    notes: 'Mutual termination executed by Super Admin. Pending inventory audit.',
    totalOrdersCount: 8,
    freezerUnitsCount: 1,
    totalSalesPhp: 94000,
    pendingBalancePhp: 12000,
    settlementFlag: true,
    softDeletedAt: '2026-10-01T10:00:00.000Z',
    latitude: 14.4255,
    longitude: 121.0319,
    lastActivityAt: '2026-10-01T10:00:00.000Z',
    createdAt: '2026-01-10T09:00:00.000Z',
    updatedAt: '2026-10-01T10:00:00.000Z',
  }
];

let recruits: Recruit[] = [
  {
    id: 'rec-201',
    referenceNumber: 'REC-2026-00201',
    agentId: 'agt-1',
    agentName: 'Maria Reyes',
    prospectFullName: 'Antonio Cruz',
    phone: '+63 917 234 5678',
    email: 'antonio.cruz@gmail.com',
    city: 'Quezon City',
    province: 'Metro Manila',
    preferredContactMethod: 'Phone Call',
    businessInterest: 'Pocket Store',
    recruitmentSource: 'Direct Field Canvassing',
    initialContactDate: '2026-10-10',
    salesConversationNotes: 'Prospect owns a busy sari-sari convenience store along Commonwealth Ave near 2 schools. Very eager to add an Aice deep freezer to increase daily basket size.',
    prospectInterestLevel: 'High',
    nextFollowUpDate: '2026-10-18',
    prospectConsentConfirmed: true,
    status: 'Pending Verification',
    submittedAt: '2026-10-12T08:15:00.000Z',
    updatedAt: '2026-10-12T08:15:00.000Z',
    attachments: [
      {
        id: 'att-1',
        recruitId: 'rec-201',
        uploadedByUserId: 'usr-agent-1',
        originalFilename: 'store_front_commonwealth.jpg',
        mimeType: 'image/jpeg',
        fileSize: 245000,
        description: 'Storefront photo with school foot traffic',
        createdAt: '2026-10-12T08:15:00.000Z',
      },
      {
        id: 'att-2',
        recruitId: 'rec-201',
        uploadedByUserId: 'usr-agent-1',
        originalFilename: 'barangay_clearance_cruz.pdf',
        mimeType: 'application/pdf',
        fileSize: 412000,
        description: 'Barangay Business Clearance',
        createdAt: '2026-10-12T08:15:00.000Z',
      }
    ],
    statusHistory: [
      {
        id: 'sh-1',
        recruitId: 'rec-201',
        changedByUserId: 'usr-agent-1',
        changedByUserName: 'Maria Reyes',
        previousStatus: 'Pending Verification',
        newStatus: 'Pending Verification',
        comment: 'Initial submission of prospect along with storefront photos and business clearance.',
        createdAt: '2026-10-12T08:15:00.000Z',
      }
    ],
  },
  {
    id: 'rec-202',
    referenceNumber: 'REC-2026-00202',
    agentId: 'agt-1',
    agentName: 'Maria Reyes',
    prospectFullName: 'Lourdes Bautista',
    phone: '+63 928 345 6789',
    email: 'lourdes.b@outlook.com',
    city: 'Pasig City',
    province: 'Metro Manila',
    preferredContactMethod: 'WhatsApp/Viber',
    businessInterest: 'Standard Kiosk',
    recruitmentSource: 'Social Media Inquiry',
    initialContactDate: '2026-10-08',
    salesConversationNotes: 'Inquired through Facebook Franchise Hub. Prepared capitalization of Php 250,000 for standard kiosk inside commercial mini-mall.',
    prospectInterestLevel: 'High',
    nextFollowUpDate: '2026-10-20',
    prospectConsentConfirmed: true,
    status: 'Under Review',
    submittedAt: '2026-10-11T14:30:00.000Z',
    updatedAt: '2026-10-13T10:00:00.000Z',
    reviewingAdminId: 'usr-admin-1',
    reviewingAdminName: 'Carlos Mendoza',
    latestReviewComment: 'Location validation in progress. Checking distance from existing Pasig dealer.',
    attachments: [
      {
        id: 'att-3',
        recruitId: 'rec-202',
        uploadedByUserId: 'usr-agent-1',
        originalFilename: 'mall_lease_intent.pdf',
        mimeType: 'application/pdf',
        fileSize: 320000,
        description: 'Letter of Intent for Commercial Mall Kiosk',
        createdAt: '2026-10-11T14:30:00.000Z',
      }
    ],
    statusHistory: [
      {
        id: 'sh-2',
        recruitId: 'rec-202',
        changedByUserId: 'usr-agent-1',
        changedByUserName: 'Maria Reyes',
        previousStatus: 'Pending Verification',
        newStatus: 'Pending Verification',
        comment: 'Submitted candidate with signed Letter of Intent.',
        createdAt: '2026-10-11T14:30:00.000Z',
      },
      {
        id: 'sh-3',
        recruitId: 'rec-202',
        changedByUserId: 'usr-admin-1',
        changedByUserName: 'Carlos Mendoza',
        previousStatus: 'Pending Verification',
        newStatus: 'Under Review',
        comment: 'Marked under review to verify non-compete buffer radius with nearby Aice outlets.',
        createdAt: '2026-10-13T10:00:00.000Z',
      }
    ],
  },
  {
    id: 'rec-203',
    referenceNumber: 'REC-2026-00203',
    agentId: 'agt-2',
    agentName: 'Juan Santos',
    prospectFullName: 'Ramon Garcia',
    phone: '+63 932 456 7890',
    email: 'ramon.garcia.cebu@yahoo.com',
    city: 'Cebu City',
    province: 'Cebu',
    preferredContactMethod: 'Phone Call',
    businessInterest: 'Commercial Parlor',
    recruitmentSource: 'Local Trade Fair',
    initialContactDate: '2026-10-05',
    salesConversationNotes: 'Met during Cebu Food & Beverage Expo. Owns prime commercial property in IT Park.',
    prospectInterestLevel: 'Moderate',
    nextFollowUpDate: '2026-10-19',
    prospectConsentConfirmed: true,
    status: 'Needs Revision',
    submittedAt: '2026-10-09T11:20:00.000Z',
    updatedAt: '2026-10-12T16:00:00.000Z',
    reviewingAdminId: 'usr-admin-1',
    reviewingAdminName: 'Carlos Mendoza',
    latestReviewComment: 'Please attach proof of title or lease agreement for the IT Park location, and clarify electrical submeter capacity for 3 freezers.',
    attachments: [],
    statusHistory: [
      {
        id: 'sh-4',
        recruitId: 'rec-203',
        changedByUserId: 'usr-agent-2',
        changedByUserName: 'Juan Santos',
        previousStatus: 'Pending Verification',
        newStatus: 'Pending Verification',
        comment: 'Initial submission of Cebu prospect.',
        createdAt: '2026-10-09T11:20:00.000Z',
      },
      {
        id: 'sh-5',
        recruitId: 'rec-203',
        changedByUserId: 'usr-admin-1',
        changedByUserName: 'Carlos Mendoza',
        previousStatus: 'Pending Verification',
        newStatus: 'Needs Revision',
        comment: 'Please attach proof of title or lease agreement for the IT Park location, and clarify electrical submeter capacity for 3 freezers.',
        createdAt: '2026-10-12T16:00:00.000Z',
      }
    ],
  },
  {
    id: 'rec-204',
    referenceNumber: 'REC-2026-00204',
    agentId: 'agt-1',
    agentName: 'Maria Reyes',
    prospectFullName: 'Patricia Lim',
    phone: '+63 917 889 0012',
    email: 'patricia.lim@gmail.com',
    city: 'Makati City',
    province: 'Metro Manila',
    preferredContactMethod: 'In-Person',
    businessInterest: 'Standard Kiosk',
    recruitmentSource: 'Referral',
    initialContactDate: '2026-09-25',
    salesConversationNotes: 'Referred by existing Franchisee Elena Valenzuela. Complete capitalization, prime high-density residential condo lobby.',
    prospectInterestLevel: 'High',
    prospectConsentConfirmed: true,
    status: 'Approved',
    submittedAt: '2026-10-01T09:00:00.000Z',
    updatedAt: '2026-10-08T15:30:00.000Z',
    approvedAt: '2026-10-08T15:30:00.000Z',
    reviewingAdminId: 'usr-admin-1',
    reviewingAdminName: 'Carlos Mendoza',
    latestReviewComment: 'All financial credentials and lease authorization verified. Approved for Franchisee Onboarding.',
    attachments: [
      {
        id: 'att-4',
        recruitId: 'rec-204',
        uploadedByUserId: 'usr-agent-1',
        originalFilename: 'makati_condo_approval.pdf',
        mimeType: 'application/pdf',
        fileSize: 512000,
        description: 'Condo PMO Commercial Approval Certificate',
        createdAt: '2026-10-01T09:00:00.000Z',
      }
    ],
    statusHistory: [
      {
        id: 'sh-6',
        recruitId: 'rec-204',
        changedByUserId: 'usr-agent-1',
        changedByUserName: 'Maria Reyes',
        previousStatus: 'Pending Verification',
        newStatus: 'Pending Verification',
        comment: 'Submitted verified prospect.',
        createdAt: '2026-10-01T09:00:00.000Z',
      },
      {
        id: 'sh-7',
        recruitId: 'rec-204',
        changedByUserId: 'usr-admin-1',
        changedByUserName: 'Carlos Mendoza',
        previousStatus: 'Pending Verification',
        newStatus: 'Approved',
        comment: 'All financial credentials and lease authorization verified. Approved for Franchisee Onboarding.',
        createdAt: '2026-10-08T15:30:00.000Z',
      }
    ],
  },
];

let workReports: AgentWorkReport[] = [
  {
    id: 'wr-101',
    referenceNumber: 'WR-2026-00101',
    agentId: 'agt-1',
    agentName: 'Maria Reyes',
    title: 'Weekly Field Recruitment - Fairview & Novaliches Corridors',
    activityDate: '2026-10-11',
    periodStart: '2026-10-05',
    periodEnd: '2026-10-11',
    activityType: 'Field Pitching',
    prospectsContacted: 24,
    meetingsConducted: 8,
    recruitsSubmittedCount: 3,
    activityDescription: 'Conducted store-to-store franchise opportunities presentation to high-volume grocery owners and sari-sari cooperatives across Quirino Highway and Novaliches Proper.',
    outcomes: 'Signed up 1 new Pocket Store recruit (Antonio Cruz) and initiated follow-up discussions with 3 bakery chain owners.',
    challenges: 'High electricity cost concerns from 2 prospects; addressed by presenting Aice high-efficiency inverter freezers consuming only Php 35/day.',
    nextSteps: 'Schedule site visits with prospective sari-sari owners on Saturday; submit revised DTI compliance documents.',
    status: 'Verified',
    submittedAt: '2026-10-11T17:00:00.000Z',
    reviewedByAdminId: 'usr-admin-1',
    reviewedByAdminName: 'Carlos Mendoza',
    reviewedAt: '2026-10-13T09:15:00.000Z',
    reviewComment: 'Outstanding weekly performance. Field log photos cross-checked with area log. Verified.',
    associatedRecruitIds: ['rec-201'],
    statusHistory: [
      {
        id: 'wsh-1',
        workReportId: 'wr-101',
        changedByUserId: 'usr-agent-1',
        changedByUserName: 'Maria Reyes',
        previousStatus: 'Pending Review',
        newStatus: 'Pending Review',
        comment: 'Submitted weekly report.',
        createdAt: '2026-10-11T17:00:00.000Z',
      },
      {
        id: 'wsh-2',
        workReportId: 'wr-101',
        changedByUserId: 'usr-admin-1',
        changedByUserName: 'Carlos Mendoza',
        previousStatus: 'Pending Review',
        newStatus: 'Verified',
        comment: 'Outstanding weekly performance. Field log photos cross-checked with area log. Verified.',
        createdAt: '2026-10-13T09:15:00.000Z',
      }
    ],
    attachmentsCount: 3,
    createdAt: '2026-10-11T17:00:00.000Z',
    updatedAt: '2026-10-13T09:15:00.000Z',
  },
  {
    id: 'wr-102',
    referenceNumber: 'WR-2026-00102',
    agentId: 'agt-2',
    agentName: 'Juan Santos',
    title: 'Cebu Metro North Canvassing & Food Expo Follow-up',
    activityDate: '2026-10-12',
    periodStart: '2026-10-06',
    periodEnd: '2026-10-12',
    activityType: 'Franchise Seminar',
    prospectsContacted: 18,
    meetingsConducted: 5,
    recruitsSubmittedCount: 1,
    activityDescription: 'Organized localized orientation for 5 retail entrepreneurs in Mandaue and Cebu City. Distributed Aice product sample boxes and financial breakdown kits.',
    outcomes: '1 prospect submitted (Ramon Garcia) with interest in IT Park parlor.',
    challenges: 'Lack of local cold chain depot in north Cebu requires coordination with Mandaue regional hub.',
    nextSteps: 'Obtain lease documentation for Ramon Garcia; follow up with 2 potential kiosk operators in Colon St.',
    status: 'Pending Review',
    submittedAt: '2026-10-12T19:30:00.000Z',
    associatedRecruitIds: ['rec-203'],
    statusHistory: [
      {
        id: 'wsh-3',
        workReportId: 'wr-102',
        changedByUserId: 'usr-agent-2',
        changedByUserName: 'Juan Santos',
        previousStatus: 'Pending Review',
        newStatus: 'Pending Review',
        comment: 'Submitted Cebu weekly work report with attendance sign-up sheet.',
        createdAt: '2026-10-12T19:30:00.000Z',
      }
    ],
    attachmentsCount: 2,
    createdAt: '2026-10-12T19:30:00.000Z',
    updatedAt: '2026-10-12T19:30:00.000Z',
  }
];

const categories: ProductCategory[] = [
  { id: 'cat-1', name: 'Ice Cream Sticks & Cones', description: 'Popular single-serve impulse treats', itemCount: 6 },
  { id: 'cat-2', name: 'Family & Bulk Tubs', description: 'Take-home tubs for celebrations and dining', itemCount: 3 },
  { id: 'cat-3', name: 'Commercial Freezers', description: 'Sub-zero certified freezers with branded decals', itemCount: 3 },
  { id: 'cat-4', name: 'Point-of-Sale & Signage', description: 'Illuminated signages, standees, and price tags', itemCount: 4 },
  { id: 'cat-5', name: 'Operating Supplies & Uniforms', description: 'Scoopers, aprons, caps, and thermal bags', itemCount: 4 },
];

let products: Product[] = [
  {
    id: 'prod-1',
    sku: 'AICE-STK-001',
    name: 'Aice Sweet Corn Bar',
    categoryId: 'cat-1',
    categoryName: 'Ice Cream Sticks & Cones',
    description: 'Iconic sweet corn shaped waffle crust filled with creamy corn ice cream. Top brand bestseller.',
    unitOfMeasure: 'Box (24 pcs)',
    internalPricePhp: 288,
    costPricePhp: 216,
    stockQuantity: 450,
    lowStockThreshold: 100,
    imageUrl: 'https://images.unsplash.com/photo-1505394033641-40c6ad1178d7?w=600&auto=format&fit=crop&q=80',
    isActive: true,
    createdAt: '2026-01-10T00:00:00.000Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-2',
    sku: 'AICE-STK-002',
    name: 'Aice Mango Slush Bar',
    categoryId: 'cat-1',
    categoryName: 'Ice Cream Sticks & Cones',
    description: 'Refreshing tropical real mango puree popsicle with soft jelly core.',
    unitOfMeasure: 'Box (24 pcs)',
    internalPricePhp: 264,
    costPricePhp: 198,
    stockQuantity: 380,
    lowStockThreshold: 80,
    imageUrl: 'https://images.unsplash.com/photo-1501443762994-82bd5dace89a?w=600&auto=format&fit=crop&q=80',
    isActive: true,
    createdAt: '2026-01-10T00:00:00.000Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-3',
    sku: 'AICE-STK-003',
    name: 'Aice Chocolate Crispy Cone',
    categoryId: 'cat-1',
    categoryName: 'Ice Cream Sticks & Cones',
    description: 'Rich chocolate coated sundae cone with roasted peanut chunks and chocolate nugget center.',
    unitOfMeasure: 'Box (24 pcs)',
    internalPricePhp: 360,
    costPricePhp: 270,
    stockQuantity: 85, // Low stock demo!
    lowStockThreshold: 100,
    imageUrl: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=600&auto=format&fit=crop&q=80',
    isActive: true,
    createdAt: '2026-01-10T00:00:00.000Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-4',
    sku: 'AICE-TUB-001',
    name: 'Aice 3-in-1 Fiesta Tub (5 Liters)',
    categoryId: 'cat-2',
    categoryName: 'Family & Bulk Tubs',
    description: 'Neapolitan trio: Strawberry, Chocolate, and Vanilla for parlors and scoop stations.',
    unitOfMeasure: 'Tub (5 Liters)',
    internalPricePhp: 550,
    costPricePhp: 410,
    stockQuantity: 120,
    lowStockThreshold: 30,
    imageUrl: 'https://images.unsplash.com/photo-1570197788417-0e82375c9371?w=600&auto=format&fit=crop&q=80',
    isActive: true,
    createdAt: '2026-01-15T00:00:00.000Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-5',
    sku: 'AICE-EQP-001',
    name: 'Aice Commercial Chest Freezer 300L (Inverter)',
    categoryId: 'cat-3',
    categoryName: 'Commercial Freezers',
    description: 'Heavy duty sub-zero -25°C sliding curved glass top with internal LED and branded Aice livery.',
    unitOfMeasure: 'Unit',
    internalPricePhp: 18500,
    costPricePhp: 14800,
    stockQuantity: 22,
    lowStockThreshold: 5,
    imageUrl: 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=600&auto=format&fit=crop&q=80',
    isActive: true,
    createdAt: '2026-01-20T00:00:00.000Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-6',
    sku: 'AICE-POS-001',
    name: 'Aice Official Outdoor Lightbox Signboard (1.2m)',
    categoryId: 'cat-4',
    categoryName: 'Point-of-Sale & Signage',
    description: 'Waterproof acrylic dual-sided illuminated signboard with high-impact Aice branding.',
    unitOfMeasure: 'Unit',
    internalPricePhp: 3200,
    costPricePhp: 2400,
    stockQuantity: 45,
    lowStockThreshold: 10,
    imageUrl: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=600&auto=format&fit=crop&q=80',
    isActive: true,
    createdAt: '2026-02-01T00:00:00.000Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-7',
    sku: 'AICE-SUP-001',
    name: 'Franchisee Operations Kit & Uniform Set',
    categoryId: 'cat-5',
    categoryName: 'Operating Supplies & Uniforms',
    description: 'Includes 3 Aice polo shirts, 3 aprons, 3 visors, 2 stainless scoops, and sanitizing kit.',
    unitOfMeasure: 'Unit',
    internalPricePhp: 1450,
    costPricePhp: 980,
    stockQuantity: 60,
    lowStockThreshold: 15,
    imageUrl: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=600&auto=format&fit=crop&q=80',
    isActive: true,
    createdAt: '2026-02-01T00:00:00.000Z',
    updatedAt: new Date().toISOString(),
  }
];

const suppliers: Supplier[] = [
  {
    id: 'sup-1',
    supplierName: 'Aice Manufacturing Philippines Corp',
    contactPerson: 'David Tan (Production Director)',
    email: 'production.ph@aiceicecream.com',
    phone: '+63 2 8844 5500',
    address: 'Laguna Technopark, Biñan, Laguna',
    suppliedCategories: ['Ice Cream Sticks & Cones', 'Family & Bulk Tubs'],
    notes: 'Main national manufacturing plant with sub-zero automated dispatch.',
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'sup-2',
    supplierName: 'FrostTech Commercial Cold Storage & Freezers',
    contactPerson: 'Engr. Roberto Gomez',
    email: 'roberto@frosttech.ph',
    phone: '+63 2 8922 4110',
    address: 'East Service Rd, Sucat, Parañaque City',
    suppliedCategories: ['Commercial Freezers'],
    notes: 'Official OEM warranty and scheduled maintenance partner.',
    isActive: true,
    createdAt: '2026-01-05T00:00:00.000Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'sup-3',
    supplierName: 'Premier Signage & Merchandising Corp',
    contactPerson: 'Grace Sy',
    email: 'orders@premiersign.ph',
    phone: '+63 917 111 8899',
    address: 'Maysan Rd, Valenzuela City',
    suppliedCategories: ['Point-of-Sale & Signage', 'Operating Supplies & Uniforms'],
    notes: 'Prints and fabricates authorized Aice lightbox signages and crew apparel.',
    isActive: true,
    createdAt: '2026-01-10T00:00:00.000Z',
    updatedAt: new Date().toISOString(),
  }
];

let inventoryMovements: InventoryMovement[] = [
  {
    id: 'mov-1',
    productId: 'prod-1',
    productName: 'Aice Sweet Corn Bar',
    sku: 'AICE-STK-001',
    movementType: 'STOCK_IN',
    quantity: 500,
    previousStock: 0,
    newStock: 500,
    referenceType: 'PO',
    referenceId: 'PO-2026-010',
    notes: 'Inbound delivery from Laguna Factory cold truck.',
    createdByUserId: 'usr-admin-1',
    createdByUserName: 'Carlos Mendoza',
    createdAt: '2026-10-01T08:00:00.000Z',
  },
  {
    id: 'mov-2',
    productId: 'prod-1',
    productName: 'Aice Sweet Corn Bar',
    sku: 'AICE-STK-001',
    movementType: 'SUPPLY_REQUEST_FULFILLMENT',
    quantity: -50,
    previousStock: 500,
    newStock: 450,
    referenceType: 'SUPPLY_REQUEST',
    referenceId: 'SR-2026-0001',
    notes: 'Dispatched to SM Fairview Hub.',
    createdByUserId: 'usr-admin-1',
    createdByUserName: 'Carlos Mendoza',
    createdAt: '2026-10-05T14:30:00.000Z',
  },
  {
    id: 'mov-3',
    productId: 'prod-3',
    productName: 'Aice Chocolate Crispy Cone',
    sku: 'AICE-STK-003',
    movementType: 'STOCK_OUT',
    quantity: -15,
    previousStock: 100,
    newStock: 85,
    referenceType: 'DISPATCH',
    referenceId: 'DSP-2026-088',
    notes: 'Promotional sampling kit for Cebu Trade Seminar.',
    createdByUserId: 'usr-admin-1',
    createdByUserName: 'Carlos Mendoza',
    createdAt: '2026-10-10T11:00:00.000Z',
  }
];

let supplyRequests: SupplyRequest[] = [
  {
    id: 'sr-1',
    referenceNumber: 'SR-2026-0001',
    franchiseeId: 'frn-1',
    franchiseName: 'Aice Ice Cream Parlor - SM Fairview Hub',
    representativeName: 'Elena Valenzuela',
    status: 'Fulfilled',
    items: [
      {
        id: 'sri-1',
        productId: 'prod-1',
        productName: 'Aice Sweet Corn Bar',
        sku: 'AICE-STK-001',
        requestedQuantity: 50,
        approvedQuantity: 50,
        fulfilledQuantity: 50,
        unitPricePhp: 288,
        unitOfMeasure: 'Box (24 pcs)'
      },
      {
        id: 'sri-2',
        productId: 'prod-4',
        productName: 'Aice 3-in-1 Fiesta Tub (5 Liters)',
        sku: 'AICE-TUB-001',
        requestedQuantity: 10,
        approvedQuantity: 10,
        fulfilledQuantity: 10,
        unitPricePhp: 550,
        unitOfMeasure: 'Tub (5 Liters)'
      }
    ],
    totalAmountPhp: 19900,
    requestedAt: '2026-10-04T10:00:00.000Z',
    reviewedByAdminId: 'usr-admin-1',
    reviewedByAdminName: 'Carlos Mendoza',
    reviewedAt: '2026-10-04T14:00:00.000Z',
    reviewComment: 'Approved in full. Scheduled for morning cold dispatch.',
    fulfilledAt: '2026-10-05T14:30:00.000Z',
    deliveryNotes: 'Received by store supervisor in frozen condition (-20°C verified).',
    createdAt: '2026-10-04T10:00:00.000Z',
    updatedAt: '2026-10-05T14:30:00.000Z',
  },
  {
    id: 'sr-2',
    referenceNumber: 'SR-2026-0002',
    franchiseeId: 'frn-1',
    franchiseName: 'Aice Ice Cream Parlor - SM Fairview Hub',
    representativeName: 'Elena Valenzuela',
    status: 'Pending Review',
    items: [
      {
        id: 'sri-3',
        productId: 'prod-2',
        productName: 'Aice Mango Slush Bar',
        sku: 'AICE-STK-002',
        requestedQuantity: 30,
        approvedQuantity: 30,
        fulfilledQuantity: 0,
        unitPricePhp: 264,
        unitOfMeasure: 'Box (24 pcs)'
      },
      {
        id: 'sri-4',
        productId: 'prod-3',
        productName: 'Aice Chocolate Crispy Cone',
        sku: 'AICE-STK-003',
        requestedQuantity: 20,
        approvedQuantity: 20,
        fulfilledQuantity: 0,
        unitPricePhp: 360,
        unitOfMeasure: 'Box (24 pcs)'
      }
    ],
    totalAmountPhp: 15120,
    requestedAt: '2026-10-14T09:15:00.000Z',
    createdAt: '2026-10-14T09:15:00.000Z',
    updatedAt: '2026-10-14T09:15:00.000Z',
  }
];

let notifications: InAppNotification[] = [
  {
    id: 'notif-1',
    userId: 'usr-admin-1',
    title: 'New Prospect Submitted',
    message: 'Agent Maria Reyes submitted Antonio Cruz (Quezon City) for Pocket Store verification.',
    notificationType: 'RECRUITMENT',
    relatedRecordType: 'RECRUIT',
    relatedRecordId: 'rec-201',
    isRead: false,
    createdAt: '2026-10-12T08:15:00.000Z',
  },
  {
    id: 'notif-2',
    userId: 'usr-admin-1',
    title: 'Agent Work Report Pending',
    message: 'Agent Juan Santos submitted weekly activity report WR-2026-00102 for review.',
    notificationType: 'WORK_REPORT',
    relatedRecordType: 'WORK_REPORT',
    relatedRecordId: 'wr-102',
    isRead: false,
    createdAt: '2026-10-12T19:30:00.000Z',
  },
  {
    id: 'notif-3',
    userId: 'usr-agent-1',
    title: 'Recruit Approved!',
    message: 'Prospect Patricia Lim (Makati City) has been verified and approved by Carlos Mendoza.',
    notificationType: 'RECRUITMENT',
    relatedRecordType: 'RECRUIT',
    relatedRecordId: 'rec-204',
    isRead: false,
    createdAt: '2026-10-08T15:30:00.000Z',
  },
  {
    id: 'notif-4',
    userId: 'usr-agent-2',
    title: 'Revision Requested on Recruit',
    message: 'Admin requested proof of commercial lease for Ramon Garcia (Cebu City).',
    notificationType: 'RECRUITMENT',
    relatedRecordType: 'RECRUIT',
    relatedRecordId: 'rec-203',
    isRead: true,
    createdAt: '2026-10-12T16:00:00.000Z',
  },
  {
    id: 'notif-5',
    userId: 'usr-fran-1',
    title: 'Supply Request Fulfilled',
    message: 'Your supply order SR-2026-0001 for 60 units has been dispatched and delivered.',
    notificationType: 'SUPPLY_REQUEST',
    relatedRecordType: 'SUPPLY_REQUEST',
    relatedRecordId: 'sr-1',
    isRead: true,
    createdAt: '2026-10-05T14:30:00.000Z',
  }
];

let auditLogs: AuditLog[] = [
  {
    id: 'aud-1',
    userId: 'usr-admin-1',
    userName: 'Carlos Mendoza',
    userRole: 'Admin',
    action: 'APPROVE_RECRUIT',
    entityType: 'RECRUITS',
    entityId: 'rec-204',
    description: 'Approved recruitment record REC-2026-00204 (Patricia Lim) following full verification.',
    createdAt: '2026-10-08T15:30:00.000Z',
  },
  {
    id: 'aud-2',
    userId: 'usr-admin-1',
    userName: 'Carlos Mendoza',
    userRole: 'Admin',
    action: 'VERIFY_WORK_REPORT',
    entityType: 'WORK_REPORTS',
    entityId: 'wr-101',
    description: 'Verified weekly agent work report WR-2026-00101 for Maria Reyes.',
    createdAt: '2026-10-13T09:15:00.000Z',
  },
  {
    id: 'aud-3',
    userId: 'usr-agent-1',
    userName: 'Maria Reyes',
    userRole: 'Agent',
    action: 'SUBMIT_RECRUIT',
    entityType: 'RECRUITS',
    entityId: 'rec-201',
    description: 'Submitted new prospective franchisee Antonio Cruz with supporting business clearance.',
    createdAt: '2026-10-12T08:15:00.000Z',
  }
];

const announcements: SystemAnnouncement[] = [
  {
    id: 'ann-1',
    title: 'Q4 2026 National Sales Rally & Top Agent Incentives',
    content: 'All certified Aice recruitment agents achieving 5 or more approved franchisee conversions this quarter qualify for the annual Tokyo Cold Chain Study Tour!',
    targetRole: 'Agent',
    priority: 'Urgent',
    publishedAt: '2026-10-01T08:00:00.000Z',
  },
  {
    id: 'ann-2',
    title: 'Holiday Season Stock Pre-Order Schedule',
    content: 'Franchisees are advised to submit advance internal supply requests for Fiesta 5L tubs and Chocolate Crispy cones at least 5 business days prior to ensure uninterrupted weekend delivery.',
    targetRole: 'Franchisee',
    priority: 'Normal',
    publishedAt: '2026-10-10T09:00:00.000Z',
  },
  {
    id: 'ann-3',
    title: 'New Inverter Freezer Specs & Energy Efficiency Guidelines',
    content: 'Updated technical spec sheets for model CF-300L are now live. Emphasize low daily kilowatt consumption in recruit presentations to reduce sari-sari hesitation.',
    targetRole: 'All',
    priority: 'Normal',
    publishedAt: '2026-10-12T10:30:00.000Z',
  }
];

// Helper to auto-resolve geographic coordinates for Philippine locations
function resolveCityCoordinates(city: string, province: string): { latitude: number; longitude: number } {
  const norm = `${city || ''} ${province || ''}`.toLowerCase();
  let baseLat = 14.5995;
  let baseLng = 120.9842;

  if (norm.includes('fairview') || norm.includes('novaliches')) {
    baseLat = 14.7338;
    baseLng = 121.0583;
  } else if (norm.includes('quezon')) {
    baseLat = 14.6760;
    baseLng = 121.0437;
  } else if (norm.includes('pasig') || norm.includes('kapitolyo') || norm.includes('ortigas')) {
    baseLat = 14.5764;
    baseLng = 121.0851;
  } else if (norm.includes('makati') || norm.includes('bel-air') || norm.includes('ayala')) {
    baseLat = 14.5547;
    baseLng = 121.0244;
  } else if (norm.includes('taguig') || norm.includes('bgc') || norm.includes('bonifacio')) {
    baseLat = 14.5176;
    baseLng = 121.0509;
  } else if (norm.includes('davao')) {
    baseLat = 7.1907;
    baseLng = 125.4553;
  } else if (norm.includes('cebu') || norm.includes('mandaue') || norm.includes('lahug')) {
    baseLat = 10.3157;
    baseLng = 123.8854;
  } else if (norm.includes('iloilo')) {
    baseLat = 10.7202;
    baseLng = 122.5621;
  } else if (norm.includes('baguio')) {
    baseLat = 16.4023;
    baseLng = 120.5960;
  } else if (norm.includes('laguna') || norm.includes('biñan') || norm.includes('calamba') || norm.includes('santa rosa')) {
    baseLat = 14.2800;
    baseLng = 121.1100;
  } else if (norm.includes('cavite') || norm.includes('bacoor') || norm.includes('dasmarinas') || norm.includes('imus')) {
    baseLat = 14.4791;
    baseLng = 120.8967;
  } else if (norm.includes('cagayan de oro') || norm.includes('cdo')) {
    baseLat = 8.4542;
    baseLng = 124.6319;
  } else if (norm.includes('pampanga') || norm.includes('san fernando') || norm.includes('angeles')) {
    baseLat = 15.0298;
    baseLng = 120.6897;
  }

  // Small random spatial dispersion so stores in the same city don't completely overlap
  const jitterLat = (Math.random() - 0.5) * 0.015;
  const jitterLng = (Math.random() - 0.5) * 0.015;

  return {
    latitude: parseFloat((baseLat + jitterLat).toFixed(6)),
    longitude: parseFloat((baseLng + jitterLng).toFixed(6)),
  };
}

// Helper to log audit actions
function logAudit(userId: string, userName: string, userRole: 'Admin' | 'Franchisee' | 'Agent', action: string, entityType: string, entityId: string, description: string) {
  auditLogs.unshift({
    id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    userId,
    userName,
    userRole,
    action,
    entityType,
    entityId,
    description,
    createdAt: new Date().toISOString(),
  });
}

// Helper to push notification
function pushNotification(userId: string, title: string, message: string, notificationType: 'RECRUITMENT' | 'WORK_REPORT' | 'SUPPLY_REQUEST' | 'SYSTEM' | 'ACCOUNT', relatedRecordType?: 'RECRUIT' | 'WORK_REPORT' | 'SUPPLY_REQUEST' | 'FRANCHISEE', relatedRecordId?: string) {
  notifications.unshift({
    id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    userId,
    title,
    message,
    notificationType,
    relatedRecordType,
    relatedRecordId,
    isRead: false,
    createdAt: new Date().toISOString(),
  });
}

// ==========================================
// REST API ROUTES
// ==========================================

// Auth endpoint
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username) {
    return res.status(400).json({ error: 'Username or email is required.' });
  }

  const user = users.find(u => 
    u.username.toLowerCase() === username.trim().toLowerCase() || 
    u.email.toLowerCase() === username.trim().toLowerCase()
  );

  if (!user) {
    return res.status(401).json({ error: 'Invalid login credentials or account not found.' });
  }

  if (user.accountStatus !== 'Active') {
    return res.status(403).json({ error: `Account is currently ${user.accountStatus}. Please contact system administrator.` });
  }

  // Update last login
  user.lastLoginAt = new Date().toISOString();

  // Return user info and profile
  const agentProfile = user.role === 'Agent' ? agents.find(a => a.userId === user.id) : undefined;
  let franchiseProfile = user.role === 'Franchisee' 
    ? (franchisees.find(f => f.userId === user.id) || franchisees.find(f => f.email?.toLowerCase() === user.email?.toLowerCase() || f.representativeName?.toLowerCase() === user.fullName?.toLowerCase()))
    : undefined;

  logAudit(user.id, user.fullName, user.role, 'LOGIN', 'USERS', user.id, `User logged in successfully as ${user.role}.`);

  res.json({
    user,
    agentProfile,
    franchiseProfile,
  });
});

// Franchisee Sign-Up & Business Location Application
app.post('/api/auth/franchisee-signup', (req: Request, res: Response) => {
  const {
    fullName,
    email,
    phone,
    username,
    password,
    storeName,
    franchiseType,
    city,
    province,
    businessAddress,
    landmarkOrNotes,
    latitude,
    longitude,
    preferredContactMethod,
    autoApprove
  } = req.body;

  if (!fullName || !phone || !city || !storeName) {
    return res.status(400).json({ error: 'Applicant name, contact phone, store name, and city are required.' });
  }

  const generatedUsername = username ? username.trim().toLowerCase() : `franchise.${city.toLowerCase().replace(/[^a-z0-9]/g, '')}${Math.floor(Math.random() * 900 + 100)}`;
  const cleanEmail = email ? email.trim().toLowerCase() : `${generatedUsername}@aice.ph`;

  // Check duplicate username if explicitly provided
  if (username && users.some(u => u.username.toLowerCase() === username.trim().toLowerCase())) {
    return res.status(400).json({ error: `Username "${username}" is already in use. Please choose another.` });
  }

  // Resolve geographical coordinates for map tracking
  const coords = (latitude && longitude && !isNaN(parseFloat(latitude)) && !isNaN(parseFloat(longitude)))
    ? { latitude: parseFloat(latitude), longitude: parseFloat(longitude) }
    : resolveCityCoordinates(city, province || 'Metro Manila');

  const formattedStoreName = storeName.trim();
  const formattedAddress = businessAddress && businessAddress.trim() 
    ? businessAddress.trim() 
    : `${city}, ${province || 'Metro Manila'}`;
  const resolvedPackage = (franchiseType as any) || 'Standard Kiosk';
  const freezers = resolvedPackage === 'Commercial Parlor' ? 4 : (resolvedPackage === 'Standard Kiosk' ? 2 : 1);

  // 1. Create User account
  const newUser: User = {
    id: `usr-fran-${Date.now()}`,
    username: generatedUsername,
    email: cleanEmail,
    fullName: fullName.trim(),
    role: 'Franchisee',
    accountStatus: 'Active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  users.push(newUser);

  // 2. Create Application Recruit record in verification pipeline
  const refNumber = `APP-2026-${String(recruits.length + 101).padStart(4, '0')}`;
  const newRecruit: Recruit = {
    id: `rec-${Date.now()}`,
    referenceNumber: refNumber,
    agentId: 'agt-portal',
    agentName: 'Online Franchisee Sign-Up Portal',
    prospectFullName: fullName.trim(),
    phone: phone.trim(),
    email: cleanEmail,
    city: city.trim(),
    province: (province || 'Metro Manila').trim(),
    businessAddress: formattedAddress,
    storeName: formattedStoreName,
    latitude: coords.latitude,
    longitude: coords.longitude,
    preferredContactMethod: preferredContactMethod || 'Phone Call',
    businessInterest: resolvedPackage,
    recruitmentSource: 'Direct Field Canvassing',
    initialContactDate: new Date().toISOString().split('T')[0],
    salesConversationNotes: `Direct online franchisee sign-up application. Proposed Store: "${formattedStoreName}" at physical address: ${formattedAddress}. Landmark/Notes: ${landmarkOrNotes || 'None'}. Registered coordinates: [${coords.latitude}, ${coords.longitude}].`,
    prospectInterestLevel: 'High',
    prospectConsentConfirmed: true,
    status: autoApprove ? 'Approved' : 'Pending Verification',
    submittedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    approvedAt: autoApprove ? new Date().toISOString() : undefined,
    attachments: [],
    statusHistory: [
      {
        id: `sh-${Date.now()}`,
        recruitId: `rec-${Date.now()}`,
        changedByUserId: newUser.id,
        changedByUserName: fullName,
        previousStatus: 'Pending Verification',
        newStatus: autoApprove ? 'Approved' : 'Pending Verification',
        comment: autoApprove 
          ? 'Instant demo approval applied. Store location registered on live map.'
          : 'Franchisee applicant registered store location details via portal.',
        createdAt: new Date().toISOString(),
      }
    ]
  };

  recruits.unshift(newRecruit);

  // 3. If autoApprove is true, immediately register store on Franchise Location Map!
  let newFranchisee: FranchiseeProfile | undefined;
  if (autoApprove) {
    newFranchisee = {
      id: `frn-app-${Date.now()}`,
      userId: newUser.id,
      franchiseName: formattedStoreName,
      representativeName: fullName.trim(),
      contactNumber: phone.trim(),
      email: cleanEmail,
      businessAddress: formattedAddress,
      city: city.trim(),
      province: (province || 'Metro Manila').trim(),
      franchiseType: resolvedPackage,
      franchiseStartDate: new Date().toISOString().split('T')[0],
      createdFromRecruitmentId: newRecruit.id,
      accountStatus: 'Active',
      notes: `Registered business location approved from direct portal sign-up #${refNumber}.`,
      totalOrdersCount: 0,
      freezerUnitsCount: freezers,
      latitude: coords.latitude,
      longitude: coords.longitude,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    franchisees.unshift(newFranchisee);
    newRecruit.convertedFranchiseeId = newFranchisee.id;

    logAudit(
      newUser.id,
      fullName,
      'Franchisee',
      'REGISTER_MAP_LOCATION',
      'FRANCHISEES',
      newFranchisee.id,
      `Approved and registered business location "${formattedStoreName}" in ${city} on live Franchise Location Map Tracker.`
    );
  } else {
    logAudit(
      newUser.id,
      fullName,
      'Franchisee',
      'SIGNUP_APPLICATION',
      'RECRUITS',
      newRecruit.id,
      `Prospective franchisee ${fullName} submitted registration for store "${formattedStoreName}" in ${city}. Pending Admin verification.`
    );
  }

  pushNotification(
    'usr-admin-1',
    autoApprove ? 'New Store Location Live on Map!' : 'New Franchisee Application & Store Location',
    `${fullName} registered store "${formattedStoreName}" in ${city} (${resolvedPackage}). ${autoApprove ? 'Store is live on map tracker.' : 'Pending review in Recruitment Queue.'}`,
    'RECRUITMENT',
    'RECRUIT',
    newRecruit.id
  );

  res.status(201).json({
    message: autoApprove 
      ? 'Franchise account created and store location successfully registered on the Map Tracker!'
      : 'Application submitted! Your business location info has been registered for approval.',
    user: newUser,
    recruit: newRecruit,
    franchisee: newFranchisee,
    autoApproved: !!autoApprove,
  });
});

app.get('/api/users', (_req: Request, res: Response) => {
  res.json(users);
});

// Franchisees API
app.get('/api/franchisees', (_req: Request, res: Response) => {
  res.json(franchisees);
});

app.post('/api/franchisees', (req: Request, res: Response) => {
  const data = req.body;
  if (!data.representativeName || !data.franchiseName || !data.city) {
    return res.status(400).json({ error: 'Missing required franchise details.' });
  }

  // Create new user account for the franchisee
  const username = `franchise.${data.city.toLowerCase().replace(/[^a-z0-9]/g, '')}${Math.floor(Math.random() * 90 + 10)}`;
  const newUser: User = {
    id: `usr-fran-${Date.now()}`,
    username,
    email: data.email || `${username}@aice.ph`,
    fullName: data.representativeName,
    role: 'Franchisee',
    accountStatus: 'Active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  users.push(newUser);

  // Resolve coordinates based on city and province
  const coords = (data.latitude && data.longitude) 
    ? { latitude: parseFloat(data.latitude), longitude: parseFloat(data.longitude) }
    : resolveCityCoordinates(data.city, data.province || 'Metro Manila');

  const newFranchisee: FranchiseeProfile = {
    id: `frn-${Date.now()}`,
    userId: newUser.id,
    franchiseName: data.franchiseName,
    representativeName: data.representativeName,
    contactNumber: data.contactNumber || '',
    email: data.email || newUser.email,
    businessAddress: data.businessAddress || '',
    city: data.city,
    province: data.province || 'Metro Manila',
    franchiseType: data.franchiseType || 'Pocket Store',
    franchiseStartDate: data.franchiseStartDate || new Date().toISOString().split('T')[0],
    createdFromRecruitmentId: data.createdFromRecruitmentId,
    accountStatus: 'Active',
    notes: data.notes || '',
    totalOrdersCount: 0,
    freezerUnitsCount: data.freezerUnitsCount || 1,
    latitude: coords.latitude,
    longitude: coords.longitude,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  franchisees.push(newFranchisee);

  // If created from approved recruit, mark recruit converted
  if (data.createdFromRecruitmentId) {
    const recruit = recruits.find(r => r.id === data.createdFromRecruitmentId);
    if (recruit) {
      recruit.convertedFranchiseeId = newFranchisee.id;
    }
  }

  logAudit(data.adminId || 'usr-admin-1', 'Carlos Mendoza', 'Admin', 'CREATE_FRANCHISEE', 'FRANCHISEES', newFranchisee.id, `Created Franchisee ${newFranchisee.franchiseName} (${newFranchisee.representativeName}). Registered at ${coords.latitude}, ${coords.longitude}.`);
  pushNotification(newUser.id, 'Welcome to Aice Franchise Portal', 'Your official Aice franchise business account has been initialized and activated.', 'ACCOUNT', 'FRANCHISEE', newFranchisee.id);

  res.status(201).json(newFranchisee);
});

// Franchisee Inspection: Full profile, agreement, performance, map coordinates, warnings, and history
app.get('/api/franchisees/:id/inspect', (req: Request, res: Response) => {
  const { id } = req.params;
  const userRole = (req.headers['x-user-role'] as string) || 'Admin';

  if (userRole !== 'Super Admin' && userRole !== 'Admin') {
    return res.status(403).json({ error: 'Access Denied: Administrative authority required.' });
  }

  const franchisee = franchisees.find(f => f.id === id);
  if (!franchisee) {
    return res.status(404).json({ error: 'Franchisee not found.' });
  }

  const warnings = franchiseeWarnings.filter(w => w.franchiseeId === id);
  const history = franchiseeStatusHistory.filter(h => h.franchiseeId === id);
  const recentOrders = supplyRequests.filter(s => s.franchiseeId === id).slice(0, 5);

  res.json({
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
      recentOrders,
    },
    mapLocation: {
      latitude: franchisee.latitude || 14.5995,
      longitude: franchisee.longitude || 120.9842,
      businessAddress: franchisee.businessAddress,
      city: franchisee.city,
      province: franchisee.province,
    },
    warnings,
    statusHistory: history,
  });
});

// Edit Franchisee Details
app.put('/api/franchisees/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const userRole = (req.headers['x-user-role'] as string) || 'Admin';
  const actorId = (req.headers['x-user-id'] as string) || 'usr-admin-1';
  const actorName = (req.headers['x-user-name'] as string) || 'Carlos Mendoza';

  if (userRole !== 'Super Admin' && userRole !== 'Admin') {
    return res.status(403).json({ error: 'Access Denied: Administrative authority required.' });
  }

  const franchisee = franchisees.find(f => f.id === id);
  if (!franchisee) {
    return res.status(404).json({ error: 'Franchisee not found.' });
  }

  const data = req.body;
  if (!data.franchiseName || !data.representativeName || !data.city) {
    return res.status(400).json({ error: 'Franchise name, representative name, and city are required.' });
  }

  const oldValues = {
    franchiseName: franchisee.franchiseName,
    representativeName: franchisee.representativeName,
    contactNumber: franchisee.contactNumber,
    email: franchisee.email,
    businessAddress: franchisee.businessAddress,
    city: franchisee.city,
    province: franchisee.province,
    franchiseType: franchisee.franchiseType,
    agreementStartDate: franchisee.agreementStartDate,
    agreementEndDate: franchisee.agreementEndDate,
    renewalStatus: franchisee.renewalStatus,
    notes: franchisee.notes,
  };

  franchisee.franchiseName = data.franchiseName.trim();
  franchisee.representativeName = data.representativeName.trim();
  if (data.contactNumber) franchisee.contactNumber = data.contactNumber.trim();
  if (data.email) franchisee.email = data.email.trim();
  if (data.businessAddress) franchisee.businessAddress = data.businessAddress.trim();
  if (data.city) franchisee.city = data.city.trim();
  if (data.province) franchisee.province = data.province.trim();
  if (data.franchiseType) franchisee.franchiseType = data.franchiseType;
  if (data.agreementStartDate) franchisee.agreementStartDate = data.agreementStartDate;
  if (data.agreementEndDate) franchisee.agreementEndDate = data.agreementEndDate;
  if (data.renewalStatus) franchisee.renewalStatus = data.renewalStatus;
  if (data.notes !== undefined) franchisee.notes = data.notes;
  franchisee.lastActivityAt = new Date().toISOString();
  franchisee.updatedAt = new Date().toISOString();

  logAudit(actorId, actorName, userRole as any, 'EDIT_FRANCHISEE', 'FRANCHISEES', franchisee.id, `Admin modified profile details for ${franchisee.franchiseName}.`);

  res.json({ success: true, message: 'Franchisee updated successfully.', franchisee });
});

// Send Warning to Franchisee
app.post('/api/franchisees/:id/warning', (req: Request, res: Response) => {
  const { id } = req.params;
  const userRole = (req.headers['x-user-role'] as string) || 'Admin';
  const actorId = (req.headers['x-user-id'] as string) || 'usr-admin-1';
  const actorName = (req.headers['x-user-name'] as string) || 'Carlos Mendoza';

  if (userRole !== 'Super Admin' && userRole !== 'Admin') {
    return res.status(403).json({ error: 'Access Denied: Administrative authority required.' });
  }

  const franchisee = franchisees.find(f => f.id === id);
  if (!franchisee) {
    return res.status(404).json({ error: 'Franchisee not found.' });
  }

  const { warningLevel, category, message, resolutionDueDate } = req.body;
  if (!warningLevel || !category || !message) {
    return res.status(400).json({ error: 'Warning level, category, and message explanation are required.' });
  }

  const warningRecord: WarningRecord = {
    id: `warn-${Date.now()}`,
    franchiseeId: franchisee.id,
    warningLevel: warningLevel as any,
    category: category as any,
    message: message.trim(),
    resolutionDueDate: resolutionDueDate || undefined,
    issuedByUserId: actorId,
    issuedByName: actorName,
    createdAt: new Date().toISOString(),
  };
  franchiseeWarnings.unshift(warningRecord);

  const prevStatus = franchisee.status || 'Active';
  const newStatus = 'Under Warning';
  franchisee.warningCount = (franchisee.warningCount || 0) + 1;
  franchisee.status = newStatus;
  franchisee.lastActivityAt = new Date().toISOString();
  franchisee.updatedAt = new Date().toISOString();

  // Status History
  franchiseeStatusHistory.unshift({
    id: `fsh-${Date.now()}`,
    franchiseeId: franchisee.id,
    changedByUserId: actorId,
    changedByName: actorName,
    changedByRole: userRole,
    actionType: 'WARNING_ISSUED',
    previousStatus: prevStatus,
    newStatus,
    reason: `Issued ${warningLevel} Warning [${category}]: ${message}`,
    createdAt: new Date().toISOString(),
  });

  // Push Notification to Franchisee
  pushNotification(
    franchisee.userId,
    `Official ${warningLevel} Warning: ${category}`,
    `Warning notice from HQ: ${message}${resolutionDueDate ? ' (Deadline: ' + resolutionDueDate + ')' : ''}`,
    'ACCOUNT',
    'FRANCHISEE',
    warningRecord.id
  );

  logAudit(actorId, actorName, userRole as any, 'SEND_WARNING', 'FRANCHISEES', franchisee.id, `Issued ${warningLevel} warning [${category}] to ${franchisee.franchiseName}. Total warnings: ${franchisee.warningCount}.`);

  const suggestEscalation = (franchisee.warningCount >= 2 || warningLevel === 'Final');

  res.json({
    success: true,
    message: `Warning issued to ${franchisee.franchiseName}.`,
    warning: warningRecord,
    franchisee,
    suggestEscalation,
    escalationMessage: suggestEscalation
      ? `Escalation Recommended: Franchisee now has ${franchisee.warningCount} warnings on file. Consider initiating formal contract suspension review.`
      : null,
  });
});

// Suspend Franchisee (Admin & Super Admin)
app.post('/api/franchisees/:id/suspend', (req: Request, res: Response) => {
  const { id } = req.params;
  const userRole = (req.headers['x-user-role'] as string) || 'Admin';
  const actorId = (req.headers['x-user-id'] as string) || 'usr-admin-1';
  const actorName = (req.headers['x-user-name'] as string) || 'Carlos Mendoza';

  if (userRole !== 'Super Admin' && userRole !== 'Admin') {
    return res.status(403).json({ error: 'Access Denied: Administrative authority required.' });
  }

  const { reason } = req.body;
  if (!reason || reason.trim().length < 5) {
    return res.status(400).json({ error: 'A valid reason for suspension is required (minimum 5 characters).' });
  }

  const franchisee = franchisees.find(f => f.id === id);
  if (!franchisee) {
    return res.status(404).json({ error: 'Franchisee not found.' });
  }

  const prevStatus = franchisee.status || 'Active';
  franchisee.status = 'Suspended';
  franchisee.accountStatus = 'Suspended';
  franchisee.lastActivityAt = new Date().toISOString();
  franchisee.updatedAt = new Date().toISOString();

  // Block user account login
  const u = users.find(usr => usr.id === franchisee.userId);
  if (u) {
    u.accountStatus = 'Suspended';
    u.updatedAt = new Date().toISOString();
  }

  // Status History
  franchiseeStatusHistory.unshift({
    id: `fsh-${Date.now()}`,
    franchiseeId: franchisee.id,
    changedByUserId: actorId,
    changedByName: actorName,
    changedByRole: userRole,
    actionType: 'SUSPEND',
    previousStatus: prevStatus,
    newStatus: 'Suspended',
    reason: reason.trim(),
    createdAt: new Date().toISOString(),
  });

  logAudit(actorId, actorName, userRole as any, 'SUSPEND_FRANCHISEE', 'FRANCHISEES', franchisee.id, `Suspended ${franchisee.franchiseName}. Reason: ${reason}`);

  res.json({ success: true, message: `${franchisee.franchiseName} has been suspended.`, franchisee });
});

// Terminate Franchisee (Super Admin ONLY!)
app.post('/api/franchisees/:id/terminate', (req: Request, res: Response) => {
  const { id } = req.params;
  const userRole = (req.headers['x-user-role'] as string) || 'Admin';
  const actorId = (req.headers['x-user-id'] as string) || 'usr-admin-1';
  const actorName = (req.headers['x-user-name'] as string) || 'Carlos Mendoza';

  // Strict Server-Side Role Enforcement: Only Super Admin can terminate
  if (userRole !== 'Super Admin') {
    return res.status(403).json({
      error: 'Permission Denied: Only Super Admin has authorization to terminate a franchisee agreement.',
      requiredRole: 'Super Admin',
      currentRole: userRole,
    });
  }

  const { reason } = req.body;
  if (!reason || reason.trim().length < 8) {
    return res.status(400).json({ error: 'A formal termination justification is required (minimum 8 characters).' });
  }

  const franchisee = franchisees.find(f => f.id === id);
  if (!franchisee) {
    return res.status(404).json({ error: 'Franchisee not found.' });
  }

  const prevStatus = franchisee.status || 'Active';
  franchisee.status = 'Terminated';
  franchisee.accountStatus = 'Suspended';
  franchisee.softDeletedAt = new Date().toISOString();
  franchisee.settlementFlag = true;
  franchisee.lastActivityAt = new Date().toISOString();
  franchisee.updatedAt = new Date().toISOString();

  // Block user account login
  const u = users.find(usr => usr.id === franchisee.userId);
  if (u) {
    u.accountStatus = 'Suspended';
    u.updatedAt = new Date().toISOString();
  }

  // Cancel pending supply orders
  let cancelledCount = 0;
  supplyRequests.forEach(sr => {
    if (sr.franchiseeId === franchisee.id && (sr.status === 'Pending Review' || sr.status === 'Processing')) {
      sr.status = 'Cancelled';
      sr.deliveryNotes = `${sr.deliveryNotes || ''} [Cancelled due to franchise termination]`.trim();
      cancelledCount++;
    }
  });

  // Status History
  franchiseeStatusHistory.unshift({
    id: `fsh-${Date.now()}`,
    franchiseeId: franchisee.id,
    changedByUserId: actorId,
    changedByName: actorName,
    changedByRole: 'Super Admin',
    actionType: 'TERMINATE',
    previousStatus: prevStatus,
    newStatus: 'Terminated',
    reason: reason.trim(),
    createdAt: new Date().toISOString(),
  });

  logAudit(actorId, actorName, 'Super Admin', 'TERMINATE_FRANCHISEE', 'FRANCHISEES', franchisee.id, `Terminated ${franchisee.franchiseName} (soft delete). Flagged for inventory settlement. Cancelled ${cancelledCount} orders. Reason: ${reason}`);

  res.json({
    success: true,
    message: `${franchisee.franchiseName} terminated (soft-deleted). Pending orders cancelled and balance flagged for final settlement.`,
    franchisee,
    cancelledCount,
  });
});

// Reinstate Franchisee (Super Admin ONLY!)
app.post('/api/franchisees/:id/reinstate', (req: Request, res: Response) => {
  const { id } = req.params;
  const userRole = (req.headers['x-user-role'] as string) || 'Admin';
  const actorId = (req.headers['x-user-id'] as string) || 'usr-admin-1';
  const actorName = (req.headers['x-user-name'] as string) || 'Carlos Mendoza';

  // Strict Server-Side Role Enforcement: Only Super Admin can reinstate
  if (userRole !== 'Super Admin') {
    return res.status(403).json({
      error: 'Permission Denied: Only Super Admin has authorization to reinstate a suspended or terminated franchisee.',
      requiredRole: 'Super Admin',
      currentRole: userRole,
    });
  }

  const { reason } = req.body;
  if (!reason || reason.trim().length < 5) {
    return res.status(400).json({ error: 'A justification for reinstatement is required (minimum 5 characters).' });
  }

  const franchisee = franchisees.find(f => f.id === id);
  if (!franchisee) {
    return res.status(404).json({ error: 'Franchisee not found.' });
  }

  const prevStatus = franchisee.status || 'Suspended';
  franchisee.status = 'Active';
  franchisee.accountStatus = 'Active';
  franchisee.softDeletedAt = undefined;
  franchisee.settlementFlag = false;
  franchisee.lastActivityAt = new Date().toISOString();
  franchisee.updatedAt = new Date().toISOString();

  // Re-enable user account login
  const u = users.find(usr => usr.id === franchisee.userId);
  if (u) {
    u.accountStatus = 'Active';
    u.updatedAt = new Date().toISOString();
  }

  // Status History
  franchiseeStatusHistory.unshift({
    id: `fsh-${Date.now()}`,
    franchiseeId: franchisee.id,
    changedByUserId: actorId,
    changedByName: actorName,
    changedByRole: 'Super Admin',
    actionType: 'REINSTATE',
    previousStatus: prevStatus,
    newStatus: 'Active',
    reason: reason.trim(),
    createdAt: new Date().toISOString(),
  });

  logAudit(actorId, actorName, 'Super Admin', 'REINSTATE_FRANCHISEE', 'FRANCHISEES', franchisee.id, `Reinstated ${franchisee.franchiseName} to Active status. Reason: ${reason}`);

  res.json({ success: true, message: `${franchisee.franchiseName} successfully reinstated to Active.`, franchisee });
});

// Agents API
app.get('/api/agents', (_req: Request, res: Response) => {
  res.json(agents);
});

app.post('/api/agents', (req: Request, res: Response) => {
  const data = req.body;
  if (!data.fullName || !data.assignedTerritory) {
    return res.status(400).json({ error: 'Missing required agent details.' });
  }

  const username = `agent.${data.fullName.toLowerCase().split(' ')[0] || 'recruiter'}${Math.floor(Math.random() * 900 + 100)}`;
  const newUser: User = {
    id: `usr-agent-${Date.now()}`,
    username,
    email: data.email || `${username}@aice.ph`,
    fullName: data.fullName,
    role: 'Agent',
    accountStatus: 'Active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  users.push(newUser);

  const newAgent: AgentProfile = {
    id: `agt-${Date.now()}`,
    userId: newUser.id,
    fullName: data.fullName,
    email: data.email || newUser.email,
    contactNumber: data.contactNumber || '',
    assignedTerritory: data.assignedTerritory,
    accountStatus: 'Active',
    recruitsSubmittedCount: 0,
    approvedRecruitsCount: 0,
    rejectedRecruitsCount: 0,
    verifiedReportsCount: 0,
    commissionEarnedPhp: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  agents.push(newAgent);

  logAudit(data.adminId || 'usr-admin-1', 'Carlos Mendoza', 'Admin', 'CREATE_AGENT', 'AGENTS', newAgent.id, `Created Agent account for ${newAgent.fullName} (${newAgent.assignedTerritory}).`);

  res.status(201).json(newAgent);
});

// Recruits API
app.get('/api/recruits', (req: Request, res: Response) => {
  const { agentId } = req.query;
  if (agentId && typeof agentId === 'string') {
    return res.json(recruits.filter(r => r.agentId === agentId));
  }
  res.json(recruits);
});

app.post('/api/recruits', (req: Request, res: Response) => {
  const data = req.body;
  if (!data.prospectFullName || !data.phone || !data.city || !data.agentId) {
    return res.status(400).json({ error: 'Prospect name, contact number, city, and agent ID are required.' });
  }

  // Duplicate phone/email validation check
  const duplicate = recruits.find(r => 
    r.phone.replace(/[^0-9]/g, '') === data.phone.replace(/[^0-9]/g, '') ||
    (data.email && r.email && r.email.toLowerCase() === data.email.toLowerCase())
  );
  if (duplicate) {
    return res.status(409).json({ 
      error: `Potential duplicate submission! A recruitment entry (#${duplicate.referenceNumber}) already exists for this prospect contact in ${duplicate.city}.`,
      duplicateReferenceNumber: duplicate.referenceNumber,
    });
  }

  const agent = agents.find(a => a.id === data.agentId);
  const refNum = `REC-2026-${Math.floor(Math.random() * 89999 + 10000)}`;

  const newRecruit: Recruit = {
    id: `rec-${Date.now()}`,
    referenceNumber: refNum,
    agentId: data.agentId,
    agentName: agent?.fullName || data.agentName || 'Aice Agent',
    prospectFullName: data.prospectFullName,
    phone: data.phone,
    email: data.email || '',
    city: data.city,
    province: data.province || 'Metro Manila',
    businessAddress: data.businessAddress || `${data.city}, ${data.province || 'Metro Manila'}`,
    storeName: data.storeName || '',
    preferredContactMethod: data.preferredContactMethod || 'Phone Call',
    businessInterest: data.businessInterest || 'Pocket Store',
    recruitmentSource: data.recruitmentSource || 'Direct Field Canvassing',
    initialContactDate: data.initialContactDate || new Date().toISOString().split('T')[0],
    salesConversationNotes: data.salesConversationNotes || '',
    prospectInterestLevel: data.prospectInterestLevel || 'High',
    nextFollowUpDate: data.nextFollowUpDate,
    prospectConsentConfirmed: true,
    status: 'Pending Verification',
    submittedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    attachments: data.attachments || [],
    statusHistory: [
      {
        id: `sh-${Date.now()}`,
        recruitId: `rec-${Date.now()}`,
        changedByUserId: agent?.userId || 'usr-agent-1',
        changedByUserName: agent?.fullName || 'Agent',
        previousStatus: 'Pending Verification',
        newStatus: 'Pending Verification',
        comment: data.initialComment || 'Submitted prospect details with verified applicant consent.',
        createdAt: new Date().toISOString(),
      }
    ]
  };

  recruits.unshift(newRecruit);

  // Update agent counts
  if (agent) {
    agent.recruitsSubmittedCount += 1;
  }

  logAudit(agent?.userId || 'usr-agent-1', agent?.fullName || 'Agent', 'Agent', 'SUBMIT_RECRUIT', 'RECRUITS', newRecruit.id, `Submitted prospect ${newRecruit.prospectFullName} (${newRecruit.referenceNumber}).`);
  pushNotification('usr-admin-1', 'New Recruit Submitted', `Agent ${newRecruit.agentName} submitted ${newRecruit.prospectFullName} for verification (${newRecruit.city}).`, 'RECRUITMENT', 'RECRUIT', newRecruit.id);

  res.status(201).json(newRecruit);
});

// Admin Review / Status Transition on Recruit
app.put('/api/recruits/:id/status', (req: Request, res: Response) => {
  const { id } = req.params;
  const { newStatus, comment, rejectionReason, adminId, adminName } = req.body;

  const recruit = recruits.find(r => r.id === id);
  if (!recruit) {
    return res.status(404).json({ error: 'Recruitment record not found.' });
  }

  const prevStatus = recruit.status;
  recruit.status = newStatus as RecruitmentStatus;
  recruit.updatedAt = new Date().toISOString();
  recruit.reviewingAdminId = adminId || 'usr-admin-1';
  recruit.reviewingAdminName = adminName || 'Carlos Mendoza';
  recruit.latestReviewComment = comment || '';

  if (newStatus === 'Approved') {
    recruit.approvedAt = new Date().toISOString();
    // Update agent performance
    const agent = agents.find(a => a.id === recruit.agentId);
    if (agent) {
      agent.approvedRecruitsCount += 1;
      agent.commissionEarnedPhp += 15000; // Php 15,000 commission bonus
    }

    // Automatically provision and register official franchisee business location on map tracker
    if (!recruit.convertedFranchiseeId) {
      const storeName = req.body.storeName || recruit.storeName || `Aice Store - ${recruit.city} (${recruit.prospectFullName.split(' ')[0]})`;
      const businessAddress = req.body.businessAddress || recruit.businessAddress || `${recruit.city}, ${recruit.province}`;

      const coords = (req.body.latitude && req.body.longitude)
        ? { latitude: parseFloat(req.body.latitude), longitude: parseFloat(req.body.longitude) }
        : (recruit.latitude && recruit.longitude)
          ? { latitude: recruit.latitude, longitude: recruit.longitude }
          : resolveCityCoordinates(recruit.city, recruit.province);

      const username = `franchise.${recruit.city.toLowerCase().replace(/[^a-z0-9]/g, '')}${Math.floor(Math.random() * 90 + 10)}`;
      const newUser: User = {
        id: `usr-fran-${Date.now()}`,
        username,
        email: recruit.email || `${username}@aice.ph`,
        fullName: recruit.prospectFullName,
        role: 'Franchisee',
        accountStatus: 'Active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      users.push(newUser);

      const freezers = req.body.freezerUnitsCount || (recruit.businessInterest === 'Commercial Parlor' ? 4 : (recruit.businessInterest === 'Standard Kiosk' ? 2 : 1));
      const newFranchisee: FranchiseeProfile = {
        id: `frn-app-${Date.now()}`,
        userId: newUser.id,
        franchiseName: storeName,
        representativeName: recruit.prospectFullName,
        contactNumber: recruit.phone,
        email: recruit.email || newUser.email,
        businessAddress,
        city: recruit.city,
        province: recruit.province || 'Metro Manila',
        franchiseType: (recruit.businessInterest as any) || 'Standard Kiosk',
        franchiseStartDate: new Date().toISOString().split('T')[0],
        createdFromRecruitmentId: recruit.id,
        accountStatus: 'Active',
        notes: `Registered business location automatically created upon approval of recruitment application #${recruit.referenceNumber}.`,
        totalOrdersCount: 0,
        freezerUnitsCount: freezers,
        latitude: coords.latitude,
        longitude: coords.longitude,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      franchisees.push(newFranchisee);
      recruit.convertedFranchiseeId = newFranchisee.id;

      logAudit(
        adminId || 'usr-admin-1',
        adminName || 'Carlos Mendoza',
        'Admin',
        'REGISTER_MAP_LOCATION',
        'FRANCHISEES',
        newFranchisee.id,
        `Approved recruit #${recruit.referenceNumber}. Automatically registered store location "${newFranchisee.franchiseName}" in ${newFranchisee.city} on National Map Tracker.`
      );

      pushNotification(
        'usr-admin-1',
        'New Store Location Registered on Map',
        `Approved application for ${recruit.prospectFullName}. Store "${newFranchisee.franchiseName}" is now active and tracked on the Franchise Map.`,
        'RECRUITMENT',
        'FRANCHISEE',
        newFranchisee.id
      );
    }
  } else if (newStatus === 'Rejected') {
    recruit.rejectionReason = rejectionReason || comment || 'Does not meet territory or financial criteria.';
    const agent = agents.find(a => a.id === recruit.agentId);
    if (agent) {
      agent.rejectedRecruitsCount += 1;
    }
  }

  // Push audit history
  recruit.statusHistory.unshift({
    id: `sh-${Date.now()}`,
    recruitId: recruit.id,
    changedByUserId: adminId || 'usr-admin-1',
    changedByUserName: adminName || 'Carlos Mendoza',
    previousStatus: prevStatus,
    newStatus: newStatus as RecruitmentStatus,
    comment: comment || `Status updated from ${prevStatus} to ${newStatus}.`,
    createdAt: new Date().toISOString(),
  });

  // Notify the submitting agent
  const agent = agents.find(a => a.id === recruit.agentId);
  if (agent) {
    pushNotification(
      agent.userId,
      `Recruit Verification: ${newStatus}`,
      `Prospect ${recruit.prospectFullName} (#${recruit.referenceNumber}) was marked ${newStatus}. ${comment ? 'Note: ' + comment : ''}`,
      'RECRUITMENT',
      'RECRUIT',
      recruit.id
    );
  }

  logAudit(adminId || 'usr-admin-1', adminName || 'Carlos Mendoza', 'Admin', 'REVIEW_RECRUIT', 'RECRUITS', recruit.id, `Updated recruit status from ${prevStatus} to ${newStatus} for ${recruit.prospectFullName}.`);

  res.json(recruit);
});

// Agent Resubmit Recruit (after Needs Revision)
app.put('/api/recruits/:id/resubmit', (req: Request, res: Response) => {
  const { id } = req.params;
  const { salesConversationNotes, nextFollowUpDate, attachments, agentComment } = req.body;

  const recruit = recruits.find(r => r.id === id);
  if (!recruit) {
    return res.status(404).json({ error: 'Recruit not found.' });
  }

  const prevStatus = recruit.status;
  recruit.status = 'Pending Verification';
  recruit.updatedAt = new Date().toISOString();
  if (salesConversationNotes) recruit.salesConversationNotes = salesConversationNotes;
  if (nextFollowUpDate) recruit.nextFollowUpDate = nextFollowUpDate;
  if (attachments && Array.isArray(attachments)) {
    recruit.attachments = [...recruit.attachments, ...attachments];
  }

  recruit.statusHistory.unshift({
    id: `sh-${Date.now()}`,
    recruitId: recruit.id,
    changedByUserId: 'usr-agent-1',
    changedByUserName: recruit.agentName,
    previousStatus: prevStatus,
    newStatus: 'Pending Verification',
    comment: agentComment || 'Resubmitted with requested revisions and supplemental evidence.',
    createdAt: new Date().toISOString(),
  });

  pushNotification('usr-admin-1', 'Recruit Resubmitted', `Agent ${recruit.agentName} resubmitted ${recruit.prospectFullName} with requested revisions.`, 'RECRUITMENT', 'RECRUIT', recruit.id);

  res.json(recruit);
});

// Work Reports API
app.get('/api/work-reports', (req: Request, res: Response) => {
  const { agentId } = req.query;
  if (agentId && typeof agentId === 'string') {
    return res.json(workReports.filter(w => w.agentId === agentId));
  }
  res.json(workReports);
});

app.post('/api/work-reports', (req: Request, res: Response) => {
  const data = req.body;
  if (!data.title || !data.agentId || !data.activityDescription) {
    return res.status(400).json({ error: 'Title, agent, and activity description are required.' });
  }

  const agent = agents.find(a => a.id === data.agentId);
  const refNum = `WR-2026-${Math.floor(Math.random() * 89999 + 10000)}`;

  const newReport: AgentWorkReport = {
    id: `wr-${Date.now()}`,
    referenceNumber: refNum,
    agentId: data.agentId,
    agentName: agent?.fullName || data.agentName || 'Agent',
    title: data.title,
    activityDate: data.activityDate || new Date().toISOString().split('T')[0],
    periodStart: data.periodStart || new Date().toISOString().split('T')[0],
    periodEnd: data.periodEnd || new Date().toISOString().split('T')[0],
    activityType: data.activityType || 'Field Pitching',
    prospectsContacted: parseInt(data.prospectsContacted || '0', 10),
    meetingsConducted: parseInt(data.meetingsConducted || '0', 10),
    recruitsSubmittedCount: parseInt(data.recruitsSubmittedCount || '0', 10),
    activityDescription: data.activityDescription,
    outcomes: data.outcomes || '',
    challenges: data.challenges || '',
    nextSteps: data.nextSteps || '',
    status: 'Pending Review',
    submittedAt: new Date().toISOString(),
    associatedRecruitIds: data.associatedRecruitIds || [],
    statusHistory: [
      {
        id: `wsh-${Date.now()}`,
        workReportId: `wr-${Date.now()}`,
        changedByUserId: agent?.userId || 'usr-agent-1',
        changedByUserName: agent?.fullName || 'Agent',
        previousStatus: 'Pending Review',
        newStatus: 'Pending Review',
        comment: 'Initial submission of field activity report.',
        createdAt: new Date().toISOString(),
      }
    ],
    attachmentsCount: data.attachmentsCount || 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  workReports.unshift(newReport);

  logAudit(agent?.userId || 'usr-agent-1', agent?.fullName || 'Agent', 'Agent', 'SUBMIT_WORK_REPORT', 'WORK_REPORTS', newReport.id, `Submitted work report #${newReport.referenceNumber}.`);
  pushNotification('usr-admin-1', 'New Agent Work Report', `Agent ${newReport.agentName} submitted work report ${newReport.referenceNumber}.`, 'WORK_REPORT', 'WORK_REPORT', newReport.id);

  res.status(201).json(newReport);
});

// Admin Review on Work Report
app.put('/api/work-reports/:id/status', (req: Request, res: Response) => {
  const { id } = req.params;
  const { newStatus, comment, adminId, adminName } = req.body;

  const report = workReports.find(w => w.id === id);
  if (!report) {
    return res.status(404).json({ error: 'Work report not found.' });
  }

  const prevStatus = report.status;
  report.status = newStatus as WorkReportStatus;
  report.updatedAt = new Date().toISOString();
  report.reviewedByAdminId = adminId || 'usr-admin-1';
  report.reviewedByAdminName = adminName || 'Carlos Mendoza';
  report.reviewedAt = new Date().toISOString();
  report.reviewComment = comment || '';

  if (newStatus === 'Verified') {
    const agent = agents.find(a => a.id === report.agentId);
    if (agent) {
      agent.verifiedReportsCount += 1;
    }
  }

  report.statusHistory.unshift({
    id: `wsh-${Date.now()}`,
    workReportId: report.id,
    changedByUserId: adminId || 'usr-admin-1',
    changedByUserName: adminName || 'Carlos Mendoza',
    previousStatus: prevStatus,
    newStatus: newStatus as WorkReportStatus,
    comment: comment || `Work report reviewed: ${newStatus}.`,
    createdAt: new Date().toISOString(),
  });

  const agent = agents.find(a => a.id === report.agentId);
  if (agent) {
    pushNotification(
      agent.userId,
      `Work Report ${newStatus}`,
      `Your work report #${report.referenceNumber} (${report.title}) was marked ${newStatus}. ${comment ? 'Comment: ' + comment : ''}`,
      'WORK_REPORT',
      'WORK_REPORT',
      report.id
    );
  }

  logAudit(adminId || 'usr-admin-1', adminName || 'Carlos Mendoza', 'Admin', 'REVIEW_WORK_REPORT', 'WORK_REPORTS', report.id, `Reviewed work report #${report.referenceNumber} to ${newStatus}.`);

  res.json(report);
});

// Products & Categories
app.get('/api/products', (_req: Request, res: Response) => {
  res.json(products);
});

app.post('/api/products', (req: Request, res: Response) => {
  const data = req.body;
  const newProduct: Product = {
    id: `prod-${Date.now()}`,
    sku: data.sku || `AICE-SKU-${Math.floor(Math.random() * 899 + 100)}`,
    name: data.name,
    categoryId: data.categoryId,
    categoryName: categories.find(c => c.id === data.categoryId)?.name || 'General Product',
    description: data.description || '',
    unitOfMeasure: data.unitOfMeasure || 'Box (24 pcs)',
    internalPricePhp: parseFloat(data.internalPricePhp || '0'),
    costPricePhp: parseFloat(data.costPricePhp || '0'),
    stockQuantity: parseInt(data.stockQuantity || '0', 10),
    lowStockThreshold: parseInt(data.lowStockThreshold || '20', 10),
    imageUrl: data.imageUrl || 'https://images.unsplash.com/photo-1505394033641-40c6ad1178d7?w=600&auto=format&fit=crop&q=80',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  products.push(newProduct);
  logAudit('usr-admin-1', 'Carlos Mendoza', 'Admin', 'CREATE_PRODUCT', 'PRODUCTS', newProduct.id, `Added product ${newProduct.name} (${newProduct.sku}).`);
  res.status(201).json(newProduct);
});

app.get('/api/categories', (_req: Request, res: Response) => {
  res.json(categories);
});

// Suppliers
app.get('/api/suppliers', (_req: Request, res: Response) => {
  res.json(suppliers);
});

// Inventory Movements
app.get('/api/inventory/movements', (_req: Request, res: Response) => {
  res.json(inventoryMovements);
});

app.post('/api/inventory/movements', (req: Request, res: Response) => {
  const { productId, movementType, quantity, referenceType, referenceId, notes, userId, userName } = req.body;
  const product = products.find(p => p.id === productId);
  if (!product) {
    return res.status(404).json({ error: 'Product not found.' });
  }

  const prev = product.stockQuantity;
  const qty = parseInt(quantity, 10);
  const next = prev + qty;

  if (next < 0) {
    return res.status(400).json({ error: `Insufficient stock! Current stock is ${prev}, cannot deduct ${Math.abs(qty)}.` });
  }

  product.stockQuantity = next;
  product.updatedAt = new Date().toISOString();

  const movement: InventoryMovement = {
    id: `mov-${Date.now()}`,
    productId: product.id,
    productName: product.name,
    sku: product.sku,
    movementType: movementType,
    quantity: qty,
    previousStock: prev,
    newStock: next,
    referenceType: referenceType || 'ADJUSTMENT',
    referenceId: referenceId || `ADJ-${Date.now()}`,
    notes: notes || '',
    createdByUserId: userId || 'usr-admin-1',
    createdByUserName: userName || 'Carlos Mendoza',
    createdAt: new Date().toISOString(),
  };

  inventoryMovements.unshift(movement);
  logAudit(userId || 'usr-admin-1', userName || 'Carlos Mendoza', 'Admin', 'INVENTORY_ADJUSTMENT', 'INVENTORY', movement.id, `Adjusted stock for ${product.name}: ${prev} -> ${next} (${qty >= 0 ? '+' : ''}${qty}).`);

  res.status(201).json({ movement, product });
});

// Supply Requests
app.get('/api/supply-requests', (req: Request, res: Response) => {
  const { franchiseeId } = req.query;
  if (franchiseeId && typeof franchiseeId === 'string') {
    return res.json(supplyRequests.filter(s => s.franchiseeId === franchiseeId));
  }
  res.json(supplyRequests);
});

app.post('/api/supply-requests', (req: Request, res: Response) => {
  const { franchiseeId, items } = req.body;
  const franchisee = franchisees.find(f => f.id === franchiseeId);
  if (!franchisee) {
    return res.status(404).json({ error: 'Franchisee profile not found.' });
  }

  if (!items || !items.length) {
    return res.status(400).json({ error: 'At least one supply product item must be selected.' });
  }

  let totalAmount = 0;
  const parsedItems = items.map((item: any, idx: number) => {
    const prod = products.find(p => p.id === item.productId);
    const qty = parseInt(item.requestedQuantity || '1', 10);
    const unitPrice = prod?.internalPricePhp || 0;
    totalAmount += unitPrice * qty;
    return {
      id: `sri-${Date.now()}-${idx}`,
      productId: item.productId,
      productName: prod?.name || 'Aice Supply Item',
      sku: prod?.sku || 'AICE-SKU',
      requestedQuantity: qty,
      approvedQuantity: qty,
      fulfilledQuantity: 0,
      unitPricePhp: unitPrice,
      unitOfMeasure: prod?.unitOfMeasure || 'Box',
    };
  });

  const refNumber = `SR-2026-${Math.floor(Math.random() * 8999 + 1000)}`;
  const newRequest: SupplyRequest = {
    id: `sr-${Date.now()}`,
    referenceNumber: refNumber,
    franchiseeId: franchisee.id,
    franchiseName: franchisee.franchiseName,
    representativeName: franchisee.representativeName,
    status: 'Pending Review',
    items: parsedItems,
    totalAmountPhp: totalAmount,
    requestedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  supplyRequests.unshift(newRequest);
  franchisee.totalOrdersCount += 1;

  pushNotification('usr-admin-1', 'New Franchisee Supply Request', `${franchisee.franchiseName} submitted replenishment request #${refNumber} (Php ${totalAmount.toLocaleString()}).`, 'SUPPLY_REQUEST', 'SUPPLY_REQUEST', newRequest.id);
  logAudit(franchisee.userId, franchisee.representativeName, 'Franchisee', 'CREATE_SUPPLY_REQUEST', 'SUPPLY_REQUESTS', newRequest.id, `Submitted supply replenishment order #${refNumber}.`);

  res.status(201).json(newRequest);
});

// Admin Review / Fulfill Supply Request
app.put('/api/supply-requests/:id/status', (req: Request, res: Response) => {
  const { id } = req.params;
  const { newStatus, reviewComment, deliveryNotes, adminId, adminName } = req.body;

  const sr = supplyRequests.find(s => s.id === id);
  if (!sr) {
    return res.status(404).json({ error: 'Supply request not found.' });
  }

  const prevStatus = sr.status;
  sr.status = newStatus as SupplyRequestStatus;
  sr.updatedAt = new Date().toISOString();
  sr.reviewedByAdminId = adminId || 'usr-admin-1';
  sr.reviewedByAdminName = adminName || 'Carlos Mendoza';
  sr.reviewedAt = new Date().toISOString();
  if (reviewComment) sr.reviewComment = reviewComment;
  if (deliveryNotes) sr.deliveryNotes = deliveryNotes;

  // When status becomes Fulfilled, deduct from inventory and create ledger movement
  if (newStatus === 'Fulfilled' && prevStatus !== 'Fulfilled') {
    sr.fulfilledAt = new Date().toISOString();
    sr.items.forEach(item => {
      item.fulfilledQuantity = item.approvedQuantity;
      const product = products.find(p => p.id === item.productId);
      if (product) {
        const prevStock = product.stockQuantity;
        const newStock = Math.max(0, prevStock - item.fulfilledQuantity);
        product.stockQuantity = newStock;
        product.updatedAt = new Date().toISOString();

        inventoryMovements.unshift({
          id: `mov-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          productId: product.id,
          productName: product.name,
          sku: product.sku,
          movementType: 'SUPPLY_REQUEST_FULFILLMENT',
          quantity: -item.fulfilledQuantity,
          previousStock: prevStock,
          newStock,
          referenceType: 'SUPPLY_REQUEST',
          referenceId: sr.referenceNumber,
          notes: `Fulfilled for ${sr.franchiseName}`,
          createdByUserId: adminId || 'usr-admin-1',
          createdByUserName: adminName || 'Carlos Mendoza',
          createdAt: new Date().toISOString(),
        });
      }
    });
  }

  // Notify franchisee
  const franchisee = franchisees.find(f => f.id === sr.franchiseeId);
  if (franchisee) {
    pushNotification(
      franchisee.userId,
      `Supply Request Update: ${newStatus}`,
      `Your supply order #${sr.referenceNumber} status changed to ${newStatus}.`,
      'SUPPLY_REQUEST',
      'SUPPLY_REQUEST',
      sr.id
    );
  }

  logAudit(adminId || 'usr-admin-1', adminName || 'Carlos Mendoza', 'Admin', 'UPDATE_SUPPLY_REQUEST', 'SUPPLY_REQUESTS', sr.id, `Updated supply request #${sr.referenceNumber} to ${newStatus}.`);

  res.json(sr);
});

// Notifications
app.get('/api/notifications', (req: Request, res: Response) => {
  const { userId } = req.query;
  if (userId && typeof userId === 'string') {
    return res.json(notifications.filter(n => n.userId === userId));
  }
  res.json(notifications);
});

app.put('/api/notifications/:id/read', (req: Request, res: Response) => {
  const notif = notifications.find(n => n.id === req.params.id);
  if (notif) {
    notif.isRead = true;
  }
  res.json({ success: true });
});

app.put('/api/notifications/read-all', (req: Request, res: Response) => {
  const { userId } = req.body;
  if (userId) {
    notifications.filter(n => n.userId === userId).forEach(n => n.isRead = true);
  } else {
    notifications.forEach(n => n.isRead = true);
  }
  res.json({ success: true });
});

// Audit Logs & Announcements
app.get('/api/audit-logs', (_req: Request, res: Response) => {
  res.json(auditLogs);
});

app.get('/api/announcements', (_req: Request, res: Response) => {
  res.json(announcements);
});

// CSV Export Endpoint
app.get('/api/export-csv', (req: Request, res: Response) => {
  const { type } = req.query;
  let csvContent = '';
  let filename = 'export.csv';

  if (type === 'recruits') {
    filename = `aice_recruits_${new Date().toISOString().split('T')[0]}.csv`;
    csvContent = 'Reference Number,Prospect Name,Phone,Email,City,Province,Business Interest,Source,Status,Agent,Submitted Date\n';
    recruits.forEach(r => {
      csvContent += `"${r.referenceNumber}","${r.prospectFullName}","${r.phone}","${r.email}","${r.city}","${r.province}","${r.businessInterest}","${r.recruitmentSource}","${r.status}","${r.agentName}","${r.submittedAt}"\n`;
    });
  } else if (type === 'work-reports') {
    filename = `aice_work_reports_${new Date().toISOString().split('T')[0]}.csv`;
    csvContent = 'Reference Number,Agent,Title,Activity Date,Type,Prospects Contacted,Meetings,Recruits Count,Status\n';
    workReports.forEach(w => {
      csvContent += `"${w.referenceNumber}","${w.agentName}","${w.title}","${w.activityDate}","${w.activityType}",${w.prospectsContacted},${w.meetingsConducted},${w.recruitsSubmittedCount},"${w.status}"\n`;
    });
  } else if (type === 'inventory') {
    filename = `aice_inventory_${new Date().toISOString().split('T')[0]}.csv`;
    csvContent = 'SKU,Product Name,Category,Unit,Current Stock,Low Stock Threshold,Internal Price (PHP),Cost (PHP)\n';
    products.forEach(p => {
      csvContent += `"${p.sku}","${p.name}","${p.categoryName}","${p.unitOfMeasure}",${p.stockQuantity},${p.lowStockThreshold},${p.internalPricePhp},${p.costPricePhp}\n`;
    });
  } else {
    filename = `aice_franchisees_${new Date().toISOString().split('T')[0]}.csv`;
    csvContent = 'Franchise Name,Representative,City,Province,Package Type,Start Date,Status,Freezers\n';
    franchisees.forEach(f => {
      csvContent += `"${f.franchiseName}","${f.representativeName}","${f.city}","${f.province}","${f.franchiseType}","${f.franchiseStartDate}","${f.accountStatus}",${f.freezerUnitsCount}\n`;
    });
  }

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(csvContent);
});

// ==========================================
// GEMINI AI SERVER-SIDE INTEGRATIONS
// ==========================================

// 1. Recruit Candidate Feasibility & Fraud/Risk Scoring
app.post('/api/gemini/evaluate-recruit', async (req: Request, res: Response) => {
  try {
    const { recruitId, prospectName, city, province, businessInterest, notes, source } = req.body;

    const prompt = `You are the Lead Franchise Verification Analyst for Aice Ice Cream Philippines.
Evaluate this prospective franchisee candidate for suitability, location viability, and fraud/risk red flags.
Candidate Data:
- Name: ${prospectName}
- Target Location: ${city}, ${province}
- Desired Franchise Model: ${businessInterest}
- Recruitment Source: ${source}
- Agent Sales Notes: ${notes}

Analyze this candidate and return a JSON object with:
- feasibilityScore: number between 1 and 100
- summary: concise 2-3 sentence executive summary
- riskFlags: array of strings noting any risks (e.g. territory overlap, cold storage logistics, capitalization, power stability)
- suggestedQuestions: array of 3 specific questions the Admin or Onboarding Officer should ask this prospect during interview
- marketDensityEstimate: string describing foot-traffic and commercial suitability for an Aice ice cream depot/store in ${city}.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    
    // Attach evaluation to recruit if recruitId provided
    if (recruitId) {
      const recruit = recruits.find(r => r.id === recruitId);
      if (recruit) {
        recruit.aiEvaluation = {
          ...parsed,
          evaluatedAt: new Date().toISOString(),
        };
      }
    }

    res.json(parsed);
  } catch (error: any) {
    console.error('Error evaluating recruit with Gemini:', error);
    res.status(500).json({ error: error.message || 'Failed to evaluate candidate with Gemini' });
  }
});

// 2. Google Maps Grounding: Location Commercial Density & Feasibility
app.post('/api/gemini/location-grounding', async (req: Request, res: Response) => {
  try {
    const { locationQuery, latitude, longitude } = req.body;
    const query = locationQuery || 'Quezon City commercial strip';

    const toolConfig: any = {};
    if (latitude && longitude) {
      toolConfig.retrievalConfig = {
        latLng: {
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
        },
      };
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Find shopping centers, school corridors, public markets, and retail hubs around ${query} suitable for setting up an Aice Ice Cream franchise retail outlet or freezer placement. List key commercial venues and assess pedestrian convenience.`,
      config: {
        tools: [{ googleMaps: {} }],
        ...(Object.keys(toolConfig).length > 0 ? { toolConfig } : {}),
      },
    });

    const text = response.text || '';
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    res.json({
      analysis: text,
      groundingChunks,
    });
  } catch (error: any) {
    console.error('Error in location grounding:', error);
    res.status(500).json({ error: error.message || 'Google Maps grounding query failed' });
  }
});

// 3. Google Search Grounding: Live Market Trends & Cold Chain Logistics
app.post('/api/gemini/search-market', async (req: Request, res: Response) => {
  try {
    const { topic } = req.body;
    const query = topic || 'Aice ice cream franchise Philippines retail demand and franchise cost 2025 2026';

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Search for recent information regarding: ${query}. Summarize key takeaways for prospective Aice franchisees and recruitment agents in bullet points.`,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text || '';
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    res.json({
      summary: text,
      groundingChunks,
    });
  } catch (error: any) {
    console.error('Error in search market grounding:', error);
    res.status(500).json({ error: error.message || 'Google Search grounding query failed' });
  }
});

// 4. High Thinking Mode: Comprehensive 5-Year Break-Even & Operational Financial Model
app.post('/api/gemini/thinking-analysis', async (req: Request, res: Response) => {
  try {
    const { franchiseType, city, dailyTargetUnits, freezerCount } = req.body;

    const prompt = `You are a Senior Strategic Franchise Financial Auditor for Aice Ice Cream Philippines.
Perform an in-depth financial feasibility and 5-year break-even projection for this prospective franchise:
- Franchise Package: ${franchiseType || 'Standard Kiosk'}
- Proposed Location: ${city || 'Metro Manila'}
- Target Daily Unit Sales: ${dailyTargetUnits || 180} ice cream sticks/tubs
- Commercial Freezers: ${freezerCount || 2} units (inverter rated, 1.2 kWh/day each)
- Average wholesale cost per stick: Php 10.50
- Average SRP retail price per stick: Php 15.00 (average gross margin 30%)

Conduct a rigorous step-by-step thinking calculation:
1. Daily gross revenue, cost of goods sold, and gross profit.
2. Estimated monthly operating expenses (Meralco electricity, commercial stall rent in ${city}, crew labor or sari-sari owner wage, incidental spoilage 1%).
3. Net monthly profit and payback period in months.
4. Sensitivity scenario: Rainy season monsoon dip (-35% sales for 3 months) vs Summer peak bump (+50% sales for 3 months).
5. Actionable operational recommendations for maximum return on investment.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.HIGH,
        },
      },
    });

    res.json({
      report: response.text || '',
    });
  } catch (error: any) {
    console.error('Error in thinking analysis:', error);
    res.status(500).json({ error: error.message || 'Thinking analysis failed' });
  }
});

// 5. Intelligent Multi-Turn Operations & Recruiter Chatbot
app.post('/api/gemini/chat', async (req: Request, res: Response) => {
  try {
    const { message, history } = req.body;

    const chat = ai.chats.create({
      model: 'gemini-3.8-flash',
      config: {
        systemInstruction: `You are 'Aice Mentor', the AI Franchise Operations and Recruitment Advisor for Aice Ice Cream Philippines.
You assist Admins, Field Agents, and Franchisees with official policies:
- Standard packages: Pocket Store (Php 40,000 - 60,000, 1 freezer), Standard Kiosk (Php 150,000 - 250,000, 2-3 freezers), Commercial Parlor (Php 450,000+, 4+ freezers).
- Strict non-compete buffer radius between Aice outlets: minimum 300 meters in urban areas.
- Cold chain requirement: -22°C to -25°C at all times; never turn off freezer at night.
- Agents receive Php 15,000 commission bonus upon official Admin verification and Franchisee account onboarding.
- All recruitment submissions require verified prospect consent.
Be professional, encouraging, practical, and highly knowledgeable about Philippine retail operations. Keep answers structured with bullet points.`,
      },
    });

    // Replay prior history if provided
    if (history && Array.isArray(history)) {
      for (const turn of history.slice(-6)) {
        if (turn.role === 'user') {
          await chat.sendMessage({ message: turn.content });
        }
      }
    }

    const result = await chat.sendMessage({ message });
    res.json({ reply: result.text || '' });
  } catch (error: any) {
    console.error('Error in chat:', error);
    res.status(500).json({ error: error.message || 'Chatbot request failed' });
  }
});

// ==========================================
// SQL SCHEMA & SEED EXPORT (FOR XAMPP / MYSQL)
// ==========================================
app.get('/api/database/schema-text', (_req: Request, res: Response) => {
  const schemaSQL = `-- ============================================================
-- AICE FRANCHISE MANAGEMENT AND RECRUITMENT SYSTEM
-- Complete MySQL / MariaDB Database Schema (InnoDB, utf8mb4)
-- Compatible with XAMPP (Apache + MySQL/MariaDB), PHP 8.x
-- ============================================================

CREATE DATABASE IF NOT EXISTS \`aice_franchise_system\`
  DEFAULT CHARACTER SET utf8mb4 
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE \`aice_franchise_system\`;

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS \`users\` (
  \`id\` VARCHAR(64) NOT NULL,
  \`username\` VARCHAR(50) NOT NULL UNIQUE,
  \`email\` VARCHAR(100) NOT NULL UNIQUE,
  \`password_hash\` VARCHAR(255) NOT NULL,
  \`full_name\` VARCHAR(100) NOT NULL,
  \`role\` ENUM('Admin', 'Franchisee', 'Agent') NOT NULL,
  \`account_status\` ENUM('Active', 'Inactive', 'Suspended') NOT NULL DEFAULT 'Active',
  \`last_login_at\` DATETIME NULL,
  \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  INDEX \`idx_users_role\` (\`role\`),
  INDEX \`idx_users_status\` (\`account_status\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. AGENTS TABLE
CREATE TABLE IF NOT EXISTS \`agents\` (
  \`id\` VARCHAR(64) NOT NULL,
  \`user_id\` VARCHAR(64) NOT NULL UNIQUE,
  \`contact_number\` VARCHAR(30) NOT NULL,
  \`assigned_territory\` VARCHAR(150) NOT NULL,
  \`commission_rate_php\` DECIMAL(10,2) NOT NULL DEFAULT 15000.00,
  \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  CONSTRAINT \`fk_agents_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. RECRUITS TABLE (Prospective Franchisees)
CREATE TABLE IF NOT EXISTS \`recruits\` (
  \`id\` VARCHAR(64) NOT NULL,
  \`reference_number\` VARCHAR(50) NOT NULL UNIQUE,
  \`agent_id\` VARCHAR(64) NOT NULL,
  \`prospect_full_name\` VARCHAR(100) NOT NULL,
  \`phone\` VARCHAR(30) NOT NULL,
  \`email\` VARCHAR(100) NULL,
  \`city\` VARCHAR(100) NOT NULL,
  \`province\` VARCHAR(100) NOT NULL,
  \`preferred_contact_method\` VARCHAR(50) DEFAULT 'Phone Call',
  \`business_interest\` VARCHAR(100) NOT NULL,
  \`recruitment_source\` VARCHAR(100) NOT NULL,
  \`initial_contact_date\` DATE NOT NULL,
  \`sales_conversation_notes\` TEXT NOT NULL,
  \`prospect_interest_level\` ENUM('High', 'Moderate', 'Evaluating') NOT NULL DEFAULT 'High',
  \`next_follow_up_date\` DATE NULL,
  \`prospect_consent_confirmed\` TINYINT(1) NOT NULL DEFAULT 1,
  \`status\` ENUM('Pending Verification', 'Under Review', 'Approved', 'Rejected', 'Needs Revision') NOT NULL DEFAULT 'Pending Verification',
  \`submitted_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  \`approved_at\` DATETIME NULL,
  \`reviewing_admin_id\` VARCHAR(64) NULL,
  \`rejection_reason\` TEXT NULL,
  \`latest_review_comment\` TEXT NULL,
  \`converted_franchisee_id\` VARCHAR(64) NULL,
  PRIMARY KEY (\`id\`),
  INDEX \`idx_recruits_agent\` (\`agent_id\`),
  INDEX \`idx_recruits_status\` (\`status\`),
  INDEX \`idx_recruits_ref\` (\`reference_number\`),
  CONSTRAINT \`fk_recruits_agent\` FOREIGN KEY (\`agent_id\`) REFERENCES \`agents\` (\`id\`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT \`fk_recruits_admin\` FOREIGN KEY (\`reviewing_admin_id\`) REFERENCES \`users\` (\`id\`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. RECRUITMENT STATUS HISTORY
CREATE TABLE IF NOT EXISTS \`recruitment_status_history\` (
  \`id\` VARCHAR(64) NOT NULL,
  \`recruit_id\` VARCHAR(64) NOT NULL,
  \`changed_by_user_id\` VARCHAR(64) NOT NULL,
  \`previous_status\` VARCHAR(50) NOT NULL,
  \`new_status\` VARCHAR(50) NOT NULL,
  \`comment\` TEXT NOT NULL,
  \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  INDEX \`idx_rsh_recruit\` (\`recruit_id\`),
  CONSTRAINT \`fk_rsh_recruit\` FOREIGN KEY (\`recruit_id\`) REFERENCES \`recruits\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT \`fk_rsh_user\` FOREIGN KEY (\`changed_by_user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. RECRUITMENT ATTACHMENTS
CREATE TABLE IF NOT EXISTS \`recruitment_attachments\` (
  \`id\` VARCHAR(64) NOT NULL,
  \`recruit_id\` VARCHAR(64) NOT NULL,
  \`uploaded_by_user_id\` VARCHAR(64) NOT NULL,
  \`stored_filename\` VARCHAR(255) NOT NULL,
  \`original_filename\` VARCHAR(255) NOT NULL,
  \`mime_type\` VARCHAR(100) NOT NULL,
  \`file_size\` INT NOT NULL,
  \`description\` VARCHAR(255) NULL,
  \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  INDEX \`idx_att_recruit\` (\`recruit_id\`),
  CONSTRAINT \`fk_att_recruit\` FOREIGN KEY (\`recruit_id\`) REFERENCES \`recruits\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. FRANCHISEES TABLE
CREATE TABLE IF NOT EXISTS \`franchisees\` (
  \`id\` VARCHAR(64) NOT NULL,
  \`user_id\` VARCHAR(64) NOT NULL UNIQUE,
  \`franchise_name\` VARCHAR(150) NOT NULL,
  \`representative_name\` VARCHAR(100) NOT NULL,
  \`contact_number\` VARCHAR(30) NOT NULL,
  \`email\` VARCHAR(100) NOT NULL,
  \`business_address\` TEXT NOT NULL,
  \`city\` VARCHAR(100) NOT NULL,
  \`province\` VARCHAR(100) NOT NULL,
  \`franchise_type\` VARCHAR(50) NOT NULL,
  \`franchise_start_date\` DATE NOT NULL,
  \`created_from_recruitment_id\` VARCHAR(64) NULL UNIQUE,
  \`account_status\` ENUM('Active', 'Inactive', 'Suspended') NOT NULL DEFAULT 'Active',
  \`notes\` TEXT NULL,
  \`freezer_units_count\` INT NOT NULL DEFAULT 1,
  \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  CONSTRAINT \`fk_franchisees_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT \`fk_franchisees_recruit\` FOREIGN KEY (\`created_from_recruitment_id\`) REFERENCES \`recruits\` (\`id\`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. AGENT WORK REPORTS TABLE
CREATE TABLE IF NOT EXISTS \`agent_work_reports\` (
  \`id\` VARCHAR(64) NOT NULL,
  \`reference_number\` VARCHAR(50) NOT NULL UNIQUE,
  \`agent_id\` VARCHAR(64) NOT NULL,
  \`title\` VARCHAR(200) NOT NULL,
  \`activity_date\` DATE NOT NULL,
  \`period_start\` DATE NOT NULL,
  \`period_end\` DATE NOT NULL,
  \`activity_type\` VARCHAR(100) NOT NULL,
  \`prospects_contacted\` INT NOT NULL DEFAULT 0,
  \`meetings_conducted\` INT NOT NULL DEFAULT 0,
  \`recruits_submitted_count\` INT NOT NULL DEFAULT 0,
  \`activity_description\` TEXT NOT NULL,
  \`outcomes\` TEXT NOT NULL,
  \`challenges\` TEXT NULL,
  \`next_steps\` TEXT NULL,
  \`status\` ENUM('Pending Review', 'Under Review', 'Verified', 'Needs Revision', 'Rejected') NOT NULL DEFAULT 'Pending Review',
  \`submitted_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`reviewed_by_admin_id\` VARCHAR(64) NULL,
  \`reviewed_at\` DATETIME NULL,
  \`review_comment\` TEXT NULL,
  \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  INDEX \`idx_awr_agent\` (\`agent_id\`),
  INDEX \`idx_awr_status\` (\`status\`),
  CONSTRAINT \`fk_awr_agent\` FOREIGN KEY (\`agent_id\`) REFERENCES \`agents\` (\`id\`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT \`fk_awr_admin\` FOREIGN KEY (\`reviewed_by_admin_id\`) REFERENCES \`users\` (\`id\`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. PRODUCT CATEGORIES & PRODUCTS
CREATE TABLE IF NOT EXISTS \`product_categories\` (
  \`id\` VARCHAR(64) NOT NULL,
  \`name\` VARCHAR(100) NOT NULL UNIQUE,
  \`description\` TEXT NULL,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS \`products\` (
  \`id\` VARCHAR(64) NOT NULL,
  \`sku\` VARCHAR(50) NOT NULL UNIQUE,
  \`name\` VARCHAR(150) NOT NULL,
  \`category_id\` VARCHAR(64) NOT NULL,
  \`description\` TEXT NULL,
  \`unit_of_measure\` VARCHAR(50) NOT NULL,
  \`internal_price_php\` DECIMAL(10,2) NOT NULL,
  \`cost_price_php\` DECIMAL(10,2) NOT NULL,
  \`stock_quantity\` INT NOT NULL DEFAULT 0,
  \`low_stock_threshold\` INT NOT NULL DEFAULT 10,
  \`image_url\` VARCHAR(255) NULL,
  \`is_active\` TINYINT(1) NOT NULL DEFAULT 1,
  \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  INDEX \`idx_prod_category\` (\`category_id\`),
  CONSTRAINT \`fk_prod_category\` FOREIGN KEY (\`category_id\`) REFERENCES \`product_categories\` (\`id\`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. SUPPLIERS TABLE
CREATE TABLE IF NOT EXISTS \`suppliers\` (
  \`id\` VARCHAR(64) NOT NULL,
  \`supplier_name\` VARCHAR(150) NOT NULL,
  \`contact_person\` VARCHAR(100) NOT NULL,
  \`email\` VARCHAR(100) NOT NULL,
  \`phone\` VARCHAR(30) NOT NULL,
  \`address\` TEXT NOT NULL,
  \`notes\` TEXT NULL,
  \`is_active\` TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. INVENTORY MOVEMENTS (Ledger)
CREATE TABLE IF NOT EXISTS \`inventory_movements\` (
  \`id\` VARCHAR(64) NOT NULL,
  \`product_id\` VARCHAR(64) NOT NULL,
  \`movement_type\` ENUM('STOCK_IN', 'STOCK_OUT', 'ADJUSTMENT', 'SUPPLY_REQUEST_FULFILLMENT') NOT NULL,
  \`quantity\` INT NOT NULL,
  \`previous_stock\` INT NOT NULL,
  \`new_stock\` INT NOT NULL,
  \`reference_type\` VARCHAR(50) NOT NULL,
  \`reference_id\` VARCHAR(50) NOT NULL,
  \`notes\` TEXT NULL,
  \`created_by_user_id\` VARCHAR(64) NOT NULL,
  \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  INDEX \`idx_im_product\` (\`product_id\`),
  CONSTRAINT \`fk_im_product\` FOREIGN KEY (\`product_id\`) REFERENCES \`products\` (\`id\`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT \`fk_im_user\` FOREIGN KEY (\`created_by_user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. SUPPLY REQUESTS & ITEMS
CREATE TABLE IF NOT EXISTS \`supply_requests\` (
  \`id\` VARCHAR(64) NOT NULL,
  \`reference_number\` VARCHAR(50) NOT NULL UNIQUE,
  \`franchisee_id\` VARCHAR(64) NOT NULL,
  \`status\` ENUM('Pending Review', 'Approved', 'Processing', 'Fulfilled', 'Rejected', 'Cancelled') NOT NULL DEFAULT 'Pending Review',
  \`total_amount_php\` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  \`requested_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`reviewed_by_admin_id\` VARCHAR(64) NULL,
  \`reviewed_at\` DATETIME NULL,
  \`review_comment\` TEXT NULL,
  \`fulfilled_at\` DATETIME NULL,
  \`delivery_notes\` TEXT NULL,
  PRIMARY KEY (\`id\`),
  INDEX \`idx_sr_franchisee\` (\`franchisee_id\`),
  CONSTRAINT \`fk_sr_franchisee\` FOREIGN KEY (\`franchisee_id\`) REFERENCES \`franchisees\` (\`id\`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. NOTIFICATIONS & AUDIT LOGS
CREATE TABLE IF NOT EXISTS \`notifications\` (
  \`id\` VARCHAR(64) NOT NULL,
  \`user_id\` VARCHAR(64) NOT NULL,
  \`title\` VARCHAR(150) NOT NULL,
  \`message\` TEXT NOT NULL,
  \`notification_type\` VARCHAR(50) NOT NULL,
  \`related_record_type\` VARCHAR(50) NULL,
  \`related_record_id\` VARCHAR(64) NULL,
  \`is_read\` TINYINT(1) NOT NULL DEFAULT 0,
  \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  INDEX \`idx_notif_user\` (\`user_id\`),
  CONSTRAINT \`fk_notif_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS \`audit_logs\` (
  \`id\` VARCHAR(64) NOT NULL,
  \`user_id\` VARCHAR(64) NOT NULL,
  \`user_name\` VARCHAR(100) NOT NULL,
  \`user_role\` VARCHAR(50) NOT NULL,
  \`action\` VARCHAR(100) NOT NULL,
  \`entity_type\` VARCHAR(50) NOT NULL,
  \`entity_id\` VARCHAR(64) NOT NULL,
  \`description\` TEXT NOT NULL,
  \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

  res.setHeader('Content-Type', 'text/plain');
  res.send(schemaSQL);
});

// ==========================================
// VITE DEV SERVER HOOK OR STATIC SERVE
// ==========================================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist/index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[AICE System] Backend running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
