'use client';

import * as React from 'react';
import { DataTable, FiltersPanel, StatusBadge } from '@/components/admin';
import { Text, Button } from '@/components/ui';
import { adminApiService, type AdminPromotion, type AdminPromoCode } from '@/services/admin-api.service';
import { useAuth } from '@/components/auth';
import { cn } from '@/lib/utils';

interface PromotionListProps {
  className?: string;
}

type ViewMode = 'promotions' | 'codes';

export function PromotionList({ className }: PromotionListProps) {
  const { accessToken } = useAuth();
  const [viewMode, setViewMode] = React.useState<ViewMode>('promotions');
  const [promotions, setPromotions] = React.useState<AdminPromotion[]>([]);
  const [promoCodes, setPromoCodes] = React.useState<AdminPromoCode[]>([]);
  const [loading, setLoading] = React.useState(false);
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

  React.useEffect(() => {
    if (!accessToken) return;
    loadData();
  }, [accessToken, filters, sorting, pagination.page, viewMode]);

  const loadData = async () => {
    if (!accessToken) return;

    setLoading(true);
    try {
      if (viewMode === 'promotions') {
        const response = await adminApiService.getPromotions(accessToken, {
          page: pagination.page,
          limit: pagination.limit,
          search: filters.search as string,
          status: filters.status as string,
          sortBy: sorting.field as string,
          sortOrder: sorting.direction,
        });

        if (response.success && response.data) {
          setPromotions(response.data.data);
          setPagination(prev => ({
            ...prev,
            total: response.data.pagination.total,
            totalPages: response.data.pagination.totalPages,
          }));
        }
      } else {
        const response = await adminApiService.getPromoCodes(accessToken, {
          page: pagination.page,
          limit: pagination.limit,
          search: filters.search as string,
          active: filters.active as boolean | undefined,
          sortBy: sorting.field as string,
          sortOrder: sorting.direction,
        });

        if (response.success && response.data) {
          setPromoCodes(response.data.data);
          setPagination(prev => ({
            ...prev,
            total: response.data.pagination.total,
            totalPages: response.data.pagination.totalPages,
          }));
        }
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivatePromotion = async (promotion: AdminPromotion) => {
    if (!accessToken) return;
    if (!confirm('Are you sure you want to deactivate this promotion?')) return;

    try {
      await adminApiService.deactivatePromotion(promotion.id, accessToken);
      alert('Promotion deactivated successfully');
      loadData();
    } catch (error) {
      console.error('Failed to deactivate promotion:', error);
      alert('Failed to deactivate promotion');
    }
  };

  const promotionColumns = [
    {
      key: 'name',
      title: 'Name',
      sortable: true,
      render: (value: unknown, promotion: AdminPromotion) => (
        <Text className="font-medium">{promotion.name}</Text>
      ),
    },
    {
      key: 'eventTitle',
      title: 'Event',
      sortable: true,
      render: (value: unknown, promotion: AdminPromotion) => (
        <Text>{promotion.eventTitle}</Text>
      ),
    },
    {
      key: 'orgName',
      title: 'Organizer',
      sortable: true,
      render: (value: unknown, promotion: AdminPromotion) => (
        <Text>{promotion.orgName}</Text>
      ),
    },
    {
      key: 'status',
      title: 'Status',
      sortable: true,
      render: (value: unknown, promotion: AdminPromotion) => (
        <StatusBadge status={promotion.status} />
      ),
    },
    {
      key: 'startAt',
      title: 'Period',
      render: (value: unknown, promotion: AdminPromotion) => (
        <div className="flex flex-col gap-1">
          <Text className="text-xs">Start: {new Date(promotion.startAt).toLocaleDateString()}</Text>
          <Text className="text-xs">End: {new Date(promotion.endAt).toLocaleDateString()}</Text>
        </div>
      ),
    },
    {
      key: 'createdAt',
      title: 'Created',
      sortable: true,
      render: (value: unknown, promotion: AdminPromotion) => (
        <Text>{new Date(promotion.createdAt).toLocaleDateString()}</Text>
      ),
    },
  ];

  const promoCodeColumns = [
    {
      key: 'code',
      title: 'Code',
      sortable: true,
      render: (value: unknown, code: AdminPromoCode) => (
        <Text className="font-mono font-medium">{code.code}</Text>
      ),
    },
    {
      key: 'eventTitle',
      title: 'Event',
      render: (value: unknown, code: AdminPromoCode) => (
        <Text>{code.eventTitle || 'All Events'}</Text>
      ),
    },
    {
      key: 'discountType',
      title: 'Discount',
      render: (value: unknown, code: AdminPromoCode) => (
        <Text>
          {code.discountType === 'percentage' ? `${code.discountValue}%` : `$${code.discountValue / 100}`}
        </Text>
      ),
    },
    {
      key: 'usageCount',
      title: 'Usage',
      render: (value: unknown, code: AdminPromoCode) => (
        <Text>
          {code.usageCount} / {code.usageLimit || '∞'}
        </Text>
      ),
    },
    {
      key: 'active',
      title: 'Status',
      sortable: true,
      render: (value: unknown, code: AdminPromoCode) => (
        <StatusBadge status={code.active ? 'active' : 'inactive'} />
      ),
    },
    {
      key: 'expiresAt',
      title: 'Expires',
      render: (value: unknown, code: AdminPromoCode) => (
        <Text>{code.expiresAt ? new Date(code.expiresAt).toLocaleDateString() : 'Never'}</Text>
      ),
    },
  ];

  return (
    <div className={cn('space-y-6', className)}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Promotion Management</h1>
          <p className="text-muted-foreground mt-1">Monitor promotions and promo codes</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'promotions' ? 'primary' : 'secondary'}
            onClick={() => setViewMode('promotions')}
          >
            Promotions
          </Button>
          <Button
            variant={viewMode === 'codes' ? 'primary' : 'secondary'}
            onClick={() => setViewMode('codes')}
          >
            Promo Codes
          </Button>
        </div>
      </div>

      {viewMode === 'promotions' ? (
        <DataTable<AdminPromotion>
          data={promotions}
          columns={promotionColumns}
          loading={loading}
          pagination={{
            ...pagination,
            onPageChange: (page) => setPagination(prev => ({ ...prev, page })),
          }}
          sorting={{
            ...sorting,
            onSort: (field) => {
              setSorting(prev => ({
                field,
                direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc',
              }));
            },
          }}
          actions={[
            {
              label: 'View Details',
              onClick: (promotion: AdminPromotion) => {
                window.location.href = `/admin/promotions/${promotion.id}`;
              },
            },
            {
              label: 'Deactivate',
              variant: 'destructive' as const,
              onClick: handleDeactivatePromotion,
            },
          ]}
        />
      ) : (
        <DataTable<AdminPromoCode>
          data={promoCodes}
          columns={promoCodeColumns}
          loading={loading}
          pagination={{
            ...pagination,
            onPageChange: (page) => setPagination(prev => ({ ...prev, page })),
          }}
          sorting={{
            ...sorting,
            onSort: (field) => {
              setSorting(prev => ({
                field,
                direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc',
              }));
            },
          }}
        />
      )}
    </div>
  );
}
