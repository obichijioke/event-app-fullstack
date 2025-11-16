'use client';

import { useEffect, useState } from 'react';
import { organizerApi } from '@/lib/api/organizer-api';
import { NotificationPreference, NotificationCategory, NotificationFrequency } from '@/lib/types/organizer';
import { ArrowLeft, Bell, Mail, Smartphone, MessageSquare, Save, Loader2 } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

const CATEGORY_INFO: Record<NotificationCategory, { label: string; description: string; icon: string }> = {
  order: {
    label: 'Orders',
    description: 'Notifications about new orders, payments, and refunds',
    icon: '💰',
  },
  event: {
    label: 'Events',
    description: 'Updates about your events, approvals, and status changes',
    icon: '🎉',
  },
  payout: {
    label: 'Payouts',
    description: 'Information about payouts, transfers, and financial transactions',
    icon: '💵',
  },
  moderation: {
    label: 'Moderation',
    description: 'Alerts for content moderation, flags, and reviews',
    icon: '⚠️',
  },
  ticket: {
    label: 'Tickets',
    description: 'Ticket sales, transfers, and check-in notifications',
    icon: '🎫',
  },
  system: {
    label: 'System',
    description: 'Important system updates and maintenance notices',
    icon: '⚙️',
  },
  marketing: {
    label: 'Marketing',
    description: 'Promotional content, tips, and best practices',
    icon: '📢',
  },
};

const FREQUENCY_OPTIONS: { value: NotificationFrequency; label: string }[] = [
  { value: 'instant', label: 'Instant' },
  { value: 'daily_digest', label: 'Daily Digest' },
  { value: 'weekly_digest', label: 'Weekly Digest' },
  { value: 'disabled', label: 'Disabled' },
];

export default function NotificationPreferencesPage() {
  const [preferences, setPreferences] = useState<NotificationPreference[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    setLoading(true);
    try {
      const response = await organizerApi.notifications.getPreferences();
      setPreferences(response);
    } catch (error) {
      console.error('Failed to load preferences:', error);
      toast.error('Failed to load notification preferences');
    } finally {
      setLoading(false);
    }
  };

  const updatePreference = (
    category: NotificationCategory,
    channel: 'inApp' | 'email' | 'push' | 'sms',
    value: NotificationFrequency
  ) => {
    setPreferences((prev) =>
      prev.map((pref) =>
        pref.category === category ? { ...pref, [channel]: value } : pref
      )
    );
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await organizerApi.notifications.bulkUpdatePreferences({
        preferences: preferences.map((pref) => ({
          category: pref.category,
          inApp: pref.inApp,
          email: pref.email,
          push: pref.push,
          sms: pref.sms,
        })),
      });
      toast.success('Preferences saved successfully');
      setHasChanges(false);
    } catch (error) {
      console.error('Failed to save preferences:', error);
      toast.error('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/organizer/notifications"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Notifications
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Notification Preferences
            </h1>
            <p className="text-muted-foreground mt-2">
              Control how and when you receive notifications
            </p>
          </div>
          {hasChanges && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Channel Legend */}
      <div className="bg-card border border-border rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4 text-foreground">Channels</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-primary" />
            <div>
              <div className="font-medium text-sm text-foreground">In-App</div>
              <div className="text-xs text-muted-foreground">Dashboard notifications</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5 text-blue-500" />
            <div>
              <div className="font-medium text-sm text-foreground">Email</div>
              <div className="text-xs text-muted-foreground">Email notifications</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Smartphone className="w-5 h-5 text-green-500" />
            <div>
              <div className="font-medium text-sm text-foreground">Push</div>
              <div className="text-xs text-muted-foreground">Mobile push notifications</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <MessageSquare className="w-5 h-5 text-amber-500" />
            <div>
              <div className="font-medium text-sm text-foreground">SMS</div>
              <div className="text-xs text-muted-foreground">Text messages</div>
            </div>
          </div>
        </div>
      </div>

      {/* Preferences Grid */}
      <div className="space-y-6">
        {preferences.map((pref) => {
          const info = CATEGORY_INFO[pref.category];
          return (
            <div
              key={pref.category}
              className="bg-card border border-border rounded-lg p-6"
            >
              {/* Category Header */}
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{info.icon}</span>
                  <h3 className="text-lg font-semibold text-foreground">
                    {info.label}
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground">{info.description}</p>
              </div>

              {/* Channel Controls */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* In-App */}
                <div>
                  <label className="block text-sm font-medium mb-2 text-foreground flex items-center gap-2">
                    <Bell className="w-4 h-4" />
                    In-App
                  </label>
                  <select
                    value={pref.inApp}
                    onChange={(e) =>
                      updatePreference(
                        pref.category,
                        'inApp',
                        e.target.value as NotificationFrequency
                      )
                    }
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {FREQUENCY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium mb-2 text-foreground flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email
                  </label>
                  <select
                    value={pref.email}
                    onChange={(e) =>
                      updatePreference(
                        pref.category,
                        'email',
                        e.target.value as NotificationFrequency
                      )
                    }
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {FREQUENCY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Push */}
                <div>
                  <label className="block text-sm font-medium mb-2 text-foreground flex items-center gap-2">
                    <Smartphone className="w-4 h-4" />
                    Push
                  </label>
                  <select
                    value={pref.push}
                    onChange={(e) =>
                      updatePreference(
                        pref.category,
                        'push',
                        e.target.value as NotificationFrequency
                      )
                    }
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {FREQUENCY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* SMS */}
                <div>
                  <label className="block text-sm font-medium mb-2 text-foreground flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    SMS
                  </label>
                  <select
                    value={pref.sms}
                    onChange={(e) =>
                      updatePreference(
                        pref.category,
                        'sms',
                        e.target.value as NotificationFrequency
                      )
                    }
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {FREQUENCY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Save Button (Bottom) */}
      {hasChanges && (
        <div className="mt-8 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save All Changes
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
