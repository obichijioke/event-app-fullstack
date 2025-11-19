'use client';

import { useEffect, useState } from 'react';
import { accountApi, type Transfer } from '@/lib/api/account-api';
import { ticketsApi } from '@/lib/api/tickets-api';
import { Loader2 } from 'lucide-react';

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
    } finally {
      setLoading(false);
    }
  };

  const handleCancelTransfer = async (transferId: string) => {
    if (!confirm('Are you sure you want to cancel this transfer?')) return;

    setCancelling(transferId);
    try {
      await ticketsApi.cancelTransfer(transferId);
      await fetchTransfers();
    } catch (err: any) {
      alert(err?.message || 'Failed to cancel transfer');
    } finally {
      setCancelling(null);
    }
  };

  const handleAcceptTransfer = async (transferId: string) => {
    if (!confirm('Accept this ticket transfer?')) return;

    setCancelling(transferId);
    try {
      await ticketsApi.acceptTransfer(transferId);
      await fetchTransfers();
    } catch (err: any) {
      alert(err?.message || 'Failed to accept transfer');
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-warning/10 text-warning';
      case 'accepted':
        return 'bg-success/10 text-success';
      case 'canceled':
        return 'bg-error/10 text-error';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Ticket Transfers</h1>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-border">
        <button
          className={`px-4 py-2 border-b-2 ${
            activeTab === 'sent'
              ? 'border-primary text-primary font-medium'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => setActiveTab('sent')}
        >
          Sent
        </button>
        <button
          className={`px-4 py-2 border-b-2 ${
            activeTab === 'received'
              ? 'border-primary text-primary font-medium'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => setActiveTab('received')}
        >
          Received
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Loading transfers...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-destructive/10 border border-destructive rounded-lg p-4 mb-6">
          <p className="text-destructive text-sm">{error}</p>
        </div>
      )}

      {/* Transfers List */}
      {!loading && !error && (
        <div className="space-y-4">
          {transfers.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No {activeTab} transfers found
            </p>
          ) : (
            transfers.map((transfer) => (
              <div key={transfer.id} className="bg-card rounded-lg shadow-card p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold">
                      {transfer.ticket.event.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {transfer.ticket.ticketType.name} • Ticket #{transfer.ticketId.slice(0, 8)}
                    </p>
                  </div>
                  <span className={`px-3 py-1 text-xs rounded-full ${getStatusColor(transfer.status)}`}>
                    {transfer.status}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground space-y-1">
                  {activeTab === 'sent' ? (
                    <p>Sent to: {transfer.toUser.email}</p>
                  ) : (
                    <p>From: {transfer.fromUser.email}</p>
                  )}
                  <p>Initiated: {formatDate(transfer.initiatedAt)}</p>
                  {transfer.acceptedAt && (
                    <p>Accepted: {formatDate(transfer.acceptedAt)}</p>
                  )}
                  {transfer.canceledAt && (
                    <p>Canceled: {formatDate(transfer.canceledAt)}</p>
                  )}
                </div>
                {transfer.status === 'pending' && (
                  <div className="flex gap-2 mt-4">
                    {activeTab === 'sent' ? (
                      <button
                        onClick={() => handleCancelTransfer(transfer.id)}
                        disabled={cancelling === transfer.id}
                        className="px-4 py-2 bg-error text-error-foreground rounded-md hover:opacity-90 transition text-sm disabled:opacity-50"
                      >
                        {cancelling === transfer.id ? 'Cancelling...' : 'Cancel Transfer'}
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => handleAcceptTransfer(transfer.id)}
                          disabled={cancelling === transfer.id}
                          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition text-sm disabled:opacity-50"
                        >
                          {cancelling === transfer.id ? 'Accepting...' : 'Accept Transfer'}
                        </button>
                        <button
                          onClick={() => handleCancelTransfer(transfer.id)}
                          disabled={cancelling === transfer.id}
                          className="px-4 py-2 bg-muted text-foreground rounded-md hover:bg-muted/80 transition text-sm disabled:opacity-50"
                        >
                          Decline
                        </button>
                      </>
                    )}
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

