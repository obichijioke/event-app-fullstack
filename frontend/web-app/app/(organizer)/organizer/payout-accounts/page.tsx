'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { PayoutAccountList } from '@/components/organizer/payouts/payout-account-list';
import { AddPayoutAccountModal } from '@/components/organizer/payouts/add-payout-account-modal';

export default function PayoutAccountsPage() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleAddSuccess = () => {
    setShowAddModal(false);
    setRefreshKey((prev) => prev + 1); // Trigger re-render of list
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/organizer/payouts"
          className="p-2 hover:bg-secondary rounded-md transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Payout Accounts</h1>
          <p className="text-muted-foreground mt-1">Manage where you receive payments</p>
        </div>
      </div>

      <PayoutAccountList key={refreshKey} onAddAccount={() => setShowAddModal(true)} />

      {showAddModal && (
        <AddPayoutAccountModal
          onSuccess={handleAddSuccess}
          onCancel={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
}
