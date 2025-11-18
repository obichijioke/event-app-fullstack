'use client';

import { useEffect, useState } from 'react';
import { accountApi, type Refund } from '@/lib/api/account-api';
import { CurrencyDisplay } from '@/components/common/currency-display';
import { Loader2 } from 'lucide-react';

export default function RefundsPage() {
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRefunds();
  }, [activeTab]);

  const fetchRefunds = async () => {
    setLoading(true);
    setError(null);
    try {
      const status = activeTab === 'active' ? 'pending' : undefined;
      const data = await accountApi.getRefunds({ status });
      setRefunds(data.items);
    } catch (err: any) {
      setError(err?.message || 'Failed to load refunds');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-warning/10 text-warning';
      case 'approved':
        return 'bg-primary/10 text-primary';
      case 'processed':
        return 'bg-success/10 text-success';
      case 'failed':
      case 'canceled':
        return 'bg-error/10 text-error';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">Refunds</h1>

      {/* Tabs */}
      <div className="mb-6 flex gap-4 border-b border-border">
        <button
          className={`px-4 py-2 border-b-2 ${
            activeTab === 'active'
              ? 'border-primary text-primary font-medium'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => setActiveTab('active')}
        >
          Active Requests
        </button>
        <button
          className={`px-4 py-2 border-b-2 ${
            activeTab === 'history'
              ? 'border-primary text-primary font-medium'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => setActiveTab('history')}
        >
          History
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Loading refunds...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-destructive/10 border border-destructive rounded-lg p-4 mb-6">
          <p className="text-destructive text-sm">{error}</p>
        </div>
      )}

      {/* Refunds List */}
      {!loading && !error && (
        <div className="space-y-4">
          {refunds.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              No {activeTab === 'active' ? 'active' : ''} refund requests found
            </p>
          ) : (
            refunds.map((refund) => (
              <div key={refund.id} className="rounded-lg bg-card p-6 shadow-card">
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">Order #{refund.orderId.slice(0, 8)}</h3>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(refund.order.createdAt)}
                    </p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs ${getStatusColor(refund.status)}`}>
                    {refund.status}
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Refund Amount</span>
                    <span className="font-medium">
                      <CurrencyDisplay amountCents={Number(refund.amountCents)} currency={refund.currency} />
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Original Order</span>
                    <span className="font-medium">
                      <CurrencyDisplay amountCents={Number(refund.order.totalCents)} currency={refund.order.currency} />
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Requested</span>
                    <span>{formatDate(refund.createdAt)}</span>
                  </div>
                  {refund.processedAt && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Processed</span>
                      <span>{formatDate(refund.processedAt)}</span>
                    </div>
                  )}
                  {refund.reason && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Reason</span>
                      <span className="text-right max-w-xs">{refund.reason}</span>
                    </div>
                  )}
                </div>
                {refund.status === 'pending' && (
                  <div className="mt-4 border-t border-border pt-4">
                    <p className="text-xs text-muted-foreground">
                      Your refund request is being processed. You will receive an email once it&apos;s approved.
                    </p>
                  </div>
                )}
                {refund.status === 'processed' && (
                  <div className="mt-4 border-t border-border pt-4">
                    <p className="text-xs text-success">
                      Refund has been processed and sent to your original payment method.
                    </p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
