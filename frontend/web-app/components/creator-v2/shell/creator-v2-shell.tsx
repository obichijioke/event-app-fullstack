'use client';

import { Loader2 } from 'lucide-react';
import { CreatorHeader } from './creator-header';
import { CreatorSidebar } from './creator-sidebar';
import { CreatorFooter } from './creator-footer';
import { useEventCreatorDraft } from '@/components/creator-v2/event-creator-provider';
import { SectionRouter } from '@/components/creator-v2/sections/section-router';

export function CreatorV2Shell() {
  const { draft, isLoading } = useEventCreatorDraft();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!draft) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Unable to load draft.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/40">
      <CreatorHeader />
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 pb-32 pt-8 lg:flex-row">
        <CreatorSidebar />
        <div className="flex-1">
          <SectionRouter />
        </div>
      </main>
      <CreatorFooter />
    </div>
  );
}
