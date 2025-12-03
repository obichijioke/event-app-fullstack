import { Injectable } from '@nestjs/common';
import { Job } from 'bullmq';
import { BaseQueueProcessor } from '../base-queue.processor';
import { RedisService } from '../../common/redis/redis.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { PayoutStatus } from '@prisma/client';
import { QueueName } from '../queues.service';

export interface PayoutJobData {
  payoutId: string;
}

@Injectable()
export class PayoutProcessor extends BaseQueueProcessor {
  constructor(
    redisService: RedisService,
    private readonly prisma: PrismaService,
  ) {
    super(redisService, QueueName.PAYOUT);
  }

  async process(job: Job<PayoutJobData>): Promise<any> {
    const { payoutId } = job.data;
    const now = new Date();

    const payout = await this.prisma.payout.findUnique({
      where: { id: payoutId },
    });

    if (!payout) {
      throw new Error(`Payout not found: ${payoutId}`);
    }

    if (
      payout.status !== PayoutStatus.pending &&
      payout.status !== PayoutStatus.in_review
    ) {
      // Idempotent exit
      this.logger.log(
        `Skipping payout ${payoutId} because status is ${payout.status}`,
      );
      return { skipped: true, status: payout.status };
    }

    try {
      // In a real integration, call provider APIs (Stripe Connect / Paystack) here.
      const providerRef =
        payout.providerRef ||
        `${payout.provider || 'manual'}_${Date.now().toString(36)}`;

      const updated = await this.prisma.payout.update({
        where: { id: payoutId },
        data: {
          initiatedAt: payout.initiatedAt || now,
          status: PayoutStatus.paid,
          providerRef,
          failureReason: null,
        },
      });

      return { success: true, payoutId, status: updated.status };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown payout failure';
      await this.prisma.payout.update({
        where: { id: payoutId },
        data: {
          status: PayoutStatus.failed,
          failureReason: message,
        },
      });
      throw error;
    }
  }
}
