'use client';

import { useEffect, useState } from 'react';
import { savedEventsService } from '@/services/saved-events.service';
import { EventCard } from '@/components/homepage/event-card';
import { EventSummary } from '@/lib/homepage';
import { PublicEvent } from '@/lib/events';
import { Heading, Text } from '@/components/ui';
import { useSavedEventsStore } from '@/hooks/use-saved-events';

// Helper to transform PublicEvent to EventSummary
function transformEvent(event: PublicEvent): EventSummary {
  const venue = event.venue ? {
    id: event.venue.id,
    name: event.venue.name,
    city: (event.venue.address as any)?.city ?? null,
    region: (event.venue.address as any)?.region ?? null,
    country: (event.venue.address as any)?.country ?? null,
    timezone: event.venue.timezone ?? null,
  } : null;

  const category = event.category ? {
    id: event.category.id,
    name: event.category.name,
    slug: event.category.slug ?? event.category.id,
  } : null;

  const tags: string[] = [];
  if (category?.name) tags.push(category.name);
  if (venue?.city) tags.push(venue.city);
  else if (venue?.region) tags.push(venue.region);

  const ticketTypes = event.ticketTypes || [];
  const cheapestTicket = ticketTypes[0];
  
  const pricing = cheapestTicket ? {
    currency: cheapestTicket.currency,
    startingAt: Number(cheapestTicket.priceCents) / 100,
    fee: Number(cheapestTicket.feeCents || 0) / 100,
    label: `From ${formatCurrency(Number(cheapestTicket.priceCents), cheapestTicket.currency)}`,
  } : null;

  const totalCapacity = ticketTypes.reduce((sum, t) => sum + (t.capacity || 0), 0);
  const soldCount = event._count?.tickets || 0;
  const available = totalCapacity - soldCount;
  const isLowInventory = totalCapacity > 0 && available > 0 && available < totalCapacity * 0.1;

  return {
    id: event.id,
    title: event.title,
    startAt: event.startAt,
    endAt: event.endAt,
    doorTime: event.doorTime ?? null,
    coverImageUrl: event.coverImageUrl ?? null,
    ageRestriction: event.ageRestriction ?? null,
    organization: {
      id: event.org.id,
      name: event.org.name,
    },
    venue,
    category,
    pricing,
    tags: tags.slice(0, 3),
    stats: {
      orderCount: event._count?.orders || 0,
      isLowInventory,
    },
    seatmap: {
      hasSeatmap: Boolean(event.seatmapId),
      isSeated: ticketTypes.some((t) => t.kind === 'SEATED'),
    },
    policies: {
      transferable: true,
      refundable: false,
    },
    promo: event.promoCodes?.[0] ? {
      id: event.promoCodes[0].id,
      code: event.promoCodes[0].code,
      kind: event.promoCodes[0].kind,
      label: event.promoCodes[0].percentOff 
        ? `${event.promoCodes[0].percentOff}% off`
        : `${formatCurrency(Number(event.promoCodes[0].amountOffCents || 0), event.promoCodes[0].currency || 'NGN')} off`,
      endsAt: event.promoCodes[0].endsAt,
    } : undefined,
    assets: event.assets || [],
  };
}

function formatCurrency(cents: number, currency: string): string {
  const amount = cents / 100;
  if (currency === 'NGN') {
    return `₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function SavedEventsPage() {
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const { savedIds } = useSavedEventsStore();

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const response = await savedEventsService.getSavedEvents();
        const transformed = response.data.map(transformEvent);
        setEvents(transformed);
      } catch (error) {
        console.error('Failed to fetch saved events', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [savedIds]); // Refetch when savedIds change (e.g. unsaving from card)

  return (
    <div className="container py-10">
      <div className="mb-8">
        <Heading level="h1">Saved Events</Heading>
        <Text className="text-muted-foreground mt-2">
          Events you have saved for later.
        </Text>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-[400px] rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : events.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Text className="text-lg font-medium">No saved events yet</Text>
          <Text className="text-muted-foreground mt-2">
            Browse events and click the heart icon to save them here.
          </Text>
        </div>
      )}
    </div>
  );
}
