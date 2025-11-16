import Link from 'next/link';
import { Badge, Text, buttonVariants } from '@/components/ui';
import { OrganizerSummary } from '@/lib/homepage';
import { formatDate, cn } from '@/lib/utils';

interface OrganizersGridProps {
  organizers: OrganizerSummary[];
}

export function OrganizersGrid({ organizers }: OrganizersGridProps) {
  if (!organizers.length) {
    return null;
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="section-title">Organizers to follow</h2>
        <Text className="section-subtitle">
          Stay close to curators with consistent sell-outs and premium
          production.
        </Text>
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {organizers.map((org) => (
          <article
            key={org.id}
            className="flex h-full flex-col rounded-2xl border border-border bg-card p-6 shadow-card transition hover:-translate-y-1 hover:shadow-card-hover"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-foreground">
                  {org.name}
                </h3>
                <Text className="text-sm text-muted-foreground">
                  {[org.city, org.region, org.country].filter(Boolean).join(', ')}
                </Text>
              </div>
              <Badge variant="outline" size="sm">
                {Intl.NumberFormat('en-NG', {
                  notation: 'compact',
                }).format(org.followerCount)}{' '}
                followers
              </Badge>
            </div>

            <div className="mt-4 space-y-3">
              {org.upcomingEvents.slice(0, 2).map((event) => (
                <div
                  key={event.id}
                  className="rounded-lg border border-dashed border-border p-3"
                >
                  <Text className="text-xs uppercase text-primary">
                    {formatDate(event.startAt, 'short')}
                  </Text>
                  <Text className="font-medium">{event.title}</Text>
                </div>
              ))}
            </div>

            <div className="mt-auto flex items-center justify-between pt-6">
              {org.website ? (
                <a
                  href={org.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(buttonVariants({ variant: 'ghost' }), 'px-4')}
                >
                  Visit site
                </a>
              ) : (
                <div />
              )}
              <Link
                href={`/organizers/${org.id}`}
                className={buttonVariants({ variant: 'primary' })}
              >
                Follow
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
