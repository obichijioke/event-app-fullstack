import { Metadata } from 'next';
import Link from 'next/link';
import { PromoCodesContent } from '@/components/organizer/promo-codes/promo-codes-content';
import { ArrowLeft } from 'lucide-react';

type Props = {
  params: Promise<{ eventId: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { eventId } = await params;
  return {
    title: `Promo Codes - ${eventId}`,
    description: 'Manage promo codes',
  };
}

export default async function PromoCodesPage({ params }: Props) {
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
          <h1 className="text-3xl font-bold">Promo Codes</h1>
          <p className="text-muted-foreground mt-1">Create and manage discount codes</p>
        </div>
      </div>

      <PromoCodesContent eventId={eventId} />
    </div>
  );
}
