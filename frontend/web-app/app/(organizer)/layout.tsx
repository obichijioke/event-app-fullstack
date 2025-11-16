'use client';

import { OrganizerLayout } from '@/components/organizer/layout/organizer-layout';

export default function Layout({ children }: { children: React.ReactNode }) {
  return <OrganizerLayout>{children}</OrganizerLayout>;
}
