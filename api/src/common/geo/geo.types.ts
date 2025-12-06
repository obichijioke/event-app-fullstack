export interface Point {
  latitude: number;
  longitude: number;
}

export interface EventWithDistance {
  id: string;
  title: string;
  startAt: Date;
  endAt: Date;
  latitude: number | null;
  longitude: number | null;
  distance: number; // in kilometers
  description?: string | null;
  [key: string]: unknown;
}

export interface VenueWithDistance {
  id: string;
  name: string;
  latitude: number | null;
  longitude: number | null;
  distance: number; // in kilometers
  [key: string]: unknown;
}

export interface NearbySearchFilters {
  categoryId?: string;
  status?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface NearbyEventsResult {
  data: EventWithDistance[];
  meta: PaginationMeta;
  searchLocation: {
    latitude: number;
    longitude: number;
    city?: string;
    country?: string;
  };
}
