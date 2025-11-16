import { Injectable, Logger } from '@nestjs/common';
import { EventStatus, Prisma, TicketKind, Visibility } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import { RedisService } from '../common/redis/redis.service';
import {
  GetHomepageDto,
  HOMEPAGE_TIMEFRAME_OPTIONS,
  HomepageTimeframe,
} from './dto/get-homepage.dto';
import {
  EventSummaryDto,
  HomepageFiltersDto,
  HomepageHeroDto,
  HomepageResponseDto,
  HomepageSectionDto,
  OrganizerSummaryDto,
  PromoHighlightDto,
} from './dto/homepage-response.dto';

type NormalizedHomepageQuery = GetHomepageDto & { radiusKm: number };

const EVENT_SUMMARY_INCLUDE = {
  venue: {
    select: {
      id: true,
      name: true,
      address: true,
      timezone: true,
    },
  },
  org: {
    select: {
      id: true,
      name: true,
    },
  },
  category: {
    select: {
      id: true,
      name: true,
      slug: true,
    },
  },
  ticketTypes: {
    select: {
      id: true,
      name: true,
      priceCents: true,
      feeCents: true,
      currency: true,
      status: true,
      kind: true,
      capacity: true,
      salesStart: true,
      salesEnd: true,
    },
    orderBy: {
      priceCents: 'asc',
    },
  },
  policies: true,
  promoCodes: {
    select: {
      id: true,
      code: true,
      kind: true,
      percentOff: true,
      amountOffCents: true,
      currency: true,
      startsAt: true,
      endsAt: true,
    },
    take: 3,
    orderBy: {
      endsAt: 'asc',
    },
  },
  assets: {
    select: {
      id: true,
      url: true,
      kind: true,
      altText: true,
    },
    orderBy: {
      createdAt: 'asc',
    },
    take: 3,
  },
  eventSeatmaps: {
    select: {
      seatmapId: true,
    },
  },
  seatmap: {
    select: {
      id: true,
    },
  },
  _count: {
    select: {
      orders: true,
      tickets: true,
    },
  },
} satisfies Prisma.EventInclude;

type EventWithRelations = Prisma.EventGetPayload<{
  include: typeof EVENT_SUMMARY_INCLUDE;
}>;

@Injectable()
export class HomepageService {
  private readonly logger = new Logger(HomepageService.name);
  private readonly CACHE_TTL_SECONDS = 60;
  private readonly FLASH_WINDOW_HOURS = 48;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async getHomepage(
    query: GetHomepageDto,
    userId?: string,
  ): Promise<HomepageResponseDto> {
    const normalizedQuery = this.normalizeQuery(query);
    const cacheKey = this.buildCacheKey(normalizedQuery, userId);

    const cached = await this.readFromCache(cacheKey);
    if (cached) {
      return {
        ...cached,
        cache: {
          ...cached.cache,
          hit: true,
        },
      };
    }

    const [
      filters,
      hero,
      trendingSection,
      categorySections,
      flashSaleSection,
      seatmapSection,
      personalizedSection,
      organizers,
    ] = await Promise.all([
      this.buildFilters(normalizedQuery),
      this.buildHero(normalizedQuery),
      this.buildTrendingSection(normalizedQuery),
      this.buildCategorySections(normalizedQuery),
      this.buildFlashSaleSection(normalizedQuery),
      this.buildSeatmapSection(normalizedQuery),
      this.buildPersonalizedSection(normalizedQuery, userId),
      this.fetchOrganizersToFollow(normalizedQuery, userId),
    ]);

    const sections = [
      trendingSection,
      ...categorySections,
      flashSaleSection,
      personalizedSection,
      seatmapSection,
    ].filter((section): section is HomepageSectionDto =>
      Boolean(section && section.items.length),
    );

    const response: HomepageResponseDto = {
      hero,
      filters,
      sections,
      organizers,
      generatedAt: new Date().toISOString(),
      cache: {
        key: cacheKey,
        ttlSeconds: this.CACHE_TTL_SECONDS,
        hit: false,
      },
    };

    await this.writeToCache(cacheKey, response);

    return response;
  }

  private normalizeQuery(query: GetHomepageDto): NormalizedHomepageQuery {
    return {
      ...query,
      city: query.city?.trim() || undefined,
      category: query.category?.trim().toLowerCase() || undefined,
      segment: query.segment?.trim() || undefined,
      radiusKm: query.radiusKm ?? 100,
    };
  }

