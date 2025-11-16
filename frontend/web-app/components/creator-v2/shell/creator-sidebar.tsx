'use client';

import { CheckCircle2, AlertTriangle, Circle } from 'lucide-react';
import { EVENT_CREATOR_SECTION_ORDER } from '@/lib/types/event-creator-v2';
import { useEventCreatorDraft } from '@/components/creator-v2/event-creator-provider';
import { ProgressBar } from '@/components/ui/progress-bar';

export function CreatorSidebar() {
  const { draft, activeSection, setActiveSection } = useEventCreatorDraft();

  if (!draft) {
    return null;
  }

  return (
    <aside className="w-full max-w-xs flex-shrink-0 rounded-3xl border border-border bg-card/70 p-5 backdrop-blur">
      <div className="mb-6 space-y-2">
        <p className="text-sm font-semibold text-foreground">Progress</p>
        <ProgressBar value={draft.completionPercent} showLabel />
        <p className="text-xs text-muted-foreground">
          {draft.completionPercent}% complete
        </p>
      </div>

      <nav className="space-y-2">
        {EVENT_CREATOR_SECTION_ORDER.map((section) => {
          const sectionData = draft.sections.find(
            (candidate) => candidate.section === section,
          );
          const isActive = activeSection === section;
          const status = sectionData?.status ?? 'incomplete';
          const icon = getStatusIcon(status);
          const label = getSectionLabel(section);

          return (
            <button
              key={section}
              type="button"
              onClick={() => setActiveSection(section)}
              className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition ${
                isActive
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-border bg-card hover:border-primary/40'
              }`}
            >
              {icon}
              <div className="flex flex-col">
                <span className="text-sm font-semibold capitalize">
                  {label}
                </span>
                <span className="text-xs text-muted-foreground">
                  {getStatusLabel(status)}
                </span>
              </div>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

function getSectionLabel(section: string) {
  switch (section) {
    case 'story':
      return 'Details & story';
    case 'tickets':
      return 'Tickets & pricing';
    case 'schedule':
      return 'Schedule & venue';
    case 'checkout':
      return 'Checkout & audience';
    default:
      return 'Basics';
  }
}

function getStatusLabel(status: string) {
  if (status === 'valid') return 'Complete';
  if (status === 'blocked') return 'Needs attention';
  return 'Not started';
}

function getStatusIcon(status: string) {
  if (status === 'valid') {
    return <CheckCircle2 className="h-5 w-5 text-success" />;
  }
  if (status === 'blocked') {
    return <AlertTriangle className="h-5 w-5 text-error" />;
  }
  return <Circle className="h-5 w-5 text-muted-foreground" />;
}
