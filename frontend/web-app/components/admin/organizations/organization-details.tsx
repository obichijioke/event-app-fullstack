'use client';

import * as React from 'react';
import { Text, Button } from '@/components/ui';
import { StatusBadge } from '@/components/admin';
import { adminApiService, type AdminOrganizationVerification } from '@/services/admin-api.service';
import { useAuth } from '@/components/auth';
import { cn } from '@/lib/utils';

interface OrganizationDetailsProps {
  orgId: string;
  className?: string;
}

export function OrganizationDetails({ orgId, className }: OrganizationDetailsProps) {
  const { accessToken } = useAuth();
  const [org, setOrg] = React.useState<AdminOrganizationVerification | null>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!accessToken || !orgId) return;
    loadOrganization();
  }, [accessToken, orgId]);

  const loadOrganization = async () => {
    if (!accessToken) return;

    setLoading(true);
    try {
      const response = await adminApiService.getOrganizationVerification(orgId, accessToken);
      if (response.success && response.data) {
        setOrg(response.data);
      }
    } catch (error) {
      console.error('Failed to load organization:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!accessToken || !confirm('Are you sure you want to approve this organization?')) return;

    try {
      await adminApiService.approveOrganization(orgId, {}, accessToken);
      alert('Organization approved successfully');
      loadOrganization();
    } catch (error) {
      console.error('Failed to approve organization:', error);
      alert('Failed to approve organization');
    }
  };

  const handleReject = async () => {
    const reason = prompt('Enter rejection reason:');
    if (!accessToken || !reason) return;

    try {
      await adminApiService.rejectOrganization(orgId, { reason }, accessToken);
      alert('Organization rejected successfully');
      loadOrganization();
    } catch (error) {
      console.error('Failed to reject organization:', error);
      alert('Failed to reject organization');
    }
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  if (!org) {
    return <div className="p-8">Organization not found</div>;
  }

  return (
    <div className={cn('space-y-6', className)}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Organization Details</h1>
          <p className="text-muted-foreground mt-1">{org.name}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="primary" onClick={handleApprove}>Approve</Button>
          <Button variant="destructive" onClick={handleReject}>Reject</Button>
        </div>
      </div>

      <div className="bg-card p-6 rounded-lg border border-border">
        <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Text className="text-sm text-muted-foreground">Organization Name</Text>
            <Text className="font-medium">{org.name}</Text>
          </div>
          <div>
            <Text className="text-sm text-muted-foreground">Legal Name</Text>
            <Text className="font-medium">{org.legalName || '—'}</Text>
          </div>
          <div>
            <Text className="text-sm text-muted-foreground">Type</Text>
            <Text className="font-medium capitalize">{org.orgType}</Text>
          </div>
          <div>
            <Text className="text-sm text-muted-foreground">Status</Text>
            <StatusBadge status={org.status} />
          </div>
          <div>
            <Text className="text-sm text-muted-foreground">Trust Score</Text>
            <Text className="font-medium">{org.trustScore}/100</Text>
          </div>
          <div>
            <Text className="text-sm text-muted-foreground">Created</Text>
            <Text className="font-medium">{new Date(org.createdAt).toLocaleDateString()}</Text>
          </div>
        </div>
      </div>

      <div className="bg-card p-6 rounded-lg border border-border">
        <h2 className="text-xl font-semibold mb-4">Verification Documents</h2>
        {org.documents && org.documents.length > 0 ? (
          <div className="space-y-4">
            {org.documents.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between p-4 border border-border rounded">
                <div>
                  <Text className="font-medium">{doc.documentType}</Text>
                  <Text className="text-xs text-muted-foreground">{doc.fileName}</Text>
                </div>
                <div className="flex items-center gap-4">
                  <StatusBadge status={doc.status} />
                  <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="text-primary text-sm">
                    View
                  </a>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Text className="text-muted-foreground">No documents uploaded</Text>
        )}
      </div>
    </div>
  );
}
