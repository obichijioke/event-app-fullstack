import { Metadata } from 'next';
import { WebhookList } from '@/components/organizer/webhooks/webhook-list';

export const metadata: Metadata = {
  title: 'Webhooks - EventFlow',
  description: 'Configure webhooks for real-time event notifications',
};

export default function WebhooksPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <WebhookList />
    </div>
  );
}
