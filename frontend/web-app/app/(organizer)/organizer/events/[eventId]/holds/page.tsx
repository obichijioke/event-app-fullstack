import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { HoldsContent } from '@/components/organizer/holds/holds-content';

type Props = {
  params: Promise<{ eventId: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { eventId } = await params;
  return {
    title: `Inventory Holds - ${eventId}`,
    description: 'Manage inventory holds',
  };
}

export default async function InventoryHoldsPage({ params }: Props) {
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
          <h1 className="text-3xl font-bold">Inventory Holds</h1>
          <p className="text-muted-foreground mt-1">Manage ticket and seat reservations</p>
        </div>
      </div>

      <HoldsContent eventId={eventId} />
    </div>
  );
}
