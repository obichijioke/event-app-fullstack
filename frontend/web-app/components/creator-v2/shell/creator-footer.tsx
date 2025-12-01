'use client';

import { useState } from 'react';
import { EVENT_CREATOR_SECTION_ORDER } from '@/lib/types/event-creator-v2';
import { Button } from '@/components/ui/button';
import { useEventCreatorDraft } from '@/components/creator-v2/event-creator-provider';
import { eventCreatorV2Api } from '@/lib/api/event-creator-v2-api';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export function CreatorFooter() {
  const { draft, activeSection, setActiveSection } = useEventCreatorDraft();
  const [isPublishing, setIsPublishing] = useState(false);
  const router = useRouter();

  if (!draft) {
    return null;
  }

  const currentIndex = EVENT_CREATOR_SECTION_ORDER.indexOf(activeSection);
  const prevSection = EVENT_CREATOR_SECTION_ORDER[currentIndex - 1];
  const nextSection = EVENT_CREATOR_SECTION_ORDER[currentIndex + 1];
  const canPublish = draft.completionPercent === 100;

  const currentSectionData = draft.sections.find((s) => s.section === activeSection);
  const isCurrentSectionValid = currentSectionData?.status === 'valid';

  const handlePublish = async () => {
    if (!draft) return;
    setIsPublishing(true);
    try {
      const response = await eventCreatorV2Api.publishDraft(draft.id, {});
      toast.success(response.message || 'Event published');
      if (response.eventId) {
        router.push(`/organizer/events/${response.eventId}`);
      } else {
        router.push('/organizer/events');
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to publish draft';
      toast.error(message);
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <footer className="fixed inset-x-0 bottom-0 border-t border-border bg-card/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center gap-3 px-6 py-4">
        <div className="flex flex-1 items-center gap-2 text-sm text-muted-foreground">
          <span>Need help?</span>
          <a className="text-primary underline-offset-4 hover:underline" href="/support">
            Contact support
          </a>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setActiveSection(prevSection ?? activeSection)}
            disabled={!prevSection}
          >
            Back
          </Button>
          <Button
            variant="outline"
            onClick={() => setActiveSection(nextSection ?? activeSection)}
            disabled={!nextSection || !isCurrentSectionValid}
          >
            Continue
          </Button>
          <Button
            onClick={handlePublish}
            disabled={!canPublish || isPublishing}
          >
            {isPublishing ? 'Publishing...' : canPublish ? 'Publish draft' : 'Complete sections to publish'}
          </Button>
        </div>
      </div>
    </footer>
  );
}
