'use client';

import { CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import type { OrganizationStatus } from '@/lib/types/organizer';

interface VerificationBadgeProps {
  status: OrganizationStatus;
}

const STATUS_CONFIG = {
  pending: {
    label: 'Pending',
    icon: Clock,
    color: 'text-gray-500 bg-gray-100',
  },
  submitted: {
    label: 'Submitted',
    icon: Clock,
    color: 'text-blue-600 bg-blue-100',
  },
  under_review: {
    label: 'Under Review',
    icon: AlertCircle,
    color: 'text-amber-600 bg-amber-100',
  },
  approved: {
    label: 'Verified',
    icon: CheckCircle,
    color: 'text-green-600 bg-green-100',
  },
  rejected: {
    label: 'Rejected',
    icon: XCircle,
    color: 'text-red-600 bg-red-100',
  },
  suspended: {
    label: 'Suspended',
    icon: AlertCircle,
    color: 'text-orange-600 bg-orange-100',
  },
  banned: {
    label: 'Banned',
    icon: XCircle,
    color: 'text-red-800 bg-red-200',
  },
};

export function VerificationBadge({ status }: VerificationBadgeProps) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${config.color}`}>
      <Icon className="w-4 h-4" />
      <span className="text-sm font-medium">{config.label}</span>
    </div>
  );
}
