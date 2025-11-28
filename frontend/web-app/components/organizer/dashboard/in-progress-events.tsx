'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FileEdit, Trash2, Clock, CheckCircle2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { CreatorDraftItem } from '@/lib/types/organizer';
import { organizerApi } from '@/lib/api/organizer-api';
import toast from 'react-hot-toast';

interface InProgressEventsProps {
  drafts: CreatorDraftItem[];
  orgId: string;
  onDraftDeleted?: () => void;
}

export function InProgressEvents({ drafts, orgId, onDraftDeleted }: InProgressEventsProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (draftId: string) => {
    if (!confirm('Are you sure you want to delete this draft? This action cannot be undone.')) {
      return;
    }

    try {
      setDeletingId(draftId);
      await organizerApi.dashboard.deleteCreatorDraft(draftId, orgId);
      toast.success('Draft deleted successfully');
      onDraftDeleted?.();
    } catch (error) {
      console.error('Failed to delete draft:', error);
      toast.error('Failed to delete draft');
    } finally {
      setDeletingId(null);
    }
  };

  const getCompletionColor = (percent: number) => {
    if (percent >= 80) return 'bg-green-500';
    if (percent >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getSectionLabel = (section: string | null) => {
    if (!section) return 'Not started';

    const labels: Record<string, string> = {
      basics: 'Basic Info',
      story: 'Event Story',
      tickets: 'Ticket Types',
      schedule: 'Schedule',
      checkout: 'Checkout Settings',
    };

    return labels[section] || section;
  };

  if (drafts.length === 0) {
    return null;
  }

  return (
    <div className="bg-card border border-border rounded-lg">
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-2">
          <FileEdit className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">In Progress Events</h2>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          {drafts.length} event{drafts.length !== 1 ? 's' : ''} waiting to be completed
        </p>
      </div>

      <div className="divide-y divide-border">
        {drafts.map((draft) => (
          <div
            key={draft.id}
            className="p-4 hover:bg-accent/50 transition-colors"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-medium text-foreground truncate">
                    {draft.title || 'Untitled Event'}
                  </h3>
                  {draft.status === 'archived' && (
                    <span className="px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                      Archived
                    </span>
                  )}
                </div>

                {/* Completion Progress */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-muted-foreground">
                          {draft.completionPercent}% complete
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Current: {getSectionLabel(draft.activeSection)}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${getCompletionColor(draft.completionPercent)}`}
                          style={{ width: `${draft.completionPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>
                        Updated {formatDistanceToNow(new Date(draft.updatedAt), { addSuffix: true })}
                      </span>
                    </div>
                    {draft.lastAutosavedAt && (
                      <div className="flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>
                          Autosaved {formatDistanceToNow(new Date(draft.lastAutosavedAt), { addSuffix: true })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <Link
                  href={`/organizer/events/create-v2/${draft.id}`}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-md transition-colors"
                >
                  Resume
                </Link>
                <button
                  onClick={() => handleDelete(draft.id)}
                  disabled={deletingId === draft.id}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                  title="Delete draft"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 bg-accent/30 border-t border-border">
        <Link
          href="/organizer/events/create"
          className="text-sm text-primary hover:text-primary/80 font-medium"
        >
          Start a new event →
        </Link>
      </div>
    </div>
  );
}
