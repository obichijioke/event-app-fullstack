'use client';

import { Badge } from '@/components/ui/badge';
import { OrganizationType } from '@/lib/types/organizer';
import { Building2, User, Heart, Landmark } from 'lucide-react';

interface OrganizationTypeBadgeProps {
  type: OrganizationType;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export function OrganizationTypeBadge({
  type,
  size = 'md',
  showIcon = true,
}: OrganizationTypeBadgeProps) {
  const typeConfig = {
    personal: {
      label: 'Personal',
      color: 'blue',
      icon: User,
      className: 'bg-blue-100 text-blue-800 border-blue-200',
    },
    business: {
      label: 'Business',
      color: 'green',
      icon: Building2,
      className: 'bg-green-100 text-green-800 border-green-200',
    },
    nonprofit: {
      label: 'Nonprofit',
      color: 'purple',
      icon: Heart,
      className: 'bg-purple-100 text-purple-800 border-purple-200',
    },
    government: {
      label: 'Government',
      color: 'gray',
      icon: Landmark,
      className: 'bg-gray-100 text-gray-800 border-gray-200',
    },
  };

  const config = typeConfig[type];
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  const iconSizes = {
    sm: 12,
    md: 14,
    lg: 16,
  };

  return (
    <Badge className={`${config.className} ${sizeClasses[size]} inline-flex items-center gap-1.5 font-medium border`}>
      {showIcon && <Icon size={iconSizes[size]} />}
      <span>{config.label}</span>
    </Badge>
  );
}

interface OrganizationVerificationBadgeProps {
  type: OrganizationType;
  status: 'pending' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'suspended' | 'banned';
}

export function OrganizationVerificationBadge({ type, status }: OrganizationVerificationBadgeProps) {
  // Personal orgs are auto-approved
  if (type === 'personal' && status === 'approved') {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg">
        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        <span className="text-sm text-green-800 font-medium">Auto-verified</span>
      </div>
    );
  }

  // Business/Nonprofit/Government verification status
  const statusConfig = {
    pending: {
      label: 'Verification Pending',
      className: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      dotColor: 'bg-yellow-500',
    },
    submitted: {
      label: 'Verification Submitted',
      className: 'bg-blue-50 border-blue-200 text-blue-800',
      dotColor: 'bg-blue-500',
    },
    under_review: {
      label: 'Under Review',
      className: 'bg-purple-50 border-purple-200 text-purple-800',
      dotColor: 'bg-purple-500',
    },
    approved: {
      label: 'Verified',
      className: 'bg-green-50 border-green-200 text-green-800',
      dotColor: 'bg-green-500',
    },
    rejected: {
      label: 'Verification Rejected',
      className: 'bg-red-50 border-red-200 text-red-800',
      dotColor: 'bg-red-500',
    },
    suspended: {
      label: 'Suspended',
      className: 'bg-orange-50 border-orange-200 text-orange-800',
      dotColor: 'bg-orange-500',
    },
    banned: {
      label: 'Banned',
      className: 'bg-red-50 border-red-200 text-red-800',
      dotColor: 'bg-red-500',
    },
  };

  const config = statusConfig[status];

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 border rounded-lg ${config.className}`}>
      <div className={`w-2 h-2 rounded-full ${config.dotColor}`}></div>
      <span className="text-sm font-medium">{config.label}</span>
    </div>
  );
}
