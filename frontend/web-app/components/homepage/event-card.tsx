import Image from 'next/image';
import { resolveImageUrl } from '@/lib/utils/image';
import Link from 'next/link';
import { Text } from '@/components/ui';
import { SaveButton } from '@/components/events/save-button';
import { EventSummary } from '@/lib/homepage';
import { formatDate, truncate, cn } from '@/lib/utils';

interface EventCardProps {
  event: EventSummary;
  compact?: boolean;
}

export function EventCard({ event, compact }: EventCardProps) {
  const image = resolveImageUrl(
    event.coverImageUrl ?? event.assets.find((asset) => asset.kind === 'image')?.url,
  );
  const venueLine = [
    event.venue?.name,
    event.venue?.city ?? event.venue?.region,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <article
      className={cn(
        'group flex flex-col overflow-hidden rounded-xl border border-border/70 bg-card transition hover:border-primary/50',
        compact ? 'max-w-sm' : '',
      )}
    >
      <div className="relative h-56 overflow-hidden">
        {image ? (
          <Image
            src={image}
            alt={event.title}
            fill
            className="object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          {event.promo ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500 border border-amber-600 px-3 py-1 text-xs font-bold text-white">
              <span className="h-1.5 w-1.5 rounded-full bg-white" />
              {event.promo.label}
            </span>
          ) : event.stats.isLowInventory ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500 border border-red-600 px-3 py-1 text-xs font-bold text-white">
              <span className="h-1.5 w-1.5 rounded-full bg-white" />
              Selling fast
            </span>
          ) : null}
          {event.seatmap.isSeated && (
            <span className="inline-flex items-center rounded-full bg-white/90 border border-white px-3 py-1 text-xs font-semibold text-slate-900">
              Reserved seats
            </span>
          )}
        </div>
        {event.pricing?.label && (
          <span className="absolute bottom-4 left-4 rounded-lg bg-white border-2 border-white px-3 py-2 text-sm font-bold text-slate-900">
            {event.pricing.label}
          </span>
        )}
        <div className="absolute right-4 top-4 z-10">
          <SaveButton 
            eventId={event.id} 
            size="icon"
            className="h-8 w-8 rounded-full border-none bg-black/20 backdrop-blur-xs hover:bg-black/40 p-0"
            iconClassName="text-white"
          />
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-xs font-bold text-primary w-fit">
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {formatDate(event.startAt, 'long')}
          </div>
          <Link
            href={`/events/${event.id}`}
            className="text-xl font-semibold text-foreground transition group-hover:text-primary"
          >
            {truncate(event.title, 70)}
          </Link>
          {venueLine && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {venueLine}
            </div>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {event.tags.slice(0, 2).map((tag) => (
            <span key={tag} className="inline-flex items-center rounded-full bg-muted/60 border border-border/50 px-3 py-1 text-xs font-medium text-foreground">
              {tag}
            </span>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between border-t border-border/50 pt-4">
          <div>
            <Text className="text-xs uppercase tracking-wide text-muted-foreground">
              Organised by
            </Text>
            <Text className="font-semibold text-sm">{event.organization.name}</Text>
          </div>
          <Link
            href={`/events/${event.id}`}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
          >
            View tickets
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </article>
  );
}
