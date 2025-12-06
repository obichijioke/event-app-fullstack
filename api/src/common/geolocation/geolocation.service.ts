import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import {
  IPLocation,
  IpApiResponse,
  CityCoordinates,
} from './geolocation.types';

@Injectable()
export class GeolocationService {
  private readonly logger = new Logger(GeolocationService.name);
  private readonly IP_API_BASE_URL = 'http://ip-api.com/json';
  private readonly CACHE_TTL_SECONDS = 86400; // 24 hours for IP cache
  private readonly CITY_CACHE_TTL_SECONDS = 604800; // 7 days for city cache

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  /**
   * Get location from IP address using ip-api.com
   * Results are cached for 24 hours
   */
  async getLocationFromIP(ipAddress: string): Promise<IPLocation | null> {
    // Skip for localhost/private IPs
    if (this.isPrivateIP(ipAddress)) {
      this.logger.debug(`Skipping geolocation for private IP: ${ipAddress}`);
      return null;
    }

    // Check cache first
    const cacheKey = `ip-geo:${ipAddress}`;
    try {
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        this.logger.debug(`IP geolocation cache hit for ${ipAddress}`);
        return JSON.parse(cached);
      }
    } catch (error) {
      this.logger.warn('Redis cache read error', error);
    }

    try {
      // Call ip-api.com (free tier: 45 requests/minute)
      const response = await firstValueFrom(
        this.httpService.get<IpApiResponse>(`${this.IP_API_BASE_URL}/${ipAddress}`, {
          timeout: 5000,
        }),
      );

      if (response.data.status !== 'success') {
        this.logger.warn(`IP geolocation failed for ${ipAddress}: ${response.data.message}`);
        return null;
      }

      const location: IPLocation = {
        ip: ipAddress,
        latitude: response.data.lat ?? 0,
        longitude: response.data.lon ?? 0,
        city: response.data.city ?? null,
        region: response.data.regionName ?? null,
        country: response.data.country ?? null,
        countryCode: response.data.countryCode ?? null,
        timezone: response.data.timezone ?? null,
      };

      // Cache the result
      try {
        await this.redis.set(cacheKey, JSON.stringify(location), this.CACHE_TTL_SECONDS);
      } catch (error) {
        this.logger.warn('Redis cache write error', error);
      }

      return location;
    } catch (error) {
      this.logger.error(`IP geolocation API error for ${ipAddress}`, error);
      return null;
    }
  }

  /**
   * Resolve city name to coordinates
   * First checks local database, then falls back to geocoding API
   */
  async resolveCityToCoordinates(
    cityName: string,
    countryCode?: string,
  ): Promise<CityCoordinates | null> {
    // Check cache first
    const cacheKey = `city-geo:${cityName.toLowerCase()}:${countryCode?.toLowerCase() ?? 'any'}`;
    try {
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        this.logger.debug(`City cache hit for ${cityName}`);
        return JSON.parse(cached);
      }
    } catch (error) {
      this.logger.warn('Redis cache read error', error);
    }

    // Try local database first
    const city = await this.findCityInDatabase(cityName, countryCode);
    if (city) {
      const result: CityCoordinates = {
        latitude: Number(city.latitude),
        longitude: Number(city.longitude),
        cityId: city.id,
        cityName: city.name,
        country: city.countryName,
        countryCode: city.countryCode,
      };

      // Cache the result
      try {
        await this.redis.set(cacheKey, JSON.stringify(result), this.CITY_CACHE_TTL_SECONDS);
      } catch (error) {
        this.logger.warn('Redis cache write error', error);
      }

      return result;
    }

    // Could add external geocoding API fallback here if needed
    // For now, just return null if not found in database
    this.logger.debug(`City not found in database: ${cityName}`);
    return null;
  }

  /**
   * Find a city in the local database
   */
  private async findCityInDatabase(
    cityName: string,
    countryCode?: string,
  ) {
    const normalizedName = cityName.toLowerCase().trim();

    // Try exact match first
    const exactMatch = await this.prisma.city.findFirst({
      where: {
        OR: [
          { name: { equals: normalizedName, mode: 'insensitive' } },
          { aliases: { has: normalizedName } },
        ],
        ...(countryCode && { countryCode: countryCode.toUpperCase() }),
      },
    });

    if (exactMatch) {
      return exactMatch;
    }

    // Try partial match for major cities
    const partialMatch = await this.prisma.city.findFirst({
      where: {
        name: { contains: normalizedName, mode: 'insensitive' },
        isMajor: true,
        ...(countryCode && { countryCode: countryCode.toUpperCase() }),
      },
      orderBy: { population: 'desc' },
    });

    return partialMatch;
  }

  /**
   * Check if an IP address is private/local
   */
  private isPrivateIP(ip: string): boolean {
    // IPv4 private ranges
    const privateRanges = [
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
      /^192\.168\./,
      /^127\./,
      /^localhost$/i,
      /^::1$/,
      /^fe80:/i,
    ];

    return privateRanges.some(range => range.test(ip));
  }

  /**
   * Get city by ID
   */
  async getCityById(cityId: string) {
    return this.prisma.city.findUnique({
      where: { id: cityId },
      include: { region: true },
    });
  }

  /**
   * Search cities by name
   */
  async searchCities(query: string, limit: number = 10, countryCode?: string) {
    const normalizedQuery = query.toLowerCase().trim();

    return this.prisma.city.findMany({
      where: {
        OR: [
          { name: { contains: normalizedQuery, mode: 'insensitive' } },
          { aliases: { has: normalizedQuery } },
        ],
        ...(countryCode && { countryCode: countryCode.toUpperCase() }),
      },
      orderBy: [
        { isMajor: 'desc' },
        { population: 'desc' },
      ],
      take: limit,
    });
  }

  /**
   * Get popular/major cities
   */
  async getMajorCities(countryCode?: string, limit: number = 20) {
    return this.prisma.city.findMany({
      where: {
        isMajor: true,
        ...(countryCode && { countryCode: countryCode.toUpperCase() }),
      },
      orderBy: { population: 'desc' },
      take: limit,
    });
  }
}
