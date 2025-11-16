import Link from 'next/link';
import { HomepageSection } from '@/lib/homepage';
import { Text, buttonVariants } from '@/components/ui';
import { EventCard } from './event-card';
import { cn } from '@/lib/utils';

interface HomepageSectionProps {
  section: HomepageSection;
}

export function HomepageSectionBlock({ section }: HomepageSectionProps) {
  if (!section.items.length) {
    return null;
  }

  const layoutClasses = {
    carousel:
      'flex gap-6 overflow-x-auto pb-4 [-ms-overflow-style:none] [scrollbar-width:none]',
    marquee:
      'flex gap-6 overflow-x-auto pb-4 animate-none [-ms-overflow-style:none] [scrollbar-width:none]',
    grid:
      'grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  } as const;

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="section-title">{section.title}</h2>
          {section.subtitle && (
            <Text className="section-subtitle">{section.subtitle}</Text>
          )}
        </div>
        {section.cta && (
          <Link
            href={section.cta.href}
            className={cn(buttonVariants({ variant: 'outline' }), 'w-fit')}
          >
            {section.cta.label}
          </Link>
        )}
      </header>

      <div
        className={cn(
          'snap-x snap-mandatory',
          section.layout === 'grid'
            ? layoutClasses.grid
            : section.layout === 'carousel'
              ? layoutClasses.carousel
              : layoutClasses.marquee,
        )}
      >
        {section.items.map((event) => (
          <div
            key={event.id}
            className={cn(
              section.layout === 'grid' ? '' : 'min-w-[280px] snap-start',
            )}
          >
            <EventCard event={event} compact={section.layout !== 'grid'} />
          </div>
        ))}
      </div>
    </section>
  );
}
