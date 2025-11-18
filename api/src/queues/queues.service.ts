import { Injectable, Logger } from '@nestjs/common';
import { Queue, QueueOptions, Job } from 'bullmq';
import { RedisService } from '../common/redis/redis.service';

export enum QueueName {
  EMAIL = 'email',
  PAYMENT = 'payment',
  WEBHOOK = 'webhook',
  NOTIFICATION = 'notification',
  REPORT = 'report',
  CLEANUP = 'cleanup',
}

@Injectable()
export class QueuesService {
  private readonly logger = new Logger(QueuesService.name);
  private readonly queues: Map<QueueName, Queue> = new Map();

  constructor(private readonly redisService: RedisService) {
    this.initializeQueues();
  }

  private initializeQueues() {
    const defaultOptions: QueueOptions = {
      connection: {
        host: 'localhost',
        port: 6379,
      },
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 50,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    };

    Object.values(QueueName).forEach((queueName) => {
      const queue = new Queue(queueName, defaultOptions);
      this.queues.set(queueName as QueueName, queue);

      queue.on('error', (err) => {
        this.logger.error(`Queue ${queueName} error: ${err.message}`);
      });

      queue.on('waiting', (jobId) => {
        const safeJobId =
          jobId && typeof jobId === 'object'
            ? JSON.stringify(jobId)
            : String(jobId);
        this.logger.debug(`Job ${safeJobId} waiting in queue ${queueName}`);
      });

      // Note: BullMQ v4 has different event names
      // queue.on('active', (job) => {
      //   this.logger.debug(`Job ${job?.id} active in queue ${queueName}`);
      // });

      // queue.on('completed', (job) => {
      //   this.logger.debug(`Job ${job?.id} completed in queue ${queueName}`);
      // });

      // queue.on('failed', (job, err) => {
      //   this.logger.error(`Job ${job?.id} failed in queue ${queueName}: ${err.message}`);
      // });
    });
  }

  getQueue(queueName: QueueName): Queue {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }
    return queue;
  }

  async addJob<T = any>(
    queueName: QueueName,
    jobName: string,
    data: T,
    options?: any,
  ): Promise<Job<T>> {
    const queue = this.getQueue(queueName);
    return queue.add(jobName, data, options);
  }

  async getJob(
    queueName: QueueName,
    jobId: string,
  ): Promise<Job | null | undefined> {
    const queue = this.getQueue(queueName);
    return queue.getJob(jobId);
  }

  async getJobs(
    queueName: QueueName,
    state?: 'active' | 'completed' | 'failed' | 'delayed' | 'waiting',
  ): Promise<Job[]> {
    const queue = this.getQueue(queueName);
    return queue.getJobs(state);
  }

  async removeJob(queueName: QueueName, jobId: string): Promise<boolean> {
    const queue = this.getQueue(queueName);
    const job = await queue.getJob(jobId);
    if (job) {
      await job.remove();
      return true;
    }
    return false;
  }

  async pauseQueue(queueName: QueueName): Promise<void> {
    const queue = this.getQueue(queueName);
    await queue.pause();
  }

  async resumeQueue(queueName: QueueName): Promise<void> {
    const queue = this.getQueue(queueName);
    await queue.resume();
  }

  async getQueueCounts(queueName: QueueName): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  }> {
    const queue = this.getQueue(queueName);
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaiting(),
      queue.getActive(),
      queue.getCompleted(),
      queue.getFailed(),
      queue.getDelayed(),
    ]);

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
      delayed: delayed.length,
    };
  }

  async cleanQueue(
    queueName: QueueName,
    grace: number = 0,
    limit: number = 100,
    state?: 'completed' | 'failed',
  ): Promise<string[]> {
    const queue = this.getQueue(queueName);
    return queue.clean(grace, limit, state);
  }

  async onModuleDestroy() {
    for (const [name, queue] of this.queues.entries()) {
      await queue.close();
      this.logger.log(`Queue ${name} closed`);
    }
  }
}
