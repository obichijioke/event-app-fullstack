import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { VenueCreateExperience } from '@/components/organizer/venues/venue-create-experience';

export const metadata: Metadata = {
  title: 'Create Venue',
  description: 'Create a new venue',
};

export default function CreateVenuePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Create Venue</h1>
          <p className="text-muted-foreground mt-1">Add a new venue to your organization</p>
        </div>
        <Link
          href="/organizer/venues"
          className="inline-flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:opacity-90 transition text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Venues
        </Link>
      </div>

      <VenueCreateExperience />
    </div>
  );
}
