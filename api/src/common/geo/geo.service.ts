import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  Point,
  EventWithDistance,
  NearbySearchFilters,
  NearbyEventsResult,
} from './geo.types';

@Injectable()
export class GeoService {
  private readonly logger = new Logger(GeoService.name);
  private postgisEnabled: boolean | null = null;

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Check if PostGIS extension is available in the database
   */
  async isPostGISEnabled(): Promise<boolean> {
    if (this.postgisEnabled !== null) {
      return this.postgisEnabled;
    }

    try {
      const result = await this.prisma.$queryRaw<{ exists: boolean }[]>`
        SELECT EXISTS (
          SELECT 1 FROM pg_extension WHERE extname = 'postgis'
        ) as exists
      `;
      this.postgisEnabled = result[0]?.exists ?? false;
      this.logger.log(`PostGIS enabled: ${this.postgisEnabled}`);
      return this.postgisEnabled;
    } catch (error) {
      this.logger.warn('Failed to check PostGIS status', error);
      this.postgisEnabled = false;
      return false;
    }
  }

  /**
   * Find events within a specified radius using PostGIS
   * Falls back to Haversine formula if PostGIS is not available
   */
  async findEventsWithinRadius(
    point: Point,
    radiusKm: number,
    page: number = 1,
    limit: number = 20,
    filters?: NearbySearchFilters,
  ): Promise<NearbyEventsResult> {
    const isPostGIS = await this.isPostGISEnabled();

    if (isPostGIS) {
      return this.findEventsWithPostGIS(point, radiusKm, page, limit, filters);
    } else {
      return this.findEventsWithHaversine(point, radiusKm, page, limit, filters);
    }
  }

