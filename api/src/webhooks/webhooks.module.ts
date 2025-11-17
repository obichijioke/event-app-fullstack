import { Module } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import { WebhooksController } from './webhooks.controller';
import { CommonModule } from '../common/common.module';
import { WebhookProcessorService } from './services/webhook-processor.service';
import { PaystackWebhookService } from './services/paystack-webhook.service';
import { StripeWebhookService } from './services/stripe-webhook.service';
import { PaystackWebhookController } from './paystack-webhook.controller';
import { StripeWebhookController } from './stripe-webhook.controller';
import { OrdersModule } from '../orders/orders.module';

@Module({
  imports: [CommonModule, OrdersModule],
  providers: [
    WebhooksService,
    WebhookProcessorService,
    PaystackWebhookService,
    StripeWebhookService,
  ],
  controllers: [
    WebhooksController,
    PaystackWebhookController,
    StripeWebhookController,
  ],
  exports: [
    WebhooksService,
    WebhookProcessorService,
    PaystackWebhookService,
    StripeWebhookService,
  ],
})
export class WebhooksModule {}
