import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { SearchCitiesDto } from './dto/search-cities.dto';

@Injectable()
export class CityService {
  private readonly logger = new Logger(CityService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Search cities by name or alias
   */
  async searchCities(dto: SearchCitiesDto) {
    const { q, country, major, limit = 10 } = dto;

    const where: Record<string, unknown> = {};

    if (q) {
      const normalizedQuery = q.toLowerCase().trim();
      where.OR = [
        { name: { contains: normalizedQuery, mode: 'insensitive' } },
        { aliases: { has: normalizedQuery } },
      ];
    }

    if (country) {
      where.countryCode = country.toUpperCase();
    }

    if (major) {
      where.isMajor = true;
    }

    const cities = await this.prisma.city.findMany({
      where,
      orderBy: [
        { isMajor: 'desc' },
        { population: 'desc' },
      ],
      take: limit,
    });

    return cities.map(city => this.formatCity(city));
  }

  /**
   * Get popular/major cities
   */
  async getPopularCities(countryCode?: string, limit: number = 20) {
    const cities = await this.prisma.city.findMany({
      where: {
        isMajor: true,
        ...(countryCode && { countryCode: countryCode.toUpperCase() }),
      },
      orderBy: { population: 'desc' },
      take: limit,
    });

    return cities.map(city => this.formatCity(city));
  }

  /**
   * Get city by ID
   */
  async getCityById(id: string) {
    const city = await this.prisma.city.findUnique({
      where: { id },
      include: { region: true },
    });

    if (!city) return null;

    return this.formatCity(city);
  }

  /**
   * Find city by name
   */
  async findByName(name: string, countryCode?: string) {
    const normalizedName = name.toLowerCase().trim();

    const city = await this.prisma.city.findFirst({
      where: {
        OR: [
          { name: { equals: normalizedName, mode: 'insensitive' } },
          { aliases: { has: normalizedName } },
        ],
        ...(countryCode && { countryCode: countryCode.toUpperCase() }),
      },
    });

    if (!city) return null;

    return this.formatCity(city);
  }

  /**
   * Get cities by country
   */
  async getCitiesByCountry(countryCode: string, limit: number = 50) {
    const cities = await this.prisma.city.findMany({
      where: { countryCode: countryCode.toUpperCase() },
      orderBy: [
        { isMajor: 'desc' },
        { population: 'desc' },
      ],
      take: limit,
    });

    return cities.map(city => this.formatCity(city));
  }

  /**
   * Get unique countries from cities
   */
  async getCountries() {
    const countries = await this.prisma.city.findMany({
      select: {
        countryCode: true,
        countryName: true,
      },
      distinct: ['countryCode'],
      orderBy: { countryName: 'asc' },
    });

    return countries;
  }

  /**
   * Format city for response
   */
  private formatCity(city: {
    id: string;
    name: string;
    countryCode: string;
    countryName: string;
    latitude: unknown;
    longitude: unknown;
    timezone: string | null;
    population: number | null;
    isMajor: boolean;
    aliases: string[];
  }) {
    return {
      id: city.id,
      name: city.name,
      countryCode: city.countryCode,
      countryName: city.countryName,
      latitude: Number(city.latitude),
      longitude: Number(city.longitude),
      timezone: city.timezone,
      population: city.population,
      isMajor: city.isMajor,
      aliases: city.aliases,
    };
  }
}
