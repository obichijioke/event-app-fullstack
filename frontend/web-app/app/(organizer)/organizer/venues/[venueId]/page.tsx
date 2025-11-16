import { Metadata } from 'next';
import { VenueDetail } from '@/components/organizer/venues/venue-detail';

type Props = {
  params: Promise<{ venueId: string }>;
};

export const metadata: Metadata = {
  title: 'Venue Details',
  description: 'View venue details and seatmaps',
};

export default async function VenueDetailPage({ params }: Props) {
  const { venueId } = await params;

  return (
    <div className="container mx-auto px-4 py-8">
      <VenueDetail venueId={venueId} />
    </div>
  );
}
