import { Metadata } from 'next';
import { PayoutList } from '@/components/admin/payouts';

export const metadata: Metadata = {
  title: 'Payout Management',
  description: 'Manage platform payouts',
};

export default function PayoutManagementPage() {
  return <PayoutList />;
}
