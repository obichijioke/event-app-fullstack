import { Metadata } from 'next';
import Link from 'next/link';
import { EditVenueWrapper } from '@/components/organizer/venues/edit-venue-wrapper';

type Props = {
  params: Promise<{ venueId: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { venueId } = await params;
  return {
    title: `Edit Venue`,
    description: 'Edit venue details',
  };
}

export default async function EditVenuePage({ params }: Props) {
  const { venueId } = await params;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Edit Venue</h1>
          <p className="text-muted-foreground mt-1">Update venue information</p>
        </div>
        <Link
          href={`/organizer/venues/${venueId}`}
          className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:opacity-90 transition text-sm"
        >
          ← Back to Venue
        </Link>
      </div>

      <EditVenueWrapper venueId={venueId} />
    </div>
  );
}
