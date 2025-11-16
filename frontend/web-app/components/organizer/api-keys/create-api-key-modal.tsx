'use client';

import { useState } from 'react';
import { X, Key, Copy, Check, AlertCircle } from 'lucide-react';
import { organizerApi } from '@/lib/api/organizer-api';
import toast from 'react-hot-toast';
import type { ApiKeyWithSecret } from '@/lib/types/organizer';

interface CreateApiKeyModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateApiKeyModal({ onClose, onSuccess }: CreateApiKeyModalProps) {
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [name, setName] = useState('');
  const [scopes, setScopes] = useState<string[]>([]);
  const [createdKey, setCreatedKey] = useState<ApiKeyWithSecret | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const availableScopes = [
    { value: 'events:read', label: 'Read Events', description: 'View event details and listings' },
    { value: 'events:write', label: 'Write Events', description: 'Create and update events' },
    { value: 'orders:read', label: 'Read Orders', description: 'View order details' },
    { value: 'tickets:read', label: 'Read Tickets', description: 'View ticket information' },
    { value: 'tickets:checkin', label: 'Check-in Tickets', description: 'Check-in attendees' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Please enter a name for the API key');
      return;
    }

    setLoading(true);
    try {
      const result = await organizerApi.apiKeys.create({
        name: name.trim(),
        scopes: scopes.length > 0 ? scopes : undefined,
      });
      setCreatedKey(result);
      setStep('success');
    } catch (error: any) {
      console.error('Failed to create API key:', error);
      toast.error(error?.message || 'Failed to create API key');
    } finally {
      setLoading(false);
    }
  };

  const handleScopeToggle = (scope: string) => {
    setScopes((prev) =>
      prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope]
    );
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('API key copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    if (step === 'success') {
      onSuccess();
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-card rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-2xl font-bold">
            {step === 'form' ? 'Create API Key' : 'API Key Created'}
          </h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-secondary rounded transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 'form' ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name Field */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-2">
                  API Key Name *
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Production Server, Mobile App, Analytics Dashboard"
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Choose a descriptive name to identify where this key will be used
                </p>
              </div>

              {/* Scopes */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Permissions (Optional)
                </label>
                <p className="text-sm text-muted-foreground mb-3">
                  Leave empty for full access, or select specific permissions
                </p>
                <div className="space-y-2">
                  {availableScopes.map((scope) => (
                    <label
                      key={scope.value}
                      className="flex items-start gap-3 p-3 border border-border rounded-lg hover:bg-secondary/50 cursor-pointer transition"
                    >
                      <input
                        type="checkbox"
                        checked={scopes.includes(scope.value)}
                        onChange={() => handleScopeToggle(scope.value)}
                        className="mt-1 w-4 h-4 text-primary border-border rounded focus:ring-2 focus:ring-primary"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-sm">{scope.label}</div>
                        <div className="text-xs text-muted-foreground">{scope.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Warning */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-900">
                  <p className="font-medium mb-1">Security Warning</p>
                  <p>The full API key will only be shown once. Make sure to copy and store it securely.</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-border rounded-lg hover:bg-secondary transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition disabled:opacity-50 flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Key className="w-4 h-4" />
                      Create API Key
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              {/* Success Message */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
                <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-green-900">
                  <p className="font-medium mb-1">API Key Created Successfully</p>
                  <p>Make sure to copy your API key now. You won't be able to see it again!</p>
                </div>
              </div>

              {/* Key Details */}
              {createdKey && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Name</label>
                    <div className="px-4 py-2 bg-secondary rounded-lg text-sm">
                      {createdKey.name}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">API Key</label>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg text-sm font-mono break-all">
                        {createdKey.secret}
                      </code>
                      <button
                        onClick={() => copyToClipboard(createdKey.secret)}
                        className="p-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition flex-shrink-0"
                        title="Copy to clipboard"
                      >
                        {copied ? (
                          <Check className="w-5 h-5" />
                        ) : (
                          <Copy className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {createdKey.scopes && createdKey.scopes.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium mb-2">Permissions</label>
                      <div className="px-4 py-2 bg-secondary rounded-lg text-sm">
                        {createdKey.scopes.join(', ')}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Warning */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-red-900">
                  <p className="font-medium mb-1">Important!</p>
                  <p>This is the only time you will see the full API key. Store it securely and never share it publicly.</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end">
                <button
                  onClick={handleClose}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
