'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, DollarSign, Search, Filter, Plus, AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react';
import { organizerApi } from '@/lib/api/organizer-api';
import { useOrganizerStore } from '@/lib/stores/organizer-store';
import { useAuth } from '@/components/auth';
import { CurrencyDisplay } from '@/components/common/currency-display';
import { RequestPayoutModal } from './request-payout-modal';
import toast from 'react-hot-toast';
import type { Payout, PayoutStatus } from '@/lib/types/organizer';

const STATUS_COLORS: Record<PayoutStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  in_review: 'bg-blue-100 text-blue-800 border-blue-200',
  paid: 'bg-green-100 text-green-800 border-green-200',
  failed: 'bg-red-100 text-red-800 border-red-200',
  canceled: 'bg-gray-100 text-gray-800 border-gray-200',
};

const STATUS_ICONS: Record<PayoutStatus, React.ReactNode> = {
  pending: <Clock className="w-4 h-4" />,
  in_review: <AlertCircle className="w-4 h-4" />,
  paid: <CheckCircle className="w-4 h-4" />,
  failed: <XCircle className="w-4 h-4" />,
  canceled: <AlertCircle className="w-4 h-4" />,
};

export function PayoutList() {
  const router = useRouter();
  const { currentOrganization } = useOrganizerStore();
  const { initialized: authInitialized, accessToken } = useAuth();
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showRequestModal, setShowRequestModal] = useState(false);

  useEffect(() => {
    if (authInitialized && accessToken && currentOrganization) {
      loadPayouts();
    }
  }, [authInitialized, accessToken, currentOrganization, statusFilter]);

  const loadPayouts = async () => {
    if (!currentOrganization) return;

    setLoading(true);
    try {
      const params = statusFilter !== 'all' ? { status: statusFilter } : undefined;
      const data = await organizerApi.payouts.list(currentOrganization.id, params);
      setPayouts(data);
    } catch (error: any) {
      console.error('Failed to load payouts:', error);
      toast.error(error?.message || 'Failed to load payouts');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const filteredPayouts = payouts.filter((payout) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        payout.id.toLowerCase().includes(query) ||
        payout.provider?.toLowerCase().includes(query) ||
        payout.providerRef?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
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
      {/* Header with Request Payout Button */}
      <div className="flex items-center justify-between">
        <div className="flex-1" />
        <button
          onClick={() => setShowRequestModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition"
        >
          <Plus className="w-4 h-4" />
          Request Payout
        </button>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by ID, provider, or reference..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Status Filter */}
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="pl-10 pr-4 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary appearance-none bg-background min-w-[160px]"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="in_review">In Review</option>
            <option value="paid">Paid</option>
            <option value="failed">Failed</option>
            <option value="canceled">Canceled</option>
          </select>
        </div>
      </div>

      {/* Empty State */}
      {filteredPayouts.length === 0 && !loading && (
        <div className="bg-card rounded-lg shadow-card p-12 text-center">
          <DollarSign className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">
            {searchQuery || statusFilter !== 'all' ? 'No Payouts Found' : 'No Payouts Yet'}
          </h3>
          <p className="text-muted-foreground mb-6">
            {searchQuery || statusFilter !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Payouts will appear here once you request them'}
          </p>
        </div>
      )}

      {/* Payout List */}
      {filteredPayouts.length > 0 && (
        <div className="space-y-4">
          {filteredPayouts.map((payout) => (
            <div
              key={payout.id}
              onClick={() => router.push(`/organizer/payouts/${payout.id}`)}
              className="bg-card rounded-lg shadow-card border border-border p-6 hover:shadow-lg transition cursor-pointer"
            >
              <div className="flex items-start justify-between">
                {/* Left Section */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">
                      <CurrencyDisplay amountCents={payout.amountCents} currency={payout.currency} showFree={false} />
                    </h3>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${STATUS_COLORS[payout.status]}`}>
                      {STATUS_ICONS[payout.status]}
                      {payout.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>Created: {formatDate(payout.createdAt)}</span>
                    </div>
                    {payout.scheduledFor && (
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>Scheduled: {formatDate(payout.scheduledFor)}</span>
                      </div>
                    )}
                    {payout.provider && (
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        <span className="capitalize">{payout.provider}</span>
                        {payout.providerRef && <span className="text-xs">({payout.providerRef})</span>}
                      </div>
                    )}
                  </div>

                  {payout.failureReason && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-sm text-red-800 font-medium">Failure Reason:</p>
                      <p className="text-sm text-red-700">{payout.failureReason}</p>
                    </div>
                  )}
                </div>

                {/* Right Section - Arrow */}
                <div className="ml-4 text-muted-foreground">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stats Footer */}
      {filteredPayouts.length > 0 && (
        <div className="text-sm text-muted-foreground text-center pt-4 border-t border-border">
          Showing {filteredPayouts.length} of {payouts.length} payout{payouts.length !== 1 ? 's' : ''}
        </div>
      )}

      {/* Request Payout Modal */}
      {showRequestModal && (
        <RequestPayoutModal
          onSuccess={() => {
            setShowRequestModal(false);
            loadPayouts();
          }}
          onCancel={() => setShowRequestModal(false)}
        />
      )}
    </div>
  );
}
