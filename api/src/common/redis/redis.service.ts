import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis, { RedisOptions } from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    this.client = new Redis(this.getConnectionOptions());
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit();
    }
  }

  getConnectionOptions(): RedisOptions {
    const redisUrl = this.configService.get<string>(
      'REDIS_URL',
      'redis://localhost:6379',
    );
    const url = new URL(redisUrl);

    const isTls = url.protocol === 'rediss:';

    return {
      host: url.hostname,
      port: parseInt(url.port, 10) || 6379,
      username: url.username || undefined,
      password: url.password || undefined,
      tls: isTls ? {} : undefined,
      // BullMQ recommends disabling these to avoid MaxRetriesPerRequest errors
      // when running long blocking commands.
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    };
  }

  getClient(): Redis {
    return this.client;
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (ttl) {
      await this.client.setex(key, ttl, value);
    } else {
      await this.client.set(key, value);
    }
  }

  async del(key: string): Promise<number> {
    return this.client.del(key);
  }

  async exists(key: string): Promise<number> {
    return this.client.exists(key);
  }

  async expire(key: string, ttl: number): Promise<number> {
    return this.client.expire(key, ttl);
  }
}
