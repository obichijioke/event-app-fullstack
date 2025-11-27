'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck, Wallet } from 'lucide-react';
import { PayoutAccountList } from '@/components/organizer/payouts/payout-account-list';
import { AddPayoutAccountModal } from '@/components/organizer/payouts/add-payout-account-modal';
import { EmptyState } from '@/components/organizer/empty-state';
import { useOrganizerStore } from '@/lib/stores/organizer-store';

export function OrganizerPayoutAccounts() {
  const { currentOrganization } = useOrganizerStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleAddSuccess = () => {
    setShowAddModal(false);
    setRefreshKey((prev) => prev + 1);
  };

  if (!currentOrganization) {
    return (
      <div className="container mx-auto px-4 py-8">
        <EmptyState
          title="No Organization Selected"
          description="Select an organization to manage payout accounts"
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Link
            href="/organizer/organization"
            className="p-2 hover:bg-secondary rounded-md transition"
            aria-label="Back to organization settings"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Organization</p>
            <h1 className="text-3xl font-bold">Payout Accounts</h1>
            <p className="text-muted-foreground mt-1">
              Manage where {currentOrganization.name || 'your organization'} receives payouts
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 mb-8">
        <div className="bg-card border border-border rounded-lg p-4 flex items-center gap-3">
          <Wallet className="w-10 h-10 text-blue-600" />
          <div>
            <p className="text-sm text-muted-foreground">Default payout destination</p>
            <p className="text-lg font-semibold">Use a single account for all payouts</p>
            <p className="text-sm text-muted-foreground mt-1">
              Add an account and mark it as default so every payout from ticket sales is routed correctly.
            </p>
          </div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4 flex items-center gap-3">
          <ShieldCheck className="w-10 h-10 text-green-600" />
          <div>
            <p className="text-sm text-muted-foreground">Compliance ready</p>
            <p className="text-lg font-semibold">Verified before transfers</p>
            <p className="text-sm text-muted-foreground mt-1">
              Accounts are validated before payouts are sent. You will be notified if anything needs attention.
            </p>
          </div>
        </div>
      </div>

      <PayoutAccountList
        key={refreshKey}
        onAddAccount={() => setShowAddModal(true)}
      />

      {showAddModal && (
        <AddPayoutAccountModal
          onSuccess={handleAddSuccess}
          onCancel={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
}
