import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class OrganizerTransferTicketDto {
  @ApiProperty({
    description: 'User ID that should receive ownership of the ticket',
  })
  @IsString()
  toUserId: string;
}
