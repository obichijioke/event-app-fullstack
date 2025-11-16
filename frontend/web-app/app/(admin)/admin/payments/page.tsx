import { Metadata } from 'next';
import { PaymentList } from '@/components/admin/payments';

export const metadata: Metadata = {
  title: 'Payment Monitoring',
  description: 'Monitor all payments',
};

export default function PaymentMonitoringPage() {
  return <PaymentList />;
}
