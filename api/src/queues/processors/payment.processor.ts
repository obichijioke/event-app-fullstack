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
        const barcode = this.generateBarcode(
          order.id,
          item.ticketTypeId,
          item.seatId || undefined,
          i,
        );

        // Skip creation if this barcode already exists for the order (handles retries)
        const existingTicket = await this.prisma.ticket.findFirst({
          where: {
            orderId: order.id,
            barcode,
          },
        });

        if (existingTicket) {
          // Regenerate QR code if it was never set during a previous attempt
          if (!existingTicket.qrCode) {
            const qrCode = this.generateQRCode(
              order.id,
              item.ticketTypeId,
              item.seatId || undefined,
              i,
              existingTicket.id,
            );

            await this.prisma.ticket.update({
              where: { id: existingTicket.id },
              data: { qrCode },
            });
          }

          continue;
        }

        // Create ticket first to get the ID
        const ticket = await this.prisma.ticket.create({
          data: {
            orderId: order.id,
            eventId: order.eventId,
            ticketTypeId: item.ticketTypeId,
            seatId: item.seatId,
            status: 'issued',
            issuedAt: new Date(),
            ownerId: order.buyerId || order.id, // Use buyerId
            qrCode: '', // Temporary empty value
            barcode,
          },
        });

        // Now generate QR code with the ticket ID
        const qrCode = this.generateQRCode(
          order.id,
          item.ticketTypeId,
          item.seatId || undefined,
          i,
          ticket.id, // Include ticket ID
        );

        // Update ticket with final QR code
        await this.prisma.ticket.update({
          where: { id: ticket.id },
          data: { qrCode },
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
    index: number = 0,
    ticketId?: string,
  ): string {
    // Generate a unique QR code with ticket ID for check-in
    // Format: ticketId|orderId|ticketTypeId|seatId|index
    const parts = [
      ticketId || 'PENDING',
      orderId,
      ticketTypeId,
      seatId || 'GA',
      index.toString(),
    ];
    const data = parts.join('|');
    return Buffer.from(data).toString('base64');
  }

  private generateBarcode(
    orderId: string,
    ticketTypeId: string,
    seatId?: string,
    index: number = 0,
  ): string {
    // In a real implementation, you would use a barcode library
    return `bc_${orderId}_${ticketTypeId}_${seatId || 'ga'}_${index}`;
  }
}
