import { Test, TestingModule } from '@nestjs/testing';
import { PaymentService } from '../../src/orders/services/payment.service';
import { PrismaService } from '../../src/common/prisma/prisma.service';
import { PaystackPaymentProvider } from '../../src/orders/providers/paystack/paystack.service';
import { StripePaymentProvider } from '../../src/orders/providers/stripe/stripe.service';
import { PAYMENT_PROVIDERS } from '../../src/orders/tokens';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { PaystackWebhookService } from '../../src/webhooks/services/paystack-webhook.service';
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

class PrismaServiceMock {
  order = {
    findUnique: jest.fn(),
    update: jest.fn(),
  };
  payment = {
    create: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    findUnique: jest.fn(),
  };
  refund = {
    create: jest.fn(),
  };
  $transaction = jest
    .fn()
    .mockImplementation((actions: Promise<unknown>[]) => Promise.all(actions));
}

const mockAxiosInstance = {
  post: jest.fn(),
  get: jest.fn(),
};

(axios.create as jest.Mock).mockReturnValue(mockAxiosInstance);

const orderFixture = {
  id: 'order_123',
  status: 'pending',
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

describe('Paystack payments E2E', () => {
  let moduleRef: TestingModule;
  let paymentService: PaymentService;
  let prisma: PrismaServiceMock;
  let webhookService: PaystackWebhookService;

  beforeAll(async () => {
    process.env.PAYSTACK_SECRET_KEY = 'sk_test_secret';
    process.env.PAYSTACK_PUBLIC_KEY = 'pk_test_public';
    process.env.PAYSTACK_WEBHOOK_SECRET = 'whsec_test';
    process.env.STRIPE_SECRET_KEY = 'sk_test_stripe';

    prisma = new PrismaServiceMock();

    moduleRef = await Test.createTestingModule({
      providers: [
        PaymentService,
        PaystackPaymentProvider,
        {
          provide: StripePaymentProvider,
          useValue: {
            name: 'stripe',
            initializePayment: jest.fn(),
            confirmPayment: jest.fn(),
            refundPayment: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: prisma,
        },
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) => process.env[key],
          },
        },
        {
          provide: PAYMENT_PROVIDERS,
          useFactory: (
            stripe: StripePaymentProvider,
            paystack: PaystackPaymentProvider,
          ) => [stripe, paystack],
          inject: [StripePaymentProvider, PaystackPaymentProvider],
        },
        PaystackWebhookService,
      ],
    }).compile();

    paymentService = moduleRef.get(PaymentService);
    webhookService = moduleRef.get(PaystackWebhookService);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockAxiosInstance.post.mockReset();
    mockAxiosInstance.get.mockReset();
    (axios.create as jest.Mock).mockReturnValue(mockAxiosInstance);
    prisma.order.findUnique.mockResolvedValue(orderFixture);
    prisma.payment.create.mockResolvedValue(undefined);
    prisma.payment.findFirst.mockResolvedValue({
      id: 'payment_1',
      orderId: 'order_123',
      provider: 'paystack',
      providerCharge: 'order_order_123',
    });
    prisma.payment.findUnique.mockResolvedValue({
      id: 'payment_1',
      orderId: 'order_123',
      provider: 'paystack',
      providerCharge: 'order_order_123',
      status: 'captured',
      amountCents: BigInt(5000),
      currency: 'NGN',
    });
  });

  it('initializes and verifies Paystack payments', async () => {
    mockAxiosInstance.post.mockResolvedValueOnce({
      data: {
        data: {
          authorization_url: 'https://paystack/authorize',
          reference: 'order_order_123',
        },
      },
    });

    const createResponse = await paymentService.createPaymentIntent(
      'order_123',
      { provider: 'paystack' } as any,
    );

    expect(createResponse.reference).toEqual('order_order_123');
    expect(prisma.payment.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ provider: 'paystack' }),
    });

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

    await paymentService.processPayment({ orderId: 'order_123' });

    expect(prisma.payment.update).toHaveBeenCalledWith({
      where: { id: 'payment_1' },
      data: expect.objectContaining({ status: 'captured' }),
    });
    expect(prisma.order.update).toHaveBeenCalledWith({
      where: { id: 'order_123' },
      data: expect.objectContaining({ status: 'paid' }),
    });
  });

  it('creates Paystack refunds', async () => {
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

    await paymentService.createPaymentIntent('order_123', {
      provider: 'paystack',
    } as any);

    await paymentService.refundPayment('payment_1');

    expect(prisma.refund.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ providerRef: 'refund_1' }),
    });
  });

  it('reconciles Paystack webhook events', async () => {
    prisma.payment.findFirst.mockResolvedValue({
      id: 'payment_1',
      orderId: 'order_123',
    });

    const payload = {
      event: 'charge.success',
      data: {
        reference: 'order_order_123',
        paid_at: '2024-01-01T00:00:00.000Z',
      },
    };

    const signature = crypto
      .createHmac('sha512', 'whsec_test')
      .update(JSON.stringify(payload))
      .digest('hex');

    await webhookService.handleEvent(signature, payload);

    expect(prisma.payment.update).toHaveBeenCalledWith({
      where: { id: 'payment_1' },
      data: expect.objectContaining({ status: 'captured' }),
    });
  });
});
