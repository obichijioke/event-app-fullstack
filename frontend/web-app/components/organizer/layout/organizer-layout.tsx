'use client';

import { ReactNode } from 'react';
import { OrganizerHeader } from './organizer-header';
import { OrganizerSidebar } from './organizer-sidebar';
import { OrganizationProvider } from '../organization-provider';
import { useAuth } from '@/components/auth';
import { useNotificationsSocket } from '@/lib/hooks/use-notifications-socket';

interface OrganizerLayoutProps {
  children: ReactNode;
}

export function OrganizerLayout({ children }: OrganizerLayoutProps) {
  const { accessToken, initialized } = useAuth();

  // Initialize WebSocket connection for real-time notifications
  useNotificationsSocket(accessToken, initialized);

  return (
    <OrganizationProvider>
      <div className="min-h-screen bg-background">
        <OrganizerHeader />
        <div className="flex">
          <OrganizerSidebar />
          {/* Add left margin to account for fixed sidebar width (w-64 = 16rem) */}
          <main className="flex-1 ml-64 overflow-x-hidden">
            {children}
          </main>
        </div>
      </div>
    </OrganizationProvider>
  );
}
