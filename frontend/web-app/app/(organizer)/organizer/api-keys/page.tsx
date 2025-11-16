import { Metadata } from 'next';
import { ApiKeyList } from '@/components/organizer/api-keys/api-key-list';

export const metadata: Metadata = {
  title: 'API Keys - EventFlow',
  description: 'Manage API keys for programmatic access',
};

export default function APIKeysPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <ApiKeyList />
    </div>
  );
}
