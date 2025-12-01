import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../common/prisma/prisma.service';
import { MailerService } from '../common/mailer/mailer.service';

@Injectable()
export class EventRemindersService {
  private readonly logger = new Logger(EventRemindersService.name);

  constructor(
    private prisma: PrismaService,
    private mailerService: MailerService,
  ) {}

  /**
   * Run every hour to check for upcoming events
   * Send reminders 24 hours before event start
   */
  @Cron(CronExpression.EVERY_HOUR)
  async sendEventReminders() {
    this.logger.log('Checking for events that need reminders...');

    try {
      // Find events starting in 23-25 hours (1-hour window for the hourly cron)
      const now = new Date();
      const reminderStart = new Date(now.getTime() + 23 * 60 * 60 * 1000); // 23 hours from now
      const reminderEnd = new Date(now.getTime() + 25 * 60 * 60 * 1000); // 25 hours from now

      const upcomingEvents = await this.prisma.event.findMany({
        where: {
          startAt: {
            gte: reminderStart,
            lte: reminderEnd,
          },
          status: 'live', // Only send for live events
          visibility: 'public', // Only public events
        },
        select: {
          id: true,
          title: true,
          startAt: true,
          doorTime: true,
          venue: {
            select: {
              name: true,
              address: true,
            },
          },
          org: {
            select: {
              supportEmail: true,
            },
          },
        },
      });

      this.logger.log(
        `Found ${upcomingEvents.length} events needing reminders`,
      );

      for (const event of upcomingEvents) {
        await this.sendRemindersForEvent(event);
      }

      this.logger.log('Event reminder check complete');
    } catch (error) {
      this.logger.error('Error sending event reminders:', error);
    }
  }

  private async sendRemindersForEvent(event: any) {
    try {
      // Get all orders for this event
      const orders = await this.prisma.order.findMany({
        where: {
          eventId: event.id,
          status: 'paid', // Only paid orders
        },
        include: {
          tickets: {
            where: {
              status: 'issued', // Only issued tickets
            },
          },
        },
      });

      this.logger.log(
        `Sending reminders for event "${event.title}" to ${orders.length} customers`,
      );

      // Group orders by buyer (user) and send one email per user
      const userOrders = new Map<string, typeof orders>();
      for (const order of orders) {
        if (order.tickets.length === 0) continue;

        const existing = userOrders.get(order.buyerId) || [];
        existing.push(order);
        userOrders.set(order.buyerId, existing);
      }

      for (const [userId, userOrderList] of userOrders) {
        const user = await this.prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, email: true, name: true },
        });

        if (!user) continue;

        // Send one reminder with all tickets
        await this.sendReminderEmail(event, user, userOrderList).catch(
          (error) => {
            this.logger.error(
              `Failed to send reminder to user ${userId}:`,
              error,
            );
            // Continue sending to other users even if one fails
          },
        );
      }
    } catch (error) {
      this.logger.error(
        `Error sending reminders for event ${event.id}:`,
        error,
      );
    }
  }

  private async sendReminderEmail(event: any, user: any, orders: any[]) {
    // Count total tickets across all orders
    const ticketCount = orders.reduce(
      (sum, order) => sum + order.tickets.length,
      0,
    );
    const orderNumber = orders[0].id; // Use first order ID

    // Format event date and time
    const eventDate = new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC',
    }).format(new Date(event.startAt));

    const eventTime = new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      timeZone: 'UTC',
    }).format(new Date(event.startAt));

    // Calculate doors open time if available
    let doorsOpenTime: string | null = null;
    if (event.doorTime) {
      doorsOpenTime = new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        timeZone: 'UTC',
      }).format(new Date(event.doorTime));
    }

    // Format venue address (address is a JSON field)
    let venueAddress = '';
    if (event.venue?.address) {
      const addr = event.venue.address;
      venueAddress =
        typeof addr === 'string'
          ? addr
          : [addr.street, addr.city, addr.state, addr.country]
              .filter(Boolean)
              .join(', ');
    }

    // Create venue map URL (Google Maps)
    let venueMapUrl: string | null = null;
    if (venueAddress) {
      venueMapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venueAddress)}`;
    }

    await this.mailerService.sendTemplatedMail({
      to: user.email,
      subject: `Reminder: ${event.title} is Tomorrow!`,
      template: 'event-reminder',
      context: {
        userName: user.name || user.email.split('@')[0],
        eventName: event.title,
        eventDate,
        eventTime,
        doorsOpenTime,
        venueName: event.venue?.name,
        venueAddress,
        ticketCount,
        orderNumber: orderNumber.slice(0, 8).toUpperCase(),
        ticketsUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/account/tickets`,
        organizerEmail: event.org?.supportEmail || 'noreply@eventflow.dev',
        parkingInfo: null,
        publicTransit: null,
        eventUpdates: null, // Could be populated from event announcements
        venueMapUrl,
      },
    });

    this.logger.log(
      `Reminder sent to ${user.email} for event "${event.title}"`,
    );
  }

  /**
   * Manual trigger for testing or admin use
   */
  async sendManualReminder(eventId: string) {
    this.logger.log(`Manually sending reminders for event ${eventId}`);

    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        title: true,
        startAt: true,
        doorTime: true,
        venue: {
          select: {
            name: true,
            address: true,
          },
        },
        org: {
          select: {
            supportEmail: true,
          },
        },
      },
    });

    if (!event) {
      throw new Error('Event not found');
    }

    await this.sendRemindersForEvent(event);

    return {
      message: `Reminders sent for event "${event.title}"`,
    };
  }
}
