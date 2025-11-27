import { Module } from '@nestjs/common';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { EventRemindersService } from './event-reminders.service';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [CommonModule],
  providers: [EventsService, EventRemindersService],
  controllers: [EventsController],
  exports: [EventsService, EventRemindersService],
})
export class EventsModule {}
