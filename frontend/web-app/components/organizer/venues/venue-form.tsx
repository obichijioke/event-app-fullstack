'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useRequireOrganization } from '@/lib/hooks';
import { organizerApi } from '@/lib/api/organizer-api';
import {
  CreateVenueDto,
  UpdateVenueDto,
  Venue,
  VenueCatalogEntry,
} from '@/lib/types/organizer';
import { handleApiError, toInt, toFloat } from '@/lib/utils';
import { Loader2, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';

interface VenueFormProps {
  venue?: Venue;
  catalogVenue?: VenueCatalogEntry;
}

function deriveCatalogCapacity(catalog?: VenueCatalogEntry) {
  if (!catalog) {
    return '';
  }
  const capacity =
    catalog.capacityMax ?? catalog.capacityMin ?? undefined;
  return capacity ? capacity.toString() : '';
}

export function VenueForm({ venue, catalogVenue }: VenueFormProps) {
  const router = useRouter();
  const { currentOrganization, ensureOrganization } = useRequireOrganization();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: venue?.name || catalogVenue?.name || '',
    address: {
      line1: venue?.address.line1 || catalogVenue?.address.line1 || '',
      line2: venue?.address.line2 || catalogVenue?.address.line2 || '',
      city: venue?.address.city || catalogVenue?.address.city || '',
      region: venue?.address.region || catalogVenue?.address.region || '',
      postal: venue?.address.postal || catalogVenue?.address.postal || '',
      country: venue?.address.country || catalogVenue?.address.country || 'US',
    },
    timezone: venue?.timezone || catalogVenue?.timezone || 'America/New_York',
    capacity: venue?.capacity?.toString() || deriveCatalogCapacity(catalogVenue),
    latitude: venue?.latitude?.toString() || catalogVenue?.latitude?.toString() || '',
    longitude: venue?.longitude?.toString() || catalogVenue?.longitude?.toString() || '',
  });

  useEffect(() => {
    if (venue || !catalogVenue) {
      return;
    }
    setFormData({
      name: catalogVenue.name,
      address: {
        line1: catalogVenue.address.line1,
        line2: catalogVenue.address.line2 || '',
        city: catalogVenue.address.city,
        region: catalogVenue.address.region,
        postal: catalogVenue.address.postal,
        country: catalogVenue.address.country,
      },
      timezone: catalogVenue.timezone,
      capacity: deriveCatalogCapacity(catalogVenue),
      latitude: catalogVenue.latitude?.toString() || '',
      longitude: catalogVenue.longitude?.toString() || '',
    });
  }, [catalogVenue, venue]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const org = ensureOrganization();
    if (!org) {
      toast.error('Please select an organization');
      return;
    }

    try {
      setLoading(true);

      const addressData = {
        line1: formData.address.line1,
        line2: formData.address.line2 || undefined,
        city: formData.address.city,
        region: formData.address.region,
        postal: formData.address.postal,
        country: formData.address.country,
      };

      const commonData = {
        name: formData.name,
        address: addressData,
        timezone: formData.timezone,
        capacity: toInt(formData.capacity) || undefined,
        latitude: toFloat(formData.latitude) || undefined,
        longitude: toFloat(formData.longitude) || undefined,
        catalogVenueId: catalogVenue?.id,
      };

      if (venue) {
        const updateData: UpdateVenueDto = commonData;
        await organizerApi.venues.update(venue.id, updateData, org.id);
        toast.success('Venue updated successfully');
        router.push(`/organizer/venues/${venue.id}`);
      } else {
        const createData: CreateVenueDto = commonData as CreateVenueDto;
        const created = await organizerApi.venues.create(org.id, createData);
        toast.success('Venue created successfully');
        router.push(`/organizer/venues/${created.id}`);
      }
    } catch (error) {
      const message = handleApiError(error, 'Failed to save venue');
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    if (field.startsWith('address.')) {
      const addressField = field.split('.')[1];
      setFormData({
        ...formData,
        address: {
          ...formData.address,
          [addressField]: value,
        },
      });
    } else {
      setFormData({
        ...formData,
        [field]: value,
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {catalogVenue && (
        <div className="rounded-md border border-primary/30 bg-primary/5 p-4 text-sm">
          <p className="font-medium text-primary">
            Shared venue selected: {catalogVenue.name}
          </p>
          <p className="text-muted-foreground">
            Address, timezone, and map coordinates are locked to the catalog entry. Provide an
            internal display name or capacity override below.
          </p>
        </div>
      )}

      {/* Basic Information */}
      <div className="bg-card rounded-lg border p-6 space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Basic Information
        </h2>

        <div>
          <label className="block text-sm font-medium mb-2">
            Venue Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder={catalogVenue ? 'Internal display name (optional)' : 'Madison Square Garden'}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Capacity
            </label>
            <input
              type="number"
              min="1"
              value={formData.capacity}
              onChange={(e) => handleInputChange('capacity', e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="20000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Timezone <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={formData.timezone}
              onChange={(e) => handleInputChange('timezone', e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary disabled:cursor-not-allowed disabled:bg-muted"
              disabled={Boolean(catalogVenue)}
            >
              <option value="America/New_York">Eastern Time</option>
              <option value="America/Chicago">Central Time</option>
              <option value="America/Denver">Mountain Time</option>
              <option value="America/Los_Angeles">Pacific Time</option>
              <option value="America/Anchorage">Alaska Time</option>
              <option value="Pacific/Honolulu">Hawaii Time</option>
            </select>
          </div>
        </div>
      </div>

      {/* Address */}
      <div className="bg-card rounded-lg border p-6 space-y-4">
        <h2 className="text-xl font-semibold">Address</h2>

        <div>
          <label className="block text-sm font-medium mb-2">
            Street Address <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={formData.address.line1}
            onChange={(e) => handleInputChange('address.line1', e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary disabled:cursor-not-allowed disabled:bg-muted"
            disabled={Boolean(catalogVenue)}
            placeholder="4 Pennsylvania Plaza"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Address Line 2
          </label>
          <input
            type="text"
            value={formData.address.line2}
            onChange={(e) => handleInputChange('address.line2', e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary disabled:cursor-not-allowed disabled:bg-muted"
            disabled={Boolean(catalogVenue)}
            placeholder="Suite 100"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              City <span className="text-red-500">*</span>
            </label>
          <input
            type="text"
            required
            value={formData.address.city}
            onChange={(e) => handleInputChange('address.city', e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary disabled:cursor-not-allowed disabled:bg-muted"
            disabled={Boolean(catalogVenue)}
            placeholder="New York"
          />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              State/Region <span className="text-red-500">*</span>
            </label>
          <input
            type="text"
            required
            value={formData.address.region}
            onChange={(e) => handleInputChange('address.region', e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary disabled:cursor-not-allowed disabled:bg-muted"
            disabled={Boolean(catalogVenue)}
            placeholder="NY"
          />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Postal Code <span className="text-red-500">*</span>
            </label>
          <input
            type="text"
            required
            value={formData.address.postal}
            onChange={(e) => handleInputChange('address.postal', e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary disabled:cursor-not-allowed disabled:bg-muted"
            disabled={Boolean(catalogVenue)}
            placeholder="10001"
          />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Country <span className="text-red-500">*</span>
          </label>
        <select
          required
          value={formData.address.country}
          onChange={(e) => handleInputChange('address.country', e.target.value)}
          className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary disabled:cursor-not-allowed disabled:bg-muted"
          disabled={Boolean(catalogVenue)}
        >
            <option value="US">United States</option>
            <option value="CA">Canada</option>
            <option value="GB">United Kingdom</option>
            <option value="AU">Australia</option>
          </select>
        </div>
      </div>

      {/* Coordinates (Optional) */}
      <div className="bg-card rounded-lg border p-6 space-y-4">
        <h2 className="text-xl font-semibold">Coordinates (Optional)</h2>
        <p className="text-sm text-muted-foreground">
          Add GPS coordinates for map integration
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Latitude
            </label>
          <input
            type="number"
            step="any"
            value={formData.latitude}
            onChange={(e) => handleInputChange('latitude', e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary disabled:cursor-not-allowed disabled:bg-muted"
            disabled={Boolean(catalogVenue)}
            placeholder="40.750504"
          />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Longitude
            </label>
          <input
            type="number"
            step="any"
            value={formData.longitude}
            onChange={(e) => handleInputChange('longitude', e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary disabled:cursor-not-allowed disabled:bg-muted"
            disabled={Boolean(catalogVenue)}
            placeholder="-73.993439"
          />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {venue ? 'Update Venue' : 'Create Venue'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-3 border border-border rounded-md hover:bg-secondary transition"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
