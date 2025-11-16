'use client';

import Image from 'next/image';
import { resolveImageUrl } from '@/lib/utils/image';
import { Badge, Button } from '@/components/ui';
import { HeartIcon } from '@/components/ui/icons';
import { SocialShareDropdown } from './social-share-dropdown';
import type { EventSummary } from '@/lib/homepage';
import { formatDate } from '@/lib/utils';

type EventHeroProps = {
  summary: EventSummary;
  occurrenceStart?: string;
  eventUrl?: string;
  eventDescription?: string;
};

function getTimezoneAbbr(timezone?: string | null): string {
  if (!timezone) return 'WAT';

  const timezoneMap: Record<string, string> = {
    'Africa/Lagos': 'WAT',
    'Africa/Accra': 'GMT',
    'Africa/Nairobi': 'EAT',
    'Africa/Cairo': 'EET',
    'Africa/Johannesburg': 'SAST',
  };
  return timezoneMap[timezone] || 'WAT';
}

export function EventHero({ summary, occurrenceStart, eventUrl, eventDescription }: EventHeroProps) {
  const coverImage = resolveImageUrl(
    summary.coverImageUrl ?? summary.assets.find((asset) => asset.kind === 'image')?.url,
  );
  const dateLabel = formatDate(occurrenceStart ?? summary.startAt, 'long');
  const timeLabel = formatDate(occurrenceStart ?? summary.startAt, 'time');
  const timezoneAbbr = getTimezoneAbbr(summary.venue?.timezone);
  const venueLine = [
    summary.venue?.name,
    summary.venue?.city ?? summary.venue?.region ?? summary.venue?.country,
  ]
    .filter(Boolean)
    .join(', ');

  // Get current URL for sharing
  const shareUrl = eventUrl || (typeof window !== 'undefined' ? window.location.href : '');
  const shareDescription = eventDescription || `Join us for ${summary.title}`;
  const shareHashtags = summary.category?.name ? [summary.category.name.replace(/\s+/g, '')] : [];

  return (
    <section className="relative h-[500px] overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        {coverImage ? (
          <Image
            src={coverImage}
            alt={summary.title}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
      </div>

      {/* Action Buttons (Top Right) */}
      <div className="absolute top-6 right-6 z-20 flex gap-3">
        <Button
          variant="outline"
          size="icon"
          className="h-10 w-10 rounded border-white/40 bg-white/10 backdrop-blur-sm hover:bg-white/20"
        >
          <HeartIcon className="h-5 w-5 text-white" />
        </Button>
        <div className="[&_button]:h-10 [&_button]:border-white/40 [&_button]:bg-white/10 [&_button]:backdrop-blur-sm [&_button]:hover:bg-white/20 [&_button]:text-white">
          <SocialShareDropdown
            url={shareUrl}
            title={summary.title}
            description={shareDescription}
            hashtags={shareHashtags}
          />
        </div>
      </div>

      {/* Hero Content (Bottom Left) */}
      <div className="absolute bottom-0 left-0 right-0 z-10 px-6 pb-8">
        <div className="container mx-auto">
          <div className="flex flex-wrap gap-2 mb-4">
            {summary.stats.isLowInventory && (
              <Badge variant="error" size="sm" className="bg-error text-white">
                🔥 Selling Fast
              </Badge>
            )}
            {summary.category?.name && (
              <Badge variant="secondary" size="sm" className="bg-primary/90 text-white">
                🎵 {summary.category.name}
              </Badge>
            )}
            {summary.ageRestriction && (
              <Badge variant="outline" size="sm" className="border-white/60 text-white bg-white/10">
                {summary.ageRestriction}
              </Badge>
            )}
          </div>

          <h1 className="text-4xl font-bold text-white mb-4 lg:text-5xl">
            {summary.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-white/90">
            <div className="flex items-center gap-2">
              <span>📅</span>
              <span className="text-sm">{dateLabel}</span>
            </div>
            <div className="flex items-center gap-2">
              <span>🕐</span>
              <span className="text-sm font-semibold">{timeLabel} {timezoneAbbr}</span>
            </div>
            {venueLine && (
              <div className="flex items-center gap-2">
                <span>📍</span>
                <span className="text-sm">{venueLine}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
