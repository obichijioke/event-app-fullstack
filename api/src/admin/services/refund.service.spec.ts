import { BadRequestException } from '@nestjs/common';
import { RefundStatus, PaymentStatus } from '@prisma/client';
import { AdminRefundService } from './refund.service';

describe('AdminRefundService - processRefund', () => {
  const prisma: any = {
    refund: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    order: {
      update: jest.fn(),
    },
    ticket: {
      updateMany: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
    notification: {
      create: jest.fn(),
    },
  };

  const paymentService: any = {
    refundCapturedPayment: jest.fn(),
  };

  const service = new AdminRefundService(prisma, paymentService);

  const baseRefund = {
    id: 'refund_1',
    orderId: 'order_1',
    amountCents: BigInt(1000),
    order: {
      totalCents: BigInt(1000),
      payments: [
        {
          id: 'payment_1',
          status: PaymentStatus.captured,
        },
      ],
      tickets: [],
    },
  };

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('marks refund processed on provider success and voids tickets for full refund', async () => {
    prisma.refund.findUnique.mockResolvedValue(baseRefund);
    paymentService.refundCapturedPayment.mockResolvedValue({
      providerReference: 'stripe_ref',
      status: 'succeeded',
    });

    await service.processRefund('refund_1', { force: false });

    expect(paymentService.refundCapturedPayment).toHaveBeenCalledWith(
      'payment_1',
      Number(baseRefund.amountCents),
    );

    expect(prisma.refund.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'refund_1' },
        data: expect.objectContaining({
          status: RefundStatus.processed,
          providerRef: 'stripe_ref',
        }),
      }),
    );

    expect(prisma.order.update).toHaveBeenCalled();
    expect(prisma.ticket.updateMany).toHaveBeenCalled();
  });

  it('marks refund failed when provider returns failed status', async () => {
    prisma.refund.findUnique.mockResolvedValue(baseRefund);
    paymentService.refundCapturedPayment.mockResolvedValue({
      providerReference: 'stripe_ref_fail',
      status: 'failed',
    });

    const result = await service.processRefund('refund_1', { force: false });

    expect(prisma.refund.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: RefundStatus.failed,
          providerRef: 'stripe_ref_fail',
        }),
      }),
    );

    expect(prisma.order.update).not.toHaveBeenCalled();
    expect(prisma.ticket.updateMany).not.toHaveBeenCalled();
    expect(result.providerStatus).toBe('failed');
  });

  it('throws BadRequestException on provider error', async () => {
    prisma.refund.findUnique.mockResolvedValue(baseRefund);
    paymentService.refundCapturedPayment.mockRejectedValue(
      new Error('stripe down'),
    );

    await expect(
      service.processRefund('refund_1', { force: false }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
