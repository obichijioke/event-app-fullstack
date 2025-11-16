import Link from 'next/link';
import { BuildingIcon, CheckCircleIcon, MessageIcon, UserIcon, MailIcon, PhoneIcon, GlobeIcon } from '@/components/ui/icons';
import { Button } from '@/components/ui';
import type { EventSummary } from '@/lib/homepage';

interface EventOrganizerCardProps {
  organizer: EventSummary['organization'];
}

export function EventOrganizerCard({ organizer }: EventOrganizerCardProps) {
  return (
    <div className="rounded border border-border bg-card p-6">
      <h2 className="text-lg font-bold text-foreground mb-5">Event Organizer</h2>

      {/* Organizer Profile */}
      <div className="flex gap-4 mb-5">
        <div className="flex-shrink-0 w-14 h-14 rounded bg-primary/10 border border-border flex items-center justify-center">
          <BuildingIcon className="h-8 w-8 text-primary" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-base font-semibold text-foreground">{organizer.name}</h3>
            <span className="flex items-center gap-1 text-xs font-medium text-primary">
              <CheckCircleIcon className="h-4 w-4" />
              Verified
            </span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed mb-3">
            Premier event organizer specializing in music festivals and concerts across Nigeria
          </p>
          <div className="flex gap-8">
            <div>
              <p className="text-sm font-semibold text-foreground">47</p>
              <p className="text-xs text-muted-foreground">Events Hosted</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">4.8 ⭐</p>
              <p className="text-xs text-muted-foreground">(1247 reviews)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 mb-5 pb-5 border-b border-border">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 flex items-center justify-center gap-2"
        >
          <MessageIcon className="h-4 w-4" />
          Contact
        </Button>
        <Link href={`/organizers/${organizer.id}`} className="flex-1">
          <Button
            variant="outline"
            size="sm"
            className="w-full flex items-center justify-center gap-2"
          >
            <UserIcon className="h-4 w-4" />
            View Profile
          </Button>
        </Link>
      </div>

      {/* Contact Information */}
      <div className="space-y-3">
        <div className="flex items-center gap-2.5">
          <MailIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <a
            href="mailto:info@eventco.ng"
            className="text-sm text-primary hover:underline"
          >
            info@eventco.ng
          </a>
        </div>
        <div className="flex items-center gap-2.5">
          <PhoneIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <a
            href="tel:+2341234567890"
            className="text-sm text-primary hover:underline"
          >
            +234 123 456 7890
          </a>
        </div>
        <div className="flex items-center gap-2.5">
          <GlobeIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <a
            href="https://eventco.ng"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline"
          >
            Visit Website
          </a>
        </div>
      </div>
    </div>
  );
}

