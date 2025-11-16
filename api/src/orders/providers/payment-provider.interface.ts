import { Payment, PaymentStatus, Prisma } from '@prisma/client';
import { CreatePaymentDto, ProcessPaymentDto } from '../dto/create-order.dto';

export type PaymentProviderName = 'stripe' | 'paystack' | 'test';

export type OrderWithPaymentRelations = Prisma.OrderGetPayload<{
  include: {
    buyer: {
      select: {
        id: true;
        email: true;
        name: true;
      };
    };
    items: {
      include: {
        ticketType: true;
      };
    };
  };
}>;

export interface PaymentInitializationResponse {
  paymentRecord: {
    providerIntent?: string | null;
    providerCharge?: string | null;
    status: PaymentStatus;
  };
  clientResponse: Record<string, any>;
}

export interface PaymentConfirmationResponse {
  status: PaymentStatus;
  providerIntent?: string | null;
  providerCharge?: string | null;
  capturedAt?: Date | null;
  failureCode?: string | null;
  failureMessage?: string | null;
  response: Record<string, any>;
}

export interface PaymentRefundResponse {
  amountCents: bigint;
  currency: string;
  status: string;
  providerReference: string;
  response: Record<string, any>;
}

export interface PaymentProvider {
  readonly name: PaymentProviderName;
  initializePayment(
    order: OrderWithPaymentRelations,
    dto: CreatePaymentDto,
  ): Promise<PaymentInitializationResponse>;
  confirmPayment(
    payment: Payment,
    dto: ProcessPaymentDto,
  ): Promise<PaymentConfirmationResponse>;
  refundPayment(
    payment: Payment,
    amountCents?: number,
  ): Promise<PaymentRefundResponse>;
}
