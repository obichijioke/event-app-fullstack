import { Module } from '@nestjs/common';
import { SavedEventsController } from './saved-events.controller';
import { SavedEventsService } from './saved-events.service';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [CommonModule],
  controllers: [SavedEventsController],
  providers: [SavedEventsService],
  exports: [SavedEventsService],
})
export class SavedEventsModule {}
