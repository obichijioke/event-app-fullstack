'use client';

import { useEffect, useState } from 'react';
import { accountApi, type Refund } from '@/lib/api/account-api';
import { CurrencyDisplay } from '@/components/common/currency-display';
import { Loader2, RotateCcw, AlertCircle, CheckCircle2 } from 'lucide-react';

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
        return 'bg-amber-100 text-amber-800';
      case 'approved':
        return 'bg-blue-100 text-blue-800';
      case 'processed':
        return 'bg-emerald-100 text-emerald-800';
      case 'failed':
      case 'canceled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-slate-200 text-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="overflow-hidden rounded-xl border border-border/70 bg-card">
        <div className="bg-linear-to-r from-slate-900 via-slate-800 to-slate-700 px-6 py-6 text-white">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur mb-2">
            <RotateCcw className="h-4 w-4" />
            Refunds
          </div>
          <h1 className="text-3xl font-semibold">Refund Requests</h1>
          <p className="text-sm text-slate-200 mt-1">Track and manage your refund requests</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-card rounded-xl border border-border/70 overflow-hidden">
        <div className="flex items-center gap-2 p-2 bg-muted/30">
          <button
            className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition ${
              activeTab === 'active'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
            onClick={() => setActiveTab('active')}
          >
            Active Requests
          </button>
          <button
            className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition ${
              activeTab === 'history'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
            onClick={() => setActiveTab('history')}
          >
            History
          </button>
        </div>
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
        <div className="bg-destructive/10 border border-destructive/40 rounded-xl p-4">
          <p className="text-destructive text-sm">{error}</p>
        </div>
      )}

      {/* Refunds List */}
      {!loading && !error && (
        <div className="space-y-4">
          {refunds.length === 0 ? (
            <div className="bg-card rounded-xl border border-border/70 p-12 text-center">
              <RotateCcw className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-lg font-semibold mb-2">No refund requests</h3>
              <p className="text-sm text-muted-foreground">
                No {activeTab === 'active' ? 'active' : ''} refund requests found
              </p>
            </div>
          ) : (
            refunds.map((refund) => (
              <div key={refund.id} className="bg-card rounded-xl border border-border/70 overflow-hidden">
                <div className="px-6 py-4 bg-muted/30 border-b border-border/50">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">Order #{refund.orderId.slice(0, 8)}</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDate(refund.order.createdAt)}
                      </p>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusColor(refund.status)}`}>
                      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
                      {refund.status}
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Refund Amount</span>
                      <span className="font-bold text-base">
                        <CurrencyDisplay amountCents={Number(refund.amountCents)} currency={refund.currency} />
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Original Order</span>
                      <span className="font-medium">
                        <CurrencyDisplay amountCents={Number(refund.order.totalCents)} currency={refund.order.currency} />
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Requested</span>
                      <span className="font-medium">{formatDate(refund.createdAt)}</span>
                    </div>
                    {refund.processedAt && (
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Processed</span>
                        <span className="font-medium">{formatDate(refund.processedAt)}</span>
                      </div>
                    )}
                    {refund.reason && (
                      <div className="pt-3 border-t border-border/50">
                        <span className="text-muted-foreground block mb-2">Reason</span>
                        <p className="text-sm">{refund.reason}</p>
                      </div>
                    )}
                  </div>
                  {refund.status === 'pending' && (
                    <div className="mt-4 flex items-start gap-3 rounded-lg bg-amber-50 border border-amber-200 p-3">
                      <AlertCircle className="h-4 w-4 text-amber-700 mt-0.5 shrink-0" />
                      <p className="text-xs text-amber-700">
                        Your refund request is being processed. You will receive an email once it&apos;s approved.
                      </p>
                    </div>
                  )}
                  {refund.status === 'processed' && (
                    <div className="mt-4 flex items-start gap-3 rounded-lg bg-emerald-50 border border-emerald-200 p-3">
                      <CheckCircle2 className="h-4 w-4 text-emerald-700 mt-0.5 shrink-0" />
                      <p className="text-xs text-emerald-700">
                        Refund has been processed and sent to your original payment method.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
