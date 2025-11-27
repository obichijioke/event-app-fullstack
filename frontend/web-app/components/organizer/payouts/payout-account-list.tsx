'use client';

import { useState, useEffect } from 'react';
import { Building, Plus, CheckCircle, AlertCircle, Trash2 } from 'lucide-react';
import { organizerApi } from '@/lib/api/organizer-api';
import { useOrganizerStore } from '@/lib/stores/organizer-store';
import { useAuth } from '@/components/auth';
import toast from 'react-hot-toast';
import type { PayoutAccount } from '@/lib/types/organizer';

interface PayoutAccountListProps {
  onAddAccount?: () => void;
}

export function PayoutAccountList({ onAddAccount }: PayoutAccountListProps) {
  const { currentOrganization } = useOrganizerStore();
  const { initialized: authInitialized, accessToken } = useAuth();
  const [accounts, setAccounts] = useState<PayoutAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (authInitialized && accessToken && currentOrganization) {
      loadAccounts();
    }
  }, [authInitialized, accessToken, currentOrganization]);

  const loadAccounts = async () => {
    if (!currentOrganization) return;

    setLoading(true);
    try {
      const data = await organizerApi.payouts.listAccounts(currentOrganization.id);
      setAccounts(data);
    } catch (error: any) {
      console.error('Failed to load payout accounts:', error);
      toast.error(error?.message || 'Failed to load payout accounts');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (accountId: string) => {
    if (!currentOrganization) return;

    if (!confirm('Delete this payout account? This action cannot be undone.')) {
      return;
    }

    setDeletingId(accountId);
    try {
      await organizerApi.payouts.deleteAccount(accountId, currentOrganization.id);
      toast.success('Payout account deleted');
      await loadAccounts();
    } catch (error: any) {
      console.error('Failed to delete payout account:', error);
      toast.error(error?.message || 'Failed to delete payout account');
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="bg-card rounded-lg shadow-card border border-border p-6 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="space-y-2 flex-1">
                <div className="h-6 bg-secondary rounded w-1/3" />
                <div className="h-4 bg-secondary rounded w-1/4" />
              </div>
              <div className="h-8 w-24 bg-secondary rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Payout Accounts</h2>
          <p className="text-muted-foreground mt-1">Manage your payout destinations and banking information</p>
        </div>
        {onAddAccount && (
          <button
            onClick={onAddAccount}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition"
          >
            <Plus className="w-4 h-4" />
            Add Account
          </button>
        )}
      </div>

      {/* Empty State */}
      {accounts.length === 0 && !loading && (
        <div className="bg-card rounded-lg shadow-card p-12 text-center">
          <Building className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No Payout Accounts Yet</h3>
          <p className="text-muted-foreground mb-6">
            Add a payout account to receive payments from ticket sales
          </p>
          {onAddAccount && (
            <button
              onClick={onAddAccount}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition"
            >
              Add Your First Account
            </button>
          )}
        </div>
      )}

      {/* Account List */}
      {accounts.length > 0 && (
        <div className="space-y-4">
          {accounts.map((account) => (
            <div
              key={account.id}
              className="bg-card rounded-lg shadow-card border border-border p-6 hover:shadow-lg transition"
            >
              <div className="flex items-start justify-between">
                {/* Left Section */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <Building className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold capitalize">{account.provider}</h3>
                      <p className="text-sm text-muted-foreground font-mono">{account.externalId}</p>
                    </div>
                    {account.defaultAccount && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border bg-green-100 text-green-800 border-green-200">
                        <CheckCircle className="w-3 h-3" />
                        Default
                      </span>
                    )}
                  </div>

                  <div className="mt-4 text-sm text-muted-foreground">
                    <p>Added on {formatDate(account.createdAt)}</p>
                    {account.provider === 'bank_transfer' && (
                      <div className="mt-2 space-y-1">
                        {account.bankName && <p>Bank: {account.bankName}</p>}
                        {account.accountName && <p>Account Name: {account.accountName}</p>}
                        {account.sortCode && <p>Sort Code: {account.sortCode}</p>}
                        {account.bic && <p>BIC: {account.bic}</p>}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Section - Actions */}
                <div className="ml-4 flex items-center gap-2">
                  <button
                    onClick={() => handleDelete(account.id)}
                    className="p-2 text-destructive hover:bg-destructive/10 rounded-md transition disabled:opacity-50"
                    title="Delete account"
                    disabled={deletingId === account.id}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Account Status */}
              <div className="mt-4 pt-4 border-t border-border">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-muted-foreground">Account verified and active</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info Notice */}
      {accounts.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-900">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium mb-1">Payment Processing</p>
              <p>
                Payouts are sent to your default account. Processing typically takes 2-5 business days depending on
                your payment provider and banking institution.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
