import { HomepageTimeframe } from './get-homepage.dto';

export interface EventVenueSummaryDto {
  id?: string | null;
  name?: string | null;
  city?: string | null;
  region?: string | null;
  country?: string | null;
  timezone?: string | null;
}

export interface CategorySummaryDto {
  id: string;
  name: string;
  slug: string;
}

export interface EventAssetSummaryDto {
  id: string;
  url: string;
  kind: string;
  altText?: string | null;
}

export interface EventPriceSummaryDto {
  currency: string;
  startingAt: number;
  fee?: number;
  label?: string;
}

export interface PromoHighlightDto {
  id: string;
  code: string;
  kind: string;
  label: string;
  endsAt?: string | null;
}

export interface EventSummaryDto {
  id: string;
  title: string;
  startAt: string;
  endAt: string;
  doorTime?: string | null;
  coverImageUrl?: string | null;
  organization: {
    id: string;
    name: string;
  };
  venue?: EventVenueSummaryDto | null;
  category?: CategorySummaryDto | null;
  pricing?: EventPriceSummaryDto | null;
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
  promo?: PromoHighlightDto;
  assets: EventAssetSummaryDto[];
}

export interface HomepageSectionDto {
  id: string;
  title: string;
  subtitle?: string;
  layout: 'carousel' | 'grid' | 'marquee';
  items: EventSummaryDto[];
  meta?: Record<string, unknown>;
  cta?: {
    label: string;
    href: string;
  };
}

export interface HomepageHeroDto {
  headline: string;
  subheading?: string;
  featured: EventSummaryDto[];
  backgroundImage?: string | null;
}

export interface HomepageFiltersDto {
  categories: CategorySummaryDto[];
  timeframes: Array<{
    id: HomepageTimeframe;
    label: string;
  }>;
  selected: {
    category?: string | null;
    timeframe?: HomepageTimeframe | null;
    city?: string | null;
  };
}

export interface OrganizerSummaryDto {
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

export interface HomepageResponseDto {
  hero: HomepageHeroDto | null;
  filters: HomepageFiltersDto;
  sections: HomepageSectionDto[];
  organizers: OrganizerSummaryDto[];
  generatedAt: string;
  cache: {
    key: string;
    ttlSeconds: number;
    hit: boolean;
  };
}
