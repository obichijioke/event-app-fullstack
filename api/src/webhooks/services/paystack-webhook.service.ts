import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { PaystackPaymentProvider } from '../../orders/providers/paystack/paystack.service';
import { PaymentStatus } from '@prisma/client';

@Injectable()
export class PaystackWebhookService {
  private readonly logger = new Logger(PaystackWebhookService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly paystackProvider: PaystackPaymentProvider,
  ) {}

  async handleEvent(signature: string | undefined, payload: any) {
    const isValid = this.paystackProvider.validateWebhookSignature(
      signature,
      payload,
    );

    if (!isValid) {
      throw new BadRequestException('Invalid Paystack webhook signature');
    }

    const reference = payload?.data?.reference;
    const event = payload?.event;

    if (!reference || !event) {
      throw new BadRequestException('Malformed Paystack webhook payload');
    }

    const payment = await this.prisma.payment.findFirst({
      where: {
        provider: 'paystack',
        providerCharge: reference,
      },
    });

    if (!payment) {
      this.logger.warn(
        `Received Paystack webhook for unknown reference ${reference}`,
      );
      return;
    }

    if (event === 'charge.success') {
      await this.markPaymentCaptured(payment.id, payment.orderId, payload);
    } else if (
      ['charge.failed', 'charge.reversed', 'charge.chargeback'].includes(event)
    ) {
      await this.markPaymentFailed(payment.id, payload);
    } else {
      this.logger.debug(`Ignoring unsupported Paystack event ${event}`);
    }
  }

  private async markPaymentCaptured(
    paymentId: string,
    orderId: string,
    payload: any,
  ) {
    const paidAt = payload?.data?.paid_at || payload?.data?.transaction_date;

    await this.prisma.$transaction([
      this.prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: PaymentStatus.captured,
          capturedAt: paidAt ? new Date(paidAt) : new Date(),
          failureCode: null,
          failureMessage: null,
        },
      }),
      this.prisma.order.update({
        where: { id: orderId },
        data: {
          status: 'paid',
          paidAt: paidAt ? new Date(paidAt) : new Date(),
        },
      }),
    ]);
  }

  private async markPaymentFailed(paymentId: string, payload: any) {
    const failureReason = payload?.data?.gateway_response || 'payment_failed';

    await this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: PaymentStatus.failed,
        failureCode: null,
        failureMessage: failureReason,
      },
    });
  }
}
