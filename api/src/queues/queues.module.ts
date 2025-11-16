import { Module } from '@nestjs/common';
import { QueuesService } from './queues.service';
import { CommonModule } from '../common/common.module';
import { EmailProcessor } from './processors/email.processor';
import { WebhookProcessor } from './processors/webhook.processor';
import { PaymentProcessor } from './processors/payment.processor';
import { NotificationProcessor } from './processors/notification.processor';
import { ReportProcessor } from './processors/report.processor';
import { CleanupProcessor } from './processors/cleanup.processor';
import { WebhooksModule } from '../webhooks/webhooks.module';
import { OrdersModule } from '../orders/orders.module';
import { WebsocketsModule } from '../websockets/websockets.module';

@Module({
  imports: [CommonModule, WebhooksModule, OrdersModule, WebsocketsModule],
  providers: [
    QueuesService,
    EmailProcessor,
    WebhookProcessor,
    PaymentProcessor,
    NotificationProcessor,
    ReportProcessor,
    CleanupProcessor,
  ],
  exports: [QueuesService],
})
export class QueuesModule {}
