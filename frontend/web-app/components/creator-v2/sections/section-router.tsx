'use client';

import { BasicsSection } from '@/components/creator-v2/sections/basics-section';
import { StorySection } from '@/components/creator-v2/sections/story-section';
import { SectionPlaceholder } from '@/components/creator-v2/sections/section-placeholder';
import { ScheduleSection } from '@/components/creator-v2/sections/schedule-section';
import { CheckoutSection } from '@/components/creator-v2/sections/checkout-section';
import { TicketsSection } from '@/components/creator-v2/sections/tickets-section';
import { useEventCreatorDraft } from '@/components/creator-v2/event-creator-provider';

export function SectionRouter() {
  const { activeSection } = useEventCreatorDraft();

  if (activeSection === 'basics') return <BasicsSection />;
  if (activeSection === 'story') return <StorySection />;
  if (activeSection === 'tickets') return <TicketsSection />;
  if (activeSection === 'schedule') return <ScheduleSection />;
  if (activeSection === 'checkout') return <CheckoutSection />;

  return <BasicsSection />;
}
