import { Metadata } from 'next';
import CategoryManagement from '@/components/admin/categories/category-management';

export const metadata: Metadata = {
  title: 'Category Management - Admin',
  description: 'Manage event categories',
};

export default function CategoryManagementPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Category Management</h1>
        <p className="text-muted-foreground mt-1">Manage event categories and subcategories</p>
      </div>

      <CategoryManagement />
    </div>
  );
}
