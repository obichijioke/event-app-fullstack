import { Injectable } from '@nestjs/common';
import { Job } from 'bullmq';
import { BaseQueueProcessor } from '../base-queue.processor';
import { RedisService } from '../../common/redis/redis.service';
import { PrismaService } from '../../common/prisma/prisma.service';

export interface ReportJobData {
  reportType:
    | 'events'
    | 'orders'
    | 'tickets'
    | 'users'
    | 'organizations'
    | 'financial';
  userId: string;
  orgId?: string;
  filters?: Record<string, any>;
  format?: 'csv' | 'json' | 'pdf';
  emailTo?: string;
}

@Injectable()
export class ReportProcessor extends BaseQueueProcessor {
  constructor(
    redisService: RedisService,
    private readonly prisma: PrismaService,
  ) {
    super(redisService, 'report');
  }

  async process(job: Job<ReportJobData>): Promise<any> {
    const {
      reportType,
      userId,
      orgId,
      filters = {},
      format = 'csv',
      emailTo,
    } = job.data;

    this.logger.log(`Generating ${reportType} report for user: ${userId}`);

    try {
      let data: any[] = [];
      let filename = '';

      // Generate report data based on type
      switch (reportType) {
        case 'events':
          data = await this.generateEventsReport(orgId, filters);
          filename = `events_report_${Date.now()}.${format}`;
          break;

        case 'orders':
          data = await this.generateOrdersReport(orgId, filters);
          filename = `orders_report_${Date.now()}.${format}`;
          break;

        case 'tickets':
          data = await this.generateTicketsReport(orgId, filters);
          filename = `tickets_report_${Date.now()}.${format}`;
          break;

        case 'users':
          data = await this.generateUsersReport(filters);
          filename = `users_report_${Date.now()}.${format}`;
          break;

        case 'organizations':
          data = await this.generateOrganizationsReport(filters);
          filename = `organizations_report_${Date.now()}.${format}`;
          break;

        case 'financial':
          data = await this.generateFinancialReport(orgId, filters);
          filename = `financial_report_${Date.now()}.${format}`;
          break;

        default:
          throw new Error('Unknown report type');
      }

      // Format the data
      let reportData: Buffer;
      switch (format) {
        case 'csv':
          reportData = this.formatAsCSV(data);
          break;

        case 'json':
          reportData = Buffer.from(JSON.stringify(data, null, 2));
          break;

        case 'pdf':
          // In a real implementation, you would use a PDF library
          reportData = Buffer.from(`PDF report for ${reportType}`);
          break;

        default:
          throw new Error('Unknown format');
      }

      // Store the report (in a real implementation, you would use a file storage service)
      const reportId = `report_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      await this.redisService.set(
        `report:${reportId}`,
        reportData.toString('base64'),
        86400,
      ); // 24 hours

      // Send email if requested
      if (emailTo) {
        // In a real implementation, you would use the email service
        this.logger.log(`Sending report to email: ${emailTo}`);
        // await this.emailService.sendEmail({
        //   to: emailTo,
        //   subject: `Your ${reportType} report is ready`,
        //   template: 'report-ready',
        //   context: {
        //     reportType,
        //     downloadUrl: `/api/reports/${reportId}/download`,
        //   },
        //   attachments: [
        //     {
        //       filename,
        //       content: reportData,
        //     },
        //   ],
        // });
      }

      // Create notification for the user
      // Note: Notification model is not in the schema, so we'll skip this for now
      // await this.prisma.notification.create({
      //   data: {
      //     userId,
      //     type: 'success',
      //     title: 'Report Ready',
      //     message: `Your ${reportType} report is ready for download.`,
      //     data: JSON.stringify({
      //       reportId,
      //       filename,
      //       downloadUrl: `/api/reports/${reportId}/download`,
      //     }),
      //     read: false,
      //     createdAt: new Date(),
      //   },
      // });

      return {
        success: true,
        reportId,
        filename,
        downloadUrl: `/api/reports/${reportId}/download`,
      };
    } catch (error) {
      this.logger.error(
        `Failed to generate ${reportType} report for user: ${userId}`,
        error,
      );

      // Create error notification for the user
      // await this.prisma.notification.create({
      //   data: {
      //     userId,
      //     type: 'error',
      //     title: 'Report Generation Failed',
      //     message: `Failed to generate your ${reportType} report. Please try again.`,
      //     read: false,
      //     createdAt: new Date(),
      //   },
      // });

      throw error;
    }
  }

  private async generateEventsReport(
    orgId?: string,
    filters: Record<string, any> = {},
  ) {
    const whereClause: any = {};

    if (orgId) {
      whereClause.orgId = orgId;
    }

    if (filters.startDate || filters.endDate) {
      whereClause.startAt = {};
      if (filters.startDate) {
        whereClause.startAt.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        whereClause.startAt.lte = new Date(filters.endDate);
      }
    }

    if (filters.status) {
      whereClause.status = filters.status;
    }

    return this.prisma.event.findMany({
      where: whereClause,
      include: {
        org: {
          select: {
            name: true,
          },
        },
        venue: {
          select: {
            name: true,
          },
        },
        _count: {
          select: {
            ticketTypes: true,
          },
        },
      },
    });
  }

  private async generateOrdersReport(
    orgId?: string,
    filters: Record<string, any> = {},
  ) {
    const whereClause: any = {};

    if (orgId) {
      whereClause.event = {
        orgId,
      };
    }

    if (filters.startDate || filters.endDate) {
      whereClause.createdAt = {};
      if (filters.startDate) {
        whereClause.createdAt.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        whereClause.createdAt.lte = new Date(filters.endDate);
      }
    }

    if (filters.status) {
      whereClause.status = filters.status;
    }

    return this.prisma.order.findMany({
      where: whereClause,
      include: {
        event: {
          select: {
            title: true,
            org: {
              select: {
                name: true,
              },
            },
          },
        },
        items: true,
      },
    });
  }

  private async generateTicketsReport(
    orgId?: string,
    filters: Record<string, any> = {},
  ) {
    const whereClause: any = {};

    if (orgId) {
      whereClause.order = {
        event: {
          orgId,
        },
      };
    }

    if (filters.startDate || filters.endDate) {
      whereClause.issuedAt = {};
      if (filters.startDate) {
        whereClause.issuedAt.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        whereClause.issuedAt.lte = new Date(filters.endDate);
      }
    }

    if (filters.status) {
      whereClause.status = filters.status;
    }

    return this.prisma.ticket.findMany({
      where: whereClause,
      include: {
        owner: {
          select: {
            email: true,
            name: true,
          },
        },
        ticketType: {
          select: {
            name: true,
            priceCents: true,
          },
        },
        order: {
          select: {
            id: true,
            createdAt: true,
            event: {
              select: {
                title: true,
                org: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  private async generateUsersReport(filters: Record<string, any> = {}) {
    const whereClause: any = {};

    if (filters.role) {
      whereClause.role = filters.role;
    }

    if (filters.startDate || filters.endDate) {
      whereClause.createdAt = {};
      if (filters.startDate) {
        whereClause.createdAt.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        whereClause.createdAt.lte = new Date(filters.endDate);
      }
    }

    return this.prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            orders: true,
          },
        },
      },
    });
  }

  private async generateOrganizationsReport(filters: Record<string, any> = {}) {
    const whereClause: any = {};

    if (filters.startDate || filters.endDate) {
      whereClause.createdAt = {};
      if (filters.startDate) {
        whereClause.createdAt.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        whereClause.createdAt.lte = new Date(filters.endDate);
      }
    }

    return this.prisma.organization.findMany({
      where: whereClause,
      include: {
        _count: {
          select: {
            events: true,
            members: true,
          },
        },
      },
    });
  }

  private async generateFinancialReport(
    orgId?: string,
    filters: Record<string, any> = {},
  ) {
    const whereClause: any = {};

    if (orgId) {
      whereClause.event = {
        orgId,
      };
    }

    if (filters.startDate || filters.endDate) {
      whereClause.createdAt = {};
      if (filters.startDate) {
        whereClause.createdAt.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        whereClause.createdAt.lte = new Date(filters.endDate);
      }
    }

    // Only include completed orders
    whereClause.status = 'completed';

    return this.prisma.order.findMany({
      where: whereClause,
      include: {
        event: {
          select: {
            title: true,
            org: {
              select: {
                name: true,
              },
            },
          },
        },
        items: {
          include: {
            ticketType: {
              select: {
                name: true,
                priceCents: true,
              },
            },
          },
        },
        feeLines: true,
        taxLines: true,
      },
    });
  }

  private formatAsCSV(data: any[]): Buffer {
    if (data.length === 0) {
      return Buffer.from('');
    }

    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];

    for (const row of data) {
      const values = headers.map((header) => {
        const value = row[header];
        if (value === null || value === undefined) {
          return '';
        }
        if (typeof value === 'object') {
          return JSON.stringify(value);
        }
        return String(value).replace(/"/g, '""');
      });
      csvRows.push(values.join(','));
    }

    return Buffer.from(csvRows.join('\n'));
  }
}
