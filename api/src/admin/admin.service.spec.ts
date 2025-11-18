/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { AdminService } from './admin.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { QueuesService } from '../queues/queues.service';
import {
  EventStatus,
  PaymentStatus,
  PayoutStatus,
  PlatformRole,
} from '@prisma/client';

describe('AdminService', () => {
  let service: AdminService;
  let prismaService: jest.Mocked<PrismaService>;
  let queuesService: jest.Mocked<QueuesService>;

  beforeEach(async () => {
    const mockPrismaService = {
      user: {
        count: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      event: {
        count: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      organization: {
        count: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      payment: {
        count: jest.fn(),
        findMany: jest.fn(),
      },
      payout: {
        count: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      auditLog: {
        count: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
      },
      order: {
        aggregate: jest.fn(),
        count: jest.fn(),
        findUnique: jest.fn(),
      },
      refund: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      siteSetting: {
        findMany: jest.fn(),
        upsert: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    const mockQueuesService = {
      addJob: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: QueuesService,
          useValue: mockQueuesService,
        },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
    prismaService = module.get(PrismaService);
    queuesService = module.get(QueuesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('updateEventStatus', () => {
    const mockEvent = {
      id: 'event-1',
      status: EventStatus.pending,
      orgId: 'org-1',
      org: { id: 'org-1', status: 'active' },
    };

    it('should update event status successfully', async () => {
      prismaService.event.findUnique.mockResolvedValue(mockEvent as any);
      prismaService.$transaction.mockImplementation(async (callback) => {
        return callback({
          event: {
            update: jest.fn().mockResolvedValue({
              id: 'event-1',
              status: EventStatus.approved,
            }),
          },
          auditLog: { create: jest.fn().mockResolvedValue({}) },
        } as any);
      });
      prismaService.organization.findUnique.mockResolvedValue({
        id: 'org-1',
        owner: { id: 'user-1', email: 'owner@example.com', name: 'Owner' },
      } as any);
      queuesService.addJob.mockResolvedValue(undefined);

      const result = await service.updateEventStatus(
        'event-1',
        { status: EventStatus.approved },
        'admin-1',
      );

      expect(result).toEqual({
        message: 'Event status updated successfully',
        event: { id: 'event-1', status: EventStatus.approved },
      });
      expect(queuesService.addJob).toHaveBeenCalledWith(
        'notification',
        'event-status-change',
        {
          userId: 'user-1',
          title: 'Event status changed: approved',
          body: 'Event event-1 status changed from pending to approved',
          channels: ['in_app', 'email'],
          emailData: {
            template: 'event_status_change',
            context: {
              eventId: 'event-1',
              from: 'pending',
              to: 'approved',
              ownerName: 'Owner',
            },
          },
        },
        { attempts: 3 },
      );
    });

    it('should throw BadRequestException for invalid status transition', async () => {
      prismaService.event.findUnique.mockResolvedValue({
        ...mockEvent,
        status: EventStatus.ended,
      } as any);

      await expect(
        service.updateEventStatus(
          'event-1',
          { status: EventStatus.live },
          'admin-1',
        ),
      ).rejects.toThrow('Invalid status transition from "ended" to "live"');
    });

    it('should throw BadRequestException when organization is suspended', async () => {
      prismaService.event.findUnique.mockResolvedValue({
        ...mockEvent,
        org: { id: 'org-1', status: 'suspended' },
      } as any);

      await expect(
        service.updateEventStatus(
          'event-1',
          { status: EventStatus.approved },
          'admin-1',
        ),
      ).rejects.toThrow(
        'Cannot update event status: organization is suspended',
      );
    });

    it('should create audit log entry', async () => {
      prismaService.event.findUnique.mockResolvedValue(mockEvent as any);
      const mockTransaction = jest.fn().mockImplementation((callback) => {
        return Promise.resolve(
          callback({
            event: {
              update: jest.fn().mockResolvedValue({
                id: 'event-1',
                status: EventStatus.approved,
              }),
            },
            auditLog: { create: jest.fn().mockResolvedValue({}) },
          } as any),
        );
      });
      prismaService.$transaction.mockImplementation(mockTransaction);
      prismaService.organization.findUnique.mockResolvedValue(null);

      await service.updateEventStatus(
        'event-1',
        { status: EventStatus.approved },
        'admin-1',
      );

      expect(mockTransaction).toHaveBeenCalled();
      // Verify audit log creation was called within transaction
      const transactionCallback = mockTransaction.mock.calls[0][0];
      const mockTx = {
        event: { update: jest.fn().mockResolvedValue({}) },
        auditLog: { create: jest.fn().mockResolvedValue({}) },
      };
      await transactionCallback(mockTx);
      expect(mockTx.auditLog.create).toHaveBeenCalledWith({
        data: {
          actorId: 'admin-1',
          action: 'update_event_status',
          targetKind: 'Event',
          targetId: 'event-1',
          meta: {
            from: EventStatus.pending,
            to: EventStatus.approved,
            orgId: 'org-1',
          },
        },
      });
    });
  });

  describe('getUsers', () => {
    it('should validate role parameter', async () => {
      prismaService.user.count.mockResolvedValue(0);
      prismaService.user.findMany.mockResolvedValue([]);

      await expect(
        service.getUsers({ role: 'invalid' as any }),
      ).rejects.toThrow('Invalid role: invalid');
    });

    it('should accept valid role parameter', async () => {
      prismaService.user.count.mockResolvedValue(0);
      prismaService.user.findMany.mockResolvedValue([]);

      const result = await service.getUsers({ role: 'admin' });

      expect(result).toBeDefined();
      expect(prismaService.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            role: PlatformRole.admin,
          }),
        }),
      );
    });
  });

  describe('getEvents', () => {
    it('should validate sortBy parameter', async () => {
      prismaService.event.count.mockResolvedValue(0);
      prismaService.event.findMany.mockResolvedValue([]);

      await expect(
        service.getEvents({ sortBy: 'invalidField' }),
      ).rejects.toThrow('Invalid sort field: invalidField');
    });

    it('should accept valid sortBy parameter', async () => {
      prismaService.event.count.mockResolvedValue(0);
      prismaService.event.findMany.mockResolvedValue([]);

      const result = await service.getEvents({ sortBy: 'title' });

      expect(result).toBeDefined();
      expect(prismaService.event.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { title: 'desc' },
        }),
      );
    });
  });

  describe('getPayments', () => {
    it('should validate status parameter', async () => {
      prismaService.payment.count.mockResolvedValue(0);
      prismaService.payment.findMany.mockResolvedValue([]);

      await expect(
        service.getPayments({ status: 'invalid' as any }),
      ).rejects.toThrow('Invalid payment status: invalid');
    });

    it('should accept valid status parameter', async () => {
      prismaService.payment.count.mockResolvedValue(0);
      prismaService.payment.findMany.mockResolvedValue([]);

      const result = await service.getPayments({ status: 'captured' });

      expect(result).toBeDefined();
      expect(prismaService.payment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: PaymentStatus.captured,
          }),
        }),
      );
    });
  });

  describe('getPayouts', () => {
    it('should validate status parameter', async () => {
      prismaService.payout.count.mockResolvedValue(0);
      prismaService.payout.findMany.mockResolvedValue([]);

      await expect(
        service.getPayouts({ status: 'invalid' as any }),
      ).rejects.toThrow('Invalid payout status: invalid');
    });

    it('should accept valid status parameter', async () => {
      prismaService.payout.count.mockResolvedValue(0);
      prismaService.payout.findMany.mockResolvedValue([]);

      const result = await service.getPayouts({ status: 'paid' });

      expect(result).toBeDefined();
      expect(prismaService.payout.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: PayoutStatus.paid,
          }),
        }),
      );
    });
  });

  describe('approvePayout', () => {
    it('should throw BadRequestException when organization is suspended', async () => {
      prismaService.payout.findUnique.mockResolvedValue({
        id: 'payout-1',
        org: { id: 'org-1', status: 'suspended' },
      } as any);

      await expect(service.approvePayout('payout-1')).rejects.toThrow(
        'Cannot approve payout: organization is suspended',
      );
    });
  });

  describe('createRefund', () => {
    it('should throw BadRequestException when organization is suspended', async () => {
      (prismaService.order.findUnique as jest.Mock).mockResolvedValue({
        id: 'order-1',
        status: 'paid',
        currency: 'NGN',
        totalCents: 10000,
        org: { id: 'org-1', status: 'suspended' },
        payments: [],
        refunds: [],
      });

      await expect(
        service.createRefund({
          orderId: 'order-1',
          amountCents: 5000,
          currency: 'NGN',
          reason: 'Test refund',
        }),
      ).rejects.toThrow('Cannot create refund: organization is suspended');
    });
  });
});
