import { Module } from '@nestjs/common';
import { TicketingService } from './ticketing.service';
import { TicketingController } from './ticketing.controller';
import { CommonModule } from '../common/common.module';
import { CurrencyModule } from '../currency/currency.module';

@Module({
  imports: [CommonModule, CurrencyModule],
  providers: [TicketingService],
  controllers: [TicketingController],
  exports: [TicketingService],
})
export class TicketingModule {}
