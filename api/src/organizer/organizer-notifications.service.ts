import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { ModerationStatus, OrgMemberRole, PayoutStatus } from '@prisma/client';
import { checkOrgPermission, serializeResponse } from '../common/utils';

@Injectable()
export class OrganizerNotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(orgId: string, userId: string) {
    const membership = await checkOrgPermission(
      this.prisma,
      orgId,
      userId,
      [
        OrgMemberRole.owner,
        OrgMemberRole.manager,
        OrgMemberRole.finance,
        OrgMemberRole.staff,
      ],
      'You are not a member of this organization',
    );

    const [flags, payouts] = await this.prisma.$transaction([
      this.prisma.flag.findMany({
        where: {
          status: {
            notIn: [ModerationStatus.resolved, ModerationStatus.approved],
          },
          event: {
            orgId,
          },
        },
        include: {
          event: {
            select: {
              id: true,
              title: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.payout.findMany({
        where: {
          orgId,
          status: {
            in: [
              PayoutStatus.pending,
              PayoutStatus.in_review,
              PayoutStatus.failed,
            ],
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
    ]);

    return serializeResponse({
      role: membership.role,
      moderationFlags: flags,
      payouts,
    });
  }

  async resolveFlag(orgId: string, userId: string, flagId: string) {
    await checkOrgPermission(
      this.prisma,
      orgId,
      userId,
      [
        OrgMemberRole.owner,
        OrgMemberRole.manager,
        OrgMemberRole.finance,
        OrgMemberRole.staff,
      ],
      'You are not a member of this organization',
    );

    const flag = await this.prisma.flag.findUnique({
      where: { id: flagId },
      include: {
        event: true,
      },
    });

    if (!flag || flag.event?.orgId !== orgId) {
      throw new NotFoundException('Flag not found');
    }

    const updated = await this.prisma.flag.update({
      where: { id: flag.id },
      data: {
        status: ModerationStatus.resolved,
        resolvedAt: new Date(),
      },
    });

    return updated;
  }
}
