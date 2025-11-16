import { Test, TestingModule } from '@nestjs/testing';
import { SeatmapsController } from './seatmaps.controller';

describe('SeatmapsController', () => {
  let controller: SeatmapsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SeatmapsController],
    }).compile();

    controller = module.get<SeatmapsController>(SeatmapsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
