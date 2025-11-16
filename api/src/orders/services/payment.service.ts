import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreatePaymentDto, ProcessPaymentDto } from '../dto/create-order.dto';
import { PaymentStatus, Prisma } from '@prisma/client';
import {
  OrderWithPaymentRelations,
  PaymentConfirmationResponse,
  PaymentProvider,
  PaymentProviderName,
} from '../providers/payment-provider.interface';
import { PAYMENT_PROVIDERS } from '../tokens';
import { Inject } from '@nestjs/common';

@Injectable()
export class PaymentService {
  private readonly providers: Record<PaymentProviderName, PaymentProvider>;

  constructor(
    private readonly prisma: PrismaService,
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

    const payment = await this.prisma.payment.findFirst({
      where: { orderId },
    });

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
    }
  }
}
