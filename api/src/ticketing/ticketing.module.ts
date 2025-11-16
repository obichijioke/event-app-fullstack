import { Module } from '@nestjs/common';
import { TicketingService } from './ticketing.service';
import { TicketingController } from './ticketing.controller';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [CommonModule],
  providers: [TicketingService],
  controllers: [TicketingController],
  exports: [TicketingService],
})
export class TicketingModule {}
