import apiClient from './client';
import type {
  Event,
  Category,
  HomepageData,
  PaginatedResponse,
  EventAgenda,
  EventSpeaker,
  Review,
  TicketType,
} from '../types';

export interface EventFilters {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  status?: string;
  upcoming?: boolean;
  startDate?: string;
  endDate?: string;
  organizationId?: string;
  following?: boolean;
}

export interface NearbyFilters {
  latitude?: number;
  longitude?: number;
  city?: string;
  radius?: number; // km, default 50
  page?: number;
  limit?: number;
}

const normalizeDate = (value?: string | Date | null): string | undefined => {
  if (!value) return undefined;
  const parsed = new Date(value);
  return isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
};

const normalizeMeta = (
  meta: any,
  page = 1,
  limit = 20,
  fallbackTotal = 0
): PaginatedResponse<Event>['meta'] => {
  const total = meta?.total ?? meta?.count ?? fallbackTotal ?? 0;
  const limitValue = meta?.limit ?? limit ?? fallbackTotal ?? 0;
  const pageValue = meta?.page ?? page ?? 1;
  const totalPages =
    meta?.totalPages ??
    meta?.pages ??
    (limitValue ? Math.ceil(total / limitValue) : 1);

  return {
    total,
    page: pageValue,
    limit: limitValue,
    totalPages,
  };
};

const toNumber = (value: unknown): number | undefined => {
  if (value === null || value === undefined) return undefined;
  const num = Number(value);
  return Number.isFinite(num) ? num : undefined;
};

const mapTicketTypeFromApi = (ticket: any): TicketType => {
  const priceCents =
    toNumber(ticket?.priceCents) ??
    toNumber(ticket?.price_cents) ??
    (typeof ticket?.price === 'number' ? ticket.price * 100 : undefined);
  const price =
    priceCents !== undefined
      ? Math.max(priceCents, 0) / 100
      : toNumber(ticket?.price) ?? 0;

  const capacity =
    toNumber(ticket?.capacity) ??
    toNumber(ticket?.quantity) ??
    undefined;
  const sold = toNumber(ticket?._count?.tickets) ?? toNumber(ticket?.ticketsSold) ?? 0;
  const held = toNumber(ticket?._count?.holds) ?? 0;
  const availableExplicit = toNumber(ticket?.quantityAvailable);
  const available =
    availableExplicit !== undefined
      ? Math.max(availableExplicit, 0)
      : capacity !== undefined
        ? Math.max(capacity - sold - held, 0)
        : 9999; // no capacity info; assume available
  const maxPerOrderRaw =
    toNumber(ticket?.perOrderLimit) ??
    toNumber(ticket?.maxPerOrder) ??
    toNumber(ticket?.ticketType?.perOrderLimit);
  const maxPerOrder =
    maxPerOrderRaw && maxPerOrderRaw > 0
      ? maxPerOrderRaw
      : (available !== undefined ? Math.max(available, 1) : 10);

  return {
    id: ticket?.id ?? '',
    name: ticket?.name ?? 'Ticket',
    description: ticket?.description ?? undefined,
    type: ticket?.kind === 'SEATED' ? 'SEATED' : 'GA',
    price,
    currency: ticket?.currency ?? 'USD',
    quantity: capacity || available || 0,
    quantitySold: sold,
    quantityAvailable: available,
    maxPerOrder,
    minPerOrder: ticket?.minPerOrder ?? 1,
    saleStartDate:
      normalizeDate(ticket?.salesStart ?? ticket?.saleStartDate ?? ticket?.saleStart) ??
      undefined,
    saleEndDate:
      normalizeDate(ticket?.salesEnd ?? ticket?.saleEndDate ?? ticket?.saleEnd) ??
      undefined,
    isOnSale: ticket?.isOnSale ?? ticket?.status === 'active',
    eventId: ticket?.eventId ?? ticket?.event_id ?? '',
  };
};