  private buildCacheKey(query: NormalizedHomepageQuery, userId?: string) {
    const parts = [
      `city:${query.city?.toLowerCase() ?? 'global'}`,
      `category:${query.category ?? 'all'}`,
      `timeframe:${query.timeframe ?? 'any'}`,
      `segment:${query.segment ?? 'all'}`,
      `radius:${query.radiusKm}`,
      `user:${userId ?? 'anon'}`,
    ];
    return `homepage:${parts.join(':')}`;
  }

  private async readFromCache(
    cacheKey: string,
  ): Promise<HomepageResponseDto | null> {
    try {
      const payload = await this.redis.get(cacheKey);
      if (!payload) {
        return null;
      }
      return JSON.parse(payload) as HomepageResponseDto;
    } catch (error) {
      this.logger.warn(
        `Failed to read homepage cache: ${(error as Error).message}`,
      );
      return null;
    }
  }

  private async writeToCache(
    cacheKey: string,
    response: HomepageResponseDto,
  ): Promise<void> {
    try {
      await this.redis.set(
        cacheKey,
        JSON.stringify(response),
        this.CACHE_TTL_SECONDS,
      );
    } catch (error) {
      this.logger.warn(
        `Failed to write homepage cache: ${(error as Error).message}`,
      );
    }
  }

  private async buildFilters(
    query: NormalizedHomepageQuery,
  ): Promise<HomepageFiltersDto> {
    const categories = await this.prisma.category.findMany({
      orderBy: {
        name: 'asc',
      },
      take: 12,
      select: {
        id: true,
        name: true,
        slug: true,
      },
    });

    return {
      categories,
      timeframes: HOMEPAGE_TIMEFRAME_OPTIONS,
      selected: {
        category: query.category ?? null,
        timeframe: query.timeframe ?? null,
        city: query.city ?? null,
      },
    };
  }

  private async buildHero(
    query: NormalizedHomepageQuery,
  ): Promise<HomepageHeroDto | null> {
    const heroEvents = await this.prisma.event.findMany({
      where: this.buildUpcomingEventWhere(query, {
        coverImageUrl: {
          not: null,
        },
      }),
      include: EVENT_SUMMARY_INCLUDE,
      orderBy: [
        {
          publishAt: 'desc',
        },
        {
          startAt: 'asc',
        },
      ],
      take: 4,
    });

    if (!heroEvents.length) {
      return null;
    }

    const prioritized = this.sortWithCityBias(heroEvents, query.city).slice(
      0,
      3,
    );
    const featured = prioritized.map((event) => this.mapEventToSummary(event));

    const backgroundImage =
      featured.find((item) => item.coverImageUrl)?.coverImageUrl ??
      featured[0]?.assets[0]?.url ??
      null;

    return {
      headline: this.buildHeroHeadline(query),
      subheading: this.buildHeroSubheading(query, featured.length),
      featured,
      backgroundImage,
    };
  }

  private buildHeroHeadline(query: NormalizedHomepageQuery): string {
    if (query.city) {
      return `Events lighting up ${query.city}`;
    }
    return 'Events audiences love right now';
  }

  private buildHeroSubheading(
    query: NormalizedHomepageQuery,
    count: number,
  ): string {
    const timeframeLabel = HOMEPAGE_TIMEFRAME_OPTIONS.find(
      (option) => option.id === query.timeframe,
    )?.label;
    if (timeframeLabel) {
      return `${count} picks for ${timeframeLabel.toLowerCase()}`;
    }
    return `${count} featured experiences hand-picked for you`;
  }

  private async buildTrendingSection(
    query: NormalizedHomepageQuery,
  ): Promise<HomepageSectionDto | null> {
    const events = await this.prisma.event.findMany({
      where: this.buildUpcomingEventWhere(query),
      include: EVENT_SUMMARY_INCLUDE,
      orderBy: [
        {
          orders: {
            _count: 'desc',
          },
        },
        {
          startAt: 'asc',
        },
      ],
      take: 18,
    });

    if (!events.length) {
      return null;
    }

    const prioritized = this.sortWithCityBias(events, query.city)
      .slice(0, 12)
      .map((event) => this.mapEventToSummary(event));

    return {
      id: 'trending',
      title: query.city ? `Trending in ${query.city}` : 'Trending now',
      layout: 'carousel',
      items: prioritized,
      cta: {
        label: 'See all trending events',
        href: '/events?sort=trending',
      },
    };
  }