  /**
   * PostGIS-based nearby events query (optimized)
   */
  private async findEventsWithPostGIS(
    point: Point,
    radiusKm: number,
    page: number,
    limit: number,
    filters?: NearbySearchFilters,
  ): Promise<NearbyEventsResult> {
    const offset = (page - 1) * limit;
    const radiusMeters = radiusKm * 1000;
    const now = new Date();

    const whereConditions: Prisma.Sql[] = [
      Prisma.sql`e.visibility = 'public'`,
      Prisma.sql`e.deleted_at IS NULL`,
      Prisma.sql`e.end_at >= ${now}`,
      Prisma.sql`e.status = ${filters?.status ?? 'live'}`,
    ];

    if (filters?.categoryId) {
      whereConditions.push(Prisma.sql`e.category_id = ${filters.categoryId}`);
    }
    if (filters?.startDate) {
      whereConditions.push(Prisma.sql`e.start_at >= ${filters.startDate}`);
    }
    if (filters?.endDate) {
      whereConditions.push(Prisma.sql`e.end_at <= ${filters.endDate}`);
    }

    const locationCondition = Prisma.sql`(
      (e.location IS NOT NULL AND ST_DWithin(
        e.location,
        ST_SetSRID(ST_MakePoint(${point.longitude}, ${point.latitude}), 4326)::geography,
        ${radiusMeters}
      ))
      OR
      (v.location IS NOT NULL AND ST_DWithin(
        v.location,
        ST_SetSRID(ST_MakePoint(${point.longitude}, ${point.latitude}), 4326)::geography,
        ${radiusMeters}
      ))
    )`;

    const whereClause = Prisma.join(whereConditions, ' AND ');

    // Count total matching events
    let countResult: { count: bigint }[];
    try {
      countResult = await this.prisma.$queryRaw<{ count: bigint }[]>`
        SELECT COUNT(*) as count
        FROM events e
        LEFT JOIN venues v ON e.venue_id = v.id
        WHERE ${whereClause}
          AND ${locationCondition}
      `;
    } catch (error) {
      this.logger.error(`PostGIS count query failed: ${error.message}`, error.stack);
      throw error;
    }

    const total = Number(countResult[0]?.count ?? 0);

    // Fetch paginated events with distance
    let events: EventWithDistance[];
    try {
      events = await this.prisma.$queryRaw<EventWithDistance[]>`
        SELECT
          e.id,
          e.title,
          COALESCE(e.short_description, e.description_md) as description,
          e.start_at as "startAt",
          e.end_at as "endAt",
          e.status,
          e.visibility,
          e.cover_image_url as "coverImageUrl",
          e.category_id as "categoryId",
          e.org_id as "orgId",
          e.venue_id as "venueId",
          COALESCE(e.latitude::float, v.latitude::float) as latitude,
          COALESCE(e.longitude::float, v.longitude::float) as longitude,
          ROUND(
            LEAST(
              CASE WHEN e.location IS NOT NULL
                THEN ST_Distance(e.location, ST_SetSRID(ST_MakePoint(${point.longitude}, ${point.latitude}), 4326)::geography) / 1000
                ELSE 999999
              END,
              CASE WHEN v.location IS NOT NULL
                THEN ST_Distance(v.location, ST_SetSRID(ST_MakePoint(${point.longitude}, ${point.latitude}), 4326)::geography) / 1000
                ELSE 999999
              END
            )::numeric, 2
          ) as distance
        FROM events e
        LEFT JOIN venues v ON e.venue_id = v.id
        WHERE ${whereClause}
          AND ${locationCondition}
        ORDER BY distance ASC
        LIMIT ${limit} OFFSET ${offset}
      `;
    } catch (error) {
      this.logger.error(`PostGIS events query failed: ${error.message}`, error.stack);
      throw error;
    }

    return {
      data: events.map(e => ({
        ...e,
        distance: Number(e.distance),
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      searchLocation: {
        latitude: point.latitude,
        longitude: point.longitude,
      },
    };
  }

  /**
   * Haversine-based nearby events query (fallback)
   */
  private async findEventsWithHaversine(
    point: Point,
    radiusKm: number,
    page: number,
    limit: number,
    filters?: NearbySearchFilters,
  ): Promise<NearbyEventsResult> {
    const now = new Date();

    // Build Prisma where clause
    const where: Record<string, unknown> = {
      visibility: 'public',
      status: filters?.status ?? 'live',
      endAt: { gte: now },
      deletedAt: null,
      OR: [
        { AND: [{ latitude: { not: null } }, { longitude: { not: null } }] },
        { venue: { AND: [{ latitude: { not: null } }, { longitude: { not: null } }] } },
      ],
    };

    if (filters?.categoryId) {
      where.categoryId = filters.categoryId;
    }
    if (filters?.startDate) {
      where.startAt = { gte: filters.startDate };
    }
    if (filters?.endDate) {
      where.endAt = { ...((where.endAt as object) || {}), lte: filters.endDate };
    }

    // Fetch all matching events
    const events = await this.prisma.event.findMany({
      where,
      include: {
        venue: {
          select: {
            id: true,
            name: true,
            latitude: true,
            longitude: true,
          },
        },
        category: true,
        org: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Calculate distances and filter by radius
    const eventsWithDistance = events
      .map((event) => {
        const eventLat = event.latitude
          ? Number(event.latitude)
          : event.venue?.latitude
            ? Number(event.venue.latitude)
            : null;
        const eventLon = event.longitude
          ? Number(event.longitude)
          : event.venue?.longitude
            ? Number(event.venue.longitude)
            : null;

        if (eventLat === null || eventLon === null) {
          return null;
        }

        const distance = this.calculateHaversineDistance(
          point.latitude,
          point.longitude,
          eventLat,
          eventLon,
        );

        return {
          ...event,
          latitude: eventLat,
          longitude: eventLon,
          distance,
        };
      })
      .filter((event): event is NonNullable<typeof event> =>
        event !== null && event.distance <= radiusKm
      )
      .sort((a, b) => a.distance - b.distance);

    // Paginate results
    const total = eventsWithDistance.length;
    const offset = (page - 1) * limit;
    const paginatedEvents = eventsWithDistance.slice(offset, offset + limit);

    return {
      data: paginatedEvents as EventWithDistance[],
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      searchLocation: {
        latitude: point.latitude,
        longitude: point.longitude,
      },
    };
  }

  /**
   * Calculate distance between two points using Haversine formula
   * Returns distance in kilometers
   */
  private calculateHaversineDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return Math.round(distance * 100) / 100;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Sync geometry column from lat/lon for an event
   */
  async syncEventGeometry(eventId: string): Promise<void> {
    const isPostGIS = await this.isPostGISEnabled();
    if (!isPostGIS) return;

    await this.prisma.$executeRaw`
      UPDATE events
      SET location = CASE
        WHEN latitude IS NOT NULL AND longitude IS NOT NULL
        THEN ST_SetSRID(ST_MakePoint(longitude::float, latitude::float), 4326)::geography
        ELSE NULL
      END
      WHERE id = ${eventId}
    `;
  }

  /**
   * Sync geometry column from lat/lon for a venue
   */
  async syncVenueGeometry(venueId: string): Promise<void> {
    const isPostGIS = await this.isPostGISEnabled();
    if (!isPostGIS) return;

    await this.prisma.$executeRaw`
      UPDATE venues
      SET location = CASE
        WHEN latitude IS NOT NULL AND longitude IS NOT NULL
        THEN ST_SetSRID(ST_MakePoint(longitude::float, latitude::float), 4326)::geography
        ELSE NULL
      END
      WHERE id = ${venueId}
    `;
  }

  /**
   * Get bounding box for a given center point and radius
   * Useful for quick filtering before precise distance calculation
   */
  getBoundingBox(center: Point, radiusKm: number): {
    minLat: number;
    maxLat: number;
    minLon: number;
    maxLon: number;
  } {
    const latDelta = radiusKm / 111.32; // 1 degree latitude ≈ 111.32 km
    const lonDelta = radiusKm / (111.32 * Math.cos(this.toRadians(center.latitude)));

    return {
      minLat: center.latitude - latDelta,
      maxLat: center.latitude + latDelta,
      minLon: center.longitude - lonDelta,
      maxLon: center.longitude + lonDelta,
    };
  }
}
