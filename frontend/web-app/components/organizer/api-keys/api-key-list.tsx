'use client';

import { useState, useEffect } from 'react';
import { Key, Plus, Trash2, Copy, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { organizerApi } from '@/lib/api/organizer-api';
import { useAuth } from '@/components/auth';
import toast from 'react-hot-toast';
import type { ApiKey } from '@/lib/types/organizer';
import { CreateApiKeyModal } from './create-api-key-modal';

export function ApiKeyList() {
  const { initialized: authInitialized, accessToken } = useAuth();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deletingKeyId, setDeletingKeyId] = useState<string | null>(null);

  useEffect(() => {
    if (authInitialized && accessToken) {
      loadApiKeys();
    }
  }, [authInitialized, accessToken]);

  const loadApiKeys = async () => {
    setLoading(true);
    try {
      const data = await organizerApi.apiKeys.list();
      setApiKeys(data);
    } catch (error: any) {
      console.error('Failed to load API keys:', error);
      toast.error(error?.message || 'Failed to load API keys');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (keyId: string, keyName: string) => {
    if (!confirm(`Are you sure you want to revoke the API key "${keyName}"? This action cannot be undone.`)) {
      return;
    }

    setDeletingKeyId(keyId);
    try {
      await organizerApi.apiKeys.revoke(keyId);
      toast.success('API key revoked successfully');
      loadApiKeys();
    } catch (error: any) {
      console.error('Failed to revoke API key:', error);
      toast.error(error?.message || 'Failed to revoke API key');
    } finally {
      setDeletingKeyId(null);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="bg-card rounded-lg shadow-card border border-border p-6 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="space-y-2 flex-1">
                <div className="h-6 bg-secondary rounded w-1/3" />
                <div className="h-4 bg-secondary rounded w-1/4" />
              </div>
              <div className="h-8 w-24 bg-secondary rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">API Keys</h2>
            <p className="text-muted-foreground mt-1">Manage API keys for programmatic access to your events and data</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition"
          >
            <Plus className="w-4 h-4" />
            Create API Key
          </button>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-medium mb-1">Important Security Information</p>
            <p>API keys provide full access to your account. Keep them secure and never share them publicly. The full key is only shown once during creation.</p>
          </div>
        </div>

        {/* Empty State */}
        {apiKeys.length === 0 && !loading && (
          <div className="bg-card rounded-lg shadow-card p-12 text-center">
            <Key className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No API Keys Yet</h3>
            <p className="text-muted-foreground mb-6">
              Create an API key to access the EventFlow API programmatically
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition"
            >
              Create Your First API Key
            </button>
          </div>
        )}

        {/* API Keys List */}
        {apiKeys.length > 0 && (
          <div className="space-y-4">
            {apiKeys.map((key) => (
              <div
                key={key.id}
                className="bg-card rounded-lg shadow-card border border-border p-6 hover:border-primary/50 transition"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Key Name */}
                    <div className="flex items-center gap-2 mb-2">
                      <Key className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                      <h3 className="text-lg font-semibold truncate">{key.name}</h3>
                      {key.revokedAt && (
                        <span className="px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded-full">
                          Revoked
                        </span>
                      )}
                    </div>

                    {/* Key Prefix */}
                    <div className="flex items-center gap-2 mb-3">
                      <code className="px-3 py-1.5 bg-secondary text-secondary-foreground rounded text-sm font-mono">
                        {key.prefix}••••••••••••••••
                      </code>
                      <button
                        onClick={() => copyToClipboard(key.prefix, 'Key prefix')}
                        className="p-1.5 hover:bg-secondary rounded transition"
                        title="Copy prefix"
                      >
                        <Copy className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </div>

                    {/* Metadata */}
                    <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                      <div>
                        <span className="font-medium">Created:</span> {formatDate(key.createdAt)}
                      </div>
                      {key.lastUsedAt && (
                        <div>
                          <span className="font-medium">Last used:</span> {formatDate(key.lastUsedAt)}
                        </div>
                      )}
                      {!key.lastUsedAt && !key.revokedAt && (
                        <div className="text-amber-600">
                          <span className="font-medium">Never used</span>
                        </div>
                      )}
                      {key.scopes && key.scopes.length > 0 && (
                        <div>
                          <span className="font-medium">Scopes:</span> {key.scopes.join(', ')}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    {!key.revokedAt && (
                      <button
                        onClick={() => handleDelete(key.id, key.name)}
                        disabled={deletingKeyId === key.id}
                        className="p-2 text-red-600 hover:bg-red-50 rounded transition disabled:opacity-50"
                        title="Revoke API key"
                      >
                        {deletingKeyId === key.id ? (
                          <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Trash2 className="w-5 h-5" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <CreateApiKeyModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            loadApiKeys();
            setShowCreateModal(false);
          }}
        />
      )}
    </>
  );
}
