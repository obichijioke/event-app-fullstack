import { Test, TestingModule } from '@nestjs/testing';
import { SeatmapsService } from './seatmaps.service';

describe('SeatmapsService', () => {
  let service: SeatmapsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SeatmapsService],
    }).compile();

    service = module.get<SeatmapsService>(SeatmapsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
