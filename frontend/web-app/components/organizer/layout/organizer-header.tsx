'use client';

import Link from 'next/link';
import { OrganizationSelector } from '../organization-selector';
import { NotificationBell } from '../notifications/notification-bell';
import { Plus } from 'lucide-react';
import { useOrganizerStore } from '@/lib/stores/organizer-store';

export function OrganizerHeader() {
  const { currentOrganization } = useOrganizerStore();
  const creatorUrl = currentOrganization ? '/organizer/events/create' : '/organizer/onboarding';

  return (
    <header className="bg-card border-b border-border h-16 sticky top-0 z-40">
      <div className="h-full px-6 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-xl font-bold text-primary">
            EventApp
          </Link>
          <OrganizationSelector />
        </div>

        <div className="flex items-center gap-4">
          <Link
            href={creatorUrl}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition font-medium"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Create Event</span>
          </Link>

          <NotificationBell />

          <Link
            href="/account"
            className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-semibold text-sm"
          >
            U
          </Link>
        </div>
      </div>
    </header>
  );
}
