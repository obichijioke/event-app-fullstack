import { Metadata } from 'next';
import { EventEditForm } from '@/components/organizer/events/event-edit-form';

type Props = {
  params: Promise<{ eventId: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { eventId } = await params;
  return {
    title: `Edit Event - ${eventId}`,
    description: 'Edit event details',
  };
}

export default async function EditEventPage({ params }: Props) {
  const { eventId } = await params;

  return <EventEditForm eventId={eventId} />;
}
