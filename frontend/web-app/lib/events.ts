
import { API_BASE_URL } from './config';
import {
  EventSummary,
  EventVenueSummary,
  CategorySummary,
  EventPriceSummary,
} from './homepage';

export interface BrowseEventsQuery {
  search?: string;
  category?: string;
  upcoming?: boolean;
  following?: boolean;
}

export interface PublicEvent {
  id: string;
  title: string;
  descriptionMd?: string | null;
  coverImageUrl?: string | null;
  startAt: string;
  endAt: string;
  doorTime?: string | null;
  categoryId?: string | null;
  venueId?: string | null;
  seatmapId?: string | null;
  ageRestriction?: string | null;
  status: string;
  visibility: string;
  org: {
    id: string;
    name: string;
    website?: string | null;
  };
  venue?: {
    id: string;
    name: string;
    address?: Record<string, unknown> | null;
    timezone?: string | null;
    latitude?: number | null;
    longitude?: number | null;
  } | null;
  category?: {
    id: string;
    name: string;
    slug?: string | null;
  } | null;
  assets?: Array<{
    id: string;
    url: string;
    kind: string;
    altText?: string | null;
  }>;
  ticketTypes?: Array<{
    id: string;
    name: string;
    priceCents: bigint | number;
    feeCents: bigint | number;
    currency: string;
    kind: string;
    capacity?: number | null;
    status: string;
    salesStart?: string | null;
    salesEnd?: string | null;
  }>;
  policies?: {
    id?: string;
    refundPolicy?: string | null;
    transferAllowed?: boolean;
    resaleAllowed?: boolean;
    transferCutoff?: string | null;
  } | null;
  promoCodes?: Array<{
    id: string;
    code: string;
    kind: string;
    percentOff?: number | null;
    amountOffCents?: bigint | number | null;
    currency?: string | null;
    startsAt: string;
    endsAt: string;
  }>;
  seatmap?: {
    id: string;
    name: string;
  } | null;
  eventSeatmaps?: Array<{
    id: string;
    seatmapId: string;
  }>;
  _count?: {
    ticketTypes?: number;
    orders?: number;
    tickets?: number;
  };
  fees?: {
    platform: {
      percent: number;
      fixedCents: number;
    } | null;
    processing: {
      percent: number;
      fixedCents: number;
    } | null;
  };
}

