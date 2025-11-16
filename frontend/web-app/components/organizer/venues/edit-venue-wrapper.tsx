'use client';

import { useEffect, useState } from 'react';
import { useOrganizerStore } from '@/lib/stores/organizer-store';
import { organizerApi } from '@/lib/api/organizer-api';
import { Venue } from '@/lib/types/organizer';
import { VenueForm } from './venue-form';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface EditVenueWrapperProps {
  venueId: string;
}

export function EditVenueWrapper({ venueId }: EditVenueWrapperProps) {
  const { currentOrganization } = useOrganizerStore();
  const [venue, setVenue] = useState<Venue | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentOrganization) {
      loadVenue();
    }
  }, [currentOrganization, venueId]);

  const loadVenue = async () => {
    if (!currentOrganization) return;

    try {
      setLoading(true);
      const data = await organizerApi.venues.get(venueId, currentOrganization.id);
      setVenue(data);
    } catch (error) {
      console.error('Failed to load venue:', error);
      toast.error('Failed to load venue');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading venue...</p>
        </div>
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Venue not found</p>
      </div>
    );
  }

  return <VenueForm venue={venue} />;
}
