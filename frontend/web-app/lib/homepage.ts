import 'server-only';
import { API_BASE_URL } from './config';

export type HomepageTimeframe = 'today' | 'weekend' | 'upcoming';

export interface HomepageQueryParams {
  city?: string;
  category?: string;
  timeframe?: HomepageTimeframe;
  segment?: string;
}

export interface EventVenueSummary {
  id?: string | null;
  name?: string | null;
  city?: string | null;
  region?: string | null;
  country?: string | null;
  timezone?: string | null;
}

export interface EventPriceSummary {
  currency: string;
  startingAt: number;
  fee?: number;
  label?: string;
}

export interface CategorySummary {
  id: string;
  name: string;
  slug: string;
}

export interface PromoHighlight {
  id: string;
  code: string;
  kind: string;
  label: string;
  endsAt?: string | null;
}

export interface EventSummary {
  id: string;
  title: string;
  startAt: string;
  endAt: string;
  doorTime?: string | null;
  coverImageUrl?: string | null;
  ageRestriction?: string | null;
  organization: {
    id: string;
    name: string;
  };
  venue?: EventVenueSummary | null;
  category?: CategorySummary | null;
  pricing?: EventPriceSummary | null;
  tags: string[];
  stats: {
    orderCount: number;
    isLowInventory: boolean;
  };
  seatmap: {
    hasSeatmap: boolean;
    isSeated: boolean;
  };
  policies: {
    transferable: boolean;
    refundable: boolean;
  };
  promo?: PromoHighlight;
  assets: Array<{
    id: string;
    url: string;
    kind: string;
    altText?: string | null;
  }>;
}

export interface HomepageHero {
  headline: string;
  subheading?: string;
  featured: EventSummary[];
  backgroundImage?: string | null;
}

export interface HomepageFilters {
  categories: CategorySummary[];
  timeframes: Array<{ id: HomepageTimeframe; label: string }>;
  selected: {
    category?: string | null;
    timeframe?: HomepageTimeframe | null;
    city?: string | null;
  };
}

export interface HomepageSection {
  id: string;
  title: string;
  subtitle?: string;
  layout: 'carousel' | 'grid' | 'marquee';
  items: EventSummary[];
  meta?: Record<string, unknown>;
  cta?: {
    label: string;
    href: string;
  };
}

export interface OrganizerSummary {
  id: string;
  name: string;
  city?: string | null;
  region?: string | null;
  country?: string | null;
  website?: string | null;
  followerCount: number;
  upcomingEvents: Array<{
    id: string;
    title: string;
    startAt: string;
  }>;
}

export interface HomepageResponse {
  hero: HomepageHero | null;
  filters: HomepageFilters;
  sections: HomepageSection[];
  organizers: OrganizerSummary[];
  generatedAt: string;
  cache: {
    key: string;
    ttlSeconds: number;
    hit: boolean;
  };
}

const DEFAULT_RESPONSE: HomepageResponse = {
  hero: null,
  filters: {
    categories: [],
    timeframes: [],
    selected: {
      category: null,
      timeframe: null,
      city: null,
    },
  },
  sections: [],
  organizers: [],
  generatedAt: new Date().toISOString(),
  cache: {
    key: 'homepage:fallback',
    ttlSeconds: 0,
    hit: false,
  },
};

export async function fetchHomepageData(
  params: HomepageQueryParams = {},
): Promise<HomepageResponse> {
  try {
    const baseUrl = new URL('/api/homepage', API_BASE_URL);
    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        baseUrl.searchParams.set(key, value);
      }
    });

    const response = await fetch(baseUrl.toString(), {
      next: { revalidate: 60 },
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Homepage API failed with status ${response.status}`);
    }

    const data = (await response.json()) as HomepageResponse;
    return data;
  } catch (error) {
    console.error('[homepage] Failed to fetch homepage data', error);
    return DEFAULT_RESPONSE;
  }
}
