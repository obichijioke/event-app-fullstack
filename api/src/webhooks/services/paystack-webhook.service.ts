import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { PaystackPaymentProvider } from '../../orders/providers/paystack/paystack.service';
import { PaymentStatus } from '@prisma/client';
import { OrdersService } from '../../orders/orders.service';

@Injectable()
export class PaystackWebhookService {
  private readonly logger = new Logger(PaystackWebhookService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly paystackProvider: PaystackPaymentProvider,
    private readonly ordersService: OrdersService,
  ) {}

  async handleEvent(signature: string | undefined, payload: any) {
    const isValid = this.paystackProvider.validateWebhookSignature(
      signature,
      payload,
    );

    if (!isValid) {
      throw new BadRequestException('Invalid Paystack webhook signature');
    }

    const reference = payload?.data?.reference || payload?.data?.transaction_reference;
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
    } else if (event.startsWith('refund')) {
      await this.handleRefundEvent(payment.orderId, payload);
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

    // Issue tickets after capture
    await this.ordersService.ensureTicketsForOrder(orderId);
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

  private async handleRefundEvent(orderId: string, payload: any) {
    const refundRef =
      payload?.data?.reference ||
      payload?.data?.transaction_reference ||
      payload?.data?.refund?.reference ||
      payload?.data?.refund?.id;
    const status = (payload?.data?.status || '').toLowerCase();

    let refund = await this.prisma.refund.findFirst({
      where: {
        orderId,
        OR: [
          refundRef ? { providerRef: refundRef } : undefined,
          { status: 'pending' },
        ].filter(Boolean) as any,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!refund) {
      const recentRefunds = await this.prisma.refund.findMany({
        where: { orderId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, providerRef: true, status: true, createdAt: true },
      });

      this.logger.debug(
        `Paystack refund webhook received but no matching refund found for order ${orderId}. payload.ref=${
          refundRef || 'none'
        } status=${status} recent=${JSON.stringify(recentRefunds)}`,
      );
      // Fallback: if a processed refund exists, don't error; otherwise stop.
      const processed = recentRefunds.find((r) => r.status === 'processed');
      if (!processed) {
        return;
      }
      // Use the most recent processed refund as target
      refund = processed as any;
    }

    const isProcessed = ['success', 'processed', 'completed'].includes(status);
    const isFailed = ['failed', 'reversed'].includes(status);

    await this.prisma.refund.update({
      where: { id: refund!.id },
      data: {
        status: isProcessed
          ? 'processed'
          : isFailed
            ? 'failed'
            : 'pending',
        processedAt: isProcessed ? new Date() : refund!.processedAt,
        providerRef: refundRef ?? refund!.providerRef,
      },
    });
  }
}
