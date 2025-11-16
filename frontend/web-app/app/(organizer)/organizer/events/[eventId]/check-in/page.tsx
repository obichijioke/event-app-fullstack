import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { CheckinContent } from '@/components/organizer/check-in/check-in-content';

type Props = {
  params: Promise<{ eventId: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { eventId } = await params;
  return {
    title: `Check-in - ${eventId}`,
    description: 'Event check-in interface',
  };
}

export default async function CheckinPage({ params }: Props) {
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
          <h1 className="text-3xl font-bold">Event Check-in</h1>
          <p className="text-muted-foreground mt-1">Scan tickets and manage attendee check-in</p>
        </div>
      </div>

      <CheckinContent eventId={eventId} />
    </div>
  );
}
