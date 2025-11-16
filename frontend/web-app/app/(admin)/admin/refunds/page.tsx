import { Metadata } from 'next';
import { RefundList } from '@/components/admin/refunds';

export const metadata: Metadata = {
  title: 'Refund Management',
  description: 'Oversee refund requests and processing',
};

export default function RefundManagementPage() {
  return <RefundList />;
}
