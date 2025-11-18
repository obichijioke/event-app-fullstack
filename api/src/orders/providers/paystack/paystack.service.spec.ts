import { PaystackPaymentProvider } from './paystack.service';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import type { Payment } from '@prisma/client';
import { CreatePaymentDto } from '../../dto/create-order.dto';
import crypto from 'crypto';

jest.mock('axios');
jest.mock('@prisma/client', () => ({
  PaymentStatus: {
    requires_action: 'requires_action',
    captured: 'captured',
    failed: 'failed',
  },
  PrismaClient: class {},
}));

const mockAxiosInstance = {
  post: jest.fn(),
  get: jest.fn(),
};

(axios.create as jest.Mock).mockReturnValue(mockAxiosInstance);

const configService = {
  get: jest.fn((key: string) => {
    switch (key) {
      case 'PAYSTACK_SECRET_KEY':
        return 'sk_test_secret';
      case 'PAYSTACK_PUBLIC_KEY':
        return 'pk_test_public';
      case 'PAYSTACK_WEBHOOK_SECRET':
        return 'whsec_test';
      default:
        return undefined;
    }
  }),
} as unknown as ConfigService;

const baseOrder: any = {
  id: 'order_123',
  totalCents: BigInt(5000),
  currency: 'NGN',
  buyer: { id: 'buyer_1', email: 'buyer@example.com' },
  items: [
    {
      ticketTypeId: 'ticket_1',
      ticketType: { name: 'VIP' },
      quantity: 2,
      unitPriceCents: BigInt(2500),
    },
  ],
};

const createPaymentDto: CreatePaymentDto = {
  provider: 'paystack',
  returnUrl: 'https://example.com/return',
};

describe('PaystackPaymentProvider', () => {
  let provider: PaystackPaymentProvider;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAxiosInstance.post.mockReset();
    mockAxiosInstance.get.mockReset();
    (axios.create as jest.Mock).mockReturnValue(mockAxiosInstance);
    provider = new PaystackPaymentProvider(configService);
  });

  it('initializes a transaction with buyer email metadata', async () => {
    mockAxiosInstance.post.mockResolvedValueOnce({
      data: {
        data: {
          authorization_url: 'https://paystack/authorize',
          reference: 'order_order_123',
        },
      },
    });

    const result = await provider.initializePayment(
      baseOrder,
      createPaymentDto,
    );

    expect(mockAxiosInstance.post).toHaveBeenCalledWith(
      '/transaction/initialize',
      expect.objectContaining({
        email: 'buyer@example.com',
        reference: 'order_order_123',
      }),
    );
    expect(result.clientResponse.authorizationUrl).toEqual(
      'https://paystack/authorize',
    );
    expect(result.paymentRecord.providerCharge).toEqual('order_order_123');
  });

  it('verifies a successful payment', async () => {
    mockAxiosInstance.get.mockResolvedValueOnce({
      data: {
        data: {
          status: 'success',
          reference: 'order_order_123',
          paid_at: '2024-01-01T00:00:00.000Z',
          gateway_response: 'Approved',
        },
      },
    });

    const payment = {
      providerCharge: 'order_order_123',
    } as Payment;

    const result = await provider.confirmPayment(payment, {} as any);

    expect(mockAxiosInstance.get).toHaveBeenCalledWith(
      '/transaction/verify/order_order_123',
    );
    expect(result.status).toEqual('captured');
    expect(result.capturedAt).toEqual(new Date('2024-01-01T00:00:00.000Z'));
  });

  it('creates a refund for the payment', async () => {
    mockAxiosInstance.post
      .mockResolvedValueOnce({
        data: {
          data: {
            authorization_url: 'https://paystack/authorize',
            reference: 'order_order_123',
          },
        },
      })
      .mockResolvedValueOnce({
        data: {
          data: {
            amount: 5000,
            status: 'pending',
            reference: 'refund_1',
            currency: 'NGN',
            id: 'refund_1',
          },
        },
      });

    await provider.initializePayment(baseOrder, createPaymentDto);

    const payment = {
      providerCharge: 'order_order_123',
      amountCents: BigInt(5000),
      currency: 'NGN',
    } as Payment;

    const result = await provider.refundPayment(payment);

    expect(mockAxiosInstance.post).toHaveBeenLastCalledWith('/refund', {
      transaction: 'order_order_123',
      amount: 5000,
      currency: 'NGN',
    });
    expect(result.providerReference).toEqual('refund_1');
  });

  it('validates webhook signatures using the configured secret', () => {
    const payload = { event: 'charge.success', data: { reference: 'order' } };
    const serialized = JSON.stringify(payload);
    const signature = crypto
      .createHmac('sha512', 'whsec_test')
      .update(serialized)
      .digest('hex');

    const isValid = provider.validateWebhookSignature(signature, payload);
    expect(isValid).toBe(true);
  });
});
