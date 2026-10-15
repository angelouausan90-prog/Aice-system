/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { RecruitmentStatus, WorkReportStatus, SupplyRequestStatus } from '../types.ts';
import { Clock, CheckCircle2, XCircle, AlertTriangle, Eye, Truck, Box } from 'lucide-react';

interface Props {
  status: RecruitmentStatus | WorkReportStatus | SupplyRequestStatus | string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<Props> = ({ status, size = 'sm' }) => {
  const textSize = size === 'sm' ? 'text-xs px-2.5 py-0.5' : 'text-sm px-3 py-1';

  switch (status) {
    case 'Pending Verification':
    case 'Pending Review':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full font-medium bg-amber-50 text-amber-700 border border-amber-200 ${textSize}`}>
          <Clock className="w-3.5 h-3.5 text-amber-500" />
          {status}
        </span>
      );

    case 'Under Review':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full font-medium bg-blue-50 text-blue-700 border border-blue-200 ${textSize}`}>
          <Eye className="w-3.5 h-3.5 text-blue-500" />
          {status}
        </span>
      );

    case 'Approved':
    case 'Verified':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 ${textSize}`}>
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          {status}
        </span>
      );

    case 'Needs Revision':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full font-medium bg-orange-50 text-orange-700 border border-orange-200 ${textSize}`}>
          <AlertTriangle className="w-3.5 h-3.5 text-orange-500" />
          {status}
        </span>
      );

    case 'Rejected':
    case 'Cancelled':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full font-medium bg-rose-50 text-rose-700 border border-rose-200 ${textSize}`}>
          <XCircle className="w-3.5 h-3.5 text-rose-500" />
          {status}
        </span>
      );

    case 'Processing':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full font-medium bg-indigo-50 text-indigo-700 border border-indigo-200 ${textSize}`}>
          <Box className="w-3.5 h-3.5 text-indigo-500" />
          Processing
        </span>
      );

    case 'Fulfilled':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full font-medium bg-teal-50 text-teal-700 border border-teal-200 ${textSize}`}>
          <Truck className="w-3.5 h-3.5 text-teal-500" />
          Fulfilled
        </span>
      );

    case 'Active':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 ${textSize}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          Active
        </span>
      );

    case 'Inactive':
    case 'Suspended':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full font-medium bg-slate-100 text-slate-700 border border-slate-200 ${textSize}`}>
          {status}
        </span>
      );

    default:
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full font-medium bg-slate-100 text-slate-700 ${textSize}`}>
          {status}
        </span>
      );
  }
};
