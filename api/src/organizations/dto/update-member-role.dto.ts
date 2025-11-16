import { IsEnum } from 'class-validator';
import { OrgMemberRole } from '@prisma/client';

export class UpdateMemberRoleDto {
  @IsEnum(OrgMemberRole)
  role: OrgMemberRole;
}
