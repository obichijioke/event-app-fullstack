import { StripeWebhookService } from './stripe-webhook.service';
import { StripePaymentProvider } from '../../orders/providers/stripe/stripe.service';
import { BadRequestException } from '@nestjs/common';
import Stripe from 'stripe';

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
  refund: {
    findFirst: jest.fn(),
    update: jest.fn().mockResolvedValue(undefined),
  },
  $transaction: jest
    .fn()
    .mockImplementation((actions: Promise<unknown>[]) => Promise.all(actions)),
};

const stripeProvider = {
  constructWebhookEvent: jest.fn(),
} as unknown as StripePaymentProvider;

describe('StripeWebhookService', () => {
  let service: StripeWebhookService;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.payment.update.mockResolvedValue(undefined);
    prisma.order.update.mockResolvedValue(undefined);
    prisma.refund.update.mockResolvedValue(undefined);
    prisma.$transaction.mockImplementation((actions) => Promise.all(actions));
    service = new StripeWebhookService(prisma as any, stripeProvider);
  });

  describe('handleEvent', () => {
    it('throws when signature validation fails', async () => {
      (stripeProvider.constructWebhookEvent as jest.Mock).mockReturnValue(null);

      await expect(
        service.handleEvent('invalid', Buffer.from('test')),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('marks payment as captured on payment_intent.succeeded', async () => {
      const mockEvent: Stripe.Event = {
        id: 'evt_test',
        object: 'event',
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_test123',
            object: 'payment_intent',
            amount: 5000,
            currency: 'usd',
            status: 'succeeded',
            charges: {
              object: 'list',
              data: [
                {
                  id: 'ch_test',
                  object: 'charge',
                  amount: 5000,
                  created: 1609459200, // 2021-01-01 00:00:00 UTC
                } as Stripe.Charge,
              ],
              has_more: false,
              url: '/v1/charges',
            },
          } as Stripe.PaymentIntent,
        },
      } as Stripe.Event;

      (stripeProvider.constructWebhookEvent as jest.Mock).mockReturnValue(
        mockEvent,
      );
      prisma.payment.findFirst.mockResolvedValue({
        id: 'payment_1',
        orderId: 'order_1',
        status: 'requires_action',
      });

      await service.handleEvent('valid_signature', Buffer.from('test'));

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(prisma.payment.update).toHaveBeenCalledWith({
        where: { id: 'payment_1' },
        data: expect.objectContaining({
          status: 'captured',
          failureCode: null,
          failureMessage: null,
        }),
      });
      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: 'order_1' },
        data: expect.objectContaining({
          status: 'paid',
        }),
      });
    });

    it('skips duplicate payment_intent.succeeded webhooks', async () => {
      const mockEvent: Stripe.Event = {
        id: 'evt_test',
        object: 'event',
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_test123',
            object: 'payment_intent',
            status: 'succeeded',
          } as Stripe.PaymentIntent,
        },
      } as Stripe.Event;

      (stripeProvider.constructWebhookEvent as jest.Mock).mockReturnValue(
        mockEvent,
      );
      prisma.payment.findFirst.mockResolvedValue({
        id: 'payment_1',
        orderId: 'order_1',
        status: 'captured', // Already captured
      });

      await service.handleEvent('valid_signature', Buffer.from('test'));

      // Should not update payment or order again
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('marks payment as failed on payment_intent.payment_failed', async () => {
      const mockEvent: Stripe.Event = {
        id: 'evt_test',
        object: 'event',
        type: 'payment_intent.payment_failed',
        data: {
          object: {
            id: 'pi_test123',
            object: 'payment_intent',
            status: 'requires_payment_method',
            last_payment_error: {
              code: 'card_declined',
              message: 'Your card was declined',
            },
          } as Stripe.PaymentIntent,
        },
      } as Stripe.Event;

      (stripeProvider.constructWebhookEvent as jest.Mock).mockReturnValue(
        mockEvent,
      );
      prisma.payment.findFirst.mockResolvedValue({
        id: 'payment_1',
        orderId: 'order_1',
        status: 'requires_action',
      });

      await service.handleEvent('valid_signature', Buffer.from('test'));

      expect(prisma.payment.update).toHaveBeenCalledWith({
        where: { id: 'payment_1' },
        data: {
          status: 'failed',
          failureCode: 'card_declined',
          failureMessage: 'Your card was declined',
        },
      });
    });

    it('marks payment as failed on payment_intent.canceled', async () => {
      const mockEvent: Stripe.Event = {
        id: 'evt_test',
        object: 'event',
        type: 'payment_intent.canceled',
        data: {
          object: {
            id: 'pi_test123',
            object: 'payment_intent',
            status: 'canceled',
          } as Stripe.PaymentIntent,
        },
      } as Stripe.Event;

      (stripeProvider.constructWebhookEvent as jest.Mock).mockReturnValue(
        mockEvent,
      );
      prisma.payment.findFirst.mockResolvedValue({
        id: 'payment_1',
        orderId: 'order_1',
        status: 'requires_action',
      });

      await service.handleEvent('valid_signature', Buffer.from('test'));

      expect(prisma.payment.update).toHaveBeenCalledWith({
        where: { id: 'payment_1' },
        data: {
          status: 'failed',
          failureCode: 'canceled',
          failureMessage: 'Payment intent was canceled',
        },
      });
    });

    it('handles charge.refunded event', async () => {
      const mockEvent: Stripe.Event = {
        id: 'evt_test',
        object: 'event',
        type: 'charge.refunded',
        data: {
          object: {
            id: 'ch_test',
            object: 'charge',
            amount: 5000,
            amount_refunded: 5000,
            payment_intent: 'pi_test123',
          } as Stripe.Charge,
        },
      } as Stripe.Event;

      (stripeProvider.constructWebhookEvent as jest.Mock).mockReturnValue(
        mockEvent,
      );
      prisma.payment.findFirst.mockResolvedValue({
        id: 'payment_1',
        orderId: 'order_1',
        status: 'captured',
      });
      prisma.refund.findFirst.mockResolvedValue({
        id: 'refund_1',
        orderId: 'order_1',
        status: 'pending',
      });

      await service.handleEvent('valid_signature', Buffer.from('test'));

      expect(prisma.refund.update).toHaveBeenCalledWith({
        where: { id: 'refund_1' },
        data: {
          status: 'processed',
          processedAt: expect.any(Date),
        },
      });
    });

    it('ignores unsupported event types', async () => {
      const mockEvent: Stripe.Event = {
        id: 'evt_test',
        object: 'event',
        type: 'customer.created',
        data: {
          object: {} as any,
        },
      } as Stripe.Event;

      (stripeProvider.constructWebhookEvent as jest.Mock).mockReturnValue(
        mockEvent,
      );

      await service.handleEvent('valid_signature', Buffer.from('test'));

      // Should not throw and should not update anything
      expect(prisma.payment.update).not.toHaveBeenCalled();
      expect(prisma.order.update).not.toHaveBeenCalled();
    });

    it('handles unknown payment intent gracefully', async () => {
      const mockEvent: Stripe.Event = {
        id: 'evt_test',
        object: 'event',
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_unknown',
            object: 'payment_intent',
            status: 'succeeded',
          } as Stripe.PaymentIntent,
        },
      } as Stripe.Event;

      (stripeProvider.constructWebhookEvent as jest.Mock).mockReturnValue(
        mockEvent,
      );
      prisma.payment.findFirst.mockResolvedValue(null);

      // Should not throw
      await service.handleEvent('valid_signature', Buffer.from('test'));

      expect(prisma.payment.update).not.toHaveBeenCalled();
      expect(prisma.order.update).not.toHaveBeenCalled();
    });
  });
});
