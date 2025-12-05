'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/auth';
import { OrganizationSetup } from '@/components/organizer/organization-setup';
import { useOrganizerStore } from '@/lib/stores/organizer-store';
import toast from 'react-hot-toast';

export function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, initialized } = useAuth();
  const { currentOrganization } = useOrganizerStore();

  useEffect(() => {
    if (!initialized) return;

    if (!user) {
      const query = searchParams?.toString();
      const returnUrl = `/organizer/onboarding${query ? `?${query}` : ''}`;
      toast.error('Please sign in to continue');
      router.replace(`/auth/login?returnUrl=${encodeURIComponent(returnUrl)}`);
      return;
    }

    if (currentOrganization) {
      router.replace('/organizer/events/create');
    }
  }, [initialized, user, currentOrganization, router, searchParams]);

  if (!initialized) {
    return null;
  }

  if (!user || currentOrganization) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <OrganizationSetup redirectTo="/organizer/events/create" />
    </div>
  );
}
