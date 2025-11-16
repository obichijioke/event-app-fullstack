import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class UserFollowsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Follow an organization
   */
  async follow(userId: string, organizationId: string) {
    // Check if organization exists
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    // Check if already following
    const existing = await this.prisma.userFollow.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId,
        },
      },
    });

    if (existing) {
      throw new ConflictException('Already following this organization');
    }

    // Create follow record
    return this.prisma.userFollow.create({
      data: {
        userId,
        organizationId,
      },
    });
  }

  /**
   * Unfollow an organization
   */
  async unfollow(userId: string, organizationId: string) {
    const follow = await this.prisma.userFollow.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId,
        },
      },
    });

    if (!follow) {
      throw new NotFoundException('Not following this organization');
    }

    await this.prisma.userFollow.delete({
      where: {
        userId_organizationId: {
          userId,
          organizationId,
        },
      },
    });

    return { message: 'Successfully unfollowed organization' };
  }

  /**
   * Get list of organizations a user is following
   */
  async getFollowing(userId: string) {
    const follows = await this.prisma.userFollow.findMany({
      where: { userId },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            legalName: true,
            website: true,
            country: true,
            status: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return follows.map((follow) => ({
      id: follow.id,
      organizationId: follow.organizationId,
      organization: follow.organization,
      followedAt: follow.createdAt,
    }));
  }

  /**
   * Get followers of an organization
   */
  async getFollowers(organizationId: string, includeUsers: boolean = false) {
    const count = await this.prisma.userFollow.count({
      where: { organizationId },
    });

    if (!includeUsers) {
      return { count };
    }

    const followers = await this.prisma.userFollow.findMany({
      where: { organizationId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      total: count,
      followers: followers.map((follow) => ({
        id: follow.id,
        userId: follow.userId,
        user: follow.user,
        createdAt: follow.createdAt,
      })),
    };
  }

  /**
   * Check if a user is following an organization
   */
  async isFollowing(userId: string, organizationId: string): Promise<boolean> {
    const follow = await this.prisma.userFollow.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId,
        },
      },
    });

    return !!follow;
  }

  /**
   * Get follower count for an organization
   */
  async getFollowerCount(organizationId: string): Promise<number> {
    return this.prisma.userFollow.count({
      where: { organizationId },
    });
  }

  /**
   * Get follower counts for multiple organizations
   */
  async getFollowerCounts(
    organizationIds: string[],
  ): Promise<Map<string, number>> {
    const counts = await this.prisma.userFollow.groupBy({
      by: ['organizationId'],
      where: {
        organizationId: { in: organizationIds },
      },
      _count: {
        organizationId: true,
      },
    });

    const countMap = new Map<string, number>();
    counts.forEach((count) => {
      countMap.set(count.organizationId, count._count.organizationId);
    });

    // Fill in zeros for organizations with no followers
    organizationIds.forEach((id) => {
      if (!countMap.has(id)) {
        countMap.set(id, 0);
      }
    });

    return countMap;
  }

  /**
   * Check if user is following multiple organizations
   */
  async areFollowing(
    userId: string,
    organizationIds: string[],
  ): Promise<Map<string, boolean>> {
    const follows = await this.prisma.userFollow.findMany({
      where: {
        userId,
        organizationId: { in: organizationIds },
      },
      select: { organizationId: true },
    });

    const followMap = new Map<string, boolean>();
    const followingIds = new Set(follows.map((f) => f.organizationId));

    organizationIds.forEach((id) => {
      followMap.set(id, followingIds.has(id));
    });

    return followMap;
  }
}
