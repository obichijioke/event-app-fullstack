import { Metadata } from 'next';
import { OrganizationList } from '@/components/admin/organizations';

export const metadata: Metadata = {
  title: 'Organization Management',
  description: 'Manage organizations',
};

export default function OrganizationManagementPage() {
  return <OrganizationList />;
}
