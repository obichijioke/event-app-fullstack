import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { MailerService } from '../../common/mailer/mailer.service';
import { CreatePaymentDto, ProcessPaymentDto } from '../dto/create-order.dto';
import { PaymentStatus, Prisma } from '@prisma/client';
import {
  OrderWithPaymentRelations,
  PaymentConfirmationResponse,
  PaymentProvider,
  PaymentProviderName,
  PaymentRefundResponse,
} from '../providers/payment-provider.interface';
import { PAYMENT_PROVIDERS } from '../tokens';
import { Inject } from '@nestjs/common';
import { orderEmailIncludes, OrderWithEmailData } from '../../common/types/prisma-helpers';

@Injectable()
export class PaymentService {
  private readonly providers: Record<PaymentProviderName, PaymentProvider>;

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailerService: MailerService,
    @Inject(PAYMENT_PROVIDERS) paymentProviders: PaymentProvider[],
  ) {
    this.providers = paymentProviders.reduce(
      (acc, provider) => {
        acc[provider.name] = provider;
        return acc;
      },
      {} as Record<PaymentProviderName, PaymentProvider>,
    );
  }

  async createPaymentIntent(
    orderId: string,
    createPaymentDto: CreatePaymentDto,
  ) {
    const order = await this.findOrderForPayment(orderId);

    const provider = this.getProvider(createPaymentDto.provider);
    const result = await provider.initializePayment(order, createPaymentDto);

    await this.prisma.payment.create({
      data: {
        orderId: order.id,
        provider: provider.name,
        providerIntent: result.paymentRecord.providerIntent,
        providerCharge: result.paymentRecord.providerCharge,
        status: result.paymentRecord.status,
        amountCents: order.totalCents,
        currency: order.currency,
      },
    });

    return result.clientResponse;
  }

  async processPayment(processPaymentDto: ProcessPaymentDto) {
    const { orderId } = processPaymentDto;

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    let payment;

    if (processPaymentDto.paymentIntentId) {
      // If specific intent ID provided, find that specific payment record
      // This handles retry scenarios where multiple payment records exist for one order
      payment = await this.prisma.payment.findFirst({
        where: {
          orderId,
          OR: [
            { providerIntent: processPaymentDto.paymentIntentId },
            { providerCharge: processPaymentDto.paymentIntentId },
          ],
        },
      });
    } else {
      // Fallback to latest payment record (legacy behavior)
      payment = await this.prisma.payment.findFirst({
        where: { orderId },
        orderBy: { createdAt: 'desc' },
      });
    }

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    const provider = this.getProvider(payment.provider as PaymentProviderName);
    const result = await provider.confirmPayment(payment, processPaymentDto);

    await this.updatePaymentAndOrder(payment.id, payment.orderId, result);

    return result.response;
  }

  async refundPayment(paymentId: string, amountCents?: number) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.status !== PaymentStatus.captured) {
      throw new BadRequestException('Payment cannot be refunded');
    }

    const provider = this.getProvider(payment.provider as PaymentProviderName);
    const result = await provider.refundPayment(payment, amountCents);

    await this.prisma.refund.create({
      data: {
        orderId: payment.orderId,
        amountCents: result.amountCents,
        currency: result.currency,
        status: 'pending',
        providerRef: result.providerReference,
        createdBy: 'system',
      },
    });

    return result.response;
  }

  /**
   * Executes a provider refund for an existing captured payment without
   * creating a new Refund record (used by admin refund flows).
   */
  async refundCapturedPayment(
    paymentId: string,
    amountCents?: number,
  ): Promise<PaymentRefundResponse> {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.status !== PaymentStatus.captured) {
      throw new BadRequestException('Payment cannot be refunded');
    }

    const provider = this.getProvider(payment.provider as PaymentProviderName);
    return provider.refundPayment(payment, amountCents);
  }

  private async findOrderForPayment(
    orderId: string,
  ): Promise<OrderWithPaymentRelations> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        buyer: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        items: {
          include: {
            ticketType: true,
          },
        },
      },
    } as Prisma.OrderFindUniqueArgs);

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status !== 'pending') {
      throw new BadRequestException('Order is not in pending status');
    }

    return order as OrderWithPaymentRelations;
  }

  private getProvider(provider: string): PaymentProvider {
    const normalized = provider.toLowerCase() as PaymentProviderName;
    const resolved = this.providers[normalized];

    if (!resolved) {
      throw new BadRequestException('Invalid payment provider');
    }

    return resolved;
  }

  private async updatePaymentAndOrder(
    paymentId: string,
    orderId: string,
    result: PaymentConfirmationResponse,
  ) {
    await this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: result.status,
        providerIntent: result.providerIntent,
        providerCharge: result.providerCharge,
        capturedAt: result.capturedAt,
        failureCode: result.failureCode,
        failureMessage: result.failureMessage,
      },
    });

    if (result.status === PaymentStatus.captured) {
      await this.prisma.order.update({
        where: { id: orderId },
        data: {
          status: 'paid',
          paidAt: result.capturedAt ?? new Date(),
        },
      });

      // Send order confirmation email
      await this.sendOrderConfirmationEmail(orderId).catch((error) => {
        console.error('Failed to send order confirmation email:', error);
        // Don't fail the payment if email fails
      });
    }
  }

  private async sendOrderConfirmationEmail(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      ...orderEmailIncludes,
    }) as OrderWithEmailData | null;

    if (!order?.event) {
      return;
    }

    // Fetch buyer (user) separately
    const user = await this.prisma.user.findUnique({
      where: { id: order.buyerId },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    if (!user) {
      return;
    }

    // Format event date and time
    const eventDate = order.occurrence?.startsAt || order.event.startAt;
    const formattedDate = new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC',
    }).format(new Date(eventDate));

    const formattedTime = new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      timeZone: 'UTC',
    }).format(new Date(eventDate));

    // Calculate ticket count and group by type
    const ticketTypes: Record<string, { name: string; quantity: number; price: string }> = {};
    let ticketCount = 0;

    for (const item of order.items) {
      ticketCount += item.quantity;
      const typeName = item.ticketType?.name || 'General Admission';

      if (!ticketTypes[typeName]) {
        ticketTypes[typeName] = {
          name: typeName,
          quantity: 0,
          price: this.formatCurrency(item.unitPriceCents),
        };
      }
      ticketTypes[typeName].quantity += item.quantity;
    }

    // Format venue address (address is a JSON field)
    let venueAddress = '';
    if (order.event.venue?.address) {
      const addr = order.event.venue.address as any;
      venueAddress = typeof addr === 'string'
        ? addr
        : [addr.street, addr.city, addr.state, addr.country]
            .filter(Boolean)
            .join(', ');
    }

    await this.mailerService.sendTemplatedMail({
      to: user.email,
      subject: `Order Confirmation - ${order.event.title}`,
      template: 'order-confirmation',
      context: {
        userName: user.name || user.email.split('@')[0],
        orderNumber: order.id.slice(0, 8).toUpperCase(),
        eventName: order.event.title,
        eventDate: formattedDate,
        eventTime: formattedTime,
        venueName: order.event.venue?.name,
        venueAddress,
        ticketCount,
        ticketTypes: Object.values(ticketTypes),
        subtotal: this.formatCurrency(order.subtotalCents),
        fees: order.feesCents > 0 ? this.formatCurrency(order.feesCents) : null,
        tax: order.taxCents > 0 ? this.formatCurrency(order.taxCents) : null,
        totalAmount: this.formatCurrency(order.totalCents),
        paymentMethod: this.formatPaymentMethod(order.payments?.[0]?.provider),
        ticketsUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/account/orders/${order.id}`,
        organizerEmail: order.event.org.supportEmail || 'noreply@eventflow.dev',
        eventReminderEnabled: true,
      },
    });
  }

  private formatCurrency(cents: bigint): string {
    const dollars = Number(cents) / 100;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(dollars);
  }

  private formatPaymentMethod(provider?: string): string {
    if (!provider) return 'Card';

    const providerMap: Record<string, string> = {
      stripe: 'Credit/Debit Card',
      paystack: 'Card',
    };

    return providerMap[provider.toLowerCase()] || provider;
  }
}
