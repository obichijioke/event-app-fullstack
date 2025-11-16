import { Metadata } from 'next';
import Link from 'next/link';
import { TicketManagementContent } from '@/components/organizer/tickets/ticket-management-content';
import { ArrowLeft } from 'lucide-react';

type Props = {
  params: Promise<{ eventId: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { eventId } = await params;
  return {
    title: `Ticket Management - ${eventId}`,
    description: 'Manage event tickets',
  };
}

export default async function TicketManagementPage({ params }: Props) {
  const { eventId } = await params;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <Link
          href={`/organizer/events/${eventId}`}
          className="p-2 hover:bg-secondary rounded-md transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Ticket Management</h1>
          <p className="text-muted-foreground mt-1">Configure and manage ticket types</p>
        </div>
      </div>

      <TicketManagementContent eventId={eventId} />
    </div>
  );
}
