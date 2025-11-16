import Link from 'next/link';
import { LocationIcon } from '@/components/ui/icons';
import type { EventVenueSummary } from '@/lib/homepage';

interface VenueCardProps {
  venue: EventVenueSummary | null;
}

export function VenueCard({ venue }: VenueCardProps) {
  if (!venue) {
    return null;
  }

  const addressLine = [venue.city, venue.region, venue.country]
    .filter(Boolean)
    .join(', ');

  return (
    <div className="flex gap-4 border-b border-border py-5">
      <div className="flex-shrink-0">
        <LocationIcon className="h-6 w-6 text-primary" />
      </div>
      <div className="flex-1">
        <h3 className="text-base font-semibold text-foreground mb-2">Venue</h3>
        <p className="text-sm font-medium text-primary">{venue.name}</p>
        {addressLine && (
          <p className="text-sm text-muted-foreground">{addressLine}</p>
        )}
        <Link
          href={`#map`}
          className="text-sm text-primary font-medium hover:underline inline-block mt-2"
        >
          View on Map
        </Link>
      </div>
    </div>
  );
}

