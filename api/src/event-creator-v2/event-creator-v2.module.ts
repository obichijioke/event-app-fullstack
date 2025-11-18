import { Module } from '@nestjs/common';
import { CommonModule } from '../common/common.module';
import { CurrencyModule } from '../currency/currency.module';
import { EventCreatorV2Service } from './event-creator-v2.service';
import { EventCreatorV2Controller } from './event-creator-v2.controller';

@Module({
  imports: [CommonModule, CurrencyModule],
  controllers: [EventCreatorV2Controller],
  providers: [EventCreatorV2Service],
  exports: [EventCreatorV2Service],
})
export class EventCreatorV2Module {}
