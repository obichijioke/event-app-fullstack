import Image from 'next/image';
import { Heading } from '@/components/ui';
import type { EventDetailSummary } from '@/lib/events';

type EventOverviewProps = {
  description: string;
  assets: EventDetailSummary['assets'];
};

export function EventOverview({ description, assets }: EventOverviewProps) {
  const paragraphs = description
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  const images = assets.filter((asset) => asset.kind === 'image');

  // Mock data for highlights and what's included - replace with real data
  const highlights = [
    'Live performances from top Nigerian artists',
    'Multiple stages with diverse music genres',
    'Food and beverage vendors',
    'VIP lounge access available',
    'Professional sound and lighting',
    'Secure parking facilities',
  ];

  const included = [
    'Event entry ticket',
    'Access to all performance stages',
    'Event program and schedule',
    'Complimentary event merchandise',
  ];

  return (
    <div className="space-y-8">
      {/* About This Event */}
      <section className="rounded border border-border bg-card p-6">
        <Heading as="h2" className="text-xl font-semibold mb-4">
          About This Event
        </Heading>
        <div className="prose prose-slate max-w-none text-sm text-foreground leading-relaxed">
          {paragraphs.length > 0 ? (
            paragraphs.map((paragraph, index) => (
              <p key={index} className="mb-3">
                {paragraph}
              </p>
            ))
          ) : (
            <p>Details coming soon.</p>
          )}
        </div>
      </section>

      {/* Event Highlights */}
      <section className="rounded border border-border bg-card p-6">
        <Heading as="h2" className="text-xl font-semibold mb-4">
          Event Highlights
        </Heading>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {highlights.map((highlight, index) => (
            <li key={index} className="flex items-start gap-2 text-sm text-foreground">
              <span className="text-success mt-0.5">✓</span>
              <span>{highlight}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* What's Included */}
      <section className="rounded border border-border bg-card p-6">
        <Heading as="h2" className="text-xl font-semibold mb-4">
          What&apos;s Included
        </Heading>
        <ul className="space-y-3">
          {included.map((item, index) => (
            <li key={index} className="flex items-start gap-2 text-sm text-foreground">
              <span className="text-primary mt-0.5">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Event Gallery */}
      {images.length > 0 && (
        <section className="rounded border border-border bg-card p-6">
          <Heading as="h2" className="text-xl font-semibold mb-4">
            Event Gallery
          </Heading>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {images.slice(0, 4).map((asset) => (
              <div key={asset.id} className="relative h-56 overflow-hidden rounded">
                <Image
                  src={asset.url}
                  alt={asset.altText ?? 'Event gallery image'}
                  fill
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
