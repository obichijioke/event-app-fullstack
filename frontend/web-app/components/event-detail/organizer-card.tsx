import Link from 'next/link';
import { Avatar, Button, Text, buttonVariants } from '@/components/ui';
import { cn } from '@/lib/utils';
import type { EventSummary } from '@/lib/homepage';

type OrganizerCardProps = {
  organizer: EventSummary['organization'];
};

export function OrganizerCard({ organizer }: OrganizerCardProps) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
      <Text className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Organizer</Text>
      <div className="mt-4 flex items-center gap-4">
        <Avatar name={organizer.name} size="lg" />
        <div>
          <p className="text-lg font-semibold text-foreground">{organizer.name}</p>
          <Text className="text-sm text-muted-foreground">Trusted organizer</Text>
        </div>
      </div>
      <div className="mt-6 flex flex-col gap-2">
        <Link
          href={`/organizers/${organizer.id}`}
          className={cn(buttonVariants())}
        >
          View profile
        </Link>
        <Button variant="outline">Follow organizer</Button>
      </div>
    </div>
  );
}