export const mapEventFromApi = (raw: any): Event => {
  const startDate =
    normalizeDate(raw?.startAt) ??
    normalizeDate(raw?.start_at) ??
    normalizeDate(raw?.startDate) ??
    normalizeDate(raw?.start_date);
  const endDate =
    normalizeDate(raw?.endAt) ??
    normalizeDate(raw?.end_at) ??
    normalizeDate(raw?.endDate) ??
    normalizeDate(raw?.end_date);

  const ticketTypes = Array.isArray(raw?.ticketTypes)
    ? raw.ticketTypes.map(mapTicketTypeFromApi)
    : [];
  const totalCapacity = ticketTypes.length
    ? ticketTypes.reduce((sum, t) => sum + (t.quantity || 0), 0)
    : undefined;

  const pricePoints = ticketTypes.map((t) => t.price).filter((p) => typeof p === 'number');
  const minPrice = pricePoints.length ? Math.min(...pricePoints) : undefined;
  const maxPrice = pricePoints.length ? Math.max(...pricePoints) : undefined;
  const isFree =
    typeof raw?.isFree === 'boolean'
      ? raw.isFree
      : pricePoints.length > 0
        ? pricePoints.every((p) => p === 0)
        : false;

  const venueAddress = raw?.venue?.address || {};
  const organization = raw?.organization ?? raw?.org;

  return {
    id: raw?.id ?? '',
    title: raw?.title ?? '',
    slug: raw?.slug ?? raw?.id ?? '',
    description: raw?.descriptionMd ?? raw?.description ?? '',
    shortDescription: raw?.shortDescription ?? raw?.short_description ?? undefined,
    status: raw?.status ?? 'draft',
    visibility: raw?.visibility ?? 'public',
    startDate: startDate ?? '',
    endDate: endDate ?? '',
    timezone: raw?.timezone ?? raw?.venue?.timezone ?? 'UTC',
    venue: raw?.venue
      ? {
          id: raw?.venue?.id ?? '',
          name: raw?.venue?.name ?? '',
          address:
            venueAddress?.line1 ??
            venueAddress?.addressLine1 ??
            venueAddress?.address ??
            raw?.venue?.address ??
            '',
          city: venueAddress?.city ?? raw?.venue?.city ?? '',
          state: venueAddress?.region ?? venueAddress?.state ?? raw?.venue?.state ?? undefined,
          country: venueAddress?.country ?? raw?.venue?.country ?? '',
          postalCode:
            venueAddress?.postal ??
            venueAddress?.postalCode ??
            venueAddress?.zip ??
            raw?.venue?.postalCode ??
            undefined,
          latitude:
            raw?.venue?.latitude !== undefined ? Number(raw?.venue?.latitude) : undefined,
          longitude:
            raw?.venue?.longitude !== undefined ? Number(raw?.venue?.longitude) : undefined,
          capacity: raw?.venue?.capacity,
          description: raw?.venue?.description,
          imageUrl: raw?.venue?.imageUrl,
        }
      : undefined,
    venueId: raw?.venueId ?? raw?.venue_id ?? raw?.venue?.id,
    organization: organization
      ? {
          id: organization.id ?? '',
          name: organization.name ?? '',
          slug: organization.slug ?? '',
          description: organization.description,
          logoUrl: organization.logoUrl,
          websiteUrl: organization.website ?? organization.websiteUrl,
          verified: organization.verified ?? false,
          followerCount: organization.followerCount,
          eventCount: organization.eventCount,
        }
      : {
          id: raw?.orgId ?? raw?.organizationId ?? '',
          name: '',
          slug: '',
          verified: false,
        },
    organizationId:
      raw?.organizationId ??
      raw?.orgId ??
      raw?.organization_id ??
      raw?.org_id ??
      organization?.id ??
      '',
    category: raw?.category
      ? {
          id: raw?.category?.id ?? '',
          name: raw?.category?.name ?? '',
          slug: raw?.category?.slug ?? '',
          icon: raw?.category?.icon,
          color: raw?.category?.color,
          description: raw?.category?.description,
          parentId: raw?.category?.parentId,
          eventCount: raw?.category?.eventCount,
        }
      : undefined,
    categoryId: raw?.categoryId ?? raw?.category_id ?? raw?.category?.id,
    coverImageUrl: raw?.coverImageUrl ?? raw?.cover_image_url ?? raw?.thumbnailUrl,
    thumbnailUrl: raw?.thumbnailUrl ?? raw?.coverImageUrl ?? raw?.cover_image_url,
    ticketTypes,
    isFree,
    minPrice,
    maxPrice,
    currency:
      raw?.currency ??
      ticketTypes.find((t) => t.currency)?.currency ??
      raw?.promoCodes?.[0]?.currency ??
      'USD',
    attendeeCount: raw?.attendeeCount ?? raw?._count?.tickets ?? raw?.ticketsCount,
    capacity:
      raw?.capacity ??
      raw?.maxAttendees ??
      totalCapacity,
    isSaved: raw?.isSaved ?? raw?.saved ?? false,
    createdAt: raw?.createdAt ?? raw?.created_at ?? undefined,
    updatedAt: raw?.updatedAt ?? raw?.updated_at ?? undefined,
  };
};

