import 'server-only';

import { API_BASE_URL } from './config';

export interface VenueSummary {
  id: string;
  name: string;
  address: Record<string, unknown>;
  timezone: string;
  capacity: number | null;
  latitude: number | null;
  longitude: number | null;
  imageUrl?: string | null;
  eventCount: number;
}

export interface VenueDetail {
  id: string;
  name: string;
  address: Record<string, unknown>;
  timezone: string;
  capacity: number | null;
  latitude: number | null;
  longitude: number | null;
  eventCount: number;
  upcomingEvents: Array<{
    id: string;
    title: string;
    startAt: string;
    endAt: string;
    coverImageUrl?: string | null;
    organizer: {
      id: string;
      name: string;
    };
  }>;
}

/**
 * Fetch all public venues
 * Uses the dedicated public venues endpoint
 */
export async function fetchVenues(): Promise<VenueSummary[]> {
  try {
    const url = new URL('/api/venues-public', API_BASE_URL);

    const response = await fetch(url.toString(), {
      next: { revalidate: 60 },
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Venues API failed with status ${response.status}`);
    }

    const data = (await response.json()) as VenueSummary[];
    return data;
  } catch (error) {
    console.error('[venues] Failed to fetch venues', error);
    return [];
  }
}

/**
 * Fetch a single venue by ID with full details including upcoming events
 * Uses the dedicated public venues endpoint
 */
export async function fetchVenueById(
  id: string,
): Promise<VenueDetail | null> {
  try {
    const url = new URL(`/api/venues-public/${id}`, API_BASE_URL);

    const response = await fetch(url.toString(), {
      next: { revalidate: 60 },
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error(`Venue API failed with status ${response.status}`);
    }

    const data = (await response.json()) as VenueDetail;
    return data;
  } catch (error) {
    console.error(`[venues] Failed to fetch venue ${id}`, error);
    return null;
  }
}

/**
 * Extract city and country from venue address
 */
export function getVenueLocation(address: Record<string, unknown>): string {
  const parts: string[] = [];

  if (typeof address.city === 'string') {
    parts.push(address.city);
  }

  if (typeof address.country === 'string') {
    parts.push(address.country);
  }

  return parts.join(', ') || 'Location TBA';
}

/**
 * Search venues by name or city
 */
export function searchVenues(
  venues: VenueSummary[],
  query: string,
): VenueSummary[] {
  const lowercaseQuery = query.toLowerCase().trim();
  if (!lowercaseQuery) {
    return venues;
  }

  return venues.filter((venue) => {
    const nameMatch = venue.name.toLowerCase().includes(lowercaseQuery);
    const cityMatch =
      typeof venue.address.city === 'string' &&
      venue.address.city.toLowerCase().includes(lowercaseQuery);
    return nameMatch || cityMatch;
  });
}

/**
 * Sort venues by different criteria
 */
export function sortVenues(
  venues: VenueSummary[],
  sortBy: 'name' | 'capacity' | 'events' = 'name',
): VenueSummary[] {
  const sorted = [...venues];

  switch (sortBy) {
    case 'name':
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    case 'capacity':
      return sorted.sort((a, b) => {
        const aCapacity = a.capacity ?? 0;
        const bCapacity = b.capacity ?? 0;
        return bCapacity - aCapacity;
      });
    case 'events':
      return sorted.sort((a, b) => b.eventCount - a.eventCount);
    default:
      return sorted;
  }
}

/**
 * Filter venues by city
 */
export function filterVenuesByCity(
  venues: VenueSummary[],
  city?: string,
): VenueSummary[] {
  if (!city) {
    return venues;
  }

  return venues.filter(
    (venue) =>
      typeof venue.address.city === 'string' &&
      venue.address.city.toLowerCase() === city.toLowerCase(),
  );
}
