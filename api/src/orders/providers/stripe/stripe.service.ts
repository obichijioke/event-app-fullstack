import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { Payment, PaymentStatus } from '@prisma/client';
import {
  OrderWithPaymentRelations,
  PaymentConfirmationResponse,
  PaymentInitializationResponse,
  PaymentProvider,
  PaymentRefundResponse,
} from '../payment-provider.interface';
import {
  CreatePaymentDto,
  ProcessPaymentDto,
} from '../../dto/create-order.dto';

@Injectable()
export class StripePaymentProvider implements PaymentProvider {
  public readonly name = 'stripe' as const;

  private readonly stripe: Stripe;

  constructor(private readonly configService: ConfigService) {
    const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (!secretKey) {
      throw new InternalServerErrorException(
        'STRIPE_SECRET_KEY is not configured.',
      );
    }

    this.stripe = new Stripe(secretKey, {} as Stripe.StripeConfig);
  }

  async initializePayment(
    order: OrderWithPaymentRelations,
    dto: CreatePaymentDto,
  ): Promise<PaymentInitializationResponse> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Number(order.totalCents),
        currency: order.currency,
        metadata: {
          orderId: order.id,
          buyerId: order.buyer?.id,
        },
        automatic_payment_methods: {
          enabled: true,
        },
        return_url: dto.returnUrl,
      });

      return {
        paymentRecord: {
          providerIntent: paymentIntent.id,
          status: PaymentStatus.requires_action,
        },
        clientResponse: {
          clientSecret: paymentIntent.client_secret,
          paymentIntentId: paymentIntent.id,
        },
      };
    } catch (error) {
      throw new InternalServerErrorException(
        `Stripe error creating payment intent: ${(error as Error).message}`,
      );
    }
  }

  async confirmPayment(
    payment: Payment,
    dto: ProcessPaymentDto,
  ): Promise<PaymentConfirmationResponse> {
    try {
      const paymentIntentId = dto.paymentIntentId || payment.providerIntent;
      if (!paymentIntentId) {
        throw new InternalServerErrorException(
          'A Stripe payment intent id is required.',
        );
      }

      let confirmedPayment: Stripe.Response<Stripe.PaymentIntent>;

      if (dto.paymentMethodId) {
        confirmedPayment = await this.stripe.paymentIntents.confirm(
          paymentIntentId,
          {
            payment_method: dto.paymentMethodId,
          },
        );
      } else {
        confirmedPayment =
          await this.stripe.paymentIntents.confirm(paymentIntentId);
      }

      const succeeded = confirmedPayment.status === 'succeeded';

      return {
        status: succeeded ? PaymentStatus.captured : PaymentStatus.failed,
        providerIntent: confirmedPayment.id,
        capturedAt: succeeded ? new Date() : null,
        failureCode: succeeded
          ? null
          : confirmedPayment.last_payment_error?.code || null,
        failureMessage: succeeded
          ? null
          : confirmedPayment.last_payment_error?.message || null,
        response: confirmedPayment,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        `Stripe error confirming payment: ${(error as Error).message}`,
      );
    }
  }

  async refundPayment(
    payment: Payment,
    amountCents?: number,
  ): Promise<PaymentRefundResponse> {
    try {
      const refund = await this.stripe.refunds.create({
        payment_intent: payment.providerIntent || undefined,
        amount: amountCents ?? Number(payment.amountCents),
        reason: 'requested_by_customer',
        metadata: {
          paymentId: payment.id,
          orderId: payment.orderId,
        },
      });

      return {
        amountCents: BigInt(refund.amount),
        currency: refund.currency || payment.currency,
        status: refund.status || 'pending',
        providerReference: refund.id,
        response: refund,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        `Stripe error creating refund: ${(error as Error).message}`,
      );
    }
  }
}
