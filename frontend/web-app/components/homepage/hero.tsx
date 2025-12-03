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
    <section className="relative overflow-hidden bg-linear-to-r from-slate-900 via-slate-800 to-slate-700">
      {/* Background Image Overlay */}
      {hero?.backgroundImage && (
        <div className="absolute inset-0">
          <Image
            src={hero.backgroundImage}
            alt="Featured event background"
            fill
            className="object-cover opacity-5"
            priority
          />
        </div>
      )}

      <div className="container relative z-10 mx-auto px-4 py-16 lg:py-24">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left Column - Content */}
          <div className="flex flex-col justify-center space-y-8">
            {/* Location Badge */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur border border-white/20">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Lagos · Abuja · Accra
              </div>
              {filters?.selected.category && (
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white backdrop-blur border border-white/20">
                  {filters.selected.category}
                </div>
              )}
            </div>

            {/* Headline */}
            <div className="space-y-4">
              <Heading
                as="h1"
                className="text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl"
              >
                {headline}
              </Heading>
              <Text className="max-w-xl text-base text-slate-200 lg:text-lg">
                {subheading}
              </Text>
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap gap-4">
              <Link
                href="/events"
                className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-base font-semibold text-slate-900 transition hover:bg-slate-100"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Explore events
              </Link>
              <Link
                href="/organizer"
                className="inline-flex items-center gap-2 rounded-lg border-2 border-white px-6 py-3 text-base font-semibold text-white transition hover:bg-white hover:text-slate-900"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create event
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 rounded-xl border-2 border-white/20 bg-white/10 p-6 backdrop-blur">
              <div className="text-center">
                <div className="text-2xl font-bold text-white lg:text-3xl">10K+</div>
                <Text className="text-xs text-slate-200 mt-1">Events</Text>
              </div>
              <div className="text-center border-l border-r border-white/20">
                <div className="text-2xl font-bold text-white lg:text-3xl">500K+</div>
                <Text className="text-xs text-slate-200 mt-1">Attendees</Text>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white lg:text-3xl">50+</div>
                <Text className="text-xs text-slate-200 mt-1">Cities</Text>
              </div>
            </div>

            {/* Active Filters Info */}
            {(filters?.selected.city || filters?.selected.timeframe) && (
              <div className="flex flex-wrap items-center gap-6 rounded-xl border-2 border-white/20 bg-white/10 p-4 backdrop-blur">
                {filters.selected.city && (
                  <div>
                    <Text className="text-xs font-medium uppercase tracking-wide text-slate-300">
                      City
                    </Text>
                    <Text className="font-semibold text-white mt-0.5">
                      {filters.selected.city}
                    </Text>
                  </div>
                )}
                {filters.selected.timeframe && (
                  <div>
                    <Text className="text-xs font-medium uppercase tracking-wide text-slate-300">
                      Timeframe
                    </Text>
                    <Text className="font-semibold text-white mt-0.5">
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
    <div className="group relative overflow-hidden rounded-xl border border-white/20 bg-white/5 backdrop-blur">
      {/* Image Skeleton */}
      <div className="relative h-48 bg-white/10">
        <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-white/5 via-white/10 to-white/5" />
      </div>

      {/* Content Skeleton */}
      <div className="space-y-4 p-6">
        <div className="h-5 w-20 animate-pulse rounded-full bg-white/10" />
        <div className="space-y-2">
          <div className="h-6 w-full animate-pulse rounded bg-white/10" />
          <div className="h-6 w-3/4 animate-pulse rounded bg-white/10" />
        </div>
        <div className="h-4 w-1/2 animate-pulse rounded bg-white/10" />
        <div className="flex items-center justify-between border-t border-white/10 pt-4">
          <div className="h-5 w-24 animate-pulse rounded bg-white/10" />
          <div className="h-9 w-20 animate-pulse rounded-lg bg-white/10" />
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
        'group relative flex flex-col overflow-hidden rounded-xl border-white/20 bg-white/5 backdrop-blur transition-all duration-300 hover:border-white/40 hover:bg-white/10',
        featured && 'lg:row-span-2'
      )}
    >
      {/* Event Image */}
      <div className={cn(
        'relative overflow-hidden bg-white/10',
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
          <div className="absolute inset-0 flex items-center justify-center bg-white/10">
            <div className="text-6xl opacity-30">🎭</div>
          </div>
        )}

        {/* Badges Overlay */}
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

          {event.category && (
            <span className="inline-flex items-center rounded-full bg-white/90 border border-white px-3 py-1 text-xs font-semibold text-slate-900">
              {event.category.name}
            </span>
          )}
        </div>

        {/* Pricing Badge */}
        {event.pricing?.label && (
          <div className="absolute bottom-4 left-4">
            <div className="rounded-lg bg-white border-2 border-white px-3 py-2 text-sm font-bold text-slate-900">
              {event.pricing.label}
            </div>
          </div>
        )}
      </div>

      {/* Event Details */}
      <div className={cn(
        'flex flex-1 flex-col bg-white/5 p-6 backdrop-blur',
        featured && 'lg:p-8'
      )}>
        {/* Date */}
        <Text className="mb-2 text-sm font-medium text-slate-300">
          {formatDate(event.startAt, 'long')}
        </Text>

        {/* Title */}
        <Heading
          as="h3"
          className={cn(
            'mb-3 font-semibold leading-tight text-white transition-colors group-hover:text-slate-200',
            featured ? 'text-xl lg:text-2xl' : 'text-lg'
          )}
        >
          {event.title}
        </Heading>

        {/* Venue */}
        {venueLabel && (
          <Text className="mb-4 text-sm text-slate-300">
            {venueLabel}
          </Text>
        )}

        {/* Organizer */}
        <div className="mt-auto flex items-center justify-between border-t border-white/20 pt-4">
          <div>
            <Text className="text-xs font-medium uppercase tracking-wide text-slate-400">
              By
            </Text>
            <Text className="font-semibold text-white">
              {event.organization.name}
            </Text>
          </div>

          <div className="flex items-center gap-2 text-sm font-semibold text-white transition-colors group-hover:text-slate-200">
            View details
            <span className="transition-transform group-hover:translate-x-1">→</span>
          </div>
        </div>

        {/* Additional Info */}
        {featured && (
          <div className="mt-4 flex flex-wrap gap-2">
            {event.seatmap.isSeated && (
              <span className="inline-flex items-center rounded-full bg-white/10 border border-white/20 px-3 py-1 text-xs font-semibold text-white">
                Reserved seating
              </span>
            )}
            {event.policies.transferable && (
              <span className="inline-flex items-center rounded-full bg-white/10 border border-white/20 px-3 py-1 text-xs font-semibold text-white">
                Transferable
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