  private async buildCategorySections(
    query: NormalizedHomepageQuery,
  ): Promise<HomepageSectionDto[]> {
    const upcomingWhere = this.buildUpcomingEventWhere(query);

    const candidateCategories = await this.prisma.category.findMany({
      where: {
        events: {
          some: upcomingWhere,
        },
      },
      select: {
        id: true,
        name: true,
        slug: true,
      },
      orderBy: {
        name: 'asc',
      },
      take: 6,
    });

    const prioritizedCategories = this.prioritizeCategories(
      candidateCategories,
      query.category,
    ).slice(0, 3);

    const sections: HomepageSectionDto[] = [];
    for (const category of prioritizedCategories) {
      const events = await this.prisma.event.findMany({
        where: {
          ...upcomingWhere,
          categoryId: category.id,
        },
        include: EVENT_SUMMARY_INCLUDE,
        orderBy: {
          startAt: 'asc',
        },
        take: 10,
      });

      if (!events.length) {
        continue;
      }

      const items = this.sortWithCityBias(events, query.city)
        .slice(0, 10)
        .map((event) => this.mapEventToSummary(event));

      sections.push({
        id: `category-${category.slug}`,
        title: `${category.name} spotlights`,
        subtitle: `Fresh ${category.name.toLowerCase()} experiences`,
        layout: 'carousel',
        items,
        cta: {
          label: `Browse all ${category.name}`,
          href: `/events?category=${category.slug}`,
        },
      });
    }

    return sections;
  }

  private prioritizeCategories(
    categories: Array<{ id: string; name: string; slug: string }>,
    targetSlug?: string,
  ) {
    if (!targetSlug) {
      return categories;
    }

    const normalizedTarget = targetSlug.toLowerCase();
    return [
      ...categories.filter(
        (category) => category.slug.toLowerCase() === normalizedTarget,
      ),
      ...categories.filter(
        (category) => category.slug.toLowerCase() !== normalizedTarget,
      ),
    ].filter(
      (category, index, self) =>
        index === self.findIndex((item) => item.id === category.id),
    );
  }

  private async buildFlashSaleSection(
    query: NormalizedHomepageQuery,
  ): Promise<HomepageSectionDto | null> {
    const now = new Date();
    const flashWindowEnds = this.addHours(now, this.FLASH_WINDOW_HOURS);

    const events = await this.prisma.event.findMany({
      where: {
        ...this.buildUpcomingEventWhere(query),
        ticketTypes: {
          some: {
            status: 'approved' as any,
            salesEnd: {
              gte: now,
              lte: flashWindowEnds,
            },
          },
        },
      },
      include: EVENT_SUMMARY_INCLUDE,
      orderBy: {
        startAt: 'asc',
      },
      take: 10,
    });

    if (!events.length) {
      return null;
    }

    const items = this.sortWithCityBias(events, query.city)
      .slice(0, 10)
      .map((event) => this.mapEventToSummary(event));

    return {
      id: 'flash-sales',
      title: 'On sale now',
      subtitle: 'Deals ending within 48 hours',
      layout: 'marquee',
      items,
      cta: {
        label: 'View all deals',
        href: '/events?sales=ending-soon',
      },
    };
  }

  private async buildSeatmapSection(
    query: NormalizedHomepageQuery,
  ): Promise<HomepageSectionDto | null> {
    const events = await this.prisma.event.findMany({
      where: {
        ...this.buildUpcomingEventWhere(query),
        OR: [
          {
            seatmapId: {
              not: null,
            },
          },
          {
            eventSeatmaps: {
              some: {},
            },
          },
        ],
        ticketTypes: {
          some: {
            kind: TicketKind.SEATED,
          },
        },
      },
      include: EVENT_SUMMARY_INCLUDE,
      orderBy: {
        startAt: 'asc',
      },
      take: 8,
    });

    if (!events.length) {
      return null;
    }

    const items = this.sortWithCityBias(events, query.city)
      .slice(0, 8)
      .map((event) => this.mapEventToSummary(event));

    return {
      id: 'seatmap-showcase',
      title: 'Pick your seats',
      layout: 'grid',
      items,
    };
  }

