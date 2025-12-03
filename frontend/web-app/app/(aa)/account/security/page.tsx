'use client';

import { useEffect, useState } from 'react';
import { authApi, type Session, type ApiKey, type UserProfile } from '@/lib/api/auth-api';
import { Loader2, X, Shield } from 'lucide-react';

export default function SecurityPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [passwordModal, setPasswordModal] = useState(false);
  const [twoFaModal, setTwoFaModal] = useState(false);
  const [apiKeyModal, setApiKeyModal] = useState(false);
  const [newApiKey, setNewApiKey] = useState<{ name: string; key: string } | null>(null);

  // Form states
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [twoFaCode, setTwoFaCode] = useState('');
  const [apiKeyName, setApiKeyName] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [profileData, sessionsData, apiKeysData] = await Promise.all([
        authApi.getProfile(),
        authApi.getSessions(),
        authApi.getApiKeys(),
      ]);
      setProfile(profileData);
      setSessions(sessionsData);
      setApiKeys(apiKeysData);
    } catch (err: any) {
      console.error('Failed to load security data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setProcessing(true);
    setError(null);
    try {
      await authApi.changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      setSuccess('Password changed successfully');
      setPasswordModal(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err?.message || 'Failed to change password');
    } finally {
      setProcessing(false);
    }
  };

  const handleToggle2FA = async (action: 'enable' | 'disable') => {
    setProcessing(true);
    setError(null);
    try {
      if (action === 'enable') {
        await authApi.requestTwoFactorCode('enable');
        setTwoFaModal(true);
      } else {
        await authApi.requestTwoFactorCode('disable');
        setTwoFaModal(true);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to request 2FA code');
    } finally {
      setProcessing(false);
    }
  };

  const handleConfirm2FA = async (action: 'enable' | 'disable') => {
    setProcessing(true);
    setError(null);
    try {
      if (action === 'enable') {
        await authApi.enableTwoFactor(twoFaCode);
        setSuccess('Two-factor authentication enabled');
      } else {
        await authApi.disableTwoFactor(twoFaCode);
        setSuccess('Two-factor authentication disabled');
      }
      setTwoFaModal(false);
      setTwoFaCode('');
      await fetchData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err?.message || 'Invalid code');
    } finally {
      setProcessing(false);
    }
  };

  const handleCreateApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    setError(null);
    try {
      const result = await authApi.createApiKey(apiKeyName);
      setNewApiKey({ name: result.name, key: result.key });
      setApiKeyName('');
      await fetchData();
    } catch (err: any) {
      setError(err?.message || 'Failed to create API key');
    } finally {
      setProcessing(false);
    }
  };

  const handleRevokeApiKey = async (id: string) => {
    if (!confirm('Are you sure you want to revoke this API key?')) return;
    try {
      await authApi.revokeApiKey(id);
      await fetchData();
    } catch (err: any) {
      setError(err?.message || 'Failed to revoke API key');
    }
  };

  const handleRevokeSession = async (id: string) => {
    if (!confirm('Are you sure you want to revoke this session?')) return;
    try {
      await authApi.revokeSession(id);
      await fetchData();
    } catch (err: any) {
      setError(err?.message || 'Failed to revoke session');
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="overflow-hidden rounded-xl border border-border/70 bg-card">
        <div className="bg-linear-to-r from-slate-900 via-slate-800 to-slate-700 px-6 py-6 text-white">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur mb-2">
            <Shield className="h-4 w-4" />
            Security
          </div>
          <h1 className="text-3xl font-semibold">Security Settings</h1>
          <p className="text-sm text-slate-200 mt-1">Manage your password, 2FA, sessions, and API keys</p>
        </div>
      </div>

      {error && (
        <div className="max-w-2xl bg-destructive/10 border border-destructive/40 rounded-xl p-4">
          <p className="text-destructive text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="max-w-2xl bg-emerald-50 border border-emerald-200 rounded-xl p-4">
          <p className="text-emerald-800 text-sm">{success}</p>
        </div>
      )}

      <div className="max-w-2xl space-y-6">
        {/* Password */}
        <div className="bg-card rounded-xl border border-border/70 overflow-hidden">
          <div className="px-6 py-4 bg-muted/30 border-b border-border/50">
            <h2 className="text-lg font-semibold">Password</h2>
          </div>
          <div className="p-6">
            <p className="text-sm text-muted-foreground mb-4">
              Change your password to keep your account secure
            </p>
            <button
              onClick={() => setPasswordModal(true)}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition text-sm font-medium"
            >
              Change Password
            </button>
          </div>
        </div>

        {/* Two-Factor Authentication */}
        <div className="bg-card rounded-xl border border-border/70 overflow-hidden">
          <div className="px-6 py-4 bg-muted/30 border-b border-border/50">
            <h2 className="text-lg font-semibold">Two-Factor Authentication</h2>
          </div>
          <div className="p-6">
            <p className="text-sm text-muted-foreground mb-4">
              Add an extra layer of security to your account
              {profile?.twoFactorEnabled && (
                <span className="ml-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-100 text-emerald-800 px-2.5 py-1 text-xs font-semibold">
                  <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
                  Enabled
                </span>
              )}
            </p>
            <button
              onClick={() => handleToggle2FA(profile?.twoFactorEnabled ? 'disable' : 'enable')}
              disabled={processing}
              className={`px-4 py-2 rounded-lg hover:opacity-90 transition text-sm font-medium disabled:opacity-50 ${
                profile?.twoFactorEnabled
                  ? 'border border-border hover:bg-muted'
                  : 'bg-primary text-primary-foreground'
              }`}
            >
              {profile?.twoFactorEnabled ? 'Disable 2FA' : 'Enable 2FA'}
            </button>
          </div>
        </div>

        {/* Active Sessions */}
        <div className="bg-card rounded-xl border border-border/70 overflow-hidden">
          <div className="px-6 py-4 bg-muted/30 border-b border-border/50">
            <h2 className="text-lg font-semibold">Active Sessions</h2>
          </div>
          <div className="p-6">
            <p className="text-sm text-muted-foreground mb-4">
              Manage devices where you&apos;re currently logged in
            </p>
            <div className="space-y-3">
              {sessions.map((session) => (
                <div key={session.id} className="flex items-center justify-between p-4 border border-border/70 rounded-lg hover:bg-muted/20 transition">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{session.userAgent || 'Unknown Device'}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {session.ipAddr} • Last active: {formatDate(session.lastActiveAt)}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRevokeSession(session.id)}
                    className="text-xs text-destructive hover:underline font-medium"
                  >
                    Revoke
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* API Keys */}
        <div className="bg-card rounded-xl border border-border/70 overflow-hidden">
          <div className="px-6 py-4 bg-muted/30 border-b border-border/50">
            <h2 className="text-lg font-semibold">API Keys</h2>
          </div>
          <div className="p-6">
            <p className="text-sm text-muted-foreground mb-4">
              Manage API keys for integrations
            </p>
            {apiKeys.length > 0 && (
              <div className="space-y-3 mb-4">
                {apiKeys.map((key) => (
                  <div key={key.id} className="flex items-center justify-between p-4 border border-border/70 rounded-lg hover:bg-muted/20 transition">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{key.name}</p>
                      <p className="text-xs text-muted-foreground font-mono mt-1">{key.prefix}••••••••</p>
                    </div>
                    <button
                      onClick={() => handleRevokeApiKey(key.id)}
                      className="text-xs text-destructive hover:underline font-medium"
                    >
                      Revoke
                    </button>
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={() => setApiKeyModal(true)}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition text-sm font-medium"
            >
              Generate API Key
            </button>
          </div>
        </div>
      </div>

      {/* Password Change Modal */}
      {passwordModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-card rounded-xl border border-border/70 overflow-hidden max-w-md w-full mx-4 shadow-lg">
            <div className="flex items-center justify-between px-6 py-4 bg-muted/30 border-b border-border/50">
              <h3 className="text-lg font-semibold">Change Password</h3>
              <button onClick={() => setPasswordModal(false)} className="hover:bg-muted rounded-lg p-1 transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleChangePassword} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Current Password</label>
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">New Password</label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  required
                  minLength={8}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Confirm Password</label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={processing}
                  className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 font-medium text-sm"
                >
                  {processing ? 'Saving...' : 'Change Password'}
                </button>
                <button
                  type="button"
                  onClick={() => setPasswordModal(false)}
                  className="px-4 py-2.5 border border-border rounded-lg hover:bg-muted text-sm font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2FA Modal */}
      {twoFaModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-card rounded-xl border border-border/70 overflow-hidden max-w-md w-full mx-4 shadow-lg">
            <div className="flex items-center justify-between px-6 py-4 bg-muted/30 border-b border-border/50">
              <h3 className="text-lg font-semibold">
                {profile?.twoFactorEnabled ? 'Disable' : 'Enable'} 2FA
              </h3>
              <button onClick={() => setTwoFaModal(false)} className="hover:bg-muted rounded-lg p-1 transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm text-muted-foreground mb-4">
                Enter the verification code sent to your email
              </p>
              <input
                type="text"
                value={twoFaCode}
                onChange={(e) => setTwoFaCode(e.target.value)}
                placeholder="Enter code"
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary mb-4"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => handleConfirm2FA(profile?.twoFactorEnabled ? 'disable' : 'enable')}
                  disabled={processing || !twoFaCode}
                  className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 font-medium text-sm"
                >
                  {processing ? 'Verifying...' : 'Confirm'}
                </button>
                <button
                  onClick={() => setTwoFaModal(false)}
                  className="px-4 py-2.5 border border-border rounded-lg hover:bg-muted text-sm font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* API Key Modal */}
      {apiKeyModal && !newApiKey && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-card rounded-xl border border-border/70 overflow-hidden max-w-md w-full mx-4 shadow-lg">
            <div className="flex items-center justify-between px-6 py-4 bg-muted/30 border-b border-border/50">
              <h3 className="text-lg font-semibold">Generate API Key</h3>
              <button onClick={() => setApiKeyModal(false)} className="hover:bg-muted rounded-lg p-1 transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateApiKey} className="p-6">
              <label className="block text-sm font-medium mb-2">Key Name</label>
              <input
                type="text"
                value={apiKeyName}
                onChange={(e) => setApiKeyName(e.target.value)}
                placeholder="e.g., Production API"
                required
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary mb-4"
              />
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={processing}
                  className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 font-medium text-sm"
                >
                  {processing ? 'Generating...' : 'Generate'}
                </button>
                <button
                  type="button"
                  onClick={() => setApiKeyModal(false)}
                  className="px-4 py-2.5 border border-border rounded-lg hover:bg-muted text-sm font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New API Key Display */}
      {newApiKey && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-card rounded-xl border border-border/70 overflow-hidden max-w-md w-full mx-4 shadow-lg">
            <div className="px-6 py-4 bg-muted/30 border-b border-border/50">
              <h3 className="text-lg font-semibold">API Key Created</h3>
            </div>
            <div className="p-6">
              <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                Save this key now! You won&apos;t be able to see it again.
              </p>
              <div className="bg-muted border border-border/50 p-4 rounded-lg mb-4">
                <p className="text-sm font-semibold mb-2">{newApiKey.name}</p>
                <code className="text-xs break-all font-mono bg-background px-2 py-1 rounded border border-border/50 block">{newApiKey.key}</code>
              </div>
              <button
                onClick={() => {
                  setNewApiKey(null);
                  setApiKeyModal(false);
                }}
                className="w-full px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:opacity-90 font-medium text-sm"
              >
                I&apos;ve Saved My Key
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
