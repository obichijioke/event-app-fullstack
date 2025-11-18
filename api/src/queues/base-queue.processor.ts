import { Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Worker, Job } from 'bullmq';
import { RedisService } from '../common/redis/redis.service';

export abstract class BaseQueueProcessor
  implements OnModuleInit, OnModuleDestroy
{
  protected readonly logger = new Logger(this.constructor.name);
  protected worker: Worker;

  constructor(
    protected readonly redisService: RedisService,
    protected readonly queueName: string,
  ) {}

  onModuleInit() {
    this.worker = new Worker(
      this.queueName,
      async (job: Job) => {
        this.logger.log(`Processing job ${job.id} of type ${job.name}`);
        try {
          await this.process(job);
          this.logger.log(`Completed job ${job.id} of type ${job.name}`);
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          const errorStack = error instanceof Error ? error.stack : undefined;
          this.logger.error(
            `Failed to process job ${job.id} of type ${job.name}: ${errorMessage}`,
            errorStack,
          );
          throw error;
        }
      },
      {
        connection: {
          host: 'localhost',
          port: 6379,
        },
        concurrency: 5,
      },
    );

    this.worker.on('completed', (job) => {
      this.logger.log(`Job ${job.id} completed successfully`);
    });

    this.worker.on('failed', (job, err) => {
      this.logger.error(`Job ${job?.id} failed: ${err.message}`, err.stack);
    });

    this.worker.on('stalled', (jobId) => {
      this.logger.warn(`Job ${jobId} stalled and will be retried`);
    });

    this.worker.on('error', (err) => {
      this.logger.error(`Worker error: ${err.message}`);
    });
  }

  async onModuleDestroy() {
    if (this.worker) {
      await this.worker.close();
      this.logger.log('Worker closed');
    }
  }

  abstract process(job: Job): Promise<any>;
}
