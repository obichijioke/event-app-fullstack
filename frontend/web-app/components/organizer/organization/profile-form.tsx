'use client';

import { useState } from 'react';
import { Loader2, Save } from 'lucide-react';

interface OrganizationProfile {
  id: string;
  name: string;
  legalName?: string;
  website?: string;
  country?: string;
  supportEmail?: string;
  taxId?: string;
}

interface ProfileFormProps {
  organization: OrganizationProfile;
  onSubmit: (data: Partial<OrganizationProfile>) => Promise<void>;
  canEdit: boolean;
}

export function ProfileForm({ organization, onSubmit, canEdit }: ProfileFormProps) {
  const [formData, setFormData] = useState({
    name: organization.name || '',
    legalName: organization.legalName || '',
    website: organization.website || '',
    country: organization.country || '',
    supportEmail: organization.supportEmail || '',
    taxId: organization.taxId || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canEdit) return;

    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      await onSubmit(formData);
      setSuccess(true);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to update organization:', err);
      setError(err instanceof Error ? err.message : 'Failed to update organization');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          Organization updated successfully!
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Organization Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-2">
            Organization Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            disabled={!canEdit || loading}
            required
            className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        {/* Legal Name */}
        <div>
          <label htmlFor="legalName" className="block text-sm font-medium mb-2">
            Legal Name
          </label>
          <input
            type="text"
            id="legalName"
            name="legalName"
            value={formData.legalName}
            onChange={handleChange}
            disabled={!canEdit || loading}
            className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        {/* Website */}
        <div>
          <label htmlFor="website" className="block text-sm font-medium mb-2">
            Website
          </label>
          <input
            type="url"
            id="website"
            name="website"
            value={formData.website}
            onChange={handleChange}
            disabled={!canEdit || loading}
            placeholder="https://example.com"
            className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        {/* Country */}
        <div>
          <label htmlFor="country" className="block text-sm font-medium mb-2">
            Country
          </label>
          <input
            type="text"
            id="country"
            name="country"
            value={formData.country}
            onChange={handleChange}
            disabled={!canEdit || loading}
            className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        {/* Support Email */}
        <div>
          <label htmlFor="supportEmail" className="block text-sm font-medium mb-2">
            Support Email
          </label>
          <input
            type="email"
            id="supportEmail"
            name="supportEmail"
            value={formData.supportEmail}
            onChange={handleChange}
            disabled={!canEdit || loading}
            placeholder="support@example.com"
            className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        {/* Tax ID */}
        <div>
          <label htmlFor="taxId" className="block text-sm font-medium mb-2">
            Tax ID
          </label>
          <input
            type="text"
            id="taxId"
            name="taxId"
            value={formData.taxId}
            onChange={handleChange}
            disabled={!canEdit || loading}
            className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
      </div>

      {canEdit && (
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      )}

      {!canEdit && (
        <p className="text-sm text-muted-foreground italic">
          You don't have permission to edit organization settings. Contact an owner or manager.
        </p>
      )}
    </form>
  );
}
