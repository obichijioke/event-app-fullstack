import { Metadata } from 'next';
import { AdminDashboardContent } from '@/components/admin/dashboard/admin-dashboard-content';

export const metadata: Metadata = {
  title: 'Admin Dashboard',
  description: 'Platform metrics and system health',
};

export default function AdminDashboardPage() {
  return <AdminDashboardContent />;
}