export async function fetchEvents(
  query: BrowseEventsQuery = {},
): Promise<EventSummary[]> {
  try {
    const url = new URL('/api/events', API_BASE_URL);
    if (query.search) {
      url.searchParams.set('search', query.search);
    }
    if (query.category) {
      url.searchParams.set('categoryId', query.category);
    }
    if (query.upcoming) {
      url.searchParams.set('upcoming', 'true');
    }
    if (query.following) {
      url.searchParams.set('following', 'true');
    }

    const response = await fetch(url.toString(), {
      next: { revalidate: 60 },
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Events API failed with status ${response.status}`);
    }

    const data = (await response.json()) as PublicEvent[];
    return data.map(transformEvent);
  } catch (error) {
    console.error('[events] Failed to fetch events', error);
    return [];
  }
}

export interface EventDetail extends PublicEvent {
  descriptionMd?: string | null;
  occurrences: Array<{
    id: string;
    startsAt: string;
    endsAt: string;
    gateOpenAt?: string | null;
  }>;
  ticketTypes: Array<{
    id: string;
    name: string;
    kind: string;
    currency: string;
    priceCents: bigint | number;
    feeCents: bigint | number;
    capacity?: number | null;
    salesStart?: string | null;
    salesEnd?: string | null;
    status: string;
  }>;
  policies?: {
    refundPolicy?: string | null;
    transferAllowed?: boolean;
    resaleAllowed?: boolean;
    transferCutoff?: string | null;
  } | null;
  assets: Array<{
    id: string;
    url: string;
    kind: string;
    altText?: string | null;
  }>;
}

export async function fetchEventDetailData(eventId: string): Promise<EventDetailSummary> {
  const url = new URL(`/api/events/${eventId}`, API_BASE_URL);

  const response = await fetch(url.toString(), {
    next: { revalidate: 30 },
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (response.status === 404) {
    throw new Error('Event not found');
  }

  if (!response.ok) {
    throw new Error(`Event detail API failed with status ${response.status}`);
  }

  const event = (await response.json()) as EventDetail;
  return {
    summary: transformEvent(event),
    description: event.descriptionMd ?? '',
    occurrences: event.occurrences.map((occurrence) => ({
      id: occurrence.id,
      startsAt: occurrence.startsAt,
      endsAt: occurrence.endsAt,
      gateOpenAt: occurrence.gateOpenAt ?? null,
    })),
    tickets: event.ticketTypes.map((ticket) => ({
      ...ticket,
      priceCents: Number(ticket.priceCents),
      feeCents: Number(ticket.feeCents),
      capacity: ticket.capacity ?? null,
    })),
    policies: event.policies ?? null,
    assets: event.assets ?? [],
  };
}

export async function fetchEventById(eventId: string): Promise<{
  event: EventDetailSummary;
  related: EventSummary[];
}> {
  const [eventDetail, related] = await Promise.all([
    fetchEventDetailData(eventId),
    fetchEvents({ upcoming: true }),
  ]);

  const filteredRelated = related
    .filter((event) => event.id !== eventId)
    .slice(0, 4);

  return {
    event: eventDetail,
    related: filteredRelated,
  };
}

export interface EventDetailSummary {
  summary: EventSummary;
  description: string;
  occurrences: Array<{
    id: string;
    startsAt: string;
    endsAt: string;
    gateOpenAt: string | null;
  }>;
  tickets: EventDetail['ticketTypes'];
  policies: EventDetail['policies'];
  assets: EventDetail['assets'];
}

function transformEvent(event: PublicEvent): EventSummary {
  const venue = toVenueSummary(event);
  const category = toCategorySummary(event.category);
  const tags = buildTags(event, venue, category);

  return {
    id: event.id,
    title: event.title,
    startAt: event.startAt,
    endAt: event.endAt,
    doorTime: event.doorTime ?? null,
    coverImageUrl: event.coverImageUrl ?? null,
    ageRestriction: event.ageRestriction ?? null,
    organization: {
      id: event.org.id,
      name: event.org.name,
    },
    venue,
    category,
    pricing: derivePricing(event),
    tags,
    stats: {
      orderCount: event._count?.orders || 0,
      isLowInventory: calculateLowInventory(event),
    },
    seatmap: {
      hasSeatmap: Boolean(event.seatmapId || event.eventSeatmaps?.length),
      isSeated: event.ticketTypes?.some((t) => t.kind === 'SEATED') || false,
    },
    policies: event.policies
      ? {
          transferable: event.policies.transferAllowed ?? true,
          refundable: Boolean(event.policies.refundPolicy),
        }
      : {
          transferable: true,
          refundable: false,
        },
    promo:
      event.promoCodes && event.promoCodes.length > 0
        ? transformPromo(event.promoCodes[0])
        : undefined,
    assets: event.assets || [],
  };
}

function toVenueSummary(event: PublicEvent): EventVenueSummary | null {
  if (!event.venue) {
    return null;
  }

  const address = extractAddress(event.venue.address);

  return {
    id: event.venue.id,
    name: event.venue.name,
    city: address?.city ?? null,
    region: address?.region ?? null,
    country: address?.country ?? null,
    timezone: event.venue.timezone ?? null,
  };
}

function toCategorySummary(
  category?: PublicEvent['category'] | null,
): CategorySummary | null {
  if (!category) {
    return null;
  }

  return {
    id: category.id,
    name: category.name,
    slug: category.slug ?? category.id,
  };
}

function derivePricing(event: PublicEvent): EventPriceSummary | null {
  // Use actual ticket data if available
  if (event.ticketTypes && event.ticketTypes.length > 0) {
    const cheapestTicket = event.ticketTypes[0]; // Already sorted by priceCents asc
    const priceCents = Number(cheapestTicket.priceCents);
    const feeCents = Number(cheapestTicket.feeCents || 0);

    return {
      currency: cheapestTicket.currency,
      startingAt: priceCents / 100,
      fee: feeCents / 100,
      label: `From ${formatCurrency(priceCents, cheapestTicket.currency)}`,
    };
  }

  // Fallback to count if ticket data not available
  if (!event._count?.ticketTypes) {
    return null;
  }

  return {
    currency: 'NGN',
    startingAt: 0,
    label: `${event._count.ticketTypes} ticket type${event._count.ticketTypes > 1 ? 's' : ''}`,
  };
}

function formatCurrency(cents: number, currency: string): string {
  const amount = cents / 100;

  if (currency === 'NGN') {
    return `₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  }

  // Fallback for other currencies
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function buildTags(
  event: PublicEvent,
  venue: EventVenueSummary | null,
  category: CategorySummary | null,
) {
  const tags = new Set<string>();
  if (category?.name) {
    tags.add(category.name);
  }
  if (venue?.city) {
    tags.add(venue.city);
  } else if (venue?.region) {
    tags.add(venue.region);
  }
  if (event.status) {
    tags.add(event.status);
  }
  return Array.from(tags).slice(0, 3);
}

function extractAddress(value: Record<string, unknown> | null | undefined) {
  if (!value) {
    return null;
  }
  return {
    city: typeof value.city === 'string' ? value.city : null,
    region: typeof value.region === 'string' ? value.region : null,
    country: typeof value.country === 'string' ? value.country : null,
  };
}

function calculateLowInventory(event: PublicEvent): boolean {
  // If no ticket types, not low inventory
  if (!event.ticketTypes || event.ticketTypes.length === 0) {
    return false;
  }

  // Calculate total capacity across all ticket types
  const totalCapacity = event.ticketTypes.reduce((sum, ticket) => {
    return sum + (ticket.capacity || 0);
  }, 0);

  // If no capacity set, can't determine inventory
  if (totalCapacity === 0) {
    return false;
  }

  // Get sold count from _count.tickets
  const soldCount = event._count?.tickets || 0;
  const available = totalCapacity - soldCount;

  // Low inventory if less than 10% remaining and at least 1 available
  const threshold = totalCapacity * 0.1;
  return available > 0 && available < threshold;
}

function transformPromo(promo: NonNullable<PublicEvent['promoCodes']>[0]) {
  let discountText = '';

  if (promo.percentOff) {
    discountText = `${promo.percentOff}% off`;
  } else if (promo.amountOffCents) {
    const amount = Number(promo.amountOffCents) / 100;
    const currency = promo.currency || 'NGN';
    discountText = `${formatCurrency(Number(promo.amountOffCents), currency)} off`;
  }

  return {
    id: promo.id,
    code: promo.code,
    kind: promo.kind,
    label: discountText,
    endsAt: promo.endsAt,
  };
}

// ============================
// Review API Functions
// ============================

export interface EventReview {
  id: string;
  eventId: string;
  userId: string;
  rating: number;
  comment?: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export interface ReviewsSummary {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

export interface CreateReviewInput {
  rating: number;
  comment?: string;
}

export interface UpdateReviewInput {
  rating?: number;
  comment?: string;
}

/**
 * Fetch reviews for a specific event
 */
export async function fetchEventReviews(
  eventId: string,
  options?: {
    page?: number;
    limit?: number;
    token?: string;
  }
): Promise<{ data: EventReview[]; total: number; page: number; limit: number }> {
  try {
    const url = new URL(`/api/events/${eventId}/reviews`, API_BASE_URL);

    if (options?.page) {
      url.searchParams.set('page', options.page.toString());
    }
    if (options?.limit) {
      url.searchParams.set('limit', options.limit.toString());
    }

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (options?.token) {
      headers['Authorization'] = `Bearer ${options.token}`;
    }

    const response = await fetch(url.toString(), {
      headers,
      next: { revalidate: 30 },
    });

    if (!response.ok) {
      throw new Error(`Reviews API failed with status ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('[reviews] Failed to fetch event reviews', error);
    return { data: [], total: 0, page: 1, limit: 10 };
  }
}

/**
 * Fetch reviews summary for an event
 */
export async function fetchEventReviewsSummary(
  eventId: string
): Promise<ReviewsSummary | null> {
  try {
    const url = new URL(`/api/events/${eventId}/reviews/summary`, API_BASE_URL);

    const response = await fetch(url.toString(), {
      headers: {
        'Content-Type': 'application/json',
      },
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      throw new Error(`Reviews summary API failed with status ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('[reviews] Failed to fetch event reviews summary', error);
    return null;
  }
}

/**
 * Fetch reviews summary for an organizer
 */
export async function fetchOrganizerReviewsSummary(
  organizerId: string
): Promise<ReviewsSummary | null> {
  try {
    const url = new URL(`/api/organizations/${organizerId}/reviews/summary`, API_BASE_URL);

    const response = await fetch(url.toString(), {
      headers: {
        'Content-Type': 'application/json',
      },
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      throw new Error(`Organizer reviews summary API failed with status ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('[reviews] Failed to fetch organizer reviews summary', error);
    return null;
  }
}

/**
 * Create a new event review (requires authentication)
 */
export async function createEventReview(
  eventId: string,
  input: CreateReviewInput,
  token: string
): Promise<EventReview | null> {
  try {
    const url = new URL(`/api/events/${eventId}/reviews`, API_BASE_URL);

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create review');
    }

    return await response.json();
  } catch (error) {
    console.error('[reviews] Failed to create review', error);
    throw error;
  }
}

/**
 * Update an existing review (requires authentication)
 */
export async function updateEventReview(
  eventId: string,
  reviewId: string,
  input: UpdateReviewInput,
  token: string
): Promise<EventReview | null> {
  try {
    const url = new URL(`/api/events/${eventId}/reviews/${reviewId}`, API_BASE_URL);

    const response = await fetch(url.toString(), {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update review');
    }

    return await response.json();
  } catch (error) {
    console.error('[reviews] Failed to update review', error);
    throw error;
  }
}

/**
 * Delete a review (requires authentication)
 */
export async function deleteEventReview(
  eventId: string,
  reviewId: string,
  token: string
): Promise<void> {
  try {
    const url = new URL(`/api/events/${eventId}/reviews/${reviewId}`, API_BASE_URL);

    const response = await fetch(url.toString(), {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete review');
    }
  } catch (error) {
    console.error('[reviews] Failed to delete review', error);
    throw error;
  }
}

// ============================
// Announcements API Functions
// ============================

export interface EventAnnouncement {
  id: string;
  eventId: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'important' | 'urgent';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export async function fetchEventAnnouncements(
  eventId: string
): Promise<EventAnnouncement[]> {
  try {
    const url = new URL(`/api/events/${eventId}/announcements`, API_BASE_URL);

    const response = await fetch(url.toString(), {
      headers: {
        'Content-Type': 'application/json',
      },
      next: { revalidate: 30 },
    });

    if (!response.ok) {
      throw new Error(`Announcements API failed with status ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('[announcements] Failed to fetch announcements', error);
    return [];
  }
}

// ============================
// FAQs API Functions
// ============================

export interface EventFAQItem {
  id: string;
  eventId: string;
  question: string;
  answer: string;
  sortOrder: number;
  isActive: boolean;
  viewCount?: number;
  helpfulCount?: number;
  createdAt: string;
  updatedAt: string;
}

export async function fetchEventFAQs(eventId: string): Promise<EventFAQItem[]> {
  try {
    const url = new URL(`/api/events/${eventId}/faqs`, API_BASE_URL);

    const response = await fetch(url.toString(), {
      headers: {
        'Content-Type': 'application/json',
      },
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      throw new Error(`FAQs API failed with status ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('[faqs] Failed to fetch FAQs', error);
    return [];
  }
}

// ============================
// Announcement Tracking & Dismissals
// ============================

export async function trackAnnouncementView(
  announcementId: string,
  token: string
): Promise<void> {
  try {
    const url = new URL(`/api/events/_/announcements/${announcementId}/view`, API_BASE_URL);
    await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
  } catch (error) {
    console.error('[announcements] Failed to track view', error);
  }
}

export async function dismissAnnouncement(
  announcementId: string,
  token: string
): Promise<void> {
  try {
    const url = new URL(`/api/events/_/announcements/${announcementId}/dismiss`, API_BASE_URL);
    await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
  } catch (error) {
    console.error('[announcements] Failed to dismiss', error);
  }
}

export async function getDismissedAnnouncements(
  eventId: string,
  token: string
): Promise<string[]> {
  try {
    const url = new URL(`/api/events/${eventId}/announcements/dismissed`, API_BASE_URL);
    const response = await fetch(url.toString(), {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return [];
    }

    return await response.json();
  } catch (error) {
    console.error('[announcements] Failed to get dismissed', error);
    return [];
  }
}

// ============================
// FAQ Tracking & Search
// ============================

export async function searchFAQs(eventId: string, query: string): Promise<EventFAQItem[]> {
  try {
    const url = new URL(`/api/events/${eventId}/faqs/search`, API_BASE_URL);
    url.searchParams.set('q', query);

    const response = await fetch(url.toString(), {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return [];
    }

    return await response.json();
  } catch (error) {
    console.error('[faqs] Failed to search', error);
    return [];
  }
}

export async function trackFAQView(faqId: string): Promise<void> {
  try {
    const url = new URL(`/api/events/_/faqs/${faqId}/view`, API_BASE_URL);
    await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('[faqs] Failed to track view', error);
  }
}

export async function markFAQHelpful(faqId: string): Promise<void> {
  try {
    const url = new URL(`/api/events/_/faqs/${faqId}/helpful`, API_BASE_URL);
    await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('[faqs] Failed to mark helpful', error);
  }
}
