'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth';
import { adminApiService } from '@/services/admin-api.service';

interface Category {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  parent?: {
    id: string;
    name: string;
    slug: string;
  };
  children?: {
    id: string;
    name: string;
    slug: string;
  }[];
  eventCount: number;
  childrenCount: number;
}

export default function CategoryManagement() {
  const { accessToken } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    parentId: '',
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    if (!accessToken) return;

    try {
      setLoading(true);
      const response = await adminApiService.getCategories(accessToken, searchTerm);
      if (response.success && response.data) {
        setCategories(response.data as Category[]);
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
      showMessage('error', 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleOpenModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        slug: category.slug,
        parentId: category.parentId || '',
      });
    } else {
      setEditingCategory(null);
      setFormData({ name: '', slug: '', parentId: '' });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCategory(null);
    setFormData({ name: '', slug: '', parentId: '' });
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      slug: editingCategory ? prev.slug : generateSlug(name),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;

    try {
      const data = {
        name: formData.name,
        slug: formData.slug,
        parentId: formData.parentId || undefined,
      };

      if (editingCategory) {
        await adminApiService.updateCategory(accessToken, editingCategory.id, data);
        showMessage('success', 'Category updated successfully');
      } else {
        await adminApiService.createCategory(accessToken, data);
        showMessage('success', 'Category created successfully');
      }

      handleCloseModal();
      loadCategories();
    } catch (error: any) {
      console.error('Failed to save category:', error);
      showMessage('error', error.response?.data?.message || 'Failed to save category');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!accessToken) return;
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      await adminApiService.deleteCategory(accessToken, id);
      showMessage('success', 'Category deleted successfully');
      loadCategories();
    } catch (error: any) {
      console.error('Failed to delete category:', error);
      showMessage('error', error.response?.data?.message || 'Failed to delete category');
    }
  };

  const parentCategories = categories.filter(cat => !cat.parentId);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading categories...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {message && (
        <div className={`p-4 rounded-lg border ${
          message.type === 'success' 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadCategories()}
            className="w-full px-4 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition"
        >
          + Add Category
        </button>
      </div>

      {/* Categories Table */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-medium">Name</th>
              <th className="px-6 py-3 text-left text-sm font-medium">Slug</th>
              <th className="px-6 py-3 text-left text-sm font-medium">Parent</th>
              <th className="px-6 py-3 text-left text-sm font-medium">Events</th>
              <th className="px-6 py-3 text-left text-sm font-medium">Subcategories</th>
              <th className="px-6 py-3 text-right text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {categories.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                  No categories found
                </td>
              </tr>
            ) : (
              categories.map((category) => (
                <tr key={category.id} className="hover:bg-muted/50">
                  <td className="px-6 py-4 text-sm font-medium">{category.name}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{category.slug}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {category.parent?.name || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm">{category.eventCount}</td>
                  <td className="px-6 py-4 text-sm">{category.childrenCount}</td>
                  <td className="px-6 py-4 text-sm text-right">
                    <button
                      onClick={() => handleOpenModal(category)}
                      className="text-primary hover:underline mr-4"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(category.id, category.name)}
                      className="text-red-600 hover:underline"
                      disabled={category.eventCount > 0 || category.childrenCount > 0}
                      title={
                        category.eventCount > 0 || category.childrenCount > 0
                          ? 'Cannot delete category with events or subcategories'
                          : 'Delete category'
                      }
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">
              {editingCategory ? 'Edit Category' : 'Create Category'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Category Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                  placeholder="e.g., Music"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Slug *</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                  placeholder="e.g., music"
                  pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
                  title="Lowercase letters, numbers, and hyphens only"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  URL-friendly identifier (lowercase, hyphens allowed)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Parent Category</label>
                <select
                  value={formData.parentId}
                  onChange={(e) => setFormData(prev => ({ ...prev, parentId: e.target.value }))}
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">None (Top Level)</option>
                  {parentCategories
                    .filter(cat => !editingCategory || cat.id !== editingCategory.id)
                    .map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 border border-border rounded-md hover:bg-secondary transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition"
                >
                  {editingCategory ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

