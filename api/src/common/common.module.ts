import { Module } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { RedisService } from './redis/redis.service';
import { QueueModule } from './queue/queue.module';
import { StorageService } from './storage.service';
import { MailerService } from './mailer/mailer.service';

@Module({
  imports: [QueueModule],
  providers: [PrismaService, RedisService, StorageService, MailerService],
  exports: [
    PrismaService,
    RedisService,
    QueueModule,
    StorageService,
    MailerService,
  ],
})
export class CommonModule {}
