import { Metadata } from 'next';
import { CreateEventEntry } from '@/components/creator-v2/create-event-entry';

export const metadata: Metadata = {
  title: 'Create Event',
  description: 'Create a new event',
};

export default function CreateEventPage() {
  return <CreateEventEntry />;
}
