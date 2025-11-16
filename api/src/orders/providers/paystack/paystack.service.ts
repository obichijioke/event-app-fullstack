import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { plainToInstance } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  validateSync,
} from 'class-validator';
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
import * as crypto from 'crypto';

class PaystackConfig {
  @IsString()
  @IsNotEmpty()
  secretKey: string;

  @IsOptional()
  @IsString()
  publicKey?: string;

  @IsOptional()
  @IsString()
  webhookSecret?: string;
}

@Injectable()
export class PaystackPaymentProvider implements PaymentProvider {
  public readonly name = 'paystack' as const;

  private readonly client: AxiosInstance;
  private readonly secretKey: string;
  private readonly webhookSecret?: string;

  constructor(private readonly configService: ConfigService) {
    const config = plainToInstance(PaystackConfig, {
      secretKey: this.configService.get<string>('PAYSTACK_SECRET_KEY'),
      publicKey: this.configService.get<string>('PAYSTACK_PUBLIC_KEY'),
      webhookSecret: this.configService.get<string>('PAYSTACK_WEBHOOK_SECRET'),
    });

    const errors = validateSync(config, {
      skipMissingProperties: false,
      whitelist: true,
    });

    if (errors.length) {
      throw new InternalServerErrorException(
        'Invalid Paystack configuration. Please verify your environment variables.',
      );
    }

    this.secretKey = config.secretKey;
    this.webhookSecret = config.webhookSecret || config.secretKey;
    this.client = axios.create({
      baseURL: 'https://api.paystack.co',
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });
  }

  async initializePayment(
    order: OrderWithPaymentRelations,
    dto: CreatePaymentDto,
  ): Promise<PaymentInitializationResponse> {
    const buyerEmail = order.buyer?.email;

    if (!buyerEmail) {
      throw new InternalServerErrorException(
        'Unable to initialize Paystack payment without buyer email.',
      );
    }

    const amountInMinorUnits = Number(order.totalCents);

    try {
      const response = await this.client.post('/transaction/initialize', {
        amount: amountInMinorUnits,
        email: buyerEmail,
        currency: order.currency,
        reference: `order_${order.id}`,
        callback_url: dto.returnUrl,
        metadata: {
          orderId: order.id,
          buyerId: order.buyer?.id,
          buyerEmail,
          items: order.items.map((item) => ({
            ticketTypeId: item.ticketTypeId,
            ticketName: item.ticketType.name,
            quantity: item.quantity,
            unitPriceCents: item.unitPriceCents
              ? item.unitPriceCents.toString()
              : undefined,
          })),
        },
      });

      const { authorization_url: authorizationUrl, reference } =
        response.data.data;

      return {
        paymentRecord: {
          providerCharge: reference,
          status: PaymentStatus.requires_action,
        },
        clientResponse: {
          authorizationUrl,
          reference,
        },
      };
    } catch (error) {
      this.handleAxiosError(error, 'initializing Paystack transaction');
      throw new InternalServerErrorException('Paystack initialization failed.');
    }
  }

  async confirmPayment(
    payment: Payment,
    _dto: ProcessPaymentDto,
  ): Promise<PaymentConfirmationResponse> {
    try {
      const response = await this.client.get(
        `/transaction/verify/${payment.providerCharge}`,
      );

      const transaction = response.data.data;
      const succeeded = transaction.status === 'success';

      return {
        status: succeeded ? PaymentStatus.captured : PaymentStatus.failed,
        providerCharge: transaction.reference,
        capturedAt:
          succeeded && transaction.paid_at
            ? new Date(transaction.paid_at)
            : succeeded
              ? new Date()
              : null,
        failureCode: null,
        failureMessage: succeeded ? null : transaction.gateway_response,
        response: transaction,
      };
    } catch (error) {
      this.handleAxiosError(error, 'verifying Paystack transaction');
      throw new InternalServerErrorException('Paystack verification failed.');
    }
  }

  async refundPayment(
    payment: Payment,
    amountCents?: number,
  ): Promise<PaymentRefundResponse> {
    const amountInMinorUnits = Math.round(
      amountCents ?? Number(payment.amountCents),
    );

    try {
      const response = await this.client.post('/refund', {
        transaction: payment.providerCharge,
        amount: amountInMinorUnits,
        currency: payment.currency,
      });

      const refund = response.data.data;

      return {
        amountCents: BigInt(refund.amount),
        currency: refund.currency ?? payment.currency,
        status: refund.status,
        providerReference: refund.reference ?? refund.id,
        response: refund,
      };
    } catch (error) {
      this.handleAxiosError(error, 'creating Paystack refund');
      throw new InternalServerErrorException('Paystack refund failed.');
    }
  }

  validateWebhookSignature(
    signature: string | undefined,
    payload: unknown,
  ): boolean {
    if (!signature) {
      return false;
    }

    const body =
      typeof payload === 'string' ? payload : JSON.stringify(payload || {});
    const expected = crypto
      .createHmac('sha512', this.webhookSecret || this.secretKey)
      .update(body)
      .digest('hex');

    return expected === signature;
  }

  private handleAxiosError(error: unknown, action: string): never {
    if (axios.isAxiosError(error)) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.status ||
        error.message;
      throw new InternalServerErrorException(
        `Paystack error while ${action}: ${message}`,
      );
    }

    throw new InternalServerErrorException(
      `Unexpected error while ${action}: ${(error as Error).message}`,
    );
  }
}
