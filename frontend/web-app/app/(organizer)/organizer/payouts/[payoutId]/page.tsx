import { Metadata } from 'next';
import { PayoutDetail } from '@/components/organizer/payouts/payout-detail';

type Props = {
  params: Promise<{ payoutId: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { payoutId } = await params;
  return {
    title: `Payout Details - ${payoutId}`,
    description: 'View payout details and transaction history',
  };
}

export default async function PayoutDetailsPage({ params }: Props) {
  const { payoutId } = await params;

  return (
    <div className="container mx-auto px-4 py-8">
      <PayoutDetail payoutId={payoutId} />
    </div>
  );
}
