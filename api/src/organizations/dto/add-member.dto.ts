import { IsEmail, IsEnum, IsString, IsOptional } from 'class-validator';
import { OrgMemberRole } from '@prisma/client';

export class AddMemberDto {
  @IsEmail()
  email: string;

  @IsEnum(OrgMemberRole)
  role: OrgMemberRole;
}
