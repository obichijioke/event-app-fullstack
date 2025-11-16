import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { UserFollowsService } from './user-follows.service';
import { OrgMemberRole, PlatformRole } from '@prisma/client';
import { checkOrgPermission, checkOwnerPermission } from '../common/utils';

@Injectable()
export class OrganizationsService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => UserFollowsService))
    private userFollowsService: UserFollowsService,
  ) {}

  async create(userId: string, createOrganizationDto: CreateOrganizationDto) {
    const { name, type, legalName, website, country, supportEmail, taxId } =
      createOrganizationDto;

    // Create organization with user as owner
    const organization = await this.prisma.organization.create({
      data: {
        ownerId: userId,
        name,
        type,
        legalName,
        website,
        country,
        supportEmail,
        taxId,
        members: {
          create: {
            userId,
            role: OrgMemberRole.owner,
          },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return organization;
  }

  async createPersonalOrganization(
    userId: string,
    dto: { name: string; country?: string },
  ) {
    // Check if user already has a personal organization
    const existingPersonalOrg = await this.prisma.organization.findFirst({
      where: {
        ownerId: userId,
        type: 'personal',
      },
    });

    if (existingPersonalOrg) {
      // Return existing personal organization instead of creating a new one
      return existingPersonalOrg;
    }

    // Create a simplified personal organization
    const organization = await this.prisma.organization.create({
      data: {
        ownerId: userId,
        name: dto.name,
        type: 'personal',
        country: dto.country,
        status: 'approved', // Auto-approve personal organizations
        verifiedAt: new Date(),
        trustScore: 50, // Start with moderate trust score
        members: {
          create: {
            userId,
            role: OrgMemberRole.owner,
          },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return organization;
  }

  async getOrCreatePersonalOrganization(userId: string) {
    // Check if user has any organization
    const existingOrg = await this.prisma.organization.findFirst({
      where: {
        members: {
          some: {
            userId,
          },
        },
      },
    });

    if (existingOrg) {
      return existingOrg;
    }

    // User has no organization, create a personal one
    // Get user details to auto-generate organization name
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true },
    });

    const orgName = user?.name ? `${user.name}'s Events` : 'My Events';

    return this.createPersonalOrganization(userId, { name: orgName });
  }

  async findAll(userId: string) {
    // Get organizations where user is a member
    const organizations = await this.prisma.organization.findMany({
      where: {
        members: {
          some: {
            userId,
          },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
          },
        },
        _count: {
          select: {
            events: true,
            members: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Map organizations to include the current user's role
    return organizations.map((org) => {
      const userMembership = org.members.find((m) => m.userId === userId);
      return {
        ...org,
        role: userMembership?.role,
      };
    });
  }

  async findOne(id: string, userId: string) {
    // Check if user is a member of the organization
    const membership = await this.prisma.orgMember.findUnique({
      where: {
        orgId_userId: {
          orgId: id,
          userId,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this organization');
    }

    const organization = await this.prisma.organization.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
          },
        },
        venues: true,
        events: {
          take: 5,
          orderBy: {
            createdAt: 'desc',
          },
        },
        _count: {
          select: {
            events: true,
            members: true,
            venues: true,
          },
        },
      },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    // Add follower count and isFollowing status
    const followerCount = await this.userFollowsService.getFollowerCount(id);
    const isFollowing = await this.userFollowsService.isFollowing(userId, id);

    return {
      ...organization,
      followerCount,
      isFollowing,
    };
  }

  async update(
    id: string,
    userId: string,
    updateOrganizationDto: UpdateOrganizationDto,
  ) {
    // Check if user is owner or manager
    await checkOrgPermission(
      this.prisma,
      id,
      userId,
      undefined,
      'You do not have permission to update this organization',
    );

    const organization = await this.prisma.organization.update({
      where: { id },
      data: updateOrganizationDto,
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return organization;
  }

  async remove(id: string, userId: string) {
    // Check if user is owner
    await checkOwnerPermission(
      this.prisma,
      id,
      userId,
      'Only the owner can delete this organization',
    );

    await this.prisma.organization.delete({
      where: { id },
    });

    return { message: 'Organization deleted successfully' };
  }

  async addMember(orgId: string, userId: string, addMemberDto: AddMemberDto) {
    // Check if user is owner or manager
    await checkOrgPermission(
      this.prisma,
      orgId,
      userId,
      undefined,
      'You do not have permission to add members to this organization',
    );

    // Find the user to add
    const userToAdd = await this.prisma.user.findUnique({
      where: { email: addMemberDto.email },
    });

    if (!userToAdd) {
      throw new NotFoundException('User with this email does not exist');
    }

    // Check if user is already a member
    const existingMembership = await this.prisma.orgMember.findUnique({
      where: {
        orgId_userId: {
          orgId,
          userId: userToAdd.id,
        },
      },
    });

    if (existingMembership) {
      throw new ConflictException(
        'User is already a member of this organization',
      );
    }

    // Add the member
    const newMember = await this.prisma.orgMember.create({
      data: {
        orgId,
        userId: userToAdd.id,
        role: addMemberDto.role,
        invitedBy: userId,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    return newMember;
  }

  async updateMemberRole(
    orgId: string,
    userId: string,
    memberId: string,
    updateMemberRoleDto: UpdateMemberRoleDto,
  ) {
    // Check if user is owner
    await checkOwnerPermission(
      this.prisma,
      orgId,
      userId,
      'Only the owner can update member roles',
    );

    // Cannot change the role of the owner
    const memberToUpdate = await this.prisma.orgMember.findUnique({
      where: {
        orgId_userId: {
          orgId,
          userId: memberId,
        },
      },
    });

    if (!memberToUpdate) {
      throw new NotFoundException('Member not found');
    }

    if (memberToUpdate.role === OrgMemberRole.owner) {
      throw new ForbiddenException('Cannot change the role of the owner');
    }

    // Update the member role
    const updatedMember = await this.prisma.orgMember.update({
      where: {
        orgId_userId: {
          orgId,
          userId: memberId,
        },
      },
      data: {
        role: updateMemberRoleDto.role,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    return updatedMember;
  }

  async removeMember(orgId: string, userId: string, memberId: string) {
    // Check if user is owner or if user is removing themselves
    const membership = await this.prisma.orgMember.findUnique({
      where: {
        orgId_userId: {
          orgId,
          userId,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this organization');
    }

    // Cannot remove the owner
    const memberToRemove = await this.prisma.orgMember.findUnique({
      where: {
        orgId_userId: {
          orgId,
          userId: memberId,
        },
      },
    });

    if (!memberToRemove) {
      throw new NotFoundException('Member not found');
    }

    if (memberToRemove.role === OrgMemberRole.owner) {
      throw new ForbiddenException(
        'Cannot remove the owner from the organization',
      );
    }

    // Only owner can remove other members, but any member can remove themselves
    if (membership.role !== OrgMemberRole.owner && userId !== memberId) {
      throw new ForbiddenException(
        'You can only remove yourself from the organization',
      );
    }

    await this.prisma.orgMember.delete({
      where: {
        orgId_userId: {
          orgId,
          userId: memberId,
        },
      },
    });

    return { message: 'Member removed successfully' };
  }

  async getMembers(orgId: string, userId: string) {
    // Check if user is a member of the organization
    const membership = await this.prisma.orgMember.findUnique({
      where: {
        orgId_userId: {
          orgId,
          userId,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this organization');
    }

    const members = await this.prisma.orgMember.findMany({
      where: {
        orgId,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return members;
  }

  /**
   * Public method to fetch all organizers (organizations) with basic info
   */
  async findAllPublic() {
    const organizations = await this.prisma.organization.findMany({
      where: {
        status: 'approved' as any,
        events: {
          some: {
            status: 'live',
          },
        },
      },
      select: {
        id: true,
        name: true,
        website: true,
        country: true,
        createdAt: true,
        _count: {
          select: {
            events: {
              where: {
                status: 'live',
              },
            },
            followers: true,
          },
        },
        events: {
          where: {
            status: 'live',
            startAt: {
              gte: new Date(),
            },
          },
          select: {
            id: true,
            title: true,
            startAt: true,
          },
          take: 3,
          orderBy: {
            startAt: 'asc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return organizations.map((org) => ({
      id: org.id,
      name: org.name,
      website: org.website,
      country: org.country,
      followerCount: org._count.followers,
      eventCount: org._count.events,
      upcomingEvents: org.events.map((event) => ({
        id: event.id,
        title: event.title,
        startAt: event.startAt.toISOString(),
      })),
    }));
  }

  /**
   * Public method to fetch a single organizer by ID
   */
  async findOnePublic(id: string) {
    const organization = await this.prisma.organization.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        website: true,
        country: true,
        createdAt: true,
        _count: {
          select: {
            events: {
              where: {
                status: 'live',
              },
            },
            followers: true,
          },
        },
        events: {
          where: {
            status: 'live',
            startAt: {
              gte: new Date(),
            },
          },
          select: {
            id: true,
            title: true,
            startAt: true,
            endAt: true,
            coverImageUrl: true,
            venue: {
              select: {
                name: true,
                address: true,
              },
            },
          },
          take: 20,
          orderBy: {
            startAt: 'asc',
          },
        },
      },
    });

    if (!organization) {
      throw new NotFoundException('Organizer not found');
    }

    return {
      id: organization.id,
      name: organization.name,
      website: organization.website,
      country: organization.country,
      followerCount: organization._count.followers,
      eventCount: organization._count.events,
      upcomingEvents: organization.events.map((event) => ({
        id: event.id,
        title: event.title,
        startAt: event.startAt.toISOString(),
        endAt: event.endAt.toISOString(),
        coverImageUrl: event.coverImageUrl,
        venue: event.venue,
      })),
    };
  }
}
