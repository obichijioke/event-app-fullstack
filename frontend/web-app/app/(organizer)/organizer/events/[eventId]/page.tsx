import { Metadata } from 'next';
import { EventDetailContent } from '@/components/organizer/events/event-detail-content';

type Props = {
  params: Promise<{ eventId: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { eventId } = await params;
  return {
    title: `Event Dashboard - ${eventId}`,
    description: 'Event overview and analytics',
  };
}

export default async function EventDashboardPage({ params }: Props) {
  const { eventId } = await params;

  return <EventDetailContent eventId={eventId} />;
}