const normalizeEventListResponse = (
  payload: any,
  page?: number,
  limit?: number
): PaginatedResponse<Event> => {
  if (Array.isArray(payload)) {
    return {
      data: payload.map(mapEventFromApi),
      meta: normalizeMeta(undefined, page, limit, payload.length),
    };
  }

  const dataArray = Array.isArray(payload?.data) ? payload.data : [];
  return {
    data: dataArray.map(mapEventFromApi),
    meta: normalizeMeta(payload?.meta, page, limit, dataArray.length),
  };
};

export const eventsApi = {
  // Get all events with filters
  async getEvents(filters?: EventFilters): Promise<PaginatedResponse<Event>> {
    const response = await apiClient.get('/events', {
      params: filters,
    });
    return normalizeEventListResponse(response.data, filters?.page, filters?.limit);
  },

  // Get single event
  async getEvent(id: string): Promise<Event> {
    const response = await apiClient.get(`/events/${id}`);
    return mapEventFromApi(response.data);
  },

  // Get event occurrences
  async getEventOccurrences(
    eventId: string
  ): Promise<
    { id: string; startsAt: string; endsAt: string; gateOpenAt?: string }[]
  > {
    const response = await apiClient.get(`/events/${eventId}/occurrences`);
    const occurrences = Array.isArray(response.data) ? response.data : [];

    return occurrences.map((occ) => ({
      id: occ?.id ?? '',
      startsAt:
        normalizeDate(occ?.startsAt ?? occ?.start_at) ??
        '',
      endsAt:
        normalizeDate(occ?.endsAt ?? occ?.end_at) ??
        '',
      gateOpenAt: normalizeDate(occ?.gateOpenAt ?? occ?.gate_open_at) ?? undefined,
    }));
  },

  // Get nearby events
  async getNearbyEvents(filters?: NearbyFilters): Promise<PaginatedResponse<Event>> {
    const response = await apiClient.get('/events/nearby', {
      params: filters,
    });
    return normalizeEventListResponse(response.data, filters?.page, filters?.limit);
  },

  // Get nearby events for authenticated user (uses stored location)
  async getNearbyEventsForMe(radius?: number): Promise<PaginatedResponse<Event>> {
    const response = await apiClient.get('/events/nearby/me', {
      params: { radius },
    });
    return normalizeEventListResponse(response.data);
  },

  // Get homepage data
  async getHomepage(): Promise<HomepageData> {
    const response = await apiClient.get<HomepageData>('/homepage');
    return response.data;
  },

  // Get all categories
  async getCategories(): Promise<Category[]> {
    const response = await apiClient.get<Category[]>('/categories');
    return response.data;
  },

  // Get event agenda
  async getEventAgenda(eventId: string): Promise<EventAgenda[]> {
    const response = await apiClient.get<EventAgenda[]>(`/events/${eventId}/agenda`);
    return response.data;
  },

  // Get event speakers
  async getEventSpeakers(eventId: string): Promise<EventSpeaker[]> {
    const response = await apiClient.get<EventSpeaker[]>(`/events/${eventId}/speakers`);
    return response.data;
  },

  // Get event reviews
  async getEventReviews(
    eventId: string,
    page = 1,
    limit = 10
  ): Promise<PaginatedResponse<Review>> {
    const response = await apiClient.get<PaginatedResponse<Review>>(
      `/events/${eventId}/reviews`,
      { params: { page, limit } }
    );
    return response.data;
  },

  // Get event review summary
  async getEventReviewSummary(
    eventId: string
  ): Promise<{ averageRating: number; totalReviews: number; distribution: Record<number, number> }> {
    const response = await apiClient.get(`/events/${eventId}/reviews/summary`);
    return response.data;
  },

  // Get event announcements
  async getEventAnnouncements(eventId: string): Promise<{
    id: string;
    title: string;
    content: string;
    createdAt: string;
  }[]> {
    const response = await apiClient.get(`/events/${eventId}/announcements`);
    return response.data;
  },

  // Get event FAQs
  async getEventFAQs(eventId: string): Promise<{
    id: string;
    question: string;
    answer: string;
    order: number;
  }[]> {
    const response = await apiClient.get(`/events/${eventId}/faqs`);
    return response.data;
  },

  // Track FAQ view
  async trackFAQView(eventId: string, faqId: string): Promise<void> {
    await apiClient.post(`/events/${eventId}/faqs/${faqId}/view`);
  },

  // Mark FAQ as helpful
  async markFAQHelpful(eventId: string, faqId: string): Promise<void> {
    await apiClient.post(`/events/${eventId}/faqs/${faqId}/helpful`);
  },
};
