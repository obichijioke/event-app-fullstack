'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CreateEventModal } from '@/components/creator-v2/create-event-modal';
import { Button } from '@/components/ui/button';

export function CreateEventEntry() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(true);

  const handleDraftCreated = (draftId: string) => {
    setIsModalOpen(false);
    router.replace(`/organizer/events/create-v2/${draftId}`);
  };

  const handleClose = () => {
    setIsModalOpen(false);
    router.push('/organizer/events');
  };

  return (
    <>
      <CreateEventModal
        open={isModalOpen}
        onClose={handleClose}
        onDraftCreated={handleDraftCreated}
      />
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 px-4 py-20 text-center">
        <h1 className="text-3xl font-bold text-foreground">
          Let’s build your next event
        </h1>
        <p className="text-muted-foreground">
          Answer a few quick questions so we can spin up a draft with autosave,
          instant preview, and collaboration tools inspired by Eventbrite’s
          creation flow.
        </p>
        <Button onClick={() => setIsModalOpen(true)}>Launch creator</Button>
      </div>
    </>
  );
}