  private async buildPersonalizedSection(
    query: NormalizedHomepageQuery,
    userId?: string,
  ): Promise<HomepageSectionDto | null> {
    if (!userId) {
      return null;
    }

    const [follows, recentOrders] = await Promise.all([
      this.prisma.userFollow.findMany({
        where: { userId },
        select: {
          organizationId: true,
        },
      }),
      this.prisma.order.findMany({
        where: { buyerId: userId },
        select: {
          event: {
            select: {
              id: true,
              categoryId: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 30,
      }),
    ]);

    const orgIds = follows.map((follow) => follow.organizationId);
    const categoryIds = recentOrders
      .map((order) => order.event?.categoryId)
      .filter((categoryId): categoryId is string => Boolean(categoryId));

    if (!orgIds.length && !categoryIds.length) {
      return null;
    }

    const personalizedEvents = await this.prisma.event.findMany({
      where: {
        ...this.buildUpcomingEventWhere(query),
        OR: [
          orgIds.length ? { orgId: { in: orgIds } } : undefined,
          categoryIds.length ? { categoryId: { in: categoryIds } } : undefined,
        ].filter(Boolean) as Prisma.EventWhereInput['OR'],
      },
      include: EVENT_SUMMARY_INCLUDE,
      orderBy: {
        startAt: 'asc',
      },
      take: 12,
    });

    if (!personalizedEvents.length) {
      return null;
    }

    const deduped = this.sortWithCityBias(
      this.dedupeEvents(personalizedEvents),
      query.city,
    )
      .slice(0, 10)
      .map((event) => this.mapEventToSummary(event));

    return {
      id: 'for-you',
      title: 'Because you follow these organizers',
      layout: 'carousel',
      items: deduped,
    };
  }

  private async fetchOrganizersToFollow(
    query: NormalizedHomepageQuery,
    userId?: string,
  ): Promise<OrganizerSummaryDto[]> {
    const upcomingWhere = this.buildUpcomingEventWhere(query);

    const organizations = await this.prisma.organization.findMany({
      where: {
        status: 'approved' as any,
        followers: userId
          ? {
              none: {
                userId,
              },
            }
          : undefined,
        events: {
          some: upcomingWhere,
        },
      },
      select: {
        id: true,
        name: true,
        website: true,
        country: true,
        venues: {
          select: {
            address: true,
          },
          take: 1,
        },
        events: {
          where: upcomingWhere,
          select: {
            id: true,
            title: true,
            startAt: true,
          },
          orderBy: {
            startAt: 'asc',
          },
          take: 2,
        },
        _count: {
          select: {
            followers: true,
          },
        },
      },
      orderBy: {
        followers: {
          _count: 'desc',
        },
      },
      take: 6,
    });

    return organizations.map((org) => {
      const venueAddress = this.extractAddress(org.venues[0]?.address);
      return {
        id: org.id,
        name: org.name,
        city: venueAddress?.city ?? null,
        region: venueAddress?.region ?? null,
        country: venueAddress?.country ?? org.country ?? null,
        website: org.website,
        followerCount: org._count.followers,
        upcomingEvents: org.events.map((event) => ({
          id: event.id,
          title: event.title,
          startAt: event.startAt.toISOString(),
        })),
      };
    });
  }

  private buildUpcomingEventWhere(
    query: NormalizedHomepageQuery,
    overrides?: Prisma.EventWhereInput,
  ): Prisma.EventWhereInput {
    const now = new Date();
    const timeframeRange = this.resolveTimeframeRange(query.timeframe);

    const startAtFilter: Prisma.DateTimeFilter = {};
    if (timeframeRange?.gte) {
      startAtFilter.gte = timeframeRange.gte;
    }
    if (timeframeRange?.lt) {
      startAtFilter.lt = timeframeRange.lt;
    }
    if (!timeframeRange) {
      startAtFilter.gte = now;
    }

    const where: Prisma.EventWhereInput = {
      deletedAt: null,
      visibility: Visibility.public,
      status: {
        in: [EventStatus.live, EventStatus.approved],
      },
      startAt: startAtFilter,
      AND: [
        {
          OR: [
            { publishAt: null },
            {
              publishAt: {
                lte: now,
              },
            },
          ],
        },
      ],
    };

    if (query.category) {
      where.category = {
        slug: query.category,
      };
    }

    if (overrides) {
      const existing = where.AND;
      if (Array.isArray(existing)) {
        where.AND = [...existing, overrides];
      } else if (existing) {
        where.AND = [existing, overrides];
      } else {
        where.AND = [overrides];
      }
    }

    return where;
  }

  private resolveTimeframeRange(timeframe?: HomepageTimeframe) {
    if (!timeframe) {
      return undefined;
    }

    const now = new Date();
    switch (timeframe) {
      case 'today': {
        const start = this.startOfDay(now);
        const end = this.endOfDay(now);
        return { gte: start, lt: end };
      }
      case 'weekend': {
        const friday = this.getUpcomingWeekday(now, 5); // Friday
        const monday = this.addDays(friday, 3); // Monday after weekend
        return { gte: friday, lt: monday };
      }
      case 'upcoming': {
        return { gte: now, lt: this.addDays(now, 30) };
      }
      default:
        return undefined;
    }
  }

  private sortWithCityBias(
    events: EventWithRelations[],
    city?: string,
  ): EventWithRelations[] {
    if (!city) {
      return events;
    }

    const normalizedCity = city.toLowerCase();
    return [...events].sort((a, b) => {
      const aMatch = this.eventMatchesCity(a, normalizedCity) ? 1 : 0;
      const bMatch = this.eventMatchesCity(b, normalizedCity) ? 1 : 0;
      if (aMatch !== bMatch) {
        return bMatch - aMatch;
      }
      return 0;
    });
  }

  private eventMatchesCity(
    event: Pick<EventWithRelations, 'venue'>,
    normalizedCity: string,
  ) {
    const address = this.extractAddress(event.venue?.address);
    if (!address) {
      return false;
    }

    const parts = [address.city, address.region, address.country]
      .filter(Boolean)
      .map((part) => part!.toLowerCase());

    return parts.includes(normalizedCity);
  }

  private dedupeEvents(events: EventWithRelations[]): EventWithRelations[] {
    const seen = new Set<string>();
    return events.filter((event) => {
      if (seen.has(event.id)) {
        return false;
      }
      seen.add(event.id);
      return true;
    });
  }

  private mapEventToSummary(event: EventWithRelations): EventSummaryDto {
    const cheapestTicket = this.getCheapestTicket(event);
    const promo = this.pickActivePromo(event);
    const venue = this.mapVenue(event);
    const coverImage =
      event.coverImageUrl ??
      event.assets.find((asset) => asset.kind === 'image')?.url ??
      event.assets[0]?.url ??
      null;

    return {
      id: event.id,
      title: event.title,
      startAt: event.startAt.toISOString(),
      endAt: event.endAt.toISOString(),
      doorTime: event.doorTime ? event.doorTime.toISOString() : null,
      coverImageUrl: coverImage,
      organization: {
        id: event.org.id,
        name: event.org.name,
      },
      venue,
      category: event.category
        ? {
            id: event.category.id,
            name: event.category.name,
            slug: event.category.slug,
          }
        : null,
      pricing: cheapestTicket
        ? {
            currency: cheapestTicket.currency,
            startingAt: this.toCurrency(cheapestTicket.priceCents),
            fee: this.toCurrency(cheapestTicket.feeCents ?? 0n),
            label: `From ${this.formatCurrency(
              cheapestTicket.priceCents,
              cheapestTicket.currency,
            )}`,
          }
        : null,
      tags: this.buildTags(event),
      stats: {
        orderCount: event._count.orders ?? 0,
        isLowInventory: this.isLowInventory(event),
      },
      seatmap: {
        hasSeatmap:
          Boolean(event.seatmap?.id) || Boolean(event.eventSeatmaps?.length),
        isSeated: event.ticketTypes.some(
          (ticket) => ticket.kind === TicketKind.SEATED,
        ),
      },
      policies: {
        transferable: event.policies?.transferAllowed ?? true,
        refundable: Boolean(event.policies?.refundPolicy),
      },
      promo,
      assets: event.assets.map((asset) => ({
        id: asset.id,
        url: asset.url,
        kind: asset.kind,
        altText: asset.altText,
      })),
    };
  }

  private mapVenue(event: EventWithRelations) {
    if (!event.venue) {
      return null;
    }
    const address = this.extractAddress(event.venue.address);
    return {
      id: event.venue.id,
      name: event.venue.name,
      city: address?.city ?? null,
      region: address?.region ?? null,
      country: address?.country ?? null,
      timezone: event.venue.timezone,
    };
  }

  private buildTags(event: EventWithRelations): string[] {
    const tags = new Set<string>();
    if (event.category?.name) {
      tags.add(event.category.name);
    }
    const venueAddress = this.extractAddress(event.venue?.address);
    if (venueAddress?.city) {
      tags.add(venueAddress.city);
    }
    if (event.policies?.transferAllowed === false) {
      tags.add('No transfers');
    }
    if (event.policies?.refundPolicy) {
      tags.add('Refundable');
    }
    if (event.ticketTypes.some((ticket) => ticket.kind === TicketKind.SEATED)) {
      tags.add('Reserved seating');
    }
    return Array.from(tags);
  }

  private getCheapestTicket(event: EventWithRelations) {
    if (!event.ticketTypes.length) {
      return null;
    }

    return [...event.ticketTypes]
      .filter((ticket) => ticket.status === 'active')
      .sort(
        (a, b) => Number(a.priceCents ?? 0n) - Number(b.priceCents ?? 0n),
      )[0];
  }

  private pickActivePromo(
    event: EventWithRelations,
  ): PromoHighlightDto | undefined {
    if (!event.promoCodes?.length) {
      return undefined;
    }
    const now = Date.now();
    const activePromo = event.promoCodes.find((promo) => {
      const startsAt =
        promo.startsAt instanceof Date
          ? promo.startsAt
          : promo.startsAt
            ? new Date(promo.startsAt)
            : null;
      const endsAt =
        promo.endsAt instanceof Date
          ? promo.endsAt
          : promo.endsAt
            ? new Date(promo.endsAt)
            : null;
      const startsOk = !startsAt || startsAt.getTime() <= now;
      const endsOk = !endsAt || endsAt.getTime() >= now;
      return startsOk && endsOk;
    });

    if (!activePromo) {
      return undefined;
    }

    return {
      id: activePromo.id,
      code: activePromo.code,
      kind: activePromo.kind,
      label: this.formatPromoLabel(activePromo),
      endsAt: activePromo.endsAt
        ? new Date(activePromo.endsAt).toISOString()
        : null,
    };
  }

  private formatPromoLabel(promo: {
    kind: string;
    percentOff?: Prisma.Decimal | null;
    amountOffCents?: bigint | null;
    currency?: string | null;
  }) {
    if (promo.kind === 'percent' && promo.percentOff) {
      return `${Number(promo.percentOff)}% off`;
    }
    if (promo.kind === 'amount' && promo.amountOffCents && promo.currency) {
      return `${this.formatCurrency(promo.amountOffCents, promo.currency)} off`;
    }
    if (promo.kind === 'access') {
      return 'Exclusive access';
    }
    return 'Special offer';
  }

  private isLowInventory(event: EventWithRelations): boolean {
    const totalCapacity = event.ticketTypes.reduce(
      (sum, ticket) => sum + (ticket.capacity ?? 0),
      0,
    );
    if (!totalCapacity) {
      return false;
    }
    const sold = event._count.tickets ?? 0;
    return totalCapacity - sold <= 25;
  }

  private extractAddress(value: Prisma.JsonValue | null | undefined): {
    city?: string | null;
    region?: string | null;
    country?: string | null;
  } | null {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return null;
    }
    const record = value as Record<string, unknown>;
    return {
      city: typeof record.city === 'string' ? record.city : null,
      region: typeof record.region === 'string' ? record.region : null,
      country: typeof record.country === 'string' ? record.country : null,
    };
  }

  private formatCurrency(amount: bigint, currency: string) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(this.toCurrency(amount));
  }

  private toCurrency(amount: bigint) {
    return Number(amount) / 100;
  }

  private startOfDay(date: Date) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    return start;
  }

  private endOfDay(date: Date) {
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    return end;
  }

  private getUpcomingWeekday(date: Date, weekday: number) {
    const result = new Date(date);
    const currentDay = date.getDay();
    const distance = (weekday + 7 - currentDay) % 7;
    result.setDate(date.getDate() + distance);
    result.setHours(0, 0, 0, 0);
    return result;
  }

  private addDays(date: Date, days: number) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  private addHours(date: Date, hours: number) {
    const result = new Date(date);
    result.setHours(result.getHours() + hours);
    return result;
  }
}
