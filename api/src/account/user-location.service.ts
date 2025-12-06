import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { GeolocationService } from '../common/geolocation/geolocation.service';
import { SetLocationDto, BrowserLocationDto } from './dto/set-location.dto';
import { LocationSource } from '@prisma/client';

@Injectable()
export class UserLocationService {
  private readonly logger = new Logger(UserLocationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly geolocationService: GeolocationService,
  ) {}

  /**
   * Get user's stored location
   */
  async getUserLocation(userId: string) {
    const location = await this.prisma.userLocation.findUnique({
      where: { userId },
      include: { cityRef: true },
    });

    if (!location) return null;

    return {
      latitude: location.latitude ? Number(location.latitude) : null,
      longitude: location.longitude ? Number(location.longitude) : null,
      city: location.city,
      cityId: location.cityId,
      region: location.region,
      country: location.country,
      countryCode: location.countryCode,
      source: location.source,
      accuracyMeters: location.accuracyMeters,
      lastUpdatedAt: location.lastUpdatedAt,
      createdAt: location.createdAt,
    };
  }

  /**
   * Set user's location manually or from browser
   */
  async setUserLocation(userId: string, dto: SetLocationDto) {
    const { latitude, longitude, cityId, source = 'manual' } = dto;

    let city: string | null = null;
    let region: string | null = null;
    let country: string | null = null;
    let countryCode: string | null = null;
    let finalLat = latitude ?? null;
    let finalLon = longitude ?? null;

    // If cityId provided, get city details
    if (cityId) {
      const cityData = await this.prisma.city.findUnique({
        where: { id: cityId },
        include: { region: true },
      });

      if (!cityData) {
        throw new NotFoundException('City not found');
      }

      city = cityData.name;
      region = cityData.region?.name ?? null;
      country = cityData.countryName;
      countryCode = cityData.countryCode;
      finalLat = Number(cityData.latitude);
      finalLon = Number(cityData.longitude);
    }

    const location = await this.prisma.userLocation.upsert({
      where: { userId },
      update: {
        latitude: finalLat,
        longitude: finalLon,
        city,
        cityId,
        region,
        country,
        countryCode,
        source: source as LocationSource,
        lastUpdatedAt: new Date(),
      },
      create: {
        userId,
        latitude: finalLat,
        longitude: finalLon,
        city,
        cityId,
        region,
        country,
        countryCode,
        source: source as LocationSource,
      },
    });

    return {
      latitude: location.latitude ? Number(location.latitude) : null,
      longitude: location.longitude ? Number(location.longitude) : null,
      city: location.city,
      cityId: location.cityId,
      region: location.region,
      country: location.country,
      countryCode: location.countryCode,
      source: location.source,
      lastUpdatedAt: location.lastUpdatedAt,
    };
  }

  /**
   * Set user's location from browser geolocation API
   */
  async setLocationFromBrowser(userId: string, dto: BrowserLocationDto) {
    const { latitude, longitude, accuracy } = dto;

    // Try to reverse geocode to get city info
    // For now, we'll just store the coordinates
    // Could add reverse geocoding API call here

    const location = await this.prisma.userLocation.upsert({
      where: { userId },
      update: {
        latitude,
        longitude,
        source: 'browser' as LocationSource,
        accuracyMeters: accuracy,
        lastUpdatedAt: new Date(),
      },
      create: {
        userId,
        latitude,
        longitude,
        source: 'browser' as LocationSource,
        accuracyMeters: accuracy,
      },
    });

    return {
      latitude: location.latitude ? Number(location.latitude) : null,
      longitude: location.longitude ? Number(location.longitude) : null,
      city: location.city,
      region: location.region,
      country: location.country,
      countryCode: location.countryCode,
      source: location.source,
      accuracyMeters: location.accuracyMeters,
      lastUpdatedAt: location.lastUpdatedAt,
    };
  }

  /**
   * Capture user's location from IP address (called on login)
   */
  async captureLocationFromIP(userId: string, ipAddress: string) {
    try {
      const ipLocation = await this.geolocationService.getLocationFromIP(ipAddress);

      if (!ipLocation) {
        this.logger.debug(`No location found for IP: ${ipAddress}`);
        return null;
      }

      // Check if user already has a manual/browser location set
      const existingLocation = await this.prisma.userLocation.findUnique({
        where: { userId },
      });

      // Don't overwrite manual or browser locations with IP-based location
      if (existingLocation && existingLocation.source !== 'ip') {
        this.logger.debug(`User ${userId} has non-IP location, skipping IP update`);
        return existingLocation;
      }

      // Try to find matching city in database
      let cityId: string | null = null;
      if (ipLocation.city) {
        const city = await this.prisma.city.findFirst({
          where: {
            name: { equals: ipLocation.city, mode: 'insensitive' },
            countryCode: ipLocation.countryCode ?? undefined,
          },
        });
        cityId = city?.id ?? null;
      }

      const location = await this.prisma.userLocation.upsert({
        where: { userId },
        update: {
          latitude: ipLocation.latitude,
          longitude: ipLocation.longitude,
          city: ipLocation.city,
          cityId,
          region: ipLocation.region,
          country: ipLocation.country,
          countryCode: ipLocation.countryCode,
          source: 'ip' as LocationSource,
          lastUpdatedAt: new Date(),
        },
        create: {
          userId,
          latitude: ipLocation.latitude,
          longitude: ipLocation.longitude,
          city: ipLocation.city,
          cityId,
          region: ipLocation.region,
          country: ipLocation.country,
          countryCode: ipLocation.countryCode,
          source: 'ip' as LocationSource,
        },
      });

      this.logger.log(`Captured IP location for user ${userId}: ${ipLocation.city}, ${ipLocation.country}`);

      return {
        latitude: location.latitude ? Number(location.latitude) : null,
        longitude: location.longitude ? Number(location.longitude) : null,
        city: location.city,
        region: location.region,
        country: location.country,
        countryCode: location.countryCode,
        source: location.source,
        lastUpdatedAt: location.lastUpdatedAt,
      };
    } catch (error) {
      this.logger.error(`Failed to capture IP location for user ${userId}`, error);
      return null;
    }
  }

  /**
   * Clear user's stored location
   */
  async clearUserLocation(userId: string) {
    await this.prisma.userLocation.deleteMany({
      where: { userId },
    });

    return { message: 'Location cleared successfully' };
  }
}
