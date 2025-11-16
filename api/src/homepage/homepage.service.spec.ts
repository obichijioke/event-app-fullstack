import { HomepageService } from './homepage.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { RedisService } from '../common/redis/redis.service';
import { GetHomepageDto } from './dto/get-homepage.dto';
import { HomepageResponseDto } from './dto/homepage-response.dto';

describe('HomepageService', () => {
  let service: HomepageService;
  let prisma: {
    event: { findMany: jest.Mock };
    category: { findMany: jest.Mock };
    organization: { findMany: jest.Mock };
    userFollow: { findMany: jest.Mock };
    order: { findMany: jest.Mock };
  };
  let redis: {
    get: jest.Mock;
    set: jest.Mock;
  };

  beforeEach(() => {
    prisma = {
      event: { findMany: jest.fn().mockResolvedValue([]) },
      category: { findMany: jest.fn().mockResolvedValue([]) },
      organization: { findMany: jest.fn().mockResolvedValue([]) },
      userFollow: { findMany: jest.fn().mockResolvedValue([]) },
      order: { findMany: jest.fn().mockResolvedValue([]) },
    };
    redis = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue(undefined),
    };

    service = new HomepageService(
      prisma as unknown as PrismaService,
      redis as unknown as RedisService,
    );
  });

  it('returns an empty payload when no data exists', async () => {
    const response = await service.getHomepage({} as GetHomepageDto);

    expect(response.hero).toBeNull();
    expect(response.sections).toHaveLength(0);
    expect(response.organizers).toHaveLength(0);
    expect(response.cache.hit).toBe(false);
    expect(redis.set).toHaveBeenCalledWith(
      expect.stringContaining('homepage:city:global'),
      expect.any(String),
      expect.any(Number),
    );
  });

  it('reads from cache when available', async () => {
    const cached: HomepageResponseDto = {
      hero: null,
      filters: {
        categories: [],
        timeframes: [],
        selected: {
          category: null,
          timeframe: null,
          city: null,
        },
      },
      sections: [],
      organizers: [],
      generatedAt: new Date().toISOString(),
      cache: {
        key: 'homepage:city:global:category:all:timeframe:any:segment:all:radius:100:user:anon',
        ttlSeconds: 60,
        hit: false,
      },
    };
    redis.get.mockResolvedValueOnce(JSON.stringify(cached));

    const response = await service.getHomepage({} as GetHomepageDto);

    expect(response.cache.hit).toBe(true);
    expect(redis.set).not.toHaveBeenCalled();
  });
});
