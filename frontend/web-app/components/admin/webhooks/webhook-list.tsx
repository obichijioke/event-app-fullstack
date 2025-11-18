'use client';

import * as React from 'react';
import { DataTable, FiltersPanel, StatusBadge } from '@/components/admin';
import { Text } from '@/components/ui';
import { adminApiService, type AdminWebhook, type AdminWebhookEvent } from '@/services/admin-api.service';
import { useAuth } from '@/components/auth';
import { cn } from '@/lib/utils';

interface WebhookListProps {
  className?: string;
}

type ViewMode = 'webhooks' | 'events';

export function WebhookList({ className }: WebhookListProps) {
  const { accessToken } = useAuth();
  const [viewMode, setViewMode] = React.useState<ViewMode>('webhooks');
  const [webhooks, setWebhooks] = React.useState<AdminWebhook[]>([]);
  const [events, setEvents] = React.useState<AdminWebhookEvent[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [pagination, setPagination] = React.useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });

  React.useEffect(() => {
    if (!accessToken) return;
    loadData();
  }, [accessToken, pagination.page, viewMode]);

  const loadData = async () => {
    if (!accessToken) return;

    setLoading(true);
    try {
      if (viewMode === 'webhooks') {
        const response = await adminApiService.getWebhooks(accessToken, {
          page: pagination.page,
          limit: pagination.limit,
        });

        if (response.success && response.data) {
          setWebhooks(response.data.data);
          setPagination(prev => ({
            ...prev,
            total: response.data.pagination.total,
            totalPages: response.data.pagination.totalPages,
          }));
        }
      } else {
        const response = await adminApiService.getWebhookEvents(accessToken, {
          page: pagination.page,
          limit: pagination.limit,
        });

        if (response.success && response.data) {
          setEvents(response.data.data);
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

  const webhookColumns = [
    {
      key: 'orgName',
      title: 'Organization',
      sortable: true,
      render: (value: unknown, webhook: AdminWebhook) => (
        <Text className="font-medium">{webhook.orgName}</Text>
      ),
    },
    {
      key: 'url',
      title: 'URL',
      render: (value: unknown, webhook: AdminWebhook) => (
        <Text className="font-mono text-xs line-clamp-1">{webhook.url}</Text>
      ),
    },
    {
      key: 'events',
      title: 'Events',
      render: (value: unknown, webhook: AdminWebhook) => (
        <Text className="text-xs">{webhook.events.length} events</Text>
      ),
    },
    {
      key: 'active',
      title: 'Status',
      sortable: true,
      render: (value: unknown, webhook: AdminWebhook) => (
        <StatusBadge status={webhook.active ? 'active' : 'inactive'} />
      ),
    },
    {
      key: 'createdAt',
      title: 'Created',
      sortable: true,
      render: (value: unknown, webhook: AdminWebhook) => (
        <Text>{new Date(webhook.createdAt).toLocaleDateString()}</Text>
      ),
    },
  ];

  const eventColumns = [
    {
      key: 'eventType',
      title: 'Event Type',
      sortable: true,
      render: (value: unknown, event: AdminWebhookEvent) => (
        <Text className="font-mono text-xs">{event.eventType}</Text>
      ),
    },
    {
      key: 'webhookUrl',
      title: 'Webhook URL',
      render: (value: unknown, event: AdminWebhookEvent) => (
        <Text className="font-mono text-xs line-clamp-1">{event.webhookUrl}</Text>
      ),
    },
    {
      key: 'status',
      title: 'Status',
      sortable: true,
      render: (value: unknown, event: AdminWebhookEvent) => (
        <StatusBadge status={event.status} />
      ),
    },
    {
      key: 'attempts',
      title: 'Attempts',
      sortable: true,
      render: (value: unknown, event: AdminWebhookEvent) => (
        <Text>{event.attempts}</Text>
      ),
    },
    {
      key: 'responseCode',
      title: 'Response',
      render: (value: unknown, event: AdminWebhookEvent) => (
        <Text>{event.responseCode || '—'}</Text>
      ),
    },
    {
      key: 'createdAt',
      title: 'Date',
      sortable: true,
      render: (value: unknown, event: AdminWebhookEvent) => (
        <Text>{new Date(event.createdAt).toLocaleDateString()}</Text>
      ),
    },
  ];

  return (
    <div className={cn('space-y-6', className)}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Webhook Monitoring</h1>
          <p className="text-muted-foreground mt-1">Monitor webhook delivery and performance</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('webhooks')}
            className={cn(
              'px-4 py-2 rounded-md text-sm font-medium transition',
              viewMode === 'webhooks'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground'
            )}
          >
            Webhooks
          </button>
          <button
            onClick={() => setViewMode('events')}
            className={cn(
              'px-4 py-2 rounded-md text-sm font-medium transition',
              viewMode === 'events'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground'
            )}
          >
            Events
          </button>
        </div>
      </div>

      {viewMode === 'webhooks' ? (
        <DataTable<AdminWebhook>
          data={webhooks}
          columns={webhookColumns}
          loading={loading}
          pagination={{
            ...pagination,
            onPageChange: (page) => setPagination(prev => ({ ...prev, page })),
          }}
        />
      ) : (
        <DataTable<AdminWebhookEvent>
          data={events}
          columns={eventColumns}
          loading={loading}
          pagination={{
            ...pagination,
            onPageChange: (page) => setPagination(prev => ({ ...prev, page })),
          }}
        />
      )}
    </div>
  );
}
