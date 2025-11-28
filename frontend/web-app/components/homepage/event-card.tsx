import Image from 'next/image';
import { resolveImageUrl } from '@/lib/utils/image';
import Link from 'next/link';
import { Badge, Text, buttonVariants } from '@/components/ui';
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
        'flex flex-col overflow-hidden rounded border border-border bg-card shadow-card transition hover:-translate-y-1 hover:shadow-card-hover',
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
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          {event.promo ? (
            <Badge variant="primary" size="sm">
              {event.promo.label}
            </Badge>
          ) : event.stats.isLowInventory ? (
            <Badge variant="warning" size="sm">
              Selling fast
            </Badge>
          ) : null}
          {event.seatmap.isSeated && (
            <Badge variant="outline" size="sm">
              Reserved seats
            </Badge>
          )}
        </div>
        {event.pricing?.label && (
          <span className="absolute bottom-4 left-4 rounded-2xl bg-black/70 px-4 py-1 text-sm font-semibold text-white backdrop-blur">
            {event.pricing.label}
          </span>
        )}
        <div className="absolute right-4 top-4 z-10">
          <SaveButton 
            eventId={event.id} 
            size="icon"
            className="h-8 w-8 rounded-full border-white/40 bg-black/20 backdrop-blur-sm hover:bg-black/40 p-0"
            iconClassName="text-white"
          />
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="space-y-2">
          <Text className="text-sm font-medium text-primary">
            {formatDate(event.startAt, 'long')}
          </Text>
          <Link
            href={`/events/${event.id}`}
            className="text-xl font-semibold text-foreground transition hover:text-primary"
          >
            {truncate(event.title, 70)}
          </Link>
          {venueLine && (
            <Text className="text-sm text-muted-foreground">{venueLine}</Text>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {event.tags.slice(0, 2).map((tag) => (
            <Badge key={tag} variant="outline" size="sm">
              {tag}
            </Badge>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between">
          <div>
            <Text className="text-xs uppercase text-muted-foreground">
              Organised by
            </Text>
            <Text className="font-medium text-xs">{event.organization.name}</Text>
          </div>
          <Link
            href={`/events/${event.id}`}
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
          >
            View tickets
          </Link>
        </div>
      </div>
    </article>
  );
}
