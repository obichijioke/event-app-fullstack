import Image from 'next/image';
import Link from 'next/link';
import { Badge, Text, buttonVariants, Heading } from '@/components/ui';
import { formatDate } from '@/lib/utils';
import {
  HomepageFilters,
  HomepageHero as HomepageHeroType,
} from '@/lib/homepage';
import { cn } from '@/lib/utils';

interface HomepageHeroProps {
  hero: HomepageHeroType | null;
  filters?: HomepageFilters;
}

export function HomepageHero({ hero, filters }: HomepageHeroProps) {
  const headline =
    hero?.headline ?? 'Discover unforgettable experiences';
  const subheading =
    hero?.subheading ??
    'From concerts to conferences, find and book the best events across Africa';
  const featured = hero?.featured ?? [];

  return (
    <section className="relative overflow-hidden bg-primary">
      {/* Background Image Overlay */}
      {hero?.backgroundImage && (
        <div className="absolute inset-0">
          <Image
            src={hero.backgroundImage}
            alt="Featured event background"
            fill
            className="object-cover opacity-10"
            priority
          />
          <div className="absolute inset-0 bg-primary/95" />
        </div>
      )}

      <div className="container relative z-10 mx-auto px-4 py-20 lg:py-28">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left Column - Content */}
          <div className="flex flex-col justify-center space-y-8">
            {/* Location Badge */}
            <div className="flex flex-wrap items-center gap-3">
              <Badge
                variant="secondary"
                size="lg"
              >
                Lagos · Abuja · Accra
              </Badge>
              {filters?.selected.category && (
                <Badge
                  variant="outline"
                  size="sm"
                  className="border-white text-white"
                >
                  {filters.selected.category}
                </Badge>
              )}
            </div>

            {/* Headline */}
            <div className="space-y-4">
              <Heading
                as="h1"
                className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl"
              >
                {headline}
              </Heading>
              <Text className="max-w-xl text-lg text-white lg:text-xl">
                {subheading}
              </Text>
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap gap-4">
              <Link
                href="/events"
                className={cn(
                  buttonVariants({ variant: 'primary', size: 'lg' }),
                  'bg-white text-primary hover:bg-gray-100'
                )}
              >
                Explore events
              </Link>
              <Link
                href="/organizer"
                className={cn(
                  buttonVariants({ variant: 'outline', size: 'lg' }),
                  'border-white text-white hover:bg-white hover:text-primary'
                )}
              >
                Create event
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 rounded-lg border border-white bg-white p-6">
              <div>
                <div className="text-2xl font-bold text-primary lg:text-3xl">10K+</div>
                <Text className="text-sm text-muted-foreground">Events</Text>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary lg:text-3xl">500K+</div>
                <Text className="text-sm text-muted-foreground">Attendees</Text>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary lg:text-3xl">50+</div>
                <Text className="text-sm text-muted-foreground">Cities</Text>
              </div>
            </div>

            {/* Active Filters Info */}
            {(filters?.selected.city || filters?.selected.timeframe) && (
              <div className="flex flex-wrap items-center gap-6 rounded-lg border border-white bg-primary-foreground/10 p-4">
                {filters.selected.city && (
                  <div>
                    <Text className="text-xs font-medium uppercase tracking-wide text-white/80">
                      City
                    </Text>
                    <Text className="font-semibold text-white">
                      {filters.selected.city}
                    </Text>
                  </div>
                )}
                {filters.selected.timeframe && (
                  <div>
                    <Text className="text-xs font-medium uppercase tracking-wide text-white/80">
                      Timeframe
                    </Text>
                    <Text className="font-semibold text-white">
                      {filters.timeframes.find(
                        (t) => t.id === filters.selected.timeframe,
                      )?.label ?? 'All upcoming'}
                    </Text>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column - Featured Events */}
          <div className="flex items-center">
            {featured.length === 0 ? (
              <div className="grid w-full gap-4">
                <HeroCardSkeleton />
                <HeroCardSkeleton />
              </div>
            ) : featured.length === 1 ? (
              <div className="w-full">
                <HeroCard event={featured[0]} featured />
              </div>
            ) : (
              <div className="grid w-full gap-4 md:grid-cols-2 lg:grid-cols-1 lg:gap-6">
                {featured.slice(0, 3).map((event, index) => (
                  <HeroCard
                    key={event.id}
                    event={event}
                    featured={index === 0}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function HeroCardSkeleton() {
  return (
    <div className="group relative overflow-hidden rounded-lg border border-border bg-card">
      {/* Image Skeleton */}
      <div className="relative h-48 bg-muted">
        <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-muted via-muted-foreground/10 to-muted" />
      </div>

      {/* Content Skeleton */}
      <div className="space-y-4 p-6">
        <div className="h-5 w-20 animate-pulse rounded-full bg-muted" />
        <div className="space-y-2">
          <div className="h-6 w-full animate-pulse rounded bg-muted" />
          <div className="h-6 w-3/4 animate-pulse rounded bg-muted" />
        </div>
        <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
        <div className="flex items-center justify-between border-t border-border pt-4">
          <div className="h-5 w-24 animate-pulse rounded bg-muted" />
          <div className="h-9 w-20 animate-pulse rounded-lg bg-muted" />
        </div>
      </div>
    </div>
  );
}

function HeroCard({
  event,
  featured = false
}: {
  event: HomepageHeroType['featured'][number];
  featured?: boolean;
}) {
  const venueLabel = [event.venue?.name, event.venue?.city]
    .filter(Boolean)
    .join(' · ');

  const image =
    event.coverImageUrl ??
    event.assets.find((asset) => asset.kind === 'image')?.url;

  return (
    <Link
      href={`/events/${event.id}`}
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-lg border border-border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary hover:shadow-lg',
        featured && 'lg:row-span-2'
      )}
    >
      {/* Event Image */}
      <div className={cn(
        'relative overflow-hidden bg-muted',
        featured ? 'h-64 lg:h-80' : 'h-48'
      )}>
        {image ? (
          <>
            <Image
              src={image}
              alt={event.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <div className="text-6xl opacity-30">🎭</div>
          </div>
        )}

        {/* Badges Overlay */}
        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          {event.promo ? (
            <Badge
              variant="primary"
              size="sm"
              className="bg-accent text-accent-foreground"
            >
              {event.promo.label}
            </Badge>
          ) : event.stats.isLowInventory ? (
            <Badge
              variant="warning"
              size="sm"
            >
              Selling fast
            </Badge>
          ) : null}

          {event.category && (
            <Badge
              variant="secondary"
              size="sm"
            >
              {event.category.name}
            </Badge>
          )}
        </div>

        {/* Pricing Badge */}
        {event.pricing?.label && (
          <div className="absolute bottom-4 left-4">
            <div className="rounded-md bg-white px-3 py-1.5 text-sm font-semibold text-primary">
              {event.pricing.label}
            </div>
          </div>
        )}
      </div>

      {/* Event Details */}
      <div className={cn(
        'flex flex-1 flex-col bg-card p-6',
        featured && 'lg:p-8'
      )}>
        {/* Date */}
        <Text className="mb-2 text-sm font-medium text-muted-foreground">
          {formatDate(event.startAt, 'long')}
        </Text>

        {/* Title */}
        <Heading
          as="h3"
          className={cn(
            'mb-3 font-bold leading-tight text-foreground transition-colors group-hover:text-primary',
            featured ? 'text-xl lg:text-2xl' : 'text-lg'
          )}
        >
          {event.title}
        </Heading>

        {/* Venue */}
        {venueLabel && (
          <Text className="mb-4 text-sm text-muted-foreground">
            {venueLabel}
          </Text>
        )}

        {/* Organizer */}
        <div className="mt-auto flex items-center justify-between border-t border-border pt-4">
          <div>
            <Text className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              By
            </Text>
            <Text className="font-semibold text-foreground">
              {event.organization.name}
            </Text>
          </div>

          <div className="flex items-center gap-2 text-sm font-medium text-primary transition-colors group-hover:text-primary/80">
            View details
            <span className="transition-transform group-hover:translate-x-1">→</span>
          </div>
        </div>

        {/* Additional Info */}
        {featured && (
          <div className="mt-4 flex flex-wrap gap-2">
            {event.seatmap.isSeated && (
              <Badge variant="outline" size="sm">
                Reserved seating
              </Badge>
            )}
            {event.policies.transferable && (
              <Badge variant="outline" size="sm">
                Transferable
              </Badge>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
