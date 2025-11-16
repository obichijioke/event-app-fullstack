import { Module } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { RedisService } from './redis/redis.service';
import { QueueModule } from './queue/queue.module';
import { StorageService } from './storage.service';

@Module({
  imports: [QueueModule],
  providers: [PrismaService, RedisService, StorageService],
  exports: [PrismaService, RedisService, QueueModule, StorageService],
})
export class CommonModule {}
