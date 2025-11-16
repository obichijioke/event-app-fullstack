import { IsString } from 'class-validator';

export class AssignSeatmapDto {
  @IsString()
  seatmapId!: string;
}
