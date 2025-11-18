import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  HealthCheckService,
  HealthIndicatorFunction,
  HealthIndicatorResult,
} from '@nestjs/terminus';
import { PrismaService } from '../common/prisma/prisma.service';
import { RedisService } from '../common/redis/redis.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private prismaService: PrismaService,
    private redisService: RedisService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Check application health' })
  @ApiResponse({ status: 200, description: 'Application is healthy' })
  async check() {
    const result = await this.health.check([
      this.createDatabaseIndicator(),
      this.createRedisIndicator(),
    ]);

    return result;
  }

  @Get('detailed')
  @ApiOperation({ summary: 'Get detailed health information' })
  @ApiResponse({ status: 200, description: 'Detailed health information' })
  async checkDetailed() {
    const database = this.createDatabaseIndicator();
    const redis = this.createRedisIndicator();

    const databaseResult = await database();
    const redisResult = await redis();

    const databaseStatus = databaseResult['database']?.status;
    const redisStatus = redisResult['redis']?.status;

    return {
      status:
        databaseStatus === 'up' && redisStatus === 'up'
          ? 'healthy'
          : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      database: databaseResult,
      redis: redisResult,
    };
  }

  private createDatabaseIndicator(): HealthIndicatorFunction {
    return async (): Promise<HealthIndicatorResult> => {
      try {
        await this.prismaService.$queryRaw`SELECT 1`;
        return {
          database: {
            status: 'up' as any,
            message: 'Database connection is healthy',
          },
        };
      } catch (error) {
        return {
          database: {
            status: 'down' as any,
            message: `Database connection failed: ${error.message}`,
          },
        };
      }
    };
  }

  private createRedisIndicator(): HealthIndicatorFunction {
    return async (): Promise<HealthIndicatorResult> => {
      try {
        await this.redisService.get('health-check');
        return {
          redis: {
            status: 'up' as any,
            message: 'Redis connection is healthy',
          },
        };
      } catch (error) {
        return {
          redis: {
            status: 'down' as any,
            message: `Redis connection failed: ${error.message}`,
          },
        };
      }
    };
  }
}
