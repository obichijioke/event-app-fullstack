import {
  Body,
  Controller,
  Headers,
  HttpCode,
  Post,
  Req,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import { StripeWebhookService } from './services/stripe-webhook.service';
import { Request } from 'express';

@Controller('webhooks/stripe')
export class StripeWebhookController {
  constructor(private readonly service: StripeWebhookService) {}

  /**
   * Stripe webhook endpoint
   * Receives and processes Stripe events
   *
   * IMPORTANT: This endpoint requires access to the raw request body
   * for signature verification. Ensure your NestJS app is configured
   * with rawBody enabled for this route.
   */
  @Post()
  @HttpCode(200)
  async handleWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() request: RawBodyRequest<Request>,
    @Body() _body: any, // Keep for NestJS routing, but use rawBody instead
  ) {
    // Use rawBody for signature verification
    // Stripe requires the raw request body (not JSON parsed)
    const rawBody = request.rawBody || Buffer.from(JSON.stringify(_body));

    await this.service.handleEvent(signature, rawBody);

    return { received: true };
  }
}
