import { Metadata } from 'next';
import { Suspense } from 'react';
import { OnboardingContent } from '@/components/organizer/onboarding-content';

export const metadata: Metadata = {
  title: 'Set up your organizer profile | EventFlow',
  description: 'Create your organizer profile to start creating events',
};

export default function OnboardingPage() {
  return (
    <Suspense fallback={null}>
      <OnboardingContent />
    </Suspense>
  );
}
