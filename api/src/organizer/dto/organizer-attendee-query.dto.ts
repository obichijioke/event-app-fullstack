import { ApiPropertyOptional } from '@nestjs/swagger';
import { TicketStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class OrganizerAttendeeQueryDto {
  @ApiPropertyOptional({ description: 'Organization ID' })
  @IsOptional()
  @IsString()
  orgId?: string;

  @ApiPropertyOptional({
    description: 'Search by attendee name, email, or ticket code',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: TicketStatus })
  @IsOptional()
  @IsEnum(TicketStatus)
  status?: TicketStatus;
}
