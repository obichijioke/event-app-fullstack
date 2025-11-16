'use client';

import { useState } from 'react';
import { X, Building, AlertTriangle, CheckCircle } from 'lucide-react';
import { organizerApi } from '@/lib/api/organizer-api';
import { useOrganizerStore } from '@/lib/stores/organizer-store';
import toast from 'react-hot-toast';
import type { CreatePayoutAccountDto } from '@/lib/types/organizer';

interface AddPayoutAccountModalProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function AddPayoutAccountModal({ onSuccess, onCancel }: AddPayoutAccountModalProps) {
  const { currentOrganization } = useOrganizerStore();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreatePayoutAccountDto>({
    provider: 'stripe',
    externalId: '',
    defaultAccount: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrganization) return;

    setLoading(true);
    try {
      await organizerApi.payouts.createAccount(formData, currentOrganization.id);
      toast.success('Payout account added successfully');
      onSuccess();
    } catch (error: any) {
      console.error('Failed to create payout account:', error);
      toast.error(error?.message || 'Failed to add payout account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg shadow-lg max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-bold">Add Payout Account</h2>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-secondary rounded-md transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Info Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-medium mb-1">Connect Your Payment Account</p>
              <p>
                This account will be used to receive payouts from ticket sales. Make sure the account ID matches your
                payment provider's records.
              </p>
            </div>
          </div>

          {/* Payment Provider */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Payment Provider <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <select
                value={formData.provider}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    provider: e.target.value,
                  }))
                }
                required
                className="w-full pl-10 pr-4 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="stripe">Stripe</option>
                <option value="paystack">Paystack</option>
                <option value="bank_transfer">Bank Transfer</option>
              </select>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Select the payment provider for this account
            </p>
          </div>

          {/* External Account ID */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Account ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.externalId}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  externalId: e.target.value,
                }))
              }
              required
              placeholder={
                formData.provider === 'stripe'
                  ? 'acct_xxxxxxxxxxxxx'
                  : formData.provider === 'paystack'
                  ? 'ACCT_xxxxxxxxxxxxx'
                  : 'Account number or identifier'
              }
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {formData.provider === 'stripe' && 'Your Stripe Connect account ID (starts with acct_)'}
              {formData.provider === 'paystack' && 'Your Paystack subaccount code'}
              {formData.provider === 'bank_transfer' && 'Your bank account number or IBAN'}
            </p>
          </div>

          {/* Default Account Toggle */}
          <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg border border-border">
            <div className="flex-1">
              <label htmlFor="defaultAccount" className="block text-sm font-medium mb-1 cursor-pointer">
                Set as Default Account
              </label>
              <p className="text-xs text-muted-foreground">
                Use this account for all future payouts by default
              </p>
            </div>
            <input
              id="defaultAccount"
              type="checkbox"
              checked={formData.defaultAccount}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  defaultAccount: e.target.checked,
                }))
              }
              className="w-5 h-5 text-primary focus:ring-2 focus:ring-primary rounded cursor-pointer"
            />
          </div>

          {/* Provider-Specific Instructions */}
          {formData.provider === 'stripe' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-900">
              <p className="font-medium mb-1">Finding Your Stripe Account ID</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Log in to your Stripe Dashboard</li>
                <li>Navigate to Settings → Account details</li>
                <li>Copy your Connect account ID (starts with "acct_")</li>
              </ol>
            </div>
          )}

          {formData.provider === 'paystack' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-900">
              <p className="font-medium mb-1">Finding Your Paystack Subaccount</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Log in to your Paystack Dashboard</li>
                <li>Navigate to Settings → Subaccounts</li>
                <li>Create a subaccount if you haven't already</li>
                <li>Copy the subaccount code</li>
              </ol>
            </div>
          )}

          {/* Verification Notice */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3 text-sm text-green-900">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium mb-1">Account Verification</p>
              <p>
                Your account will be verified automatically. You'll be notified if there are any issues with the
                account information.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-border rounded-lg hover:bg-secondary transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Adding Account...
                </>
              ) : (
                <>
                  <Building className="w-4 h-4" />
                  Add Account
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
