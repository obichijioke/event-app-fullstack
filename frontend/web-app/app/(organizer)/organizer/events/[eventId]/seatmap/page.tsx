import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { EventSeatmapAssignment } from '@/components/organizer/events/event-seatmap-assignment';

type Props = {
  params: Promise<{ eventId: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { eventId } = await params;
  return {
    title: `Seatmap Configuration`,
    description: 'Configure event seatmap',
  };
}

export default async function SeatmapConfigurationPage({ params }: Props) {
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
          <h1 className="text-3xl font-bold">Seatmap Configuration</h1>
          <p className="text-muted-foreground mt-1">Assign a seating layout to your event</p>
        </div>
      </div>

      <EventSeatmapAssignment eventId={eventId} />
    </div>
  );
}
