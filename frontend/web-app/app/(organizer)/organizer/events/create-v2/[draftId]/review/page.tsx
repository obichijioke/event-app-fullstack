import { Metadata } from 'next';
import { EventCreatorDraftProvider } from '@/components/creator-v2/event-creator-provider';
import { ReviewPublish } from '@/components/creator-v2/review/review-publish';

export const metadata: Metadata = {
  title: 'Review & Publish',
  description: 'Review your draft and publish or schedule',
};

export default async function DraftReviewPage({
  params,
}: {
  params: Promise<{ draftId: string }>;
}) {
  const { draftId } = await params;
  return (
    <EventCreatorDraftProvider draftId={draftId}>
      <div className="mx-auto w-full max-w-4xl px-6 py-10">
        <ReviewPublish />
      </div>
    </EventCreatorDraftProvider>
  );
}

