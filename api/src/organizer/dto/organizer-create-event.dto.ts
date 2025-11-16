import { CreateEventDto } from '../../events/dto/create-event.dto';
import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class OrganizerCreateEventDto extends CreateEventDto {
  @ApiProperty({ description: 'Organization ID that owns the event' })
  @IsString()
  orgId: string;
}
