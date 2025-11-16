import { Metadata } from 'next';
import SiteSettingsForm from '@/components/admin/settings/site-settings-form';

export const metadata: Metadata = {
  title: 'Site Settings - Admin',
  description: 'Configure platform settings',
};

export default function SiteSettingsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Site Settings</h1>
        <p className="text-muted-foreground mt-1">Configure platform-wide settings and preferences</p>
      </div>

      <SiteSettingsForm />
    </div>
  );
}
