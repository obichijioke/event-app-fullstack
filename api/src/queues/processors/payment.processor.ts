import { Injectable } from '@nestjs/common';
import { Job } from 'bullmq';
import { BaseQueueProcessor } from '../base-queue.processor';
import { RedisService } from '../../common/redis/redis.service';
import { PaymentService } from '../../orders/services/payment.service';
import { PrismaService } from '../../common/prisma/prisma.service';

export interface PaymentJobData {
  orderId: string;
  paymentIntentId?: string;
  paymentMethodId?: string;
  sourceId?: string;
  provider: string;
  userId: string;
}

@Injectable()
export class PaymentProcessor extends BaseQueueProcessor {
  constructor(
    redisService: RedisService,
    private readonly paymentService: PaymentService,
    private readonly prisma: PrismaService,
  ) {
    super(redisService, 'payment');
  }

  async process(job: Job<PaymentJobData>): Promise<any> {
    const {
      orderId,
      paymentIntentId,
      paymentMethodId,
      sourceId,
      provider,
      userId,
    } = job.data;
    void userId;

    this.logger.log(
      `Processing payment for order: ${orderId}, provider: ${provider}`,
    );

    try {
      // Get the order
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
      });

      if (!order) {
        throw new Error(`Order not found: ${orderId}`);
      }

      // Process the payment
      const result = await this.paymentService.processPayment({
        orderId,
        paymentIntentId,
        paymentMethodId,
        sourceId,
      });

      // If payment is successful, create tickets
      if (result.status === 'succeeded') {
        // Create tickets for the order
        await this.createTicketsForOrder(orderId);
      }

      return {
        success: true,
        orderId,
        paymentId:
          (result as any).paymentIntentId ||
          (result as any).reference ||
          'unknown',
        status: result.status,
      };
    } catch (error) {
      this.logger.error(
        `Failed to process payment for order: ${orderId}`,
        error,
      );

      // Update order status to failed
      await this.prisma.order.update({
        where: { id: orderId },
        data: {
          status: 'canceled',
        },
      });

      throw error;
    }
  }

  private async createTicketsForOrder(orderId: string) {
    // Get the order with items
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
      },
    });

    if (!order) {
      throw new Error(`Order not found: ${orderId}`);
    }

    // Create tickets for each order item
    for (const item of order.items) {
      for (let i = 0; i < item.quantity; i++) {
        await this.prisma.ticket.create({
          data: {
            orderId: order.id,
            eventId: order.eventId, // Add eventId
            ticketTypeId: item.ticketTypeId,
            seatId: item.seatId,
            status: 'issued',
            issuedAt: new Date(),
            ownerId: order.items[0]?.orderId || order.id, // Use orderId as fallback
            qrCode: this.generateQRCode(
              order.id,
              item.ticketTypeId,
              item.seatId || undefined,
            ),
            barcode: this.generateBarcode(
              order.id,
              item.ticketTypeId,
              item.seatId || undefined,
            ),
          },
        });
      }
    }

    // Update order status to completed
    await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'paid',
      },
    });
  }

  private generateQRCode(
    orderId: string,
    ticketTypeId: string,
    seatId?: string,
  ): string {
    // In a real implementation, you would use a QR code library
    return `qr_${orderId}_${ticketTypeId}_${seatId || 'ga'}_${Date.now()}`;
  }

  private generateBarcode(
    orderId: string,
    ticketTypeId: string,
    seatId?: string,
  ): string {
    // In a real implementation, you would use a barcode library
    return `bc_${orderId}_${ticketTypeId}_${seatId || 'ga'}_${Date.now()}`;
  }
}
