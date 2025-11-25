import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AnnouncementsController } from './announcements.controller';
import { AnnouncementsService } from './announcements.service';
import { AnnouncementsSchedulerService } from './announcements-scheduler.service';
import { CommonModule } from '../common/common.module';
import { QueuesModule } from '../queues/queues.module';

@Module({
  imports: [CommonModule, QueuesModule, ScheduleModule.forRoot()],
  controllers: [AnnouncementsController],
  providers: [AnnouncementsService, AnnouncementsSchedulerService],
  exports: [AnnouncementsService],
})
export class AnnouncementsModule {}
