import { Metadata } from 'next';
import { VenueList } from '@/components/organizer/venues/venue-list';

export const metadata: Metadata = {
  title: 'Venues',
  description: 'Manage your event venues and seating arrangements',
};

export default function VenuesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <VenueList />
    </div>
  );
}
