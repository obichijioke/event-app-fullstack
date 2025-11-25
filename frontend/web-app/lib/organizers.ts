
import { API_BASE_URL } from './config';
import { EventSummary } from './homepage';

export interface Organizer {
  id: string;
  name: string;
  legalName?: string | null;
  website?: string | null;
  country?: string | null;
  supportEmail?: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    events?: number;
    followers?: number;
  };
}

export interface OrganizerWithEvents extends Organizer {
  events: EventSummary[];
  followerCount: number;
  eventCount: number;
}

export interface OrganizerSummary {
  id: string;
  name: string;
  website?: string | null;
  country?: string | null;
  followerCount: number;
  eventCount: number;
  upcomingEvents: Array<{
    id: string;
    title: string;
    startAt: string;
  }>;
}

export interface OrganizerDetail {
  id: string;
  name: string;
  website?: string | null;
  country?: string | null;
  followerCount: number;
  eventCount: number;
  upcomingEvents: Array<{
    id: string;
    title: string;
    startAt: string;
    endAt: string;
    coverImageUrl?: string | null;
    venue: {
      name: string;
      address: Record<string, unknown> | null;
    } | null;
  }>;
}

/**
 * Fetch all public organizers (organizations)
 * Uses the dedicated public organizers endpoint
 */
export async function fetchOrganizers(): Promise<OrganizerSummary[]> {
  try {
    const url = new URL('/api/organizers', API_BASE_URL);

    const response = await fetch(url.toString(), {
      next: { revalidate: 60 },
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Organizers API failed with status ${response.status}`);
    }

    const data = (await response.json()) as OrganizerSummary[];
    return data;
  } catch (error) {
    console.error('[organizers] Failed to fetch organizers', error);
    return [];
  }
}

/**
 * Fetch a single organizer by ID with full details including upcoming events
 * Uses the dedicated public organizers endpoint
 */
export async function fetchOrganizerById(
  id: string,
): Promise<OrganizerDetail | null> {
  try {
    const url = new URL(`/api/organizers/${id}`, API_BASE_URL);

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
      throw new Error(`Organizer API failed with status ${response.status}`);
    }

    const data = (await response.json()) as OrganizerDetail;
    return data;
  } catch (error) {
    console.error(`[organizers] Failed to fetch organizer ${id}`, error);
    return null;
  }
}

/**
 * Search organizers by name
 */
export function searchOrganizers(
  organizers: OrganizerSummary[],
  query: string,
): OrganizerSummary[] {
  const lowercaseQuery = query.toLowerCase().trim();
  if (!lowercaseQuery) {
    return organizers;
  }

  return organizers.filter((org) =>
    org.name.toLowerCase().includes(lowercaseQuery),
  );
}

/**
 * Sort organizers by different criteria
 */
export function sortOrganizers(
  organizers: OrganizerSummary[],
  sortBy: 'name' | 'followers' | 'events' = 'name',
): OrganizerSummary[] {
  const sorted = [...organizers];

  switch (sortBy) {
    case 'name':
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    case 'followers':
      return sorted.sort((a, b) => b.followerCount - a.followerCount);
    case 'events':
      return sorted.sort((a, b) => b.eventCount - a.eventCount);
    default:
      return sorted;
  }
}

/**
 * Filter organizers by country
 */
export function filterOrganizersByCountry(
  organizers: OrganizerSummary[],
  country?: string,
): OrganizerSummary[] {
  if (!country) {
    return organizers;
  }

  return organizers.filter(
    (org) => org.country?.toLowerCase() === country.toLowerCase(),
  );
}
