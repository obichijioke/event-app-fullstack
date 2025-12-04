import Image from 'next/image';
import { Heading } from '@/components/ui';
import type { EventDetailSummary } from '@/lib/events';

type EventOverviewProps = {
  description: string;
  assets: EventDetailSummary['assets'];
  agenda: EventDetailSummary['agenda'];
  speakers: EventDetailSummary['speakers'];
};

export function EventOverview({ description, assets, agenda, speakers }: EventOverviewProps) {
  const hasHtml = /<\/?[a-z][\s\S]*>/i.test(description);
  const paragraphs = !hasHtml
    ? description
        .split(/\n{2,}/)
        .map((paragraph) => paragraph.trim())
        .filter(Boolean)
    : [];

  const images = assets.filter((asset) => asset.kind === 'image');

  return (
    <div className="space-y-8">
      {/* About This Event */}
      <section className="rounded border border-border bg-card p-6">
        <Heading as="h2" className="text-xl font-semibold mb-4">
          About This Event
        </Heading>
        <div className="prose prose-slate max-w-none text-sm text-foreground leading-relaxed">
          {hasHtml ? (
            <div dangerouslySetInnerHTML={{ __html: description }} />
          ) : paragraphs.length > 0 ? (
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

      {/* Agenda */}
      {agenda.length > 0 && (
        <section className="rounded border border-border bg-card p-6">
          <Heading as="h2" className="text-xl font-semibold mb-4">
            Agenda
          </Heading>
          <div className="space-y-3">
            {agenda.map((item, idx) => (
              <div
                key={`${item.title}-${idx}`}
                className="flex flex-col gap-2 rounded border border-border/60 bg-muted/40 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {(item.time ?? '').trim() || idx + 1}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{item.title}</p>
                    {item.time && (
                      <p className="text-xs text-muted-foreground">Starts at {item.time}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Speakers */}
      {speakers.length > 0 && (
        <section className="rounded border border-border bg-card p-6">
          <Heading as="h2" className="text-xl font-semibold mb-4">
            Speakers
          </Heading>
          <div className="grid gap-4 sm:grid-cols-2">
            {speakers.map((speaker, idx) => (
              <div key={`${speaker.name}-${idx}`} className="rounded border border-border bg-card/70 p-4">
                <div className="flex items-start gap-3">
                  {speaker.photoUrl ? (
                    <div className="relative h-12 w-12 overflow-hidden rounded-full bg-muted">
                      <Image
                        src={speaker.photoUrl}
                        alt={speaker.name}
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    </div>
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground">
                      {speaker.name.slice(0, 1).toUpperCase()}
                    </div>
                  )}
                  <div className="space-y-1">
                    <p className="font-semibold text-foreground">{speaker.name}</p>
                    {speaker.role && <p className="text-sm text-muted-foreground">{speaker.role}</p>}
                    {speaker.bio && (
                      <p className="text-sm text-muted-foreground leading-snug">
                        {speaker.bio}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

    </div>
  );
}
