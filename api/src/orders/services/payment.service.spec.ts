/* eslint-disable @typescript-eslint/unbound-method */
import { PaymentService } from './payment.service';
import { PaymentProvider } from '../providers/payment-provider.interface';

jest.mock('@prisma/client', () => ({
  PaymentStatus: {
    requires_action: 'requires_action',
    captured: 'captured',
    failed: 'failed',
  },
  PrismaClient: class {},
}));

const mockPrisma = {
  order: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  payment: {
    create: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    findUnique: jest.fn(),
  },
  refund: {
    create: jest.fn(),
  },
};

const baseOrder = {
  id: 'order_123',
  status: 'pending',
  totalCents: BigInt(5000),
  currency: 'NGN',
  buyer: { id: 'buyer_1', email: 'buyer@example.com' },
  items: [],
};

describe('PaymentService', () => {
  let paymentService: PaymentService;
  let provider: jest.Mocked<PaymentProvider>;

  beforeEach(() => {
    jest.clearAllMocks();

    provider = {
      name: 'paystack',
      initializePayment: jest.fn(),
      confirmPayment: jest.fn(),
      refundPayment: jest.fn(),
    } as unknown as jest.Mocked<PaymentProvider>;

    paymentService = new PaymentService(
      mockPrisma as any,
      [provider] as unknown as PaymentProvider[],
    );
  });

  it('creates a payment intent using the selected provider', async () => {
    mockPrisma.order.findUnique.mockResolvedValueOnce(baseOrder);
    provider.initializePayment.mockResolvedValueOnce({
      paymentRecord: {
        providerCharge: 'order_order_123',
        status: 'requires_action',
      },
      clientResponse: {
        reference: 'order_order_123',
      },
    });

    const response = await paymentService.createPaymentIntent('order_123', {
      provider: 'paystack',
    } as any);

    expect(provider.initializePayment).toHaveBeenCalled();
    expect(mockPrisma.payment.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        provider: 'paystack',
        providerCharge: 'order_order_123',
      }),
    });
    expect(response.reference).toEqual('order_order_123');
  });

  it('processes a payment confirmation', async () => {
    mockPrisma.order.findUnique.mockResolvedValueOnce(baseOrder);
    mockPrisma.payment.findFirst.mockResolvedValueOnce({
      id: 'payment_1',
      orderId: 'order_123',
      provider: 'paystack',
    });
    provider.confirmPayment.mockResolvedValueOnce({
      status: 'captured',
      providerCharge: 'order_order_123',
      capturedAt: new Date('2024-01-01T00:00:00.000Z'),
      response: { status: 'captured' },
    } as any);

    await paymentService.processPayment({ orderId: 'order_123' });

    expect(provider.confirmPayment).toHaveBeenCalled();
    expect(mockPrisma.payment.update).toHaveBeenCalledWith({
      where: { id: 'payment_1' },
      data: expect.objectContaining({ status: 'captured' }),
    });
    expect(mockPrisma.order.update).toHaveBeenCalledWith({
      where: { id: 'order_123' },
      data: expect.objectContaining({ status: 'paid' }),
    });
  });

  it('creates a refund using the provider', async () => {
    mockPrisma.payment.findUnique.mockResolvedValueOnce({
      id: 'payment_1',
      orderId: 'order_123',
      provider: 'paystack',
      status: 'captured',
      amountCents: BigInt(5000),
      currency: 'NGN',
    });

    provider.refundPayment.mockResolvedValueOnce({
      amountCents: BigInt(5000),
      currency: 'NGN',
      status: 'pending',
      providerReference: 'refund_1',
      response: { id: 'refund_1' },
    });

    await paymentService.refundPayment('payment_1', undefined, 'user_1');

    expect(provider.refundPayment).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'payment_1' }),
      undefined,
    );
    expect(mockPrisma.refund.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ providerRef: 'refund_1', createdBy: 'user_1' }),
    });
  });
});
