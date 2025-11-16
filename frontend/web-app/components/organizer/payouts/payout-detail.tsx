'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, DollarSign, Clock, CheckCircle, XCircle, AlertCircle, Building } from 'lucide-react';
import { organizerApi } from '@/lib/api/organizer-api';
import { useOrganizerStore } from '@/lib/stores/organizer-store';
import { useAuth } from '@/components/auth';
import toast from 'react-hot-toast';
import Link from 'next/link';
import type { Payout, PayoutStatus } from '@/lib/types/organizer';

const STATUS_CONFIG: Record<PayoutStatus, { color: string; icon: React.ReactNode; label: string }> = {
  pending: {
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: <Clock className="w-5 h-5" />,
    label: 'Pending'
  },
  in_review: {
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: <AlertCircle className="w-5 h-5" />,
    label: 'In Review'
  },
  approved: {
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: <CheckCircle className="w-5 h-5" />,
    label: 'Approved'
  },
  failed: {
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: <XCircle className="w-5 h-5" />,
    label: 'Failed'
  },
  completed: {
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: <CheckCircle className="w-5 h-5" />,
    label: 'Completed'
  },
};

interface PayoutDetailProps {
  payoutId: string;
}

export function PayoutDetail({ payoutId }: PayoutDetailProps) {
  const router = useRouter();
  const { currentOrganization } = useOrganizerStore();
  const { initialized: authInitialized, accessToken } = useAuth();
  const [payout, setPayout] = useState<Payout | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    if (authInitialized && accessToken && currentOrganization) {
      loadPayout();
    }
  }, [authInitialized, accessToken, currentOrganization, payoutId]);

  const loadPayout = async () => {
    if (!currentOrganization) return;

    setLoading(true);
    setError(null);
    try {
      const data = await organizerApi.payouts.get(payoutId, currentOrganization.id);
      setPayout(data);
    } catch (error: any) {
      console.error('Failed to load payout:', error);
      setError(error?.message || 'Failed to load payout details');
      toast.error(error?.message || 'Failed to load payout');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (cents: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(cents / 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleRetry = async () => {
    if (!currentOrganization || !payout) return;

    setRetrying(true);
    try {
      const updated = await organizerApi.payouts.retry(payout.id, currentOrganization.id);
      setPayout(updated);
      toast.success('Payout retry queued');
    } catch (err: any) {
      console.error('Failed to retry payout:', err);
      toast.error(err?.message || 'Failed to retry payout');
    } finally {
      setRetrying(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-32 bg-secondary rounded-lg" />
        <div className="h-64 bg-secondary rounded-lg" />
        <div className="h-48 bg-secondary rounded-lg" />
      </div>
    );
  }

  if (error || !payout) {
    return (
      <div className="bg-card rounded-lg shadow-card border border-border p-12 text-center">
        <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">Failed to Load Payout</h3>
        <p className="text-muted-foreground mb-6">{error || 'Payout not found'}</p>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:opacity-90 transition"
        >
          Go Back
        </button>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[payout.status];

  return (
    <div className="space-y-6">
      {/* Header with Status */}
      <div className="bg-card rounded-lg shadow-card border border-border p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-3xl font-bold mb-2">
              {formatCurrency(payout.amountCents, payout.currency)}
            </h2>
            <p className="text-muted-foreground">Payout ID: {payout.id}</p>
          </div>
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border ${statusConfig.color}`}>
            {statusConfig.icon}
            <span className="font-semibold">{statusConfig.label}</span>
          </div>
        </div>

        {/* Failure Alert */}
        {payout.status === 'failed' && payout.failureReason && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-3">
              <XCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-red-800 mb-1">Payout Failed</h4>
                <p className="text-sm text-red-700">{payout.failureReason}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Payout Information */}
      <div className="bg-card rounded-lg shadow-card border border-border p-6">
        <h3 className="text-lg font-semibold mb-4">Payout Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm text-muted-foreground">Created Date</p>
              <p className="font-medium">{formatDate(payout.createdAt)}</p>
            </div>
          </div>

          {payout.scheduledFor && (
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Scheduled For</p>
                <p className="font-medium">{formatDate(payout.scheduledFor)}</p>
              </div>
            </div>
          )}

          {payout.initiatedAt && (
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Initiated Date</p>
                <p className="font-medium">{formatDate(payout.initiatedAt)}</p>
              </div>
            </div>
          )}

          <div className="flex items-start gap-3">
            <DollarSign className="w-5 h-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm text-muted-foreground">Amount</p>
              <p className="font-medium">{formatCurrency(payout.amountCents, payout.currency)}</p>
            </div>
          </div>

          {payout.provider && (
            <div className="flex items-start gap-3">
              <Building className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Payment Provider</p>
                <p className="font-medium capitalize">{payout.provider}</p>
              </div>
            </div>
          )}

          {payout.providerRef && (
            <div className="flex items-start gap-3">
              <Building className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Provider Reference</p>
                <p className="font-medium font-mono text-sm">{payout.providerRef}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-card rounded-lg shadow-card border border-border p-6">
        <h3 className="text-lg font-semibold mb-4">Payout Timeline</h3>
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium">Payout Created</p>
              <p className="text-sm text-muted-foreground">{formatDate(payout.createdAt)}</p>
            </div>
          </div>

          {payout.initiatedAt && (
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <Clock className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium">Payout Initiated</p>
                <p className="text-sm text-muted-foreground">{formatDate(payout.initiatedAt)}</p>
              </div>
            </div>
          )}

          {payout.status === 'completed' && (
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium">Payout Completed</p>
                <p className="text-sm text-muted-foreground">Funds transferred successfully</p>
              </div>
            </div>
          )}

          {payout.status === 'failed' && (
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                <XCircle className="w-4 h-4 text-red-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium">Payout Failed</p>
                <p className="text-sm text-muted-foreground">{payout.failureReason || 'Unknown error'}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <Link
          href="/organizer/payouts"
          className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:opacity-90 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Payouts
        </Link>

        {payout.status === 'failed' && (
          <button
            onClick={handleRetry}
            disabled={retrying}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition disabled:opacity-50"
          >
            {retrying ? 'Retrying...' : 'Retry Payout'}
          </button>
        )}
      </div>
    </div>
  );
}
