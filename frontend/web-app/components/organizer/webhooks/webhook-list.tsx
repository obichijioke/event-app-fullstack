'use client';

import { useState, useEffect } from 'react';
import { Webhook as WebhookIcon, Plus, Trash2, Edit, Power, PowerOff, ExternalLink } from 'lucide-react';
import { organizerApi } from '@/lib/api/organizer-api';
import { useOrganizerStore } from '@/lib/stores/organizer-store';
import { useAuth } from '@/components/auth';
import toast from 'react-hot-toast';
import type { Webhook } from '@/lib/types/organizer';
import { CreateWebhookModal } from './create-webhook-modal';
import { EditWebhookModal } from './edit-webhook-modal';
import Link from 'next/link';

export function WebhookList() {
  const { currentOrganization } = useOrganizerStore();
  const { initialized: authInitialized, accessToken } = useAuth();
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<Webhook | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    if (authInitialized && accessToken && currentOrganization) {
      loadWebhooks();
    }
  }, [authInitialized, accessToken, currentOrganization]);

  const loadWebhooks = async () => {
    if (!currentOrganization) return;

    setLoading(true);
    try {
      const data = await organizerApi.webhooks.list(currentOrganization.id);
      setWebhooks(data);
    } catch (error: any) {
      console.error('Failed to load webhooks:', error);
      toast.error(error?.message || 'Failed to load webhooks');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (webhook: Webhook) => {
    if (!currentOrganization) return;
    if (!confirm(`Are you sure you want to delete the webhook "${webhook.url}"? This action cannot be undone.`)) {
      return;
    }

    setDeletingId(webhook.id);
    try {
      await organizerApi.webhooks.delete(currentOrganization.id, webhook.id);
      toast.success('Webhook deleted successfully');
      loadWebhooks();
    } catch (error: any) {
      console.error('Failed to delete webhook:', error);
      toast.error(error?.message || 'Failed to delete webhook');
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleActive = async (webhook: Webhook) => {
    if (!currentOrganization) return;

    setTogglingId(webhook.id);
    try {
      await organizerApi.webhooks.update(currentOrganization.id, webhook.id, {
        active: !webhook.active,
      });
      toast.success(`Webhook ${!webhook.active ? 'enabled' : 'disabled'}`);
      loadWebhooks();
    } catch (error: any) {
      console.error('Failed to toggle webhook:', error);
      toast.error(error?.message || 'Failed to toggle webhook');
    } finally {
      setTogglingId(null);
    }
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
                <div className="h-6 bg-secondary rounded w-2/3" />
                <div className="h-4 bg-secondary rounded w-1/2" />
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
            <h2 className="text-2xl font-bold">Webhooks</h2>
            <p className="text-muted-foreground mt-1">Configure webhooks to receive real-time event notifications</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition"
          >
            <Plus className="w-4 h-4" />
            Create Webhook
          </button>
        </div>

        {/* Empty State */}
        {webhooks.length === 0 && !loading && (
          <div className="bg-card rounded-lg shadow-card p-12 text-center">
            <WebhookIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Webhooks Yet</h3>
            <p className="text-muted-foreground mb-6">
              Create a webhook to receive real-time notifications about orders, tickets, and other events
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition"
            >
              Create Your First Webhook
            </button>
          </div>
        )}

        {/* Webhooks List */}
        {webhooks.length > 0 && (
          <div className="space-y-4">
            {webhooks.map((webhook) => (
              <div
                key={webhook.id}
                className={`bg-card rounded-lg shadow-card border ${
                  webhook.active ? 'border-border' : 'border-muted/30 opacity-75'
                } p-6 hover:border-primary/50 transition`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Webhook URL */}
                    <div className="flex items-center gap-2 mb-2">
                      <WebhookIcon className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                      <a
                        href={webhook.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-lg font-semibold truncate hover:text-primary transition flex items-center gap-1"
                      >
                        {webhook.url}
                        <ExternalLink className="w-4 h-4 flex-shrink-0" />
                      </a>
                      {!webhook.active && (
                        <span className="px-2 py-0.5 text-xs bg-muted text-muted-foreground rounded-full">
                          Disabled
                        </span>
                      )}
                    </div>

                    {/* Description */}
                    {webhook.description && (
                      <p className="text-sm text-muted-foreground mb-3">{webhook.description}</p>
                    )}

                    {/* Event Filters */}
                    <div className="mb-3">
                      <span className="text-sm font-medium text-muted-foreground mr-2">Events:</span>
                      <div className="inline-flex flex-wrap gap-2 mt-1">
                        {webhook.eventFilters.length > 0 ? (
                          webhook.eventFilters.map((filter) => (
                            <span
                              key={filter}
                              className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded border border-blue-200"
                            >
                              {filter}
                            </span>
                          ))
                        ) : (
                          <span className="text-sm text-muted-foreground">All events</span>
                        )}
                      </div>
                    </div>

                    {/* Metadata */}
                    <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                      <div>
                        <span className="font-medium">Created:</span> {formatDate(webhook.createdAt)}
                      </div>
                      {webhook._count && (
                        <div>
                          <span className="font-medium">Deliveries:</span> {webhook._count.attempts}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleToggleActive(webhook)}
                      disabled={togglingId === webhook.id}
                      className={`p-2 rounded transition ${
                        webhook.active
                          ? 'text-amber-600 hover:bg-amber-50'
                          : 'text-green-600 hover:bg-green-50'
                      } disabled:opacity-50`}
                      title={webhook.active ? 'Disable webhook' : 'Enable webhook'}
                    >
                      {togglingId === webhook.id ? (
                        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      ) : webhook.active ? (
                        <PowerOff className="w-5 h-5" />
                      ) : (
                        <Power className="w-5 h-5" />
                      )}
                    </button>
                    <button
                      onClick={() => setEditingWebhook(webhook)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded transition"
                      title="Edit webhook"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(webhook)}
                      disabled={deletingId === webhook.id}
                      className="p-2 text-red-600 hover:bg-red-50 rounded transition disabled:opacity-50"
                      title="Delete webhook"
                    >
                      {deletingId === webhook.id ? (
                        <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Trash2 className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <CreateWebhookModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            loadWebhooks();
            setShowCreateModal(false);
          }}
        />
      )}

      {/* Edit Modal */}
      {editingWebhook && (
        <EditWebhookModal
          webhook={editingWebhook}
          onClose={() => setEditingWebhook(null)}
          onSuccess={() => {
            loadWebhooks();
            setEditingWebhook(null);
          }}
        />
      )}
    </>
  );
}
