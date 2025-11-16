'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth';
import { adminApiService } from '@/services/admin-api.service';

interface SiteSettings {
  siteName: string;
  siteTagline: string;
  supportEmail: string;
  contactEmail: string;
  maintenanceMode: boolean;
  maintenanceMessage: string;
  allowRegistrations: boolean;
  requireEmailVerification: boolean;
  defaultCurrency: string;
  defaultTimezone: string;
  platformFeePercent: number;
  processingFeePercent: number;
  enableStripe: boolean;
  enablePaystack: boolean;
  maxUploadSizeMB: number;
  eventsRequireApproval: boolean;
  enableAnalytics: boolean;
  termsUrl: string;
  privacyUrl: string;
  facebookUrl: string;
  twitterUrl: string;
  instagramUrl: string;
  linkedinUrl: string;
}

export default function SiteSettingsForm() {
  const { user, accessToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [settings, setSettings] = useState<SiteSettings>({
    siteName: '',
    siteTagline: '',
    supportEmail: '',
    contactEmail: '',
    maintenanceMode: false,
    maintenanceMessage: '',
    allowRegistrations: true,
    requireEmailVerification: true,
    defaultCurrency: 'NGN',
    defaultTimezone: 'Africa/Lagos',
    platformFeePercent: 2.5,
    processingFeePercent: 1.5,
    enableStripe: true,
    enablePaystack: true,
    maxUploadSizeMB: 10,
    eventsRequireApproval: false,
    enableAnalytics: true,
    termsUrl: '',
    privacyUrl: '',
    facebookUrl: '',
    twitterUrl: '',
    instagramUrl: '',
    linkedinUrl: '',
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    if (!accessToken) return;
    
    try {
      setLoading(true);
      const response = await adminApiService.getSiteSettings(accessToken);
      if (response.success && response.data) {
        setSettings(response.data as unknown as SiteSettings);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
      setMessage({ type: 'error', text: 'Failed to load settings' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;

    try {
      setSaving(true);
      setMessage(null);
      const response = await adminApiService.updateSiteSettings(accessToken, settings as unknown as Record<string, unknown>);
      if (response.success) {
        setMessage({ type: 'success', text: 'Settings updated successfully!' });
        setTimeout(() => setMessage(null), 5000);
      }
    } catch (error) {
      console.error('Failed to update settings:', error);
      setMessage({ type: 'error', text: 'Failed to update settings' });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof SiteSettings, value: string | number | boolean) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading settings...</div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {message && (
        <div className={`p-4 rounded-lg border ${
          message.type === 'success' 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      {/* General Settings */}
      <div className="bg-card rounded-lg border border-border p-6">
        <h2 className="text-xl font-semibold mb-4">General Settings</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2">Site Name</label>
            <input
              type="text"
              value={settings.siteName}
              onChange={(e) => handleChange('siteName', e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Site Tagline</label>
            <input
              type="text"
              value={settings.siteTagline}
              onChange={(e) => handleChange('siteTagline', e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Support Email</label>
            <input
              type="email"
              value={settings.supportEmail}
              onChange={(e) => handleChange('supportEmail', e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Contact Email</label>
            <input
              type="email"
              value={settings.contactEmail}
              onChange={(e) => handleChange('contactEmail', e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
      </div>

      {/* Maintenance Mode */}
      <div className="bg-card rounded-lg border border-border p-6">
        <h2 className="text-xl font-semibold mb-4">Maintenance Mode</h2>
        <div className="space-y-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="maintenanceMode"
              checked={settings.maintenanceMode}
              onChange={(e) => handleChange('maintenanceMode', e.target.checked)}
              className="w-4 h-4 text-primary border-border rounded focus:ring-2 focus:ring-primary"
            />
            <label htmlFor="maintenanceMode" className="ml-2 text-sm font-medium">
              Enable Maintenance Mode
            </label>
          </div>
          {settings.maintenanceMode && (
            <div>
              <label className="block text-sm font-medium mb-2">Maintenance Message</label>
              <textarea
                value={settings.maintenanceMessage}
                onChange={(e) => handleChange('maintenanceMessage', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          )}
        </div>
      </div>

      {/* User Registration */}
      <div className="bg-card rounded-lg border border-border p-6">
        <h2 className="text-xl font-semibold mb-4">User Registration</h2>
        <div className="space-y-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="allowRegistrations"
              checked={settings.allowRegistrations}
              onChange={(e) => handleChange('allowRegistrations', e.target.checked)}
              className="w-4 h-4 text-primary border-border rounded focus:ring-2 focus:ring-primary"
            />
            <label htmlFor="allowRegistrations" className="ml-2 text-sm font-medium">
              Allow New User Registrations
            </label>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="requireEmailVerification"
              checked={settings.requireEmailVerification}
              onChange={(e) => handleChange('requireEmailVerification', e.target.checked)}
              className="w-4 h-4 text-primary border-border rounded focus:ring-2 focus:ring-primary"
            />
            <label htmlFor="requireEmailVerification" className="ml-2 text-sm font-medium">
              Require Email Verification
            </label>
          </div>
        </div>
      </div>

      {/* Regional Settings */}
      <div className="bg-card rounded-lg border border-border p-6">
        <h2 className="text-xl font-semibold mb-4">Regional Settings</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2">Default Currency</label>
            <select
              value={settings.defaultCurrency}
              onChange={(e) => handleChange('defaultCurrency', e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="NGN">NGN - Nigerian Naira</option>
              <option value="USD">USD - US Dollar</option>
              <option value="EUR">EUR - Euro</option>
              <option value="GBP">GBP - British Pound</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Default Timezone</label>
            <select
              value={settings.defaultTimezone}
              onChange={(e) => handleChange('defaultTimezone', e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="Africa/Lagos">Africa/Lagos (WAT)</option>
              <option value="America/New_York">America/New_York (EST)</option>
              <option value="Europe/London">Europe/London (GMT)</option>
              <option value="Asia/Dubai">Asia/Dubai (GST)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Payment & Fees */}
      <div className="bg-card rounded-lg border border-border p-6">
        <h2 className="text-xl font-semibold mb-4">Payment & Fees</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2">Platform Fee (%)</label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="100"
              value={settings.platformFeePercent}
              onChange={(e) => handleChange('platformFeePercent', parseFloat(e.target.value))}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Processing Fee (%)</label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="100"
              value={settings.processingFeePercent}
              onChange={(e) => handleChange('processingFeePercent', parseFloat(e.target.value))}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="enableStripe"
              checked={settings.enableStripe}
              onChange={(e) => handleChange('enableStripe', e.target.checked)}
              className="w-4 h-4 text-primary border-border rounded focus:ring-2 focus:ring-primary"
            />
            <label htmlFor="enableStripe" className="ml-2 text-sm font-medium">
              Enable Stripe Payments
            </label>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="enablePaystack"
              checked={settings.enablePaystack}
              onChange={(e) => handleChange('enablePaystack', e.target.checked)}
              className="w-4 h-4 text-primary border-border rounded focus:ring-2 focus:ring-primary"
            />
            <label htmlFor="enablePaystack" className="ml-2 text-sm font-medium">
              Enable Paystack Payments
            </label>
          </div>
        </div>
      </div>

      {/* Event Settings */}
      <div className="bg-card rounded-lg border border-border p-6">
        <h2 className="text-xl font-semibold mb-4">Event Settings</h2>
        <div className="space-y-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="eventsRequireApproval"
              checked={settings.eventsRequireApproval}
              onChange={(e) => handleChange('eventsRequireApproval', e.target.checked)}
              className="w-4 h-4 text-primary border-border rounded focus:ring-2 focus:ring-primary"
            />
            <label htmlFor="eventsRequireApproval" className="ml-2 text-sm font-medium">
              Events Require Admin Approval
            </label>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="enableAnalytics"
              checked={settings.enableAnalytics}
              onChange={(e) => handleChange('enableAnalytics', e.target.checked)}
              className="w-4 h-4 text-primary border-border rounded focus:ring-2 focus:ring-primary"
            />
            <label htmlFor="enableAnalytics" className="ml-2 text-sm font-medium">
              Enable Event Analytics
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Max Upload Size (MB)</label>
            <input
              type="number"
              min="1"
              max="100"
              value={settings.maxUploadSizeMB}
              onChange={(e) => handleChange('maxUploadSizeMB', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
      </div>

      {/* Legal Pages */}
      <div className="bg-card rounded-lg border border-border p-6">
        <h2 className="text-xl font-semibold mb-4">Legal Pages</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2">Terms of Service URL</label>
            <input
              type="url"
              value={settings.termsUrl}
              onChange={(e) => handleChange('termsUrl', e.target.value)}
              placeholder="https://example.com/terms"
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Privacy Policy URL</label>
            <input
              type="url"
              value={settings.privacyUrl}
              onChange={(e) => handleChange('privacyUrl', e.target.value)}
              placeholder="https://example.com/privacy"
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
      </div>

      {/* Social Media */}
      <div className="bg-card rounded-lg border border-border p-6">
        <h2 className="text-xl font-semibold mb-4">Social Media Links</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2">Facebook URL</label>
            <input
              type="url"
              value={settings.facebookUrl}
              onChange={(e) => handleChange('facebookUrl', e.target.value)}
              placeholder="https://facebook.com/yourpage"
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Twitter URL</label>
            <input
              type="url"
              value={settings.twitterUrl}
              onChange={(e) => handleChange('twitterUrl', e.target.value)}
              placeholder="https://twitter.com/yourhandle"
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Instagram URL</label>
            <input
              type="url"
              value={settings.instagramUrl}
              onChange={(e) => handleChange('instagramUrl', e.target.value)}
              placeholder="https://instagram.com/yourhandle"
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">LinkedIn URL</label>
            <input
              type="url"
              value={settings.linkedinUrl}
              onChange={(e) => handleChange('linkedinUrl', e.target.value)}
              placeholder="https://linkedin.com/company/yourcompany"
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-4">
        <button
          type="button"
          onClick={loadSettings}
          className="px-6 py-2 border border-border rounded-md hover:bg-secondary transition"
          disabled={saving}
        >
          Reset
        </button>
        <button
          type="submit"
          className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition disabled:opacity-50"
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </form>
  );
}

