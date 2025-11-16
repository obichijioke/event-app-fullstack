import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  TaxRateQueryDto,
  CreateTaxRateDto,
  UpdateTaxRateDto,
} from '../dto/tax-rate.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class AdminTaxRateService {
  constructor(private prisma: PrismaService) {}

  async getTaxRates(query: TaxRateQueryDto) {
    const {
      page = 1,
      limit = 10,
      search,
      country,
      region,
      city,
      active,
      sortBy,
      sortOrder,
    } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.TaxRateWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { postal: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (country) {
      where.country = country;
    }

    if (region) {
      where.region = { contains: region, mode: 'insensitive' };
    }

    if (city) {
      where.city = { contains: city, mode: 'insensitive' };
    }

    if (active !== undefined) {
      where.active = active;
    }

    const orderBy: Prisma.TaxRateOrderByWithRelationInput = {};
    if (sortBy) {
      const allowedSortFields = [
        'id',
        'country',
        'region',
        'city',
        'postal',
        'rate',
        'name',
        'active',
        'createdAt',
      ] as const;
      if (!allowedSortFields.includes(sortBy as any)) {
        throw new BadRequestException(`Invalid sort field: ${sortBy}`);
      }
      orderBy[sortBy] = sortOrder || 'desc';
    } else {
      orderBy.createdAt = 'desc';
    }

    const [taxRates, total] = await Promise.all([
      this.prisma.taxRate.findMany({
        where,
        skip,
        take: limit,
        orderBy,
      }),
      this.prisma.taxRate.count({ where }),
    ]);

    return {
      data: taxRates,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getTaxRate(taxRateId: string) {
    const taxRate = await this.prisma.taxRate.findUnique({
      where: { id: taxRateId },
    });

    if (!taxRate) {
      throw new NotFoundException('Tax rate not found');
    }

    return taxRate;
  }

  async createTaxRate(dto: CreateTaxRateDto) {
    const { country, region, city, postal, rate, name, active } = dto;

    // Check for duplicate tax rate in the same location
    const existingTaxRate = await this.prisma.taxRate.findFirst({
      where: {
        country,
        region: region || null,
        city: city || null,
        postal: postal || null,
        active: true,
      },
    });

    if (existingTaxRate) {
      throw new ConflictException(
        'An active tax rate already exists for this location',
      );
    }

    const taxRate = await this.prisma.taxRate.create({
      data: {
        country,
        region: region || null,
        city: city || null,
        postal: postal || null,
        rate,
        name,
        active: active !== undefined ? active : true,
      },
    });

    return taxRate;
  }

  async updateTaxRate(taxRateId: string, dto: UpdateTaxRateDto) {
    const taxRate = await this.prisma.taxRate.findUnique({
      where: { id: taxRateId },
    });

    if (!taxRate) {
      throw new NotFoundException('Tax rate not found');
    }

    // If updating location fields, check for duplicates
    if (dto.country || dto.region || dto.city || dto.postal) {
      const existingTaxRate = await this.prisma.taxRate.findFirst({
        where: {
          id: { not: taxRateId },
          country: dto.country || taxRate.country,
          region: dto.region !== undefined ? dto.region : taxRate.region,
          city: dto.city !== undefined ? dto.city : taxRate.city,
          postal: dto.postal !== undefined ? dto.postal : taxRate.postal,
          active: true,
        },
      });

      if (existingTaxRate) {
        throw new ConflictException(
          'An active tax rate already exists for this location',
        );
      }
    }

    const updatedTaxRate = await this.prisma.taxRate.update({
      where: { id: taxRateId },
      data: {
        ...dto,
        ...(dto.region !== undefined && { region: dto.region || null }),
        ...(dto.city !== undefined && { city: dto.city || null }),
        ...(dto.postal !== undefined && { postal: dto.postal || null }),
      },
    });

    return updatedTaxRate;
  }

  async deleteTaxRate(taxRateId: string) {
    const taxRate = await this.prisma.taxRate.findUnique({
      where: { id: taxRateId },
    });

    if (!taxRate) {
      throw new NotFoundException('Tax rate not found');
    }

    await this.prisma.taxRate.delete({
      where: { id: taxRateId },
    });

    return { message: 'Tax rate deleted successfully' };
  }

  async deactivateTaxRate(taxRateId: string) {
    const taxRate = await this.prisma.taxRate.findUnique({
      where: { id: taxRateId },
    });

    if (!taxRate) {
      throw new NotFoundException('Tax rate not found');
    }

    await this.prisma.taxRate.update({
      where: { id: taxRateId },
      data: { active: false },
    });

    return { message: 'Tax rate deactivated successfully' };
  }

  async getTaxRatesByCountry(country: string) {
    const taxRates = await this.prisma.taxRate.findMany({
      where: {
        country,
        active: true,
      },
      orderBy: [
        { region: 'asc' },
        { city: 'asc' },
        { postal: 'asc' },
      ],
    });

    return taxRates;
  }

  async getTaxRateStats() {
    const [total, active, countries, avgRate] = await Promise.all([
      this.prisma.taxRate.count(),
      this.prisma.taxRate.count({ where: { active: true } }),
      this.prisma.taxRate.groupBy({
        by: ['country'],
        _count: true,
      }),
      this.prisma.taxRate.aggregate({
        _avg: {
          rate: true,
        },
        where: {
          active: true,
        },
      }),
    ]);

    return {
      total,
      active,
      countriesCount: countries.length,
      averageRate: avgRate._avg.rate
        ? Number(avgRate._avg.rate).toFixed(4)
        : '0',
    };
  }
}
