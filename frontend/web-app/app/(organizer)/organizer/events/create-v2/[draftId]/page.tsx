import { Metadata } from 'next';
import { CreatorV2Root } from '@/components/creator-v2/creator-v2-root';

export const metadata: Metadata = {
  title: 'Event Creator',
  description: 'Create and publish events with the new Eventbrite-inspired flow',
};

export default async function DraftPage({
  params,
}: {
  params: Promise<{ draftId: string }>;
}) {
  const { draftId } = await params;
  return <CreatorV2Root draftId={draftId} />;
}
