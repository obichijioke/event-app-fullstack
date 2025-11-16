import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class AdminCategoryService {
  constructor(private prisma: PrismaService) {}

  async getCategories(query?: { search?: string; parentOnly?: boolean }) {
    const where: Prisma.CategoryWhereInput = {};

    if (query?.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { slug: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query?.parentOnly) {
      where.parentId = null;
    }

    const categories = await this.prisma.category.findMany({
      where,
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        children: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        _count: {
          select: {
            events: true,
            children: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      parentId: cat.parentId,
      parent: cat.parent,
      children: cat.children,
      eventCount: cat._count.events,
      childrenCount: cat._count.children,
    }));
  }

  async getCategoryById(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        children: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        _count: {
          select: {
            events: true,
            children: true,
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      parentId: category.parentId,
      parent: category.parent,
      children: category.children,
      eventCount: category._count.events,
      childrenCount: category._count.children,
    };
  }

  async createCategory(data: {
    name: string;
    slug: string;
    parentId?: string;
  }) {
    const existing = await this.prisma.category.findUnique({
      where: { slug: data.slug },
    });

    if (existing) {
      throw new BadRequestException('Category with this slug already exists');
    }

    if (data.parentId) {
      const parent = await this.prisma.category.findUnique({
        where: { id: data.parentId },
      });

      if (!parent) {
        throw new NotFoundException('Parent category not found');
      }
    }

    const category = await this.prisma.category.create({
      data: {
        name: data.name,
        slug: data.slug,
        parentId: data.parentId || null,
      },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    return category;
  }

  async updateCategory(
    id: string,
    data: { name?: string; slug?: string; parentId?: string | null },
  ) {
    const existing = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Category not found');
    }

    if (data.slug && data.slug !== existing.slug) {
      const slugExists = await this.prisma.category.findUnique({
        where: { slug: data.slug },
      });

      if (slugExists) {
        throw new BadRequestException('Category with this slug already exists');
      }
    }

    if (data.parentId !== undefined && data.parentId !== null) {
      if (data.parentId === id) {
        throw new Error('Category cannot be its own parent');
      }

      const parent = await this.prisma.category.findUnique({
        where: { id: data.parentId },
      });

      if (!parent) {
        throw new NotFoundException('Parent category not found');
      }

      if (parent.parentId === id) {
        throw new BadRequestException(
          'Cannot create circular category reference',
        );
      }
    }

    const category = await this.prisma.category.update({
      where: { id },
      data: {
        name: data.name,
        slug: data.slug,
        parentId: data.parentId === null ? null : data.parentId,
      },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    return category;
  }

  async deleteCategory(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            events: true,
            children: true,
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    if (category._count.events > 0) {
      throw new BadRequestException(
        `Cannot delete category with ${category._count.events} associated events`,
      );
    }

    if (category._count.children > 0) {
      throw new BadRequestException(
        `Cannot delete category with ${category._count.children} subcategories`,
      );
    }

    await this.prisma.category.delete({
      where: { id },
    });

    return { success: true, message: 'Category deleted successfully' };
  }
}
