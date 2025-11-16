'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { OrganizationSetup } from '@/components/organizer/organization-setup';
import { useOrganizerStore } from '@/lib/stores/organizer-store';

export function OnboardingContent() {
  const router = useRouter();
  const { currentOrganization } = useOrganizerStore();

  useEffect(() => {
    if (currentOrganization) {
      router.replace('/organizer/events/create');
    }
  }, [currentOrganization, router]);

  if (currentOrganization) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <OrganizationSetup redirectTo="/organizer/events/create" />
    </div>
  );
}
