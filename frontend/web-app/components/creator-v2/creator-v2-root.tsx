'use client';

import { EventCreatorDraftProvider } from '@/components/creator-v2/event-creator-provider';
import { CreatorV2Shell } from '@/components/creator-v2/shell/creator-v2-shell';

interface CreatorV2RootProps {
  draftId: string;
}

export function CreatorV2Root({ draftId }: CreatorV2RootProps) {
  return (
    <EventCreatorDraftProvider draftId={draftId}>
      <CreatorV2Shell />
    </EventCreatorDraftProvider>
  );
}
