import { Test, TestingModule } from '@nestjs/testing';
import { AdminPayoutService } from './payout.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { QueuesService } from '../../queues/queues.service';
import { PayoutStatus } from '@prisma/client';

describe('AdminPayoutService', () => {
  let service: AdminPayoutService;
  const prisma = {
    payout: {
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
  } as unknown as PrismaService;

  const queues = {
    addJob: jest.fn(),
  } as unknown as QueuesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminPayoutService,
        { provide: PrismaService, useValue: prisma },
        { provide: QueuesService, useValue: queues },
      ],
    }).compile();

    service = module.get<AdminPayoutService>(AdminPayoutService);
    jest.clearAllMocks();
  });

  describe('processPayout', () => {
    it('enqueues payout processing when pending', async () => {
      prisma.payout.findUnique = jest.fn().mockResolvedValue({
        id: 'p1',
        status: PayoutStatus.pending,
        org: { status: 'active' },
      });
      prisma.payout.update = jest.fn().mockResolvedValue({});
      queues.addJob = jest.fn();

      const result = await service.processPayout('p1');

      expect(prisma.payout.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'p1' },
          data: expect.objectContaining({ status: PayoutStatus.in_review }),
        }),
      );
      expect(queues.addJob).toHaveBeenCalledWith(
        expect.anything(),
        'process-payout',
        { payoutId: 'p1' },
        expect.anything(),
      );
      expect(result).toBeDefined();
    });

    it('throws if status not processable', async () => {
      prisma.payout.findUnique = jest.fn().mockResolvedValue({
        id: 'p1',
        status: PayoutStatus.paid,
        org: { status: 'active' },
      });

      await expect(service.processPayout('p1')).rejects.toThrow(
        /Cannot process payout/,
      );
    });
  });

  describe('rejectPayout', () => {
    it('rejects pending payout', async () => {
      prisma.payout.findUnique = jest.fn().mockResolvedValue({
        id: 'p1',
        status: PayoutStatus.pending,
      });
      prisma.payout.update = jest.fn().mockResolvedValue({
        id: 'p1',
        status: PayoutStatus.canceled,
      });

      const result = await service.rejectPayout('p1', { reason: 'fraud' });
      expect(result.status).toBe(PayoutStatus.canceled);
      expect(prisma.payout.update).toHaveBeenCalled();
    });
  });

  describe('retryPayout', () => {
    it('enqueues retry for failed payout', async () => {
      prisma.payout.findUnique = jest.fn().mockResolvedValue({
        id: 'p1',
        status: PayoutStatus.failed,
      });
      prisma.payout.update = jest.fn().mockResolvedValue({});
      queues.addJob = jest.fn();

      await service.retryPayout('p1', { reason: 'transient failure' });

      expect(prisma.payout.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'p1' },
          data: expect.objectContaining({ status: PayoutStatus.pending }),
        }),
      );
      expect(queues.addJob).toHaveBeenCalledWith(
        expect.anything(),
        'retry-payout',
        { payoutId: 'p1' },
        expect.anything(),
      );
    });
  });
});
