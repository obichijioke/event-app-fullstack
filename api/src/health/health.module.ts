import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { TerminusModule } from '@nestjs/terminus';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [CommonModule, TerminusModule],
  controllers: [HealthController],
})
export class HealthModule {}
