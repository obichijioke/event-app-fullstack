'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Loader2, Building, Shield, Users } from 'lucide-react';
import { useOrganizerStore } from '@/lib/stores/organizer-store';
import { organizerApi } from '@/lib/api/organizer-api';
import { ProfileForm } from '@/components/organizer/organization/profile-form';
import { VerificationStatus } from '@/components/organizer/organization/verification-status';
import { EmptyState } from '@/components/organizer/empty-state';

import type { OrganizationStatus } from '@/lib/types/organizer';

interface OrganizationDetails {
  id: string;
  name: string;
  legalName?: string;
  website?: string;
  country?: string;
  supportEmail?: string;
  taxId?: string;
  status: OrganizationStatus;
  verifiedAt?: string;
  verificationNotes?: string;
  _count?: {
    events: number;
    members: number;
  };
}

type TabType = 'profile' | 'verification' | 'team';

export default function OrganizationSettingsPage() {
  const { currentOrganization } = useOrganizerStore();
  const [organization, setOrganization] = useState<OrganizationDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('profile');

  const canEdit = currentOrganization?.role === 'owner' || currentOrganization?.role === 'manager';

  useEffect(() => {
    async function loadOrganization() {
      if (!currentOrganization) return;

      try {
        setLoading(true);
        setError(null);

        const data = await organizerApi.organization.get(currentOrganization.id);
        setOrganization(data);
      } catch (err) {
        console.error('Failed to load organization:', err);
        setError(err instanceof Error ? err.message : 'Failed to load organization');
      } finally {
        setLoading(false);
      }
    }

    loadOrganization();
  }, [currentOrganization]);

  const handleUpdateOrganization = async (data: Partial<OrganizationDetails>) => {
    if (!currentOrganization) return;

    const updated = await organizerApi.organization.update(currentOrganization.id, data);
    setOrganization(updated);
  };

  if (!currentOrganization) {
    return (
      <div className="container mx-auto px-4 py-8">
        <EmptyState
          title="No Organization Selected"
          description="Please select an organization to view settings"
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (error || !organization) {
    return (
      <div className="container mx-auto px-4 py-8">
        <EmptyState
          title="Failed to Load Organization"
          description={error || 'Organization not found'}
          action={
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90"
            >
              Retry
            </button>
          }
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Organization Settings</h1>
          <p className="text-muted-foreground mt-1">{organization.name}</p>
        </div>
        <Link
          href="/organizer"
          className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:opacity-90 transition text-sm"
        >
          ← Back to Dashboard
        </Link>
      </div>

      {/* Organization Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Building className="w-8 h-8 text-blue-600" />
            <div>
              <p className="text-2xl font-bold">{organization._count?.events || 0}</p>
              <p className="text-sm text-muted-foreground">Total Events</p>
            </div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-2xl font-bold">{organization._count?.members || 0}</p>
              <p className="text-sm text-muted-foreground">Team Members</p>
            </div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-purple-600" />
            <div>
              <p className="text-2xl font-bold capitalize">{organization.status}</p>
              <p className="text-sm text-muted-foreground">Status</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-border">
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-3 font-medium transition border-b-2 ${
            activeTab === 'profile'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Profile
        </button>
        <button
          onClick={() => setActiveTab('verification')}
          className={`px-4 py-3 font-medium transition border-b-2 ${
            activeTab === 'verification'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Verification
        </button>
        <Link
          href="/organizer/organization/members"
          className="px-4 py-3 font-medium transition border-b-2 border-transparent text-muted-foreground hover:text-foreground"
        >
          Team Members
        </Link>
      </div>

      {/* Tab Content */}
      <div className="bg-card rounded-lg border border-border p-6">
        {activeTab === 'profile' && (
          <div>
            <h2 className="text-xl font-semibold mb-6">Organization Profile</h2>
            <ProfileForm
              organization={organization}
              onSubmit={handleUpdateOrganization}
              canEdit={canEdit}
            />
          </div>
        )}

        {activeTab === 'verification' && (
          <div>
            <h2 className="text-xl font-semibold mb-6">Verification</h2>
            <VerificationStatus
              status={organization.status}
              verifiedAt={organization.verifiedAt}
              verificationNotes={organization.verificationNotes}
            />
            {organization.status === 'pending' && (
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-900">
                  To get verified, you need to submit verification documents. Contact support to learn more about the verification process.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
