'use client';

import { CheckCircle, AlertCircle, Info } from 'lucide-react';
import { VerificationBadge } from './verification-badge';
import type { OrganizationStatus } from '@/lib/types/organizer';

interface VerificationStatusProps {
  status: OrganizationStatus;
  verifiedAt?: string;
  verificationNotes?: string;
}

export function VerificationStatus({ status, verifiedAt, verificationNotes }: VerificationStatusProps) {
  const getMessage = () => {
    switch (status) {
      case 'pending':
        return {
          icon: Info,
          color: 'text-blue-600 bg-blue-50',
          title: 'Verification Pending',
          message: 'Your organization has been created. Submit verification documents to get verified.',
        };
      case 'submitted':
        return {
          icon: Info,
          color: 'text-blue-600 bg-blue-50',
          title: 'Documents Submitted',
          message: 'Your verification documents have been submitted and are awaiting review.',
        };
      case 'under_review':
        return {
          icon: AlertCircle,
          color: 'text-amber-600 bg-amber-50',
          title: 'Under Review',
          message: 'Your verification documents are currently being reviewed by our team.',
        };
      case 'approved':
        return {
          icon: CheckCircle,
          color: 'text-green-600 bg-green-50',
          title: 'Verified Organization',
          message: verifiedAt
            ? `Your organization was verified on ${new Date(verifiedAt).toLocaleDateString()}.`
            : 'Your organization is verified and can create events.',
        };
      case 'rejected':
        return {
          icon: AlertCircle,
          color: 'text-red-600 bg-red-50',
          title: 'Verification Rejected',
          message: verificationNotes || 'Your verification was rejected. Please update your documents and resubmit.',
        };
      case 'suspended':
        return {
          icon: AlertCircle,
          color: 'text-orange-600 bg-orange-50',
          title: 'Account Suspended',
          message: verificationNotes || 'Your organization has been temporarily suspended. Contact support for assistance.',
        };
      case 'banned':
        return {
          icon: AlertCircle,
          color: 'text-red-800 bg-red-100',
          title: 'Account Banned',
          message: verificationNotes || 'Your organization has been permanently banned.',
        };
      default:
        return {
          icon: Info,
          color: 'text-gray-600 bg-gray-50',
          title: 'Unknown Status',
          message: 'Unknown verification status.',
        };
    }
  };

  const info = getMessage();
  const Icon = info.icon;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Verification Status</h3>
        <VerificationBadge status={status} />
      </div>

      <div className={`flex gap-3 p-4 rounded-lg border ${info.color}`}>
        <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium mb-1">{info.title}</p>
          <p className="text-sm">{info.message}</p>
        </div>
      </div>

      {(status === 'rejected' || status === 'suspended' || status === 'banned') && verificationNotes && (
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm font-medium mb-2">Admin Notes:</p>
          <p className="text-sm text-muted-foreground">{verificationNotes}</p>
        </div>
      )}
    </div>
  );
}
