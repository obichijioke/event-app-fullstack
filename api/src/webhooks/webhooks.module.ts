import { Module } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import { WebhooksController } from './webhooks.controller';
import { CommonModule } from '../common/common.module';
import { WebhookProcessorService } from './services/webhook-processor.service';
import { PaystackWebhookService } from './services/paystack-webhook.service';
import { PaystackWebhookController } from './paystack-webhook.controller';
import { OrdersModule } from '../orders/orders.module';

@Module({
  imports: [CommonModule, OrdersModule],
  providers: [WebhooksService, WebhookProcessorService, PaystackWebhookService],
  controllers: [WebhooksController, PaystackWebhookController],
  exports: [WebhooksService, WebhookProcessorService, PaystackWebhookService],
})
export class WebhooksModule {}
