'use client';

import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import type { EventCreatorSectionType } from '@/lib/types/event-creator-v2';
import { useEventCreatorDraft } from '@/components/creator-v2/event-creator-provider';

const SECTION_COPY: Record<
  EventCreatorSectionType,
  { title: string; subtitle: string; checklist: string[] }
> = {
  basics: {
    title: 'Basics',
    subtitle:
      'Name your event, pick a category, and set visibility. This is the first impression for attendees.',
    checklist: [
      'Clear, concise event title',
      'Category + tags for discovery',
      'Cover image that represents the experience',
    ],
  },
  story: {
    title: 'Details & Story',
    subtitle:
      'Tell people why they should attend. Outline speakers, agenda, and what to expect.',
    checklist: [
      'Compelling hero story or description',
      'Speaker lineup or agenda structure',
      'Refund policy and accessibility notes',
    ],
  },
  tickets: {
    title: 'Tickets & Pricing',
    subtitle:
      'Configure paid, free, donation, and add-on tickets with flexible fees.',
    checklist: [
      'Tiered pricing or promos if needed',
      'Capacity aligned with venue limits',
      'Taxes, fees, and payout preferences',
    ],
  },
  schedule: {
    title: 'Schedule & Venue',
    subtitle:
      'Single date, multi-day, or recurring? Capture venue, streaming links, and check-in preferences.',
    checklist: [
      'Timezone and recurrence rules',
      'Hybrid or online access instructions',
      'Check-in and badge preferences',
    ],
  },
  checkout: {
    title: 'Checkout & Audience',
    subtitle:
      'Collect only the info you need at checkout. Configure custom questions and consent language.',
    checklist: [
      'Attendee fields per ticket or order',
      'Optional vs required questions mapped',
      'Marketing consent + compliance toggles',
    ],
  },
};

interface SectionPlaceholderProps {
  section: EventCreatorSectionType;
}

export function SectionPlaceholder({ section }: SectionPlaceholderProps) {
  const { draft, updateSection, isSaving } = useEventCreatorDraft();
  const sectionData = draft?.sections.find(
    (candidate) => candidate.section === section,
  );
  const meta = SECTION_COPY[section];

  const isComplete = sectionData?.status === 'valid';

  const statusLabel = useMemo(() => {
    if (sectionData?.status === 'valid') return 'Marked complete';
    if (sectionData?.status === 'blocked') return 'Blocked';
    return 'Not started';
  }, [sectionData?.status]);

  const handleToggleComplete = async () => {
    await updateSection(
      section,
      {
        payload: sectionData?.payload ?? {},
        status: isComplete ? 'incomplete' : 'valid',
      },
      { showToast: true },
    );
  };

  return (
    <div className="rounded-3xl border border-border bg-card/80 p-8 shadow-sm backdrop-blur">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            {statusLabel}
          </p>
          <h2 className="text-2xl font-bold text-foreground">{meta.title}</h2>
          <p className="text-sm text-muted-foreground">{meta.subtitle}</p>
        </div>
        <Button
          variant={isComplete ? 'outline' : 'primary'}
          onClick={handleToggleComplete}
          disabled={isSaving}
        >
          {isComplete ? 'Mark incomplete' : 'Mark complete'}
        </Button>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <div className="space-y-3">
          <p className="text-sm font-semibold text-foreground">
            What to cover
          </p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {meta.checklist.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-primary" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground">
          <p className="font-semibold text-foreground">
            Phase 4 preview ✨
          </p>
          <p className="mt-2">
            This placeholder gives collaborators a guided checklist while we
            wire up the full form experience in the next phase.
          </p>
          <p className="mt-2">
            Use the button above to experiment with autosave + validation
            states. Section status feeds the progress tracker and publish
            button.
          </p>
        </div>
      </div>
    </div>
  );
}
