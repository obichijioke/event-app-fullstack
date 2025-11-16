import { Metadata } from 'next';
import { EventList } from '@/components/admin/events';

export const metadata: Metadata = {
  title: 'Event Management',
  description: 'Manage all platform events',
};

export default function EventManagementPage() {
  return <EventList />;
}
