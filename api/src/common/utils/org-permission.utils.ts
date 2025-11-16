import { ForbiddenException } from '@nestjs/common';
import { OrgMemberRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Default roles that have management permissions in an organization
 */
export const DEFAULT_MANAGEMENT_ROLES: OrgMemberRole[] = [
  OrgMemberRole.owner,
  OrgMemberRole.manager,
];

/**
 * Roles that have financial access permissions
 */
export const FINANCE_ROLES: OrgMemberRole[] = [
  OrgMemberRole.owner,
  OrgMemberRole.manager,
  OrgMemberRole.finance,
];

/**
 * Owner-only permissions
 */
export const OWNER_ONLY_ROLES: OrgMemberRole[] = [OrgMemberRole.owner];

/**
 * Check if a user has permission to perform actions in an organization
 * @param prisma PrismaService instance
 * @param orgId Organization ID
 * @param userId User ID
 * @param allowedRoles Array of allowed roles (defaults to owner + manager)
 * @param errorMessage Custom error message (optional)
 * @returns The membership object if permission is granted
 * @throws ForbiddenException if permission is denied
 */
export async function checkOrgPermission(
  prisma: PrismaService,
  orgId: string,
  userId: string,
  allowedRoles: OrgMemberRole[] = DEFAULT_MANAGEMENT_ROLES,
  errorMessage?: string,
) {
  const membership = await prisma.orgMember.findUnique({
    where: {
      orgId_userId: {
        orgId,
        userId,
      },
    },
  });

  if (!membership || !allowedRoles.includes(membership.role)) {
    throw new ForbiddenException(
      errorMessage ||
        'You do not have permission to perform this action in this organization',
    );
  }

  return membership;
}

/**
 * Check if user has finance access to an organization
 * @param prisma PrismaService instance
 * @param orgId Organization ID
 * @param userId User ID
 * @param errorMessage Custom error message (optional)
 * @returns The membership object if permission is granted
 */
export async function checkFinancePermission(
  prisma: PrismaService,
  orgId: string,
  userId: string,
  errorMessage?: string,
) {
  return checkOrgPermission(
    prisma,
    orgId,
    userId,
    FINANCE_ROLES,
    errorMessage ||
      'You do not have permission to manage finances for this organization',
  );
}

/**
 * Check if user is the owner of an organization
 * @param prisma PrismaService instance
 * @param orgId Organization ID
 * @param userId User ID
 * @param errorMessage Custom error message (optional)
 * @returns The membership object if permission is granted
 */
export async function checkOwnerPermission(
  prisma: PrismaService,
  orgId: string,
  userId: string,
  errorMessage?: string,
) {
  return checkOrgPermission(
    prisma,
    orgId,
    userId,
    OWNER_ONLY_ROLES,
    errorMessage || 'Only the organization owner can perform this action',
  );
}
