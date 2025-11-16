import { PaystackWebhookService } from './paystack-webhook.service';
import { PaystackPaymentProvider } from '../../orders/providers/paystack/paystack.service';
import { BadRequestException } from '@nestjs/common';

jest.mock('@prisma/client', () => ({
  PaymentStatus: {
    requires_action: 'requires_action',
    captured: 'captured',
    failed: 'failed',
  },
  PrismaClient: class {},
}));

const prisma = {
  payment: {
    findFirst: jest.fn(),
    update: jest.fn().mockResolvedValue(undefined),
  },
  order: {
    update: jest.fn().mockResolvedValue(undefined),
  },
  $transaction: jest
    .fn()
    .mockImplementation((actions: Promise<unknown>[]) => Promise.all(actions)),
};

const paystackProvider = {
  validateWebhookSignature: jest.fn(),
} as unknown as PaystackPaymentProvider;

describe('PaystackWebhookService', () => {
  let service: PaystackWebhookService;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.payment.update.mockResolvedValue(undefined);
    prisma.order.update.mockResolvedValue(undefined);
    prisma.$transaction.mockImplementation((actions) => Promise.all(actions));
    service = new PaystackWebhookService(prisma as any, paystackProvider);
  });

  it('throws when signature validation fails', async () => {
    (paystackProvider.validateWebhookSignature as jest.Mock).mockReturnValue(
      false,
    );

    await expect(
      service.handleEvent('invalid', { event: 'charge.success', data: {} }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('marks payments as captured on success events', async () => {
    (paystackProvider.validateWebhookSignature as jest.Mock).mockReturnValue(
      true,
    );
    prisma.payment.findFirst.mockResolvedValue({
      id: 'payment_1',
      orderId: 'order_1',
    });

    await service.handleEvent('signature', {
      event: 'charge.success',
      data: {
        reference: 'order_order_1',
        paid_at: '2024-01-01T00:00:00.000Z',
      },
    });

    expect(prisma.$transaction).toHaveBeenCalled();
    expect(prisma.payment.update).toHaveBeenCalledWith({
      where: { id: 'payment_1' },
      data: expect.objectContaining({ status: 'captured' }),
    });
    expect(prisma.order.update).toHaveBeenCalledWith({
      where: { id: 'order_1' },
      data: expect.objectContaining({ status: 'paid' }),
    });
  });

  it('marks payments as failed on charge.failed events', async () => {
    (paystackProvider.validateWebhookSignature as jest.Mock).mockReturnValue(
      true,
    );
    prisma.payment.findFirst.mockResolvedValue({
      id: 'payment_1',
      orderId: 'order_1',
    });

    await service.handleEvent('signature', {
      event: 'charge.failed',
      data: {
        reference: 'order_order_1',
        gateway_response: 'Insufficient funds',
      },
    });

    expect(prisma.payment.update).toHaveBeenCalledWith({
      where: { id: 'payment_1' },
      data: expect.objectContaining({
        status: 'failed',
        failureMessage: 'Insufficient funds',
      }),
    });
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
