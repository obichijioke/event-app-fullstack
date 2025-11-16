'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { Eye, LogOut, Share2, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { eventCreatorV2Api } from '@/lib/api/event-creator-v2-api';
import { useEventCreatorDraft } from '@/components/creator-v2/event-creator-provider';
import { toast } from 'react-hot-toast';

export function CreatorHeader() {
  const router = useRouter();
  const { draft, lastSavedAt, refresh } = useEventCreatorDraft();
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [versions, setVersions] = useState<Array<{ id: string; section?: string; reason?: string; createdAt: string; createdBy: string }>>([]);
  const [loadingVersions, setLoadingVersions] = useState(false);

  if (!draft) {
    return null;
  }

  const savedLabel = useMemo(() => {
    if (!lastSavedAt) {
      return 'Autosave ready';
    }
    return `Saved ${formatDistanceToNow(lastSavedAt, { addSuffix: true })}`;
  }, [lastSavedAt]);

  const handlePreview = async () => {
    setIsPreviewLoading(true);
    try {
      const preview = await eventCreatorV2Api.generatePreview(draft.id);
      toast.success('Preview link ready');
      window.open(preview.previewUrl, '_blank');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to generate preview';
      toast.error(message);
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const handleExit = () => {
    router.push('/organizer/events');
  };

  const openHistory = async () => {
    if (!draft) return;
    setShowHistory(true);
    setLoadingVersions(true);
    try {
      const data = await eventCreatorV2Api.listVersions(draft.id);
      setVersions(data);
    } finally {
      setLoadingVersions(false);
    }
  };

  const restoreVersion = async (versionId: string) => {
    if (!draft) return;
    await eventCreatorV2Api.restore(draft.id, versionId);
    await refresh();
    setShowHistory(false);
  };

  return (
    <header className="border-b border-border bg-card/80 px-6 py-4 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center gap-4">
        <div className="flex flex-1 flex-col gap-1">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="capitalize">
              {draft.status.toLowerCase()}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {savedLabel}
            </span>
          </div>
          <h1 className="text-2xl font-semibold text-foreground">
            {draft.title || 'Untitled event'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {draft.organization.name} •{' '}
            {draft.eventType.replace('_', ' ')} • {draft.timezone}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={() => router.push(`/organizer/events/create-v2/${draft.id}/review`)}>
            <Share2 className="h-4 w-4" />
            Review & publish
          </Button>
          <Button
            variant="outline"
            className="gap-2"
            onClick={handlePreview}
            disabled={isPreviewLoading}
          >
            {isPreviewLoading ? (
              <span className="flex items-center gap-2">
                <Eye className="h-4 w-4 animate-pulse" />
                Generating...
              </span>
            ) : (
              <>
                <Eye className="h-4 w-4" />
                Preview
              </>
            )}
          </Button>
          <Button variant="outline" className="gap-2" onClick={openHistory}>
            <History className="h-4 w-4" />
            History
          </Button>
          <Button variant="outline" className="gap-2" disabled>
            <Share2 className="h-4 w-4" />
            Share (soon)
          </Button>
          <Button variant="ghost" className="gap-2" onClick={handleExit}>
            <LogOut className="h-4 w-4" />
            Exit
          </Button>
        </div>
      </div>

      {showHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowHistory(false)}>
          <div className="w-full max-w-xl rounded-xl border border-border bg-card p-4" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Version history</h3>
              <button className="text-sm text-muted-foreground" onClick={() => setShowHistory(false)}>Close</button>
            </div>
            {loadingVersions ? (
              <div className="p-4 text-sm text-muted-foreground">Loading…</div>
            ) : versions.length === 0 ? (
              <div className="p-4 text-sm text-muted-foreground">No versions yet.</div>
            ) : (
              <div className="divide-y divide-border">
                {versions.map((v) => (
                  <div key={v.id} className="flex items-center justify-between gap-3 px-2 py-3 text-sm">
                    <div>
                      <div className="text-foreground">{v.section ? `Section: ${v.section}` : 'Full snapshot'}</div>
                      <div className="text-muted-foreground">{formatDistanceToNow(new Date(v.createdAt), { addSuffix: true })}</div>
                    </div>
                    <Button variant="outline" onClick={() => restoreVersion(v.id)}>Restore</Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
