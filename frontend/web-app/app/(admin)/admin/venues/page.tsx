import { Metadata } from 'next';
import VenueManagement from '@/components/admin/venues/venue-management';

export const metadata: Metadata = {
  title: 'Venue Management - Admin',
  description: 'Manage venue catalog entries and organizer venues.',
};

export default function AdminVenuesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Venue Management</h1>
        <p className="text-muted-foreground mt-1">
          Administer the shared venue catalog and oversee organizer-created venues.
        </p>
      </div>
      <VenueManagement />
    </div>
  );
}
