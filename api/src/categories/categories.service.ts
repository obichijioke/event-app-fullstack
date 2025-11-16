import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.category.findMany({
      select: {
        id: true,
        slug: true,
        name: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }
}
