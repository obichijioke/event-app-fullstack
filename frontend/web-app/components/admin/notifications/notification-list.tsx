'use client';

import * as React from 'react';
import { DataTable, FiltersPanel, StatusBadge } from '@/components/admin';
import { Text, Button } from '@/components/ui';
import { adminApiService, type AdminNotification } from '@/services/admin-api.service';
import { useAuth } from '@/components/auth';
import { cn } from '@/lib/utils';

interface NotificationListProps {
  className?: string;
}

export function NotificationList({ className }: NotificationListProps) {
  const { accessToken } = useAuth();
  const [notifications, setNotifications] = React.useState<AdminNotification[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [showBroadcastForm, setShowBroadcastForm] = React.useState(false);
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
    loadNotifications();
  }, [accessToken, filters, sorting, pagination.page]);

  const loadNotifications = async () => {
    if (!accessToken) return;

    setLoading(true);
    try {
      const response = await adminApiService.getNotifications(accessToken, {
        page: pagination.page,
        limit: pagination.limit,
        search: filters.search as string,
        type: filters.type as string,
        channel: filters.channel as string,
        sortBy: sorting.field as string,
        sortOrder: sorting.direction,
      });

      if (response.success && response.data) {
        setNotifications(response.data.data);
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination.total,
          totalPages: response.data.pagination.totalPages,
        }));
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (notification: AdminNotification) => {
    if (!accessToken) return;
    if (!confirm('Are you sure you want to delete this notification?')) return;

    try {
      await adminApiService.deleteNotification(notification.id, accessToken);
      alert('Notification deleted successfully');
      loadNotifications();
    } catch (error) {
      console.error('Failed to delete notification:', error);
      alert('Failed to delete notification');
    }
  };

  const columns = [
    {
      key: 'type',
      title: 'Type',
      sortable: true,
      render: (value: unknown, notification: AdminNotification) => (
        <StatusBadge status={notification.type} />
      ),
    },
    {
      key: 'title',
      title: 'Title',
      sortable: true,
      render: (value: unknown, notification: AdminNotification) => (
        <Text className="font-medium">{notification.title}</Text>
      ),
    },
    {
      key: 'message',
      title: 'Message',
      render: (value: unknown, notification: AdminNotification) => (
        <Text className="line-clamp-2 text-sm">{notification.message}</Text>
      ),
    },
    {
      key: 'userName',
      title: 'Recipient',
      sortable: true,
      render: (value: unknown, notification: AdminNotification) => (
        <div className="flex flex-col gap-1">
          <Text className="font-medium">{notification.userName || 'N/A'}</Text>
          <Text className="text-xs text-muted-foreground">{notification.userEmail || 'N/A'}</Text>
        </div>
      ),
    },
    {
      key: 'channels',
      title: 'Channels',
      render: (value: unknown, notification: AdminNotification) => (
        <div className="flex flex-wrap gap-1">
          {notification.channels.map(channel => (
            <span key={channel} className="text-xs px-2 py-1 bg-secondary rounded">
              {channel}
            </span>
          ))}
        </div>
      ),
    },
    {
      key: 'createdAt',
      title: 'Date',
      sortable: true,
      render: (value: unknown, notification: AdminNotification) => (
        <Text>{new Date(notification.createdAt).toLocaleDateString()}</Text>
      ),
    },
  ];

  const filterFields = [
    {
      key: 'search',
      label: 'Search',
      type: 'text' as const,
      placeholder: 'Search by title or message...',
    },
    {
      key: 'type',
      label: 'Type',
      type: 'select' as const,
      options: [
        { value: '', label: 'All Types' },
        { value: 'info', label: 'Info' },
        { value: 'success', label: 'Success' },
        { value: 'warning', label: 'Warning' },
        { value: 'error', label: 'Error' },
      ],
    },
    {
      key: 'channel',
      label: 'Channel',
      type: 'select' as const,
      options: [
        { value: '', label: 'All Channels' },
        { value: 'in_app', label: 'In-App' },
        { value: 'email', label: 'Email' },
        { value: 'push', label: 'Push' },
        { value: 'sms', label: 'SMS' },
      ],
    },
  ];

  const actions = [
    {
      label: 'Delete',
      variant: 'destructive' as const,
      onClick: handleDelete,
    },
  ];

  return (
    <div className={cn('space-y-6', className)}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Notification Management</h1>
          <p className="text-muted-foreground mt-1">Broadcast and manage platform notifications</p>
        </div>
        <Button onClick={() => setShowBroadcastForm(true)}>Broadcast Notification</Button>
      </div>

      <FiltersPanel
        fields={filterFields}
        values={filters}
        onChange={(newFilters) => {
          setFilters(newFilters);
          setPagination(prev => ({ ...prev, page: 1 }));
        }}
        onReset={() => setFilters({})}
      />

      <DataTable
        data={notifications}
        columns={columns}
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
            setPagination(prev => ({ ...prev, page: 1 }));
          },
        }}
        actions={actions}
      />
    </div>
  );
}
