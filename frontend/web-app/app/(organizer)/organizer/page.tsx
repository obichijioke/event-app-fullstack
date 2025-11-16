import { Metadata } from 'next';
import { DashboardContent } from '@/components/organizer/dashboard/dashboard-content';

export const metadata: Metadata = {
  title: 'Organizer Dashboard',
  description: 'Manage your events and organization',
};

export default function OrganizerDashboardPage() {
  return <DashboardContent />;
}

