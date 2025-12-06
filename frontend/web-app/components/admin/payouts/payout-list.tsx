'use client';

import * as React from 'react';
import { DataTable, FiltersPanel, StatusBadge } from '@/components/admin';
import { Text, Modal, Button, Input, Checkbox, Label } from '@/components/ui';
import { CurrencyDisplay } from '@/components/common/currency-display';
import { adminApiService, type AdminPayout, type PayoutAnalytics } from '@/services/admin-api.service';
import { useAuth } from '@/components/auth';
import { cn } from '@/lib/utils';

interface PayoutListProps {
  className?: string;
}

export function PayoutList({ className }: PayoutListProps) {
  const { accessToken } = useAuth();
  const [payouts, setPayouts] = React.useState<AdminPayout[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [analytics, setAnalytics] = React.useState<PayoutAnalytics | null>(null);
  const [dialog, setDialog] = React.useState<
    | { type: 'reject'; payoutId: string; reason: string }
    | { type: 'retry'; payoutId: string; reason?: string }
    | { type: 'process'; payoutId: string; force: boolean }
    | null
  >(null);
  const [pagination, setPagination] = React.useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });
  const [filters, setFilters] = React.useState<Record<string, unknown>>({});
  const [sorting, setSorting] = React.useState({
    field: 'createdAt' as string,
    direction: 'desc' as 'asc' | 'desc',
  });

  // Load payouts on mount and when filters/sorting change
  React.useEffect(() => {
    if (!accessToken) return;
    
    loadPayouts();
    loadAnalytics();
  }, [accessToken, filters, sorting, pagination.page]);

  const loadPayouts = async () => {
    if (!accessToken) return;

    setLoading(true);
    try {
      const response = await adminApiService.getPayouts(accessToken, {
        page: pagination.page,
        limit: pagination.limit,
        search: filters.search as string,
        status: filters.status as string,
        sortBy: sorting.field as string,
        sortOrder: sorting.direction,
      });

      if (response.success && response.data) {
        setPayouts(response.data.data);
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination.total,
          totalPages: response.data.pagination.totalPages,
        }));
      }
    } catch (error) {
      console.error('Failed to load payouts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters: Record<string, unknown>) => {
    setFilters(newFilters);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleSort = (field: string) => {
    setSorting(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
  };

  const handleApprovePayout = async (payoutId: string) => {
    if (!accessToken) return;

    try {
      await adminApiService.approvePayout(accessToken, payoutId);
      
      // Reload payouts to reflect changes
      await loadPayouts();
    } catch (error) {
      console.error('Failed to approve payout:', error);
    }
  };

  const handleProcessPayout = async (payoutId: string) => {
    setDialog({ type: 'process', payoutId, force: false });
  };

  const handleRejectPayout = async (payoutId: string) => {
    setDialog({ type: 'reject', payoutId, reason: '' });
  };

  const handleRetryPayout = async (payoutId: string) => {
    setDialog({ type: 'retry', payoutId, reason: '' });
  };

  const loadAnalytics = async () => {
    if (!accessToken) return;
    try {
      const res = await adminApiService.getPayoutAnalytics(accessToken);
      if (res.success) {
        setAnalytics(res.data);
      }
    } catch (error) {
      console.error('Failed to load payout analytics:', error);
    }
  };

  const columns = [
    {
      key: 'id',
      title: 'Payout ID',
      sortable: true,
      render: (value: unknown, payout: AdminPayout) => (
        <Text className="font-mono text-xs">{payout.id.substring(0, 8)}...</Text>
      ),
    },
    {
      key: 'orgName',
      title: 'Organization',
      sortable: true,
      render: (value: unknown, payout: AdminPayout) => (
        <Text className="font-medium">{payout.orgName}</Text>
      ),
    },
    {
      key: 'amountCents',
      title: 'Amount',
      sortable: true,
      render: (value: unknown, payout: AdminPayout) => (
        <Text className="font-medium">
          <CurrencyDisplay
            amountCents={payout.amountCents}
            currency={payout.currency}
            showFree={false}
          />
        </Text>
      ),
    },
    {
      key: 'provider',
      title: 'Provider',
      sortable: true,
      render: (value: unknown, payout: AdminPayout) => (
        <Text className="capitalize">{payout.provider || 'N/A'}</Text>
      ),
    },
    {
      key: 'status',
      title: 'Status',
      sortable: true,
      render: (value: unknown, payout: AdminPayout) => (
        <StatusBadge status={payout.status} />
      ),
    },
    {
      key: 'scheduledFor',
      title: 'Scheduled',
      sortable: true,
      render: (value: unknown, payout: AdminPayout) => (
        <Text>
          {payout.scheduledFor ? new Date(payout.scheduledFor).toLocaleDateString() : 'N/A'}
        </Text>
      ),
    },
    {
      key: 'createdAt',
      title: 'Created',
      sortable: true,
      render: (value: unknown, payout: AdminPayout) => (
        <div className="flex flex-col gap-1">
          <Text>{new Date(payout.createdAt).toLocaleDateString()}</Text>
          <Text className="text-xs text-muted-foreground">
            {new Date(payout.createdAt).toLocaleTimeString()}
          </Text>
        </div>
      ),
    },
  ];

  const filterFields = [
    {
      key: 'search',
      label: 'Search',
      type: 'text' as const,
      placeholder: 'Search by organization...',
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select' as const,
      options: [
        { value: '', label: 'All Status' },
        { value: 'pending', label: 'Pending' },
        { value: 'in_review', label: 'In Review' },
        { value: 'paid', label: 'Paid' },
        { value: 'failed', label: 'Failed' },
      ],
    },
  ];

  const actions = [
    {
      label: 'View Details',
      onClick: (payout: AdminPayout) => {
        window.location.href = `/admin/payouts/${payout.id}`;
      },
    },
    {
      label: 'Approve',
      onClick: (payout: AdminPayout) => handleApprovePayout(payout.id),
      variant: 'success' as const,
      condition: (payout: AdminPayout) => payout.status === 'pending' || payout.status === 'in_review',
    },
    {
      label: 'Process',
      onClick: (payout: AdminPayout) => handleProcessPayout(payout.id),
      variant: 'primary' as const,
      condition: (payout: AdminPayout) => payout.status === 'pending' || payout.status === 'in_review',
    },
    {
      label: 'Reject',
      onClick: (payout: AdminPayout) => handleRejectPayout(payout.id),
      variant: 'destructive' as const,
      condition: (payout: AdminPayout) => payout.status === 'pending' || payout.status === 'in_review',
    },
    {
      label: 'Retry',
      onClick: (payout: AdminPayout) => handleRetryPayout(payout.id),
      variant: 'secondary' as const,
      condition: (payout: AdminPayout) => payout.status === 'failed',
    },
  ];

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Payout Management</h1>
          <p className="text-muted-foreground mt-1">Manage platform payouts to organizers</p>
        </div>
      </div>

      {analytics && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            { label: 'Pending', value: analytics.pending },
            { label: 'In Review', value: analytics.inReview },
            { label: 'Paid', value: analytics.paid },
            { label: 'Failed', value: analytics.failed },
            { label: 'Canceled', value: analytics.canceled },
          ].map((item) => (
            <div key={item.label} className="p-3 rounded-lg border border-border bg-card/60">
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p className="text-xl font-semibold">{item.value}</p>
            </div>
          ))}
          <div className="md:col-span-2 lg:col-span-2 p-3 rounded-lg border border-border bg-card/80">
            <p className="text-xs text-muted-foreground">Total Volume</p>
            <p className="text-lg font-semibold">
              <CurrencyDisplay amountCents={analytics.totalAmount} currency={payouts[0]?.currency || 'USD'} showFree={false} />
            </p>
          </div>
        </div>
      )}

      {/* Dialogs */}
      {dialog && dialog.type === 'reject' && (
        <Modal open onClose={() => setDialog(null)} title="Reject Payout">
          <div className="space-y-4">
            <Label htmlFor="reject-reason">Reason</Label>
            <Input
              id="reject-reason"
              value={dialog.reason}
              onChange={(e) =>
                setDialog((prev) =>
                  prev && prev.type === 'reject'
                    ? { ...prev, reason: e.target.value }
                    : prev,
                )
              }
              placeholder="Enter rejection reason"
            />
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setDialog(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                disabled={!dialog.reason}
                onClick={async () => {
                  if (!accessToken || !dialog.reason) return;
                  try {
                    await adminApiService.rejectPayout(accessToken, dialog.payoutId, {
                      reason: dialog.reason,
                    });
                    await Promise.all([loadPayouts(), loadAnalytics()]);
                  } catch (error) {
                    console.error('Failed to reject payout:', error);
                  } finally {
                    setDialog(null);
                  }
                }}
              >
                Reject
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {dialog && dialog.type === 'retry' && (
        <Modal open onClose={() => setDialog(null)} title="Retry Payout">
          <div className="space-y-4">
            <Label htmlFor="retry-reason">Optional note</Label>
            <Input
              id="retry-reason"
              value={dialog.reason || ''}
              onChange={(e) =>
                setDialog((prev) =>
                  prev && prev.type === 'retry'
                    ? { ...prev, reason: e.target.value }
                    : prev,
                )
              }
              placeholder="Enter a note (optional)"
            />
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setDialog(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={async () => {
                  if (!accessToken) return;
                  try {
                    await adminApiService.retryPayout(accessToken, dialog.payoutId, {
                      reason: dialog.reason || undefined,
                    });
                    await Promise.all([loadPayouts(), loadAnalytics()]);
                  } catch (error) {
                    console.error('Failed to retry payout:', error);
                  } finally {
                    setDialog(null);
                  }
                }}
              >
                Retry
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {dialog && dialog.type === 'process' && (
        <Modal open onClose={() => setDialog(null)} title="Process Payout">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Checkbox
                id="force-process"
                checked={dialog.force}
                onChange={(event) =>
                  setDialog((prev) =>
                    prev && prev.type === 'process'
                      ? { ...prev, force: event.target.checked }
                      : prev,
                  )
                }
              />
              <Label htmlFor="force-process">Force processing (override status guard)</Label>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setDialog(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={async () => {
                  if (!accessToken) return;
                  try {
                    await adminApiService.processPayout(accessToken, dialog.payoutId, {
                      force: dialog.force,
                    });
                    await Promise.all([loadPayouts(), loadAnalytics()]);
                  } catch (error) {
                    console.error('Failed to process payout:', error);
                  } finally {
                    setDialog(null);
                  }
                }}
              >
                Process
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Filters */}
      <FiltersPanel
        fields={filterFields}
        values={filters}
        onChange={handleFilterChange}
        onReset={() => setFilters({})}
      />

      {/* Payouts Table */}
      <DataTable
        data={payouts}
        columns={columns}
        loading={loading}
        pagination={{
          ...pagination,
          onPageChange: handlePageChange,
        }}
        sorting={{
          ...sorting,
          onSort: handleSort,
        }}
        actions={actions}
      />
    </div>
  );
}

