'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BuildingIcon, CheckCircleIcon, MessageIcon, UserIcon, MailIcon, PhoneIcon, GlobeIcon } from '@/components/ui/icons';
import { Button } from '@/components/ui';
import type { EventSummary } from '@/lib/homepage';
import { fetchOrganizerReviewsSummary, ReviewsSummary } from '@/lib/events';

interface EventOrganizerCardProps {
  organizer: EventSummary['organization'];
}

export function EventOrganizerCard({ organizer }: EventOrganizerCardProps) {
  const [reviewSummary, setReviewSummary] = useState<ReviewsSummary | null>(null);

  useEffect(() => {
    fetchOrganizerReviewsSummary(organizer.id).then(setReviewSummary);
  }, [organizer.id]);
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
          {reviewSummary && (
            <div className="flex gap-8 mt-3">
              {reviewSummary.totalReviews > 0 && (
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {reviewSummary.averageRating.toFixed(1)} ⭐
                  </p>
                  <p className="text-xs text-muted-foreground">
                    ({reviewSummary.totalReviews.toLocaleString()} review{reviewSummary.totalReviews !== 1 ? 's' : ''})
                  </p>
                </div>
              )}
            </div>
          )}
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

      {/* Contact Information - Only show if available */}
      {(organizer as any).website && (
        <div className="space-y-3">
          <div className="flex items-center gap-2.5">
            <GlobeIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <a
              href={(organizer as any).website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline"
            >
              Visit Website
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

