import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { TicketingService } from '../ticketing/ticketing.service';
import { OrdersService } from '../orders/orders.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { HoldReason } from '@prisma/client';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const ticketingService = app.get(TicketingService);
  const ordersService = app.get(OrdersService);
  const prisma = app.get(PrismaService);

  console.log('Starting Hold System Test...');

  // 1. Setup: Get an event and ticket type
  const event = await prisma.event.findFirst({
    where: { status: 'live' },
    include: { ticketTypes: true },
  });

  if (!event || event.ticketTypes.length === 0) {
    console.error('No live event found with ticket types');
    await app.close();
    return;
  }

  const ticketType = event.ticketTypes[0];
  const userId = (await prisma.user.findFirst())?.id;

  if (!userId) {
    console.error('No user found');
    await app.close();
    return;
  }

  console.log(
    `Testing with Event: ${event.title}, TicketType: ${ticketType.name}`,
  );

  // 2. Create a Hold
  console.log('Creating a hold...');
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 10);

  const hold = await ticketingService.createHold(event.id, userId, {
    ticketTypeId: ticketType.id,
    quantity: 1,
    expiresAt: expiresAt.toISOString(),
    reason: HoldReason.checkout,
  });

  console.log(`Hold created: ${hold.id}`);

  // 3. Verify Inventory (should decrease)
  const inventory = await ticketingService.getInventorySummary(
    event.id,
    userId,
  );
  const ttInventory = inventory.ticketTypes.find((t) => t.id === ticketType.id);
  console.log(`Inventory remaining: ${ttInventory?.available}`);

  // 4. Create Order using Hold
  console.log('Creating order with hold...');
  try {
    const order = await ordersService.createOrder(userId, {
      eventId: event.id,
      items: [{ ticketTypeId: ticketType.id, quantity: 1 }],
      holdId: hold.id,
    });
    console.log(`Order created: ${order.id}`);
  } catch (error) {
    console.error('Failed to create order:', error.message);
  }

  // 5. Verify Hold is gone
  const holdCheck = await prisma.hold.findUnique({ where: { id: hold.id } });
  if (!holdCheck) {
    console.log('Hold successfully deleted after order creation');
  } else {
    console.error('Hold still exists!');
  }

  await app.close();
}

bootstrap();
