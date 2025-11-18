'use client';

import * as React from 'react';
import { adminApiService, type AdminDispute, type AdminDisputeStats } from '@/services/admin-api.service';
import { useAuth } from '@/components/auth';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui';
import { StatusBadge } from '@/components/admin';
import { CurrencyDisplay } from '@/components/common/currency-display';
import { cn } from '@/lib/utils';

interface DisputeListProps {
  className?: string;
}

export function DisputeList({ className }: DisputeListProps) {
  const { accessToken } = useAuth();
  const [disputes, setDisputes] = React.useState<AdminDispute[]>([]);
  const [stats, setStats] = React.useState<AdminDisputeStats | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [pagination, setPagination] = React.useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });
  const [filters, setFilters] = React.useState<Record<string, unknown>>({});
  const [selectedDispute, setSelectedDispute] = React.useState<AdminDispute | null>(null);
  const [showStatusDialog, setShowStatusDialog] = React.useState(false);
  const [statusForm, setStatusForm] = React.useState({ status: '', note: '' });

  React.useEffect(() => {
    if (!accessToken) return;
    loadDisputes();
    loadStats();
  }, [accessToken, filters, pagination.page]);

  const loadDisputes = async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const response = await adminApiService.getDisputes(accessToken, {
        page: pagination.page,
        limit: pagination.limit,
        search: filters.search as string,
        status: filters.status as string,
        provider: filters.provider as string,
      });

      if (response.success && response.data) {
        setDisputes(response.data.data);
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination.total,
          totalPages: response.data.pagination.totalPages,
        }));
      }
    } catch (error) {
      console.error('Failed to load disputes:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    if (!accessToken) return;
    try {
      const response = await adminApiService.getDisputeStats(accessToken);
      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedDispute || !accessToken) return;
    try {
      await adminApiService.updateDisputeStatus(
        selectedDispute.id,
        { status: statusForm.status, note: statusForm.note },
        accessToken
      );
      setShowStatusDialog(false);
      loadDisputes();
      loadStats();
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      needs_response: 'bg-red-100 text-red-800 border-red-200',
      under_review: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      won: 'bg-green-100 text-green-800 border-green-200',
      lost: 'bg-gray-100 text-gray-800 border-gray-200',
      warning: 'bg-orange-100 text-orange-800 border-orange-200',
      charge_refunded: 'bg-blue-100 text-blue-800 border-blue-200',
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Dispute Management</h1>
        <p className="text-muted-foreground mt-1">Manage payment disputes and chargebacks</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-card p-4 rounded-lg border">
            <p className="text-sm text-muted-foreground">Total Disputes</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
          <div className="bg-card p-4 rounded-lg border">
            <p className="text-sm text-muted-foreground">Needs Response</p>
            <p className="text-2xl font-bold text-red-600">{stats.needsResponse}</p>
          </div>
          <div className="bg-card p-4 rounded-lg border">
            <p className="text-sm text-muted-foreground">Win Rate</p>
            <p className="text-2xl font-bold text-green-600">{stats.winRate}%</p>
          </div>
          <div className="bg-card p-4 rounded-lg border">
            <p className="text-sm text-muted-foreground">Total Amount</p>
            <p className="text-2xl font-bold">
              <CurrencyDisplay amountCents={stats.totalAmountCents || 0} currency="USD" showFree={false} />
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-4">
        <input
          type="search"
          placeholder="Search by order ID, case ID, or buyer..."
          className="flex-1 px-4 py-2 border rounded-lg"
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
        />
        <select
          className="px-4 py-2 border rounded-lg"
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
        >
          <option value="">All Statuses</option>
          <option value="needs_response">Needs Response</option>
          <option value="under_review">Under Review</option>
          <option value="won">Won</option>
          <option value="lost">Lost</option>
        </select>
        <select
          className="px-4 py-2 border rounded-lg"
          onChange={(e) => setFilters({ ...filters, provider: e.target.value })}
        >
          <option value="">All Providers</option>
          <option value="stripe">Stripe</option>
          <option value="paystack">Paystack</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-card rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-4 font-semibold">Case ID</th>
                <th className="text-left p-4 font-semibold">Order ID</th>
                <th className="text-left p-4 font-semibold">Status</th>
                <th className="text-left p-4 font-semibold">Amount</th>
                <th className="text-left p-4 font-semibold">Provider</th>
                <th className="text-left p-4 font-semibold">Buyer</th>
                <th className="text-left p-4 font-semibold">Event</th>
                <th className="text-left p-4 font-semibold">Opened</th>
                <th className="text-left p-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="text-center p-8 text-muted-foreground">
                    Loading disputes...
                  </td>
                </tr>
              ) : disputes.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center p-8 text-muted-foreground">
                    No disputes found
                  </td>
                </tr>
              ) : (
                disputes.map((dispute) => (
                  <tr key={dispute.id} className="border-t hover:bg-muted/50">
                    <td className="p-4">
                      <Text className="font-mono text-xs">{dispute.caseId}</Text>
                    </td>
                    <td className="p-4">
                      <Text className="font-mono text-xs">{dispute.orderId.substring(0, 8)}...</Text>
                    </td>
                    <td className="p-4">
                      <span className={cn('px-2 py-1 rounded-full text-xs font-medium border', getStatusColor(dispute.status))}>
                        {dispute.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-4">
                      <Text>
                        <CurrencyDisplay
                          amountCents={dispute.amountCents || 0}
                          currency={dispute.orderCurrency}
                          showFree={false}
                        />
                      </Text>
                    </td>
                    <td className="p-4">
                      <Text className="capitalize">{dispute.provider}</Text>
                    </td>
                    <td className="p-4">
                      <Text className="text-sm">{dispute.buyerName}</Text>
                      <Text className="text-xs text-muted-foreground">{dispute.buyerEmail}</Text>
                    </td>
                    <td className="p-4">
                      <Text className="text-sm">{dispute.eventTitle}</Text>
                    </td>
                    <td className="p-4">
                      <Text className="text-sm">{new Date(dispute.openedAt).toLocaleDateString()}</Text>
                    </td>
                    <td className="p-4">
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedDispute(dispute);
                          setStatusForm({ status: dispute.status, note: '' });
                          setShowStatusDialog(true);
                        }}
                      >
                        Update
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            disabled={pagination.page === 1}
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
          >
            Previous
          </Button>
          <span className="flex items-center px-4">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            disabled={pagination.page === pagination.totalPages}
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
          >
            Next
          </Button>
        </div>
      )}

      {/* Status Update Dialog */}
      {showStatusDialog && selectedDispute && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Update Dispute Status</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Case ID</label>
                <Text className="text-sm text-muted-foreground">{selectedDispute.caseId}</Text>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  className="w-full px-3 py-2 border rounded-lg"
                  value={statusForm.status}
                  onChange={(e) => setStatusForm({ ...statusForm, status: e.target.value })}
                >
                  <option value="needs_response">Needs Response</option>
                  <option value="under_review">Under Review</option>
                  <option value="won">Won</option>
                  <option value="lost">Lost</option>
                  <option value="charge_refunded">Charge Refunded</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Note (Optional)</label>
                <textarea
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={3}
                  value={statusForm.note}
                  onChange={(e) => setStatusForm({ ...statusForm, note: e.target.value })}
                  placeholder="Add any notes about this status update..."
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowStatusDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateStatus}>Update Status</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
