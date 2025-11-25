'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Plus, Calendar, Send, Trash2, Edit2, Eye, TrendingUp } from 'lucide-react';
import { Button, Heading } from '@/components/ui';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/components/auth';
import { useOrganizerStore } from '@/lib/stores/organizer-store';

interface Announcement {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'important' | 'urgent';
  isActive: boolean;
  scheduledFor: string | null;
  publishedAt: string | null;
  viewCount: number;
  createdAt: string;
}

interface Analytics {
  totalAnnouncements: number;
  activeAnnouncements: number;
  scheduledAnnouncements: number;
  totalViews: number;
  uniqueViewers: number;
  totalDismissals: number;
  byType: Record<string, { count: number; views: number; dismissals: number }>;
}
 const apiUrl = process.env.NEXT_PUBLIC_API_URL+"/api" || 'http://localhost:3000/api';
export default function AnnouncementsManagementPage() {
 
  const params = useParams();
  const router = useRouter();
  const eventId = params.eventId as string;
  const { accessToken, initialized: authReady } = useAuth();
  const { currentOrganization } = useOrganizerStore();

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    loadData();
  }, [eventId, accessToken, currentOrganization?.id]);

  async function loadData() {
    if (!authReady || !accessToken) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const headers = {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      };
      const orgQuery = currentOrganization?.id ? `&orgId=${currentOrganization.id}` : '';

      const [announcementsRes, analyticsRes] = await Promise.all([
        fetch(`${apiUrl}/events/${eventId}/announcements?includeInactive=true${orgQuery}`, {
          headers,
        }),
        fetch(`${apiUrl}/events/${eventId}/announcements/analytics${orgQuery ? `?orgId=${currentOrganization!.id}` : ''}`, {
          headers,
        }),
      ]);

      if (announcementsRes.ok) {
        const data = await announcementsRes.json();
        setAnnouncements(data);
      } else if (announcementsRes.status === 401) {
        console.warn('Unauthorized to load announcements');
      }

      if (analyticsRes.ok) {
        const data = await analyticsRes.json();
        setAnalytics(data);
      } else if (analyticsRes.status === 401) {
        console.warn('Unauthorized to load announcement analytics');
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this announcement?')) return;

    try {
      const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined;
      const res = await fetch(`${apiUrl}/events/${eventId}/announcements/${id}`, {
        method: 'DELETE',
        headers,
      });

      if (res.ok) {
        loadData();
      }
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  }

  async function handleSendNotification(id: string) {
    if (!confirm('Send notification to all ticket holders?')) return;

    try {
      const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined;
      const res = await fetch(`${apiUrl}/events/${eventId}/announcements/${id}/notify`, {
        method: 'POST',
        headers,
      });

      if (res.ok) {
        alert('Notifications queued successfully!');
      }
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Loading announcements...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <Heading as="h1" className="text-3xl font-bold mb-2">
            Announcements Management
          </Heading>
          <p className="text-muted-foreground">
            Create, schedule, and manage event announcements
          </p>
        </div>
        <Button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Announcement
        </Button>
      </div>

      {/* Analytics Cards */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="Total Announcements"
            value={analytics.totalAnnouncements}
            icon={<TrendingUp className="w-5 h-5" />}
          />
          <StatCard
            label="Active Now"
            value={analytics.activeAnnouncements}
            icon={<Eye className="w-5 h-5" />}
            color="blue"
          />
          <StatCard
            label="Scheduled"
            value={analytics.scheduledAnnouncements}
            icon={<Calendar className="w-5 h-5" />}
            color="amber"
          />
          <StatCard
            label="Total Views"
            value={analytics.totalViews}
            icon={<TrendingUp className="w-5 h-5" />}
            color="green"
          />
        </div>
      )}

      {/* Announcements List */}
      <div className="space-y-4">
        {announcements.length === 0 ? (
          <div className="text-center py-12 border border-border rounded bg-card">
            <p className="text-muted-foreground mb-4">
              No announcements yet. Create your first one!
            </p>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Announcement
            </Button>
          </div>
        ) : (
          announcements.map((announcement) => (
            <AnnouncementCard
              key={announcement.id}
              announcement={announcement}
              onDelete={handleDelete}
              onSendNotification={handleSendNotification}
            />
          ))
        )}
      </div>

      {/* Create Form Modal */}
      {showCreateForm && (
        <CreateAnnouncementModal
          eventId={eventId}
          onClose={() => setShowCreateForm(false)}
          onSuccess={() => {
            setShowCreateForm(false);
            loadData();
          }}
        />
      )}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  color?: 'default' | 'blue' | 'amber' | 'green';
}

function StatCard({ label, value, icon, color = 'default' }: StatCardProps) {
  const colorClasses = {
    default: 'text-foreground',
    blue: 'text-blue-600 dark:text-blue-400',
    amber: 'text-amber-600 dark:text-amber-400',
    green: 'text-green-600 dark:text-green-400',
  };

  return (
    <div className="border border-border rounded bg-card p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-muted-foreground">{label}</span>
        <div className={colorClasses[color]}>{icon}</div>
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

interface AnnouncementCardProps {
  announcement: Announcement;
  onDelete: (id: string) => void;
  onSendNotification: (id: string) => void;
}

function AnnouncementCard({ announcement, onDelete, onSendNotification }: AnnouncementCardProps) {
  const typeStyles = {
    info: 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20',
    warning: 'border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20',
    important: 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20',
    urgent: 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20',
  };

  const typeLabels = {
    info: 'Info',
    warning: 'Warning',
    important: 'Important',
    urgent: 'Urgent',
  };

  const isScheduled = announcement.scheduledFor && !announcement.publishedAt;
  const timeLabel = announcement.publishedAt
    ? `Published ${formatDistanceToNow(new Date(announcement.publishedAt), { addSuffix: true })}`
    : isScheduled
    ? `Scheduled for ${new Date(announcement.scheduledFor!).toLocaleString()}`
    : `Created ${formatDistanceToNow(new Date(announcement.createdAt), { addSuffix: true })}`;

  return (
    <div className={cn('border rounded p-4', typeStyles[announcement.type])}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold uppercase text-muted-foreground">
              {typeLabels[announcement.type]}
            </span>
            {!announcement.isActive && (
              <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">
                Inactive
              </span>
            )}
            {isScheduled && (
              <span className="text-xs px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-900 text-amber-900 dark:text-amber-100">
                Scheduled
              </span>
            )}
          </div>

          {/* Title & Message */}
          <h3 className="font-semibold text-lg mb-1">{announcement.title}</h3>
          <p className="text-sm text-foreground/80 mb-3 line-clamp-2">
            {announcement.message}
          </p>

          {/* Meta */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {announcement.viewCount} views
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {timeLabel}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSendNotification(announcement.id)}
            title="Send notification"
          >
            <Send className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            title="Edit"
          >
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(announcement.id)}
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

interface CreateAnnouncementModalProps {
  eventId: string;
  onClose: () => void;
  onSuccess: () => void;
}

function CreateAnnouncementModal({ eventId, onClose, onSuccess }: CreateAnnouncementModalProps) {
  const { accessToken } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'info' as 'info' | 'warning' | 'important' | 'urgent',
    isActive: true,
    scheduledFor: '',
    sendNotification: false,
  });
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        ...formData,
        scheduledFor: formData.scheduledFor || undefined,
      };

      const res = await fetch(`${apiUrl}/events/${eventId}/announcements`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        onSuccess();
      } else {
        alert('Failed to create announcement');
      }
    } catch (error) {
      console.error('Failed to create announcement:', error);
      alert('An error occurred');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
        <Heading as="h2" className="text-2xl font-bold mb-6">
          Create Announcement
        </Heading>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-2">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded bg-background"
              required
            />
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-medium mb-2">Message</label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded bg-background"
              rows={4}
              required
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium mb-2">Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
              className="w-full px-3 py-2 border border-border rounded bg-background"
            >
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="important">Important</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          {/* Scheduled For */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Schedule For (optional)
            </label>
            <input
              type="datetime-local"
              value={formData.scheduledFor}
              onChange={(e) => setFormData({ ...formData, scheduledFor: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded bg-background"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Leave empty to publish immediately
            </p>
          </div>

          {/* Checkboxes */}
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm">Active (visible to attendees)</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.sendNotification}
                onChange={(e) => setFormData({ ...formData, sendNotification: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm">Send notification to ticket holders</span>
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4">
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Announcement'}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
