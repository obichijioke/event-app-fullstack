import { Body, Controller, Headers, HttpCode, Post } from '@nestjs/common';
import { PaystackWebhookService } from './services/paystack-webhook.service';

@Controller('webhooks/paystack')
export class PaystackWebhookController {
  constructor(private readonly service: PaystackWebhookService) {}

  @Post()
  @HttpCode(200)
  async handleWebhook(
    @Headers('x-paystack-signature') signature: string,
    @Body() payload: any,
  ) {
    await this.service.handleEvent(signature, payload);
    return { received: true };
  }
}
