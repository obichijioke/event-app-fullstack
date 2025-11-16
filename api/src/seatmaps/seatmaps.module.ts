import { Module } from '@nestjs/common';
import { SeatmapsService } from './seatmaps.service';
import { SeatmapsController } from './seatmaps.controller';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [CommonModule],
  providers: [SeatmapsService],
  controllers: [SeatmapsController],
  exports: [SeatmapsService],
})
export class SeatmapsModule {}
