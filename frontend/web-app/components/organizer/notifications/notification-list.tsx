'use client';

import { useState, useEffect } from 'react';
import { organizerApi } from '@/lib/api/organizer-api';
import { Notification, NotificationCategory } from '@/lib/types/organizer';
import { NotificationItem } from './notification-item';
import { NotificationFilters } from './notification-filters';
import { EmptyState } from '../empty-state';
import { Bell, Loader2, Search, Settings, Trash2, CheckCheck } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useNotificationStore } from '@/lib/stores/notification-store';

const CATEGORY_OPTIONS: { value: NotificationCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'All Categories' },
  { value: 'order', label: 'Orders' },
  { value: 'event', label: 'Events' },
  { value: 'payout', label: 'Payouts' },
  { value: 'moderation', label: 'Moderation' },
  { value: 'ticket', label: 'Tickets' },
  { value: 'system', label: 'System' },
  { value: 'marketing', label: 'Marketing' },
];

export function NotificationList() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [categoryFilter, setCategoryFilter] = useState<NotificationCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  useEffect(() => {
    loadNotifications();
    loadUnreadCount();
  }, [activeFilter, categoryFilter, searchQuery, page]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const response = await organizerApi.notifications.list({
        page,
        limit: 20,
        unreadOnly: activeFilter === 'unread',
        category: categoryFilter !== 'all' ? categoryFilter : undefined,
        search: searchQuery || undefined,
      });

      // Filter locally for 'read' since API doesn't support readOnly filter
      let filteredData = response.data;
      if (activeFilter === 'read') {
        filteredData = response.data.filter((n) => n.readAt !== null && n.readAt !== undefined);
      }

      setNotifications(filteredData);
      setTotalPages(response.pagination.totalPages);
      setSelectedIds(new Set()); // Clear selection on reload
    } catch (error) {
      console.error('Failed to load notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const response = await organizerApi.notifications.getUnreadCount();
      setUnreadCount(response.count);
    } catch (error) {
      console.error('Failed to load unread count:', error);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await organizerApi.notifications.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      // Sync with global store
      useNotificationStore.getState().markAsRead(id);

      toast.success('Notification marked as read');
    } catch (error) {
      console.error('Failed to mark as read:', error);
      toast.error('Failed to mark as read');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      // Get notification before deleting to check if it's unread
      const deletedNotification = notifications.find((n) => n.id === id);

      await organizerApi.notifications.delete(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));

      // Update local unread count if deleted notification was unread
      if (deletedNotification && !deletedNotification.readAt) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }

      // Sync with global store
      useNotificationStore.getState().removeNotification(id);

      toast.success('Notification deleted');
    } catch (error) {
      console.error('Failed to delete notification:', error);
      toast.error('Failed to delete notification');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const response = await organizerApi.notifications.markAllAsRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, readAt: new Date().toISOString() }))
      );
      setUnreadCount(0);

      // Sync with global store
      useNotificationStore.getState().markAllAsRead();

      toast.success(`${response.count} notification(s) marked as read`);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      toast.error('Failed to mark all as read');
    }
  };

  // ========== Bulk Actions ==========

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === notifications.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(notifications.map((n) => n.id)));
    }
  };

  const handleBulkMarkAsRead = async () => {
    if (selectedIds.size === 0) return;

    setBulkActionLoading(true);
    try {
      const response = await organizerApi.notifications.bulkMarkAsRead({
        notificationIds: Array.from(selectedIds),
      });

      setNotifications((prev) =>
        prev.map((n) =>
          selectedIds.has(n.id) ? { ...n, readAt: new Date().toISOString() } : n
        )
      );

      // Update local unread count
      const unreadSelectedCount = notifications.filter(
        (n) => selectedIds.has(n.id) && !n.readAt
      ).length;
      setUnreadCount((prev) => Math.max(0, prev - unreadSelectedCount));

      // Sync with global store
      const store = useNotificationStore.getState();
      selectedIds.forEach((id) => {
        store.markAsRead(id);
      });

      setSelectedIds(new Set());
      toast.success(`${response.count} notification(s) marked as read`);
    } catch (error) {
      console.error('Failed to bulk mark as read:', error);
      toast.error('Failed to mark notifications as read');
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;

    if (!confirm(`Are you sure you want to delete ${selectedIds.size} notification(s)?`)) {
      return;
    }

    setBulkActionLoading(true);
    try {
      const response = await organizerApi.notifications.bulkDelete({
        notificationIds: Array.from(selectedIds),
      });

      setNotifications((prev) => prev.filter((n) => !selectedIds.has(n.id)));

      // Update local unread count
      const unreadSelectedCount = notifications.filter(
        (n) => selectedIds.has(n.id) && !n.readAt
      ).length;
      setUnreadCount((prev) => Math.max(0, prev - unreadSelectedCount));

      // Sync with global store
      const store = useNotificationStore.getState();
      selectedIds.forEach((id) => {
        store.removeNotification(id);
      });

      setSelectedIds(new Set());
      toast.success(`${response.count} notification(s) deleted`);
    } catch (error) {
      console.error('Failed to bulk delete:', error);
      toast.error('Failed to delete notifications');
    } finally {
      setBulkActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Bar: Filters + Search + Preferences */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <NotificationFilters
            activeFilter={activeFilter}
            onFilterChange={(filter) => {
              setActiveFilter(filter);
              setPage(1);
            }}
            unreadCount={unreadCount}
          />

          <Link
            href="/organizer/notifications/preferences"
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-foreground border border-border rounded-lg hover:bg-muted transition"
          >
            <Settings className="w-4 h-4" />
            Preferences
          </Link>
        </div>

        {/* Category Filter + Search */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Category Dropdown */}
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value as NotificationCategory | 'all');
              setPage(1);
            }}
            className="px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {CATEGORY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {/* Search Bar */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">
            {selectedIds.size} notification(s) selected
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleBulkMarkAsRead}
              disabled={bulkActionLoading}
              className="px-4 py-2 text-sm font-medium text-foreground bg-background border border-border rounded-lg hover:bg-muted transition disabled:opacity-50 flex items-center gap-2"
            >
              <CheckCheck className="w-4 h-4" />
              Mark as Read
            </button>
            <button
              onClick={handleBulkDelete}
              disabled={bulkActionLoading}
              className="px-4 py-2 text-sm font-medium text-red-600 bg-background border border-border rounded-lg hover:bg-red-50 transition disabled:opacity-50 flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        </div>
      )}

      {/* Mark All as Read */}
      {unreadCount > 0 && selectedIds.size === 0 && (
        <div className="flex justify-end">
          <button
            onClick={handleMarkAllAsRead}
            className="px-4 py-2 text-sm font-medium text-primary hover:underline"
          >
            Mark all as read
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : notifications.length === 0 ? (
        /* Empty State */
        <EmptyState
          icon={<Bell className="w-12 h-12" />}
          title={
            activeFilter === 'unread'
              ? 'No unread notifications'
              : activeFilter === 'read'
              ? 'No read notifications'
              : 'No notifications'
          }
          description={
            activeFilter === 'all' && categoryFilter === 'all' && !searchQuery
              ? 'You have no notifications yet. When you receive notifications, they will appear here.'
              : 'No notifications match your filters. Try adjusting your search or filters.'
          }
        />
      ) : (
        /* Notification List */
        <div className="space-y-3">
          {/* Select All Checkbox */}
          <div className="flex items-center gap-3 px-4 py-2 bg-muted/50 rounded-lg">
            <input
              type="checkbox"
              checked={selectedIds.size === notifications.length && notifications.length > 0}
              onChange={toggleSelectAll}
              className="w-4 h-4 rounded border-border"
            />
            <span className="text-sm text-muted-foreground">
              Select all on this page
            </span>
          </div>

          {notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onMarkAsRead={handleMarkAsRead}
              onDelete={handleDelete}
              selected={selectedIds.has(notification.id)}
              onToggleSelect={toggleSelection}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 text-sm font-medium border border-border rounded-lg hover:bg-muted transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 text-sm font-medium border border-border rounded-lg hover:bg-muted transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
