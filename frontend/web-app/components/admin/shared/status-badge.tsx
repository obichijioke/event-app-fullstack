'use client';

import { Badge } from '@/components/ui';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const statusConfig: Record<string, { variant: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error'; label: string }> = {
  // User statuses
  active: { variant: 'success', label: 'Active' },
  inactive: { variant: 'secondary', label: 'Inactive' },
  suspended: { variant: 'error', label: 'Suspended' },
  user_pending: { variant: 'warning', label: 'Pending' },

  // Event statuses
  draft: { variant: 'secondary', label: 'Draft' },
  pending_approval: { variant: 'warning', label: 'Pending Approval' },
  approved: { variant: 'success', label: 'Approved' },
  live: { variant: 'success', label: 'Live' },
  paused: { variant: 'warning', label: 'Paused' },
  ended: { variant: 'secondary', label: 'Ended' },
  event_canceled: { variant: 'error', label: 'Canceled' },

  // Order statuses
  order_pending: { variant: 'warning', label: 'Pending' },
  order_paid: { variant: 'success', label: 'Paid' },
  order_canceled: { variant: 'error', label: 'Canceled' },
  refunded: { variant: 'secondary', label: 'Refunded' },
  chargeback: { variant: 'error', label: 'Chargeback' },

  // Payment statuses
  requires_action: { variant: 'warning', label: 'Requires Action' },
  authorized: { variant: 'primary', label: 'Authorized' },
  captured: { variant: 'success', label: 'Captured' },
  voided: { variant: 'error', label: 'Voided' },
  payment_failed: { variant: 'error', label: 'Failed' },

  // Payout statuses
  in_review: { variant: 'warning', label: 'In Review' },
  payout_paid: { variant: 'success', label: 'Paid' },
  payout_failed: { variant: 'error', label: 'Failed' },

  // Moderation statuses
  moderation_open: { variant: 'warning', label: 'Open' },
  needs_changes: { variant: 'warning', label: 'Needs Changes' },
  rejected: { variant: 'error', label: 'Rejected' },
  resolved: { variant: 'success', label: 'Resolved' },

  // Visibility
  public: { variant: 'success', label: 'Public' },
  unlisted: { variant: 'secondary', label: 'Unlisted' },
  private: { variant: 'error', label: 'Private' },

  // Refund statuses
  refund_pending: { variant: 'warning', label: 'Pending' },
  refund_approved: { variant: 'primary', label: 'Approved' },
  refund_processed: { variant: 'success', label: 'Processed' },
  refund_failed: { variant: 'error', label: 'Failed' },
  refund_canceled: { variant: 'secondary', label: 'Canceled' },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status.toLowerCase()] || {
    variant: 'secondary',
    label: status,
  };

  return (
    <Badge
      variant={config.variant}
      size="sm"
      className={cn('font-medium', className)}
    >
      {config.label}
    </Badge>
  );
}