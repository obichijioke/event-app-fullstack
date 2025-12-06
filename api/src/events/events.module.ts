import { Module } from '@nestjs/common';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { EventRemindersService } from './event-reminders.service';
import { CommonModule } from '../common/common.module';
import { GeoModule } from '../common/geo/geo.module';
import { GeolocationModule } from '../common/geolocation/geolocation.module';

@Module({
  imports: [CommonModule, GeoModule, GeolocationModule],
  providers: [EventsService, EventRemindersService],
  controllers: [EventsController],
  exports: [EventsService, EventRemindersService],
})
export class EventsModule {}
