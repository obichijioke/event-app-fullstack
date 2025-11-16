import { Metadata } from 'next';
import { RefundList } from '@/components/organizer/refunds/refund-list';

export const metadata: Metadata = {
  title: 'Refunds - EventFlow',
  description: 'Track and manage refunded orders',
};

export default function RefundsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <RefundList />
    </div>
  );
}
