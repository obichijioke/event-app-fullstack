import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { CommonModule } from '../common/common.module';
import { WebsocketsModule } from '../websockets/websockets.module';

@Module({
  imports: [CommonModule, WebsocketsModule],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
