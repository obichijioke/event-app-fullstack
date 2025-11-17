import { Metadata } from 'next';
import CurrencySettingsForm from '@/components/admin/settings/currency-settings-form';

export const metadata: Metadata = {
  title: 'Currency Settings - Admin',
  description: 'Configure currency and multi-currency settings',
};

export default function CurrencySettingsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Currency Settings</h1>
        <p className="text-muted-foreground mt-1">
          Configure platform currency, multi-currency mode, and exchange rates
        </p>
      </div>

      <CurrencySettingsForm />
    </div>
  );
}
