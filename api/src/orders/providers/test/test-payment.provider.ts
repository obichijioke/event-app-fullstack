import { Injectable } from '@nestjs/common';
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
export class TestPaymentProvider implements PaymentProvider {
  public readonly name = 'test' as const;

  initializePayment(
    order: OrderWithPaymentRelations,
    _dto: CreatePaymentDto,
  ): Promise<PaymentInitializationResponse> {
    void _dto;
    const providerIntent = `test_intent_${order.id}_${Date.now()}`;

    return Promise.resolve({
      paymentRecord: {
        providerIntent,
        status: PaymentStatus.requires_action,
      },
      clientResponse: {
        provider: this.name,
        providerIntent,
        message: 'Test payment initialized',
      },
    });
  }

  confirmPayment(
    payment: Payment,
    _dto: ProcessPaymentDto,
  ): Promise<PaymentConfirmationResponse> {
    void _dto;
    const providerIntent =
      payment.providerIntent ?? `test_intent_${payment.orderId}`;

    return Promise.resolve({
      status: PaymentStatus.captured,
      providerIntent,
      capturedAt: new Date(),
      response: {
        provider: this.name,
        providerIntent,
        message: 'Test payment confirmed',
      },
    });
  }

  refundPayment(
    payment: Payment,
    amountCents?: number,
  ): Promise<PaymentRefundResponse> {
    const refundAmount = amountCents ?? Number(payment.amountCents);

    return Promise.resolve({
      amountCents: BigInt(refundAmount),
      currency: payment.currency,
      status: 'refunded',
      providerReference: `test_refund_${payment.id}_${Date.now()}`,
      response: {
        provider: this.name,
        amountCents: refundAmount,
        message: 'Test refund processed',
      },
    });
  }
}
