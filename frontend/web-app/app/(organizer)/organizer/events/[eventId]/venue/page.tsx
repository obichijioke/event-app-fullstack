import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, MapPin } from 'lucide-react';
import { EventVenueManagement } from '@/components/organizer/venues/event-venue-management';

type Props = {
  params: Promise<{ eventId: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { eventId } = await params;
  return {
    title: `Venue - ${eventId}`,
    description: 'Select or update the venue for this event',
  };
}

export default async function EventVenuePage({ params }: Props) {
  const { eventId } = await params;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <Link
          href={`/organizer/events/${eventId}`}
          className="p-2 hover:bg-secondary rounded-md transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <MapPin className="w-6 h-6" />
            Event Venue
          </h1>
          <p className="text-muted-foreground mt-1">
            Assign, change, or create a venue for this event.
          </p>
        </div>
      </div>

      <EventVenueManagement eventId={eventId} />
    </div>
  );
}
