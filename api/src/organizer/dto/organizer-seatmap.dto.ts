import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class AssignSeatmapDto {
  @ApiProperty({ description: 'Seatmap ID to assign to the event' })
  @IsNotEmpty()
  @IsString()
  seatmapId: string;
}
