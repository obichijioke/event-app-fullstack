import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { PayoutList } from '@/components/organizer/payouts/payout-list';

export const metadata: Metadata = {
  title: 'Payouts',
  description: 'Manage your organization payouts',
};

export default function PayoutsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link
            href="/organizer"
            className="p-2 hover:bg-secondary rounded-md transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Payouts</h1>
            <p className="text-muted-foreground mt-1">Manage your organization payouts and payment history</p>
          </div>
        </div>
      </div>

      <PayoutList />
    </div>
  );
}
