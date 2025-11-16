import { Module } from '@nestjs/common';
import { CommonModule } from '../common/common.module';
import { EventCreatorV2Service } from './event-creator-v2.service';
import { EventCreatorV2Controller } from './event-creator-v2.controller';

@Module({
  imports: [CommonModule],
  controllers: [EventCreatorV2Controller],
  providers: [EventCreatorV2Service],
  exports: [EventCreatorV2Service],
})
export class EventCreatorV2Module {}
