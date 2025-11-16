'use client';

import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useEventCreatorDraft } from '@/components/creator-v2/event-creator-provider';
import { eventCreatorV2Api } from '@/lib/api/event-creator-v2-api';
import { format } from 'date-fns';

export function ReviewPublish() {
  const { draft, refresh } = useEventCreatorDraft();
  const [publishing, setPublishing] = useState(false);
  const [scheduleAt, setScheduleAt] = useState<string>('');
  const [message, setMessage] = useState<string | null>(null);

  // Always call hooks in the same order. Avoid early returns before hooks.
  const sections = draft?.sections ?? [];
  const blockers = useMemo(
    () => sections.filter((s) => s.status !== 'valid'),
    [sections],
  );

  const canPublish = blockers.length === 0;

  const handlePublish = async (scheduled?: boolean) => {
    setPublishing(true);
    setMessage(null);
    try {
      if (!draft) return;
      const payload: any = {};
      if (scheduled && scheduleAt) payload.publishAt = scheduleAt;
      const res = await eventCreatorV2Api.publishDraft(draft.id, payload);
      setMessage(res.message);
      await refresh();
    } catch (e: any) {
      setMessage(e?.message || 'Unable to publish');
    } finally {
      setPublishing(false);
    }
  };

  if (!draft) {
    return (
      <div className="mx-auto w-full max-w-4xl px-6 py-10">
        <div className="rounded-2xl border border-border p-6 text-sm text-muted-foreground">
          Loading draft…
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold">Review & publish</h2>
        <p className="text-sm text-muted-foreground">
          Resolve any remaining items, preview your page, then publish or schedule.
        </p>
      </div>

      <div className="rounded-2xl border border-border">
        <div className="grid grid-cols-3 bg-muted/40 px-4 py-3 text-xs font-semibold text-muted-foreground">
          <div>Section</div>
          <div>Status</div>
          <div>Last updated</div>
        </div>
        <div className="divide-y divide-border">
          {sections.map((s) => (
            <div key={s.section} className="grid grid-cols-3 items-center px-4 py-3 text-sm">
              <div className="capitalize">
                {s.section === 'story' ? 'Details & story' : s.section === 'tickets' ? 'Tickets & pricing' : s.section === 'schedule' ? 'Schedule & venue' : s.section === 'checkout' ? 'Checkout & audience' : 'Basics'}
              </div>
              <div className={s.status === 'valid' ? 'text-emerald-600' : s.status === 'blocked' ? 'text-red-600' : 'text-muted-foreground'}>
                {s.status === 'valid' ? 'Complete' : s.status === 'blocked' ? 'Needs attention' : 'Incomplete'}
              </div>
              <div className="text-muted-foreground">
                {s.updatedAt ? format(new Date(s.updatedAt), 'MMM d, yyyy • h:mm a') : '-'}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3 rounded-2xl border border-border p-4">
        <p className="text-sm font-medium">Schedule publish (optional)</p>
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="datetime-local"
            className="rounded-md border border-border bg-input px-3 py-2 text-sm"
            value={scheduleAt}
            onChange={(e) => setScheduleAt(e.target.value)}
          />
          <Button onClick={() => handlePublish(true)} disabled={publishing || !scheduleAt}>
            {publishing ? 'Scheduling…' : 'Schedule publish'}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          onClick={() => handlePublish(false)}
          disabled={!canPublish || publishing}
        >
          {publishing ? 'Publishing…' : canPublish ? 'Publish now' : 'Complete sections to publish'}
        </Button>
        <a
          href={`/organizer/events/create-v2/${draft.id}`}
          className="text-sm text-primary underline-offset-4 hover:underline"
        >
          Back to editor
        </a>
      </div>

      {message && (
        <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm text-foreground">
          {message}
        </div>
      )}
    </div>
  );
}
