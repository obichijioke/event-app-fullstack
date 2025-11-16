import { PartialType } from '@nestjs/mapped-types';
import { CreateSeatmapDto } from './create-seatmap.dto';

export class UpdateSeatmapDto extends PartialType(CreateSeatmapDto) {}
