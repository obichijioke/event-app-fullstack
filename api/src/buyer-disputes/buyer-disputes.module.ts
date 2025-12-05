import { Module } from '@nestjs/common';
import { BuyerDisputesController } from './buyer-disputes.controller';
import { BuyerDisputesService } from './buyer-disputes.service';
import { CommonModule } from '../common/common.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [CommonModule, NotificationsModule],
  controllers: [BuyerDisputesController],
  providers: [BuyerDisputesService],
  exports: [BuyerDisputesService],
})
export class BuyerDisputesModule {}
