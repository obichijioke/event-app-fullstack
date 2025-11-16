'use client';

import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '@/components/auth';
import {
  adminApiService,
  AdminVenueCatalogEntry,
  AdminVenueRecord,
} from '@/services/admin-api.service';

type CatalogFormState = {
  id?: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  timezone: string;
  capacityMin: string;
  capacityMax: string;
  latitude: string;
  longitude: string;
  address: {
    line1: string;
    line2?: string;
    city: string;
    region: string;
    postal: string;
    country: string;
  };
  tags: string;
};

const defaultCatalogForm: CatalogFormState = {
  name: '',
  slug: '',
  description: '',
  imageUrl: '',
  timezone: 'America/New_York',
  capacityMin: '',
  capacityMax: '',
  latitude: '',
  longitude: '',
  address: {
    line1: '',
    line2: '',
    city: '',
    region: '',
    postal: '',
    country: 'US',
  },
  tags: '',
};

export default function VenueManagement() {
  const { accessToken } = useAuth();
  const [activeTab, setActiveTab] = useState<'catalog' | 'venues'>('catalog');

  const [catalogEntries, setCatalogEntries] = useState<AdminVenueCatalogEntry[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [showCatalogModal, setShowCatalogModal] = useState(false);
  const [catalogForm, setCatalogForm] = useState<CatalogFormState>(defaultCatalogForm);
  const [editingCatalog, setEditingCatalog] = useState<AdminVenueCatalogEntry | null>(null);

  const [venues, setVenues] = useState<AdminVenueRecord[]>([]);
  const [venuesLoading, setVenuesLoading] = useState(false);
  const [venueSearch, setVenueSearch] = useState('');
  const [venueStatus, setVenueStatus] = useState<'active' | 'archived' | 'all'>('active');

  useEffect(() => {
    if (!accessToken) return;
    loadCatalog();
    loadVenues();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  const loadCatalog = async () => {
    if (!accessToken) return;
    try {
      setCatalogLoading(true);
      const response = await adminApiService.listVenueCatalog(accessToken, {
        search: catalogSearch || undefined,
        limit: 50,
      });
      if (response.success) {
        setCatalogEntries(response.data);
      }
    } catch (error) {
      console.error('Failed to load catalog venues', error);
      toast.error('Failed to load catalog venues');
    } finally {
      setCatalogLoading(false);
    }
  };

  const loadVenues = async () => {
    if (!accessToken) return;
    try {
      setVenuesLoading(true);
      const response = await adminApiService.getVenues(accessToken, {
        search: venueSearch || undefined,
        status: venueStatus,
        limit: 50,
      });
      if (response.success) {
        setVenues(response.data);
      }
    } catch (error) {
      console.error('Failed to load venues', error);
      toast.error('Failed to load venues');
    } finally {
      setVenuesLoading(false);
    }
  };

  const openCatalogModal = (entry?: AdminVenueCatalogEntry) => {
    if (entry) {
      setEditingCatalog(entry);
      setCatalogForm({
        id: entry.id,
        name: entry.name,
        slug: entry.slug ?? '',
        description: entry.description ?? '',
        imageUrl: entry.imageUrl ?? '',
        timezone: entry.timezone,
        capacityMin: entry.capacityMin?.toString() ?? '',
        capacityMax: entry.capacityMax?.toString() ?? '',
        latitude: entry.latitude?.toString() ?? '',
        longitude: entry.longitude?.toString() ?? '',
        address: {
          line1: (entry.address?.line1 as string) ?? '',
          line2: (entry.address?.line2 as string) ?? '',
          city: (entry.address?.city as string) ?? '',
          region: (entry.address?.region as string) ?? '',
          postal: (entry.address?.postal as string) ?? '',
          country: (entry.address?.country as string) ?? 'US',
        },
        tags: entry.tags.join(', '),
      });
    } else {
      setEditingCatalog(null);
      setCatalogForm(defaultCatalogForm);
    }
    setShowCatalogModal(true);
  };

  const closeCatalogModal = () => {
    setShowCatalogModal(false);
    setEditingCatalog(null);
    setCatalogForm(defaultCatalogForm);
  };

  const handleCatalogSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!accessToken) return;

    const payload = {
      name: catalogForm.name,
      slug: catalogForm.slug || undefined,
      description: catalogForm.description || undefined,
      imageUrl: catalogForm.imageUrl || undefined,
      timezone: catalogForm.timezone,
      capacityMin: catalogForm.capacityMin ? Number(catalogForm.capacityMin) : undefined,
      capacityMax: catalogForm.capacityMax ? Number(catalogForm.capacityMax) : undefined,
      latitude: catalogForm.latitude ? Number(catalogForm.latitude) : undefined,
      longitude: catalogForm.longitude ? Number(catalogForm.longitude) : undefined,
      address: catalogForm.address,
      tags: catalogForm.tags
        ? catalogForm.tags
            .split(',')
            .map(tag => tag.trim())
            .filter(Boolean)
        : [],
    };

    try {
      if (editingCatalog) {
        await adminApiService.updateVenueCatalog(accessToken, editingCatalog.id, payload);
        toast.success('Catalog venue updated');
      } else {
        await adminApiService.createVenueCatalog(accessToken, payload);
        toast.success('Catalog venue created');
      }
      closeCatalogModal();
      loadCatalog();
    } catch (error: any) {
      console.error('Failed to save catalog venue', error);
      toast.error(error?.response?.data?.message || 'Failed to save catalog venue');
    }
  };

  const handleDeleteCatalog = async (entry: AdminVenueCatalogEntry) => {
    if (!accessToken) return;
    if (!confirm(`Delete catalog venue "${entry.name}"?`)) {
      return;
    }
    try {
      await adminApiService.deleteVenueCatalog(accessToken, entry.id);
      toast.success('Catalog venue deleted');
      loadCatalog();
    } catch (error: any) {
      console.error('Failed to delete catalog venue', error);
      toast.error(error?.response?.data?.message || 'Failed to delete catalog venue');
    }
  };

  const handleArchiveVenue = async (venue: AdminVenueRecord) => {
    if (!accessToken) return;
    if (!confirm(`Archive venue "${venue.name}"?`)) return;
    try {
      await adminApiService.archiveVenue(accessToken, venue.id);
      toast.success('Venue archived');
      loadVenues();
    } catch (error: any) {
      console.error('Failed to archive venue', error);
      toast.error(error?.response?.data?.message || 'Failed to archive venue');
    }
  };

  const handleRestoreVenue = async (venue: AdminVenueRecord) => {
    if (!accessToken) return;
    try {
      await adminApiService.restoreVenue(accessToken, venue.id);
      toast.success('Venue restored');
      loadVenues();
    } catch (error: any) {
      console.error('Failed to restore venue', error);
      toast.error(error?.response?.data?.message || 'Failed to restore venue');
    }
  };

  const catalogEmpty = !catalogLoading && catalogEntries.length === 0;
  const venuesEmpty = !venuesLoading && venues.length === 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-3">
        <button
          className={`rounded-md px-4 py-2 text-sm font-medium ${
            activeTab === 'catalog'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-foreground'
          }`}
          onClick={() => setActiveTab('catalog')}
        >
          Catalog
        </button>
        <button
          className={`rounded-md px-4 py-2 text-sm font-medium ${
            activeTab === 'venues'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-foreground'
          }`}
          onClick={() => setActiveTab('venues')}
        >
          Venues
        </button>
      </div>

      {activeTab === 'catalog' ? (
        <section className="space-y-6 rounded-xl border border-border bg-card p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold">Venue Catalog</h2>
              <p className="text-sm text-muted-foreground">
                Manage shared venues that organizers can adopt.
              </p>
            </div>
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <input
                type="text"
                value={catalogSearch}
                onChange={(event) => setCatalogSearch(event.target.value)}
                placeholder="Search catalog..."
                className="rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <div className="flex gap-2">
                <button
                  onClick={loadCatalog}
                  className="rounded-md border border-border px-4 py-2 text-sm"
                >
                  Refresh
                </button>
                <button
                  onClick={() => openCatalogModal()}
                  className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
                >
                  Add Catalog Venue
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted/60">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Name
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Location
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Timezone
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Tags
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-card">
                {catalogLoading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-sm text-muted-foreground">
                      Loading catalog venues...
                    </td>
                  </tr>
                ) : catalogEmpty ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-sm text-muted-foreground">
                      No catalog venues found
                    </td>
                  </tr>
                ) : (
                  catalogEntries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-muted/40">
                      <td className="px-4 py-3 text-sm font-medium">{entry.name}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {formatLocation(entry.address)}
                      </td>
                      <td className="px-4 py-3 text-sm">{entry.timezone}</td>
                      <td className="px-4 py-3 text-sm">
                        {entry.tags.length ? entry.tags.join(', ') : '—'}
                      </td>
                      <td className="px-4 py-3 text-right text-sm">
                        <button
                          className="text-primary hover:underline"
                          onClick={() => openCatalogModal(entry)}
                        >
                          Edit
                        </button>
                        <button
                          className="ml-4 text-red-600 hover:underline"
                          onClick={() => handleDeleteCatalog(entry)}
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
        </section>
      ) : (
        <section className="space-y-6 rounded-xl border border-border bg-card p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold">Org Venues</h2>
              <p className="text-sm text-muted-foreground">
                Review venues created by organizers and take action when necessary.
              </p>
            </div>
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <input
                type="text"
                value={venueSearch}
                onChange={(event) => setVenueSearch(event.target.value)}
                placeholder="Search by venue or org..."
                className="rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <div className="flex gap-2">
                <select
                  value={venueStatus}
                  onChange={(event) =>
                    setVenueStatus(event.target.value as 'active' | 'archived' | 'all')
                  }
                  className="rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="active">Active</option>
                  <option value="archived">Archived</option>
                  <option value="all">All</option>
                </select>
                <button
                  onClick={loadVenues}
                  className="rounded-md border border-border px-4 py-2 text-sm"
                >
                  Refresh
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted/60">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Venue
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Organization
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Catalog
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Events
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Seatmaps
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Status
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-card">
                {venuesLoading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-6 text-center text-sm text-muted-foreground">
                      Loading venues...
                    </td>
                  </tr>
                ) : venuesEmpty ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-6 text-center text-sm text-muted-foreground">
                      No venues found
                    </td>
                  </tr>
                ) : (
                  venues.map((venue) => (
                    <tr key={venue.id} className="hover:bg-muted/40">
                      <td className="px-4 py-3 text-sm font-medium">
                        <div>{venue.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatAddressLine(venue.address)}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {venue.organization?.name || '—'}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {venue.catalogVenue ? venue.catalogVenue.name : '—'}
                      </td>
                      <td className="px-4 py-3 text-sm">{venue.eventCount}</td>
                      <td className="px-4 py-3 text-sm">{venue.seatmapCount}</td>
                      <td className="px-4 py-3 text-sm capitalize">{venue.status}</td>
                      <td className="px-4 py-3 text-right text-sm">
                        {venue.status === 'archived' ? (
                          <button
                            onClick={() => handleRestoreVenue(venue)}
                            className="text-primary hover:underline"
                          >
                            Restore
                          </button>
                        ) : (
                          <button
                            onClick={() => handleArchiveVenue(venue)}
                            className="text-red-600 hover:underline"
                          >
                            Archive
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {showCatalogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-3xl rounded-lg border border-border bg-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold">
                {editingCatalog ? 'Edit Catalog Venue' : 'Create Catalog Venue'}
              </h3>
              <button onClick={closeCatalogModal} className="text-sm text-muted-foreground">
                Close
              </button>
            </div>

            <form className="grid gap-4 md:grid-cols-2" onSubmit={handleCatalogSubmit}>
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium">Name *</label>
                <input
                  type="text"
                  value={catalogForm.name}
                  onChange={(e) =>
                    setCatalogForm((prev) => ({
                      ...prev,
                      name: e.target.value,
                      slug: editingCatalog ? prev.slug : slugify(e.target.value),
                    }))
                  }
                  className="w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Slug</label>
                <input
                  type="text"
                  value={catalogForm.slug}
                  onChange={(e) =>
                    setCatalogForm((prev) => ({
                      ...prev,
                      slug: e.target.value,
                    }))
                  }
                  className="w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="lagos-arena"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Timezone *</label>
                <input
                  type="text"
                  value={catalogForm.timezone}
                  onChange={(e) =>
                    setCatalogForm((prev) => ({
                      ...prev,
                      timezone: e.target.value,
                    }))
                  }
                  className="w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium">Description</label>
                <textarea
                  value={catalogForm.description}
                  onChange={(e) =>
                    setCatalogForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  className="w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  rows={2}
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium">Image URL</label>
                <input
                  type="text"
                  value={catalogForm.imageUrl}
                  onChange={(e) =>
                    setCatalogForm((prev) => ({
                      ...prev,
                      imageUrl: e.target.value,
                    }))
                  }
                  placeholder="https://images.example.com/venue.jpg"
                  className="w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Capacity Min</label>
                <input
                  type="number"
                  value={catalogForm.capacityMin}
                  onChange={(e) =>
                    setCatalogForm((prev) => ({
                      ...prev,
                      capacityMin: e.target.value,
                    }))
                  }
                  className="w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Capacity Max</label>
                <input
                  type="number"
                  value={catalogForm.capacityMax}
                  onChange={(e) =>
                    setCatalogForm((prev) => ({
                      ...prev,
                      capacityMax: e.target.value,
                    }))
                  }
                  className="w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Latitude</label>
                <input
                  type="text"
                  value={catalogForm.latitude}
                  onChange={(e) =>
                    setCatalogForm((prev) => ({
                      ...prev,
                      latitude: e.target.value,
                    }))
                  }
                  className="w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Longitude</label>
                <input
                  type="text"
                  value={catalogForm.longitude}
                  onChange={(e) =>
                    setCatalogForm((prev) => ({
                      ...prev,
                      longitude: e.target.value,
                    }))
                  }
                  className="w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="md:col-span-2 grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium">Address Line 1 *</label>
                  <input
                    type="text"
                    value={catalogForm.address.line1}
                    onChange={(e) =>
                      setCatalogForm((prev) => ({
                        ...prev,
                        address: { ...prev.address, line1: e.target.value },
                      }))
                    }
                    required
                    className="w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Address Line 2</label>
                  <input
                    type="text"
                    value={catalogForm.address.line2 || ''}
                    onChange={(e) =>
                      setCatalogForm((prev) => ({
                        ...prev,
                        address: { ...prev.address, line2: e.target.value },
                      }))
                    }
                    className="w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">City *</label>
                  <input
                    type="text"
                    value={catalogForm.address.city}
                    onChange={(e) =>
                      setCatalogForm((prev) => ({
                        ...prev,
                        address: { ...prev.address, city: e.target.value },
                      }))
                    }
                    required
                    className="w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Region *</label>
                  <input
                    type="text"
                    value={catalogForm.address.region}
                    onChange={(e) =>
                      setCatalogForm((prev) => ({
                        ...prev,
                        address: { ...prev.address, region: e.target.value },
                      }))
                    }
                    required
                    className="w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Postal Code *</label>
                  <input
                    type="text"
                    value={catalogForm.address.postal}
                    onChange={(e) =>
                      setCatalogForm((prev) => ({
                        ...prev,
                        address: { ...prev.address, postal: e.target.value },
                      }))
                    }
                    required
                    className="w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Country *</label>
                  <input
                    type="text"
                    value={catalogForm.address.country}
                    onChange={(e) =>
                      setCatalogForm((prev) => ({
                        ...prev,
                        address: { ...prev.address, country: e.target.value },
                      }))
                    }
                    required
                    className="w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium">Tags</label>
                <input
                  type="text"
                  value={catalogForm.tags}
                  onChange={(e) =>
                    setCatalogForm((prev) => ({
                      ...prev,
                      tags: e.target.value,
                    }))
                  }
                  placeholder="arena, outdoor"
                  className="w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="md:col-span-2 flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeCatalogModal}
                  className="rounded-md border border-border px-4 py-2 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
                >
                  {editingCatalog ? 'Update Venue' : 'Create Venue'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function formatLocation(address: AdminVenueCatalogEntry['address']) {
  const parts: string[] = [];
  if (address?.city) parts.push(address.city);
  if (address?.region) parts.push(address.region);
  if (address?.country) parts.push(address.country);
  return parts.join(', ') || '—';
}

function formatAddressLine(address: Record<string, unknown>) {
  const line1 = typeof address?.line1 === 'string' ? address.line1 : null;
  const city = typeof address?.city === 'string' ? address.city : null;
  const country = typeof address?.country === 'string' ? address.country : null;
  return [line1, city, country].filter(Boolean).join(', ');
}
