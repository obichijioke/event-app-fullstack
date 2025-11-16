import { Metadata } from 'next';
import { UserList } from '@/components/admin/users';

export const metadata: Metadata = {
  title: 'User Management',
  description: 'Manage platform users',
};

export default function UserManagementPage() {
  return <UserList />;
}
