'use client';

import { useEffect, useState } from 'react';
import { accountApi, type Transfer } from '@/lib/api/account-api';
import { ticketsApi } from '@/lib/api/tickets-api';
import { Loader2, ArrowLeftRight, Send, Inbox, Calendar, Ticket as TicketIcon, User, RefreshCw, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function TransfersPage() {
  const [activeTab, setActiveTab] = useState<'sent' | 'received'>('sent');
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<string | null>(null);

  useEffect(() => {
    fetchTransfers();
  }, [activeTab]);

  const fetchTransfers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await accountApi.getTransfers({ type: activeTab });
      setTransfers(data.items);
    } catch (err: any) {
      setError(err?.message || 'Failed to load transfers');
      toast.error('Failed to load transfers');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelTransfer = async (transferId: string) => {
    setCancelling(transferId);
    try {
      await ticketsApi.cancelTransfer(transferId);
      toast.success('Transfer cancelled successfully');
      await fetchTransfers();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to cancel transfer');
    } finally {
      setCancelling(null);
    }
  };

  const handleAcceptTransfer = async (transferId: string) => {
    setCancelling(transferId);
    try {
      await ticketsApi.acceptTransfer(transferId);
      toast.success('Transfer accepted successfully');
      await fetchTransfers();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to accept transfer');
    } finally {
      setCancelling(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { text: string; className: string }> = {
      pending: { text: 'Pending', className: 'bg-amber-100 text-amber-800' },
      accepted: { text: 'Accepted', className: 'bg-emerald-100 text-emerald-800' },
      canceled: { text: 'Canceled', className: 'bg-slate-200 text-slate-700' },
    };
    const badge = badges[status] || { text: status, className: 'bg-muted text-foreground' };
    return (
      <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${badge.className}`}>
        <span className="h-2 w-2 rounded-full bg-current opacity-70" />
        {badge.text}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="overflow-hidden rounded-xl border border-border/70 bg-card">
        <div className="bg-linear-to-r from-slate-900 via-slate-800 to-slate-700 px-6 py-6 text-white">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur mb-2">
            <ArrowLeftRight className="h-4 w-4" />
            My Transfers
          </div>
          <h1 className="text-3xl font-semibold">Ticket Transfers</h1>
          <p className="text-sm text-slate-200 mt-1">Manage sent and received ticket transfers</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Tabs */}
        <div className="flex items-center gap-2 rounded-full border border-border bg-muted/60 p-1">
              <button
                onClick={() => setActiveTab('sent')}
                className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition ${
                  activeTab === 'sent'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <span className="inline-flex items-center gap-2">
                  <Send className="h-4 w-4" />
                  Sent
                </span>
              </button>
              <button
                onClick={() => setActiveTab('received')}
                className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition ${
                  activeTab === 'received'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <span className="inline-flex items-center gap-2">
                  <Inbox className="h-4 w-4" />
                  Received
                </span>
              </button>
            </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Loading transfers...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Transfers List */}
        {!loading && !error && (
          <div className="space-y-4">
            {transfers.length === 0 ? (
              <div className="bg-card rounded-xl border border-border/70 p-12 text-center">
                {activeTab === 'sent' ? <Send className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" /> : <Inbox className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />}
                <h3 className="text-lg font-semibold mb-2">No {activeTab} transfers</h3>
                <p className="text-sm text-muted-foreground">
                  {activeTab === 'sent' ? 'Transfer tickets to friends from your tickets page.' : 'Pending transfers will appear here.'}
                </p>
              </div>
            ) : (
                  transfers.map((transfer) => (
                    <div key={transfer.id} className="overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm">
                      <div className="bg-linear-to-r from-slate-50 to-slate-100 px-4 py-4 dark:from-slate-800/50 dark:to-slate-900/50">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-3">
                              <h3 className="text-base font-semibold text-foreground">
                                {transfer.ticket.event.title}
                              </h3>
                              {getStatusBadge(transfer.status)}
                            </div>
                            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                              <span className="inline-flex items-center gap-1.5">
                                <TicketIcon className="h-3.5 w-3.5" />
                                {transfer.ticket.ticketType.name}
                              </span>
                              <span>•</span>
                              <span className="inline-flex items-center gap-1.5">
                                <Calendar className="h-3.5 w-3.5" />
                                {formatDate(transfer.initiatedAt)}
                              </span>
                              <span>•</span>
                              <span className="inline-flex items-center gap-1.5">
                                <User className="h-3.5 w-3.5" />
                                {activeTab === 'sent' ? `To: ${transfer.toUser.email}` : `From: ${transfer.fromUser.email}`}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Transfer Details */}
                      <div className="bg-card p-4">
                        <div className="grid gap-3 sm:grid-cols-2">
                          {/* Transfer Info */}
                          <div className="space-y-2 rounded-lg border border-border/50 bg-muted/30 p-3">
                            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              Transfer Details
                            </h4>
                            <div className="space-y-1.5 text-xs">
                              <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Transfer ID</span>
                                <span className="font-mono font-semibold">{transfer.id.slice(0, 12).toUpperCase()}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Ticket ID</span>
                                <span className="font-mono font-semibold">{transfer.ticketId.slice(0, 12).toUpperCase()}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Initiated</span>
                                <span className="font-medium">{formatDate(transfer.initiatedAt)}</span>
                              </div>
                            </div>
                          </div>

                          {/* Status Timeline */}
                          <div className="space-y-2 rounded-lg border border-border/50 bg-muted/30 p-3">
                            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              Status Timeline
                            </h4>
                            <div className="space-y-1.5 text-xs">
                              {transfer.acceptedAt && (
                                <div className="flex items-center justify-between">
                                  <span className="text-muted-foreground">Accepted</span>
                                  <span className="font-medium">{formatDate(transfer.acceptedAt)}</span>
                                </div>
                              )}
                              {transfer.canceledAt && (
                                <div className="flex items-center justify-between">
                                  <span className="text-muted-foreground">Canceled</span>
                                  <span className="font-medium">{formatDate(transfer.canceledAt)}</span>
                                </div>
                              )}
                              {!transfer.acceptedAt && !transfer.canceledAt && (
                                <div className="flex items-center justify-between">
                                  <span className="text-muted-foreground">Status</span>
                                  <span className="font-medium text-amber-600">Awaiting Action</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        {transfer.status === 'pending' && (
                          <div className="mt-4 flex flex-wrap gap-2">
                            {activeTab === 'sent' ? (
                              <button
                                onClick={() => handleCancelTransfer(transfer.id)}
                                disabled={cancelling === transfer.id}
                                className="inline-flex items-center gap-2 rounded-lg border border-destructive bg-destructive/10 px-4 py-2 text-sm font-semibold text-destructive transition hover:bg-destructive/20 disabled:opacity-50"
                              >
                                {cancelling === transfer.id ? (
                                  <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Cancelling...
                                  </>
                                ) : (
                                  <>
                                    <X className="h-4 w-4" />
                                    Cancel Transfer
                                  </>
                                )}
                              </button>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleAcceptTransfer(transfer.id)}
                                  disabled={cancelling === transfer.id}
                                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
                                >
                                  {cancelling === transfer.id ? (
                                    <>
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                      Accepting...
                                    </>
                                  ) : (
                                    <>
                                      <Check className="h-4 w-4" />
                                      Accept Transfer
                                    </>
                                  )}
                                </button>
                                <button
                                  onClick={() => handleCancelTransfer(transfer.id)}
                                  disabled={cancelling === transfer.id}
                                  className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-muted disabled:opacity-50"
                                >
                                  {cancelling === transfer.id ? 'Processing...' : 'Decline'}
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
