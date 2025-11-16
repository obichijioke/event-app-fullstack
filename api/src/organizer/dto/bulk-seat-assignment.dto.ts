import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsString } from 'class-validator';

export class BulkSeatAssignmentDto {
  @ApiProperty({
    type: [String],
    description: 'Seat IDs to assign to the ticket type',
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  seatIds: string[];
}
