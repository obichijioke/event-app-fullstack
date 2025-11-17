import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateCurrencyData() {
  console.log('Starting currency data migration...\n');

  try {
    // 1. Ensure CurrencyConfiguration exists
    console.log('Step 1: Ensuring currency configuration exists...');
    let config = await prisma.currencyConfiguration.findFirst();

    if (!config) {
      config = await prisma.currencyConfiguration.create({
        data: {
          defaultCurrency: 'NGN',
          supportedCurrencies: ['NGN', 'USD', 'GBP', 'EUR', 'GHS', 'KES', 'ZAR'],
          currencySymbol: '₦',
          currencyPosition: 'before',
          decimalPlaces: 2,
          multiCurrencyEnabled: false,
          exchangeRatesEnabled: false,
          allowOrganizerCurrency: false,
        },
      });
      console.log('✅ Currency configuration created with NGN as default\n');
    } else {
      console.log(`✅ Currency configuration already exists (default: ${config.defaultCurrency})\n`);
    }

    const defaultCurrency = config.defaultCurrency;

    // 2. Update TicketTypes with empty currency
    console.log('Step 2: Updating TicketTypes with missing currency...');
    const ticketTypesResult = await prisma.ticketType.updateMany({
      where: {
        currency: '',
      },
      data: {
        currency: defaultCurrency,
      },
    });
    console.log(`✅ Updated ${ticketTypesResult.count} ticket types\n`);

    // 3. Update Orders with empty currency
    console.log('Step 3: Updating Orders with missing currency...');
    const ordersResult = await prisma.order.updateMany({
      where: {
        currency: '',
      },
      data: {
        currency: defaultCurrency,
      },
    });
    console.log(`✅ Updated ${ordersResult.count} orders\n`);

    // 4. Update OrderItems with empty currency
    console.log('Step 4: Updating OrderItems with missing currency...');
    const orderItemsResult = await prisma.orderItem.updateMany({
      where: {
        currency: '',
      },
      data: {
        currency: defaultCurrency,
      },
    });
    console.log(`✅ Updated ${orderItemsResult.count} order items\n`);

    // 5. Update Payments with empty currency
    console.log('Step 5: Updating Payments with missing currency...');
    const paymentsResult = await prisma.payment.updateMany({
      where: {
        currency: '',
      },
      data: {
        currency: defaultCurrency,
      },
    });
    console.log(`✅ Updated ${paymentsResult.count} payments\n`);

    // 6. Update Refunds with empty currency
    console.log('Step 6: Updating Refunds with missing currency...');
    const refundsResult = await prisma.refund.updateMany({
      where: {
        currency: '',
      },
      data: {
        currency: defaultCurrency,
      },
    });
    console.log(`✅ Updated ${refundsResult.count} refunds\n`);

    // Summary
    console.log('═══════════════════════════════════════════════════');
    console.log('Currency Migration Summary:');
    console.log('═══════════════════════════════════════════════════');
    console.log(`Default Currency: ${defaultCurrency}`);
    console.log(`Ticket Types Updated: ${ticketTypesResult.count}`);
    console.log(`Orders Updated: ${ordersResult.count}`);
    console.log(`Order Items Updated: ${orderItemsResult.count}`);
    console.log(`Payments Updated: ${paymentsResult.count}`);
    console.log(`Refunds Updated: ${refundsResult.count}`);
    console.log('═══════════════════════════════════════════════════');
    console.log('\n✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
migrateCurrencyData()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
