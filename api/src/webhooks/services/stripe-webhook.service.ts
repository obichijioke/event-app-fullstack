import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { StripePaymentProvider } from '../../orders/providers/stripe/stripe.service';
import { OrganizerDisputesService } from '../../organizer/organizer-disputes.service';
import { PaymentStatus } from '@prisma/client';
import Stripe from 'stripe';

@Injectable()
export class StripeWebhookService {
  private readonly logger = new Logger(StripeWebhookService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly stripeProvider: StripePaymentProvider,
    private readonly disputesService: OrganizerDisputesService,
  ) {}

  /**
   * Handles incoming Stripe webhook events
   * @param signature The Stripe-Signature header value
   * @param payload The raw request body
   */
  async handleEvent(
    signature: string | undefined,
    payload: string | Buffer,
  ): Promise<void> {
    const event = this.stripeProvider.constructWebhookEvent(signature, payload);

    if (!event) {
      throw new BadRequestException('Invalid Stripe webhook signature');
    }

    this.logger.log(`Received Stripe webhook event: ${event.type}`);

    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.handlePaymentIntentSucceeded(event.data.object);
        break;

      case 'payment_intent.payment_failed':
        await this.handlePaymentIntentFailed(event.data.object);
        break;

      case 'payment_intent.canceled':
        await this.handlePaymentIntentCanceled(event.data.object);
        break;

      case 'charge.refunded':
        await this.handleChargeRefunded(event.data.object);
        break;

      case 'charge.dispute.created':
        await this.handleDisputeCreated(event.data.object);
        break;

      case 'charge.dispute.closed':
        await this.handleDisputeClosed(event.data.object);
        break;

      default:
        this.logger.debug(`Ignoring unsupported Stripe event: ${event.type}`);
    }
  }

  /**
   * Handles successful payment intent completion
   */
  private async handlePaymentIntentSucceeded(
    paymentIntent: Stripe.PaymentIntent,
  ): Promise<void> {
    const payment = await this.findPaymentByProviderIntent(paymentIntent.id);

    if (!payment) {
      this.logger.warn(
        `Received payment_intent.succeeded for unknown intent: ${paymentIntent.id}`,
      );
      return;
    }

    // Check if already processed to ensure idempotency
    if (payment.status === PaymentStatus.captured) {
      this.logger.debug(
        `Payment ${payment.id} already captured, skipping duplicate webhook`,
      );
      return;
    }

    // Retrieve the latest charge if available
    // PaymentIntent may have charges expanded or we need to fetch them
    const stripe = this.stripeProvider['stripe']; // Access the stripe client
    let capturedAt = new Date();

    try {
      // If charges are expanded in the webhook event, use them
      const charges = paymentIntent.latest_charge
        ? typeof paymentIntent.latest_charge === 'string'
          ? await stripe.charges.retrieve(paymentIntent.latest_charge)
          : paymentIntent.latest_charge
        : null;

      if (charges?.created) {
        capturedAt = new Date(charges.created * 1000);
      }
    } catch {
      this.logger.warn(
        `Could not retrieve charge details for ${paymentIntent.id}, using current time`,
      );
    }

    await this.markPaymentCaptured(payment.id, payment.orderId, capturedAt);

    this.logger.log(
      `Payment ${payment.id} marked as captured for order ${payment.orderId}`,
    );
  }

  /**
   * Handles failed payment intent
   */
  private async handlePaymentIntentFailed(
    paymentIntent: Stripe.PaymentIntent,
  ): Promise<void> {
    const payment = await this.findPaymentByProviderIntent(paymentIntent.id);

    if (!payment) {
      this.logger.warn(
        `Received payment_intent.payment_failed for unknown intent: ${paymentIntent.id}`,
      );
      return;
    }

    const failureCode =
      paymentIntent.last_payment_error?.code || 'payment_failed';
    const failureMessage =
      paymentIntent.last_payment_error?.message || 'Payment failed';

    await this.markPaymentFailed(payment.id, failureCode, failureMessage);

    this.logger.log(`Payment ${payment.id} marked as failed: ${failureCode}`);
  }

  /**
   * Handles canceled payment intent
   */
  private async handlePaymentIntentCanceled(
    paymentIntent: Stripe.PaymentIntent,
  ): Promise<void> {
    const payment = await this.findPaymentByProviderIntent(paymentIntent.id);

    if (!payment) {
      this.logger.warn(
        `Received payment_intent.canceled for unknown intent: ${paymentIntent.id}`,
      );
      return;
    }

    await this.markPaymentFailed(
      payment.id,
      'canceled',
      'Payment intent was canceled',
    );

    this.logger.log(`Payment ${payment.id} marked as canceled`);
  }

  /**
   * Handles charge refund
   */
  private async handleChargeRefunded(charge: Stripe.Charge): Promise<void> {
    const paymentIntentId =
      typeof charge.payment_intent === 'string'
        ? charge.payment_intent
        : charge.payment_intent?.id;

    if (!paymentIntentId) {
      this.logger.warn(
        `Received charge.refunded without payment_intent: ${charge.id}`,
      );
      return;
    }

    const payment = await this.findPaymentByProviderIntent(paymentIntentId);

    if (!payment) {
      this.logger.warn(
        `Received charge.refunded for unknown payment intent: ${paymentIntentId}`,
      );
      return;
    }

    // Update refund status if refund record exists
    const refundAmount = charge.amount_refunded;
    this.logger.log(
      `Charge ${charge.id} refunded ${refundAmount} for payment ${payment.id}`,
    );

    // Prefer matching refund by provider reference if available
    const providerRefundId = charge.refunds?.data?.[0]?.id;
    let refund: any = null;

    if (providerRefundId) {
      refund = await this.prisma.refund.findFirst({
        where: {
          providerRef: providerRefundId,
          orderId: payment.orderId,
        },
      });
    }

    if (!refund) {
      refund = await this.prisma.refund.findFirst({
        where: {
          orderId: payment.orderId,
          status: 'pending',
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    }

    if (refund) {
      await this.prisma.refund.update({
        where: { id: refund.id },
        data: {
          status: 'processed',
          processedAt: new Date(),
          providerRef: providerRefundId ?? refund.providerRef,
        },
      });

      this.logger.log(`Refund ${refund.id} marked as processed`);
    }
  }

  /**
   * Handles dispute creation (chargeback)
   */
  private async handleDisputeCreated(dispute: Stripe.Dispute): Promise<void> {
    const chargeId =
      typeof dispute.charge === 'string' ? dispute.charge : dispute.charge?.id;

    if (!chargeId) {
      this.logger.warn(
        `Received dispute.created without charge: ${dispute.id}`,
      );
      return;
    }

    this.logger.warn(
      `Dispute created for charge ${chargeId}: ${dispute.reason}`,
    );

    // Find the payment and order associated with this charge
    const paymentIntentId =
      typeof dispute.payment_intent === 'string'
        ? dispute.payment_intent
        : dispute.payment_intent?.id;

    if (!paymentIntentId) {
      this.logger.warn(
        `Received dispute.created without payment_intent: ${dispute.id}`,
      );
      return;
    }

    const payment = await this.findPaymentByProviderIntent(paymentIntentId);

    if (!payment) {
      this.logger.warn(
        `Received dispute.created for unknown payment intent: ${paymentIntentId}`,
      );
      return;
    }

    // Check if dispute already exists to ensure idempotency
    const existingDispute = await this.prisma.dispute.findUnique({
      where: {
        provider_caseId: {
          provider: 'stripe',
          caseId: dispute.id,
        },
      },
    });

    if (existingDispute) {
      this.logger.debug(
        `Dispute ${dispute.id} already exists, skipping duplicate webhook`,
      );
      return;
    }

    // Create dispute record and update order status in a transaction
    const [createdDispute] = await this.prisma.$transaction([
      this.prisma.dispute.create({
        data: {
          orderId: payment.orderId,
          type: 'payment_provider',
          provider: 'stripe',
          caseId: dispute.id,
          status: 'needs_response',
          amountCents: dispute.amount,
          reason: dispute.reason,
          openedAt: new Date(dispute.created * 1000),
        },
      }),
      this.prisma.order.update({
        where: { id: payment.orderId },
        data: {
          status: 'chargeback',
        },
      }),
    ]);

    this.logger.log(
      `Dispute ${dispute.id} created for order ${payment.orderId} with status 'needs_response'`,
    );

    // Send notifications to organization members
    try {
      await this.disputesService.notifyDisputeCreated(createdDispute.id);
    } catch (error) {
      this.logger.error(
        `Failed to send dispute notification for ${createdDispute.id}`,
        error,
      );
      // Don't fail the webhook if notification fails
    }
  }

  /**
   * Handles dispute closure
   */
  private async handleDisputeClosed(dispute: Stripe.Dispute): Promise<void> {
    const chargeId =
      typeof dispute.charge === 'string' ? dispute.charge : dispute.charge?.id;

    if (!chargeId) {
      this.logger.warn(`Received dispute.closed without charge: ${dispute.id}`);
      return;
    }

    this.logger.log(
      `Dispute closed for charge ${chargeId}: status=${dispute.status}`,
    );

    // Find the existing dispute record
    const existingDispute = await this.prisma.dispute.findUnique({
      where: {
        provider_caseId: {
          provider: 'stripe',
          caseId: dispute.id,
        },
      },
      include: {
        order: true,
      },
    });

    if (!existingDispute) {
      this.logger.warn(
        `Received dispute.closed for unknown dispute: ${dispute.id}`,
      );
      return;
    }

    // Map Stripe dispute status to our status
    // Stripe statuses: won, lost, warning_needs_response, warning_under_review, warning_closed
    let disputeStatus: string;
    let orderStatus: any = existingDispute.order.status;

    if (dispute.status === 'won') {
      disputeStatus = 'won';
      orderStatus = 'paid'; // Restore order to paid status
    } else if (dispute.status === 'lost') {
      disputeStatus = 'lost';
      orderStatus = 'chargeback'; // Keep as chargeback
    } else if (dispute.status.startsWith('warning')) {
      disputeStatus = 'warning';
      // Keep current order status for warnings
    } else {
      disputeStatus = dispute.status;
    }

    // Update dispute and order status in a transaction
    const [updatedDispute] = await this.prisma.$transaction([
      this.prisma.dispute.update({
        where: { id: existingDispute.id },
        data: {
          status: disputeStatus,
          closedAt: new Date(),
        },
      }),
      this.prisma.order.update({
        where: { id: existingDispute.orderId },
        data: {
          status: orderStatus,
        },
      }),
    ]);

    this.logger.log(
      `Dispute ${dispute.id} closed with status '${disputeStatus}', order ${existingDispute.orderId} updated to '${orderStatus}'`,
    );

    // Send notifications if dispute is resolved (won/lost)
    if (disputeStatus === 'won' || disputeStatus === 'lost') {
      try {
        await this.disputesService.notifyDisputeResolved(updatedDispute.id);
      } catch (error) {
        this.logger.error(
          `Failed to send dispute resolution notification for ${updatedDispute.id}`,
          error,
        );
        // Don't fail the webhook if notification fails
      }
    }
  }

  /**
   * Finds payment record by Stripe payment intent ID
   */
  private async findPaymentByProviderIntent(
    paymentIntentId: string,
  ): Promise<{ id: string; orderId: string; status: PaymentStatus } | null> {
    return this.prisma.payment.findFirst({
      where: {
        provider: 'stripe',
        providerIntent: paymentIntentId,
      },
      select: {
        id: true,
        orderId: true,
        status: true,
      },
    });
  }

  /**
   * Marks payment as captured and updates order status
   */
  private async markPaymentCaptured(
    paymentId: string,
    orderId: string,
    capturedAt: Date,
  ): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: PaymentStatus.captured,
          capturedAt,
          failureCode: null,
          failureMessage: null,
        },
      }),
      this.prisma.order.update({
        where: { id: orderId },
        data: {
          status: 'paid',
          paidAt: capturedAt,
        },
      }),
    ]);
  }

  /**
   * Marks payment as failed
   */
  private async markPaymentFailed(
    paymentId: string,
    failureCode: string,
    failureMessage: string,
  ): Promise<void> {
    await this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: PaymentStatus.failed,
        failureCode,
        failureMessage,
      },
    });
  }
}
