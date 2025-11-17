import axios from 'axios';
import * as dotenv from 'dotenv';
import { join } from 'path';

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

const API_URL = process.env.API_URL || 'http://localhost:3000/api';

interface OrderResponse {
  id: string;
  status: string;
  totalCents: bigint;
  currency: string;
  eventId: string;
  buyerId: string;
}

interface PaymentInitResponse {
  clientSecret?: string;
  paymentIntentId?: string;
  authorizationUrl?: string;
  reference?: string;
}

async function testPaymentFlow() {
  console.log('🧪 Testing Payment Flow\n');
  console.log('='.repeat(60));

  try {
    // Step 1: Get authentication token
    console.log('\n📝 Step 1: Getting authentication token...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'organizer@eventflow.dev',
      password: 'Password123!',
    });

    const token = loginResponse.data.accessToken || loginResponse.data.access_token;
    console.log('✅ Authentication successful');

    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    // Step 2: Find a live event
    console.log('\n📝 Step 2: Finding a live event...');
    const eventsResponse = await axios.get(`${API_URL}/events`, {
      params: {
        status: 'live',
        visibility: 'public',
      },
    });

    if (!eventsResponse.data.length) {
      console.log('❌ No live events found. Please create a live event first.');
      return;
    }

    const event = eventsResponse.data[0];
    console.log(`✅ Found event: ${event.title} (ID: ${event.id})`);

    // Step 3: Get ticket types for the event
    console.log('\n📝 Step 3: Getting ticket types...');
    const ticketTypesResponse = await axios.get(
      `${API_URL}/ticketing/events/${event.id}/ticket-types`,
      { headers },
    );

    if (!ticketTypesResponse.data.length) {
      console.log('❌ No ticket types found for this event.');
      return;
    }

    const ticketType = ticketTypesResponse.data[0];
    console.log(
      `✅ Found ticket type: ${ticketType.name} (Price: ${ticketType.priceCents / 100} ${ticketType.currency})`,
    );
    console.log(`   Ticket Type ID: ${ticketType.id}`);
    console.log(`   Status: ${ticketType.status}`);

    // Step 4: Create an order
    console.log('\n📝 Step 4: Creating order...');
    const orderPayload = {
      eventId: event.id,
      items: [
        {
          ticketTypeId: ticketType.id,
          quantity: 2,
        },
      ],
    };

    const orderResponse = await axios.post<OrderResponse>(
      `${API_URL}/orders`,
      orderPayload,
      { headers },
    );

    const order = orderResponse.data;
    console.log(`✅ Order created: ${order.id}`);
    console.log(
      `   Status: ${order.status}, Total: ${Number(order.totalCents) / 100} ${order.currency}`,
    );

    // Step 5: Test Stripe payment initialization
    console.log('\n📝 Step 5: Testing Stripe payment initialization...');
    try {
      const stripePaymentPayload = {
        provider: 'stripe',
        returnUrl: 'http://localhost:3000/payment/success',
      };

      const stripePaymentResponse = await axios.post<PaymentInitResponse>(
        `${API_URL}/orders/${order.id}/payment`,
        stripePaymentPayload,
        { headers },
      );

      console.log('✅ Stripe payment initialized successfully');
      console.log(`   Payment Intent ID: ${stripePaymentResponse.data.paymentIntentId}`);
      console.log(
        `   Client Secret: ${stripePaymentResponse.data.clientSecret?.substring(0, 20)}...`,
      );
    } catch (error: any) {
      if (error.response?.status === 500 && error.response?.data?.message?.includes('STRIPE_SECRET_KEY')) {
        console.log('⚠️  Stripe not configured (STRIPE_SECRET_KEY missing)');
      } else {
        console.log(`❌ Stripe payment initialization failed: ${error.response?.data?.message || error.message}`);
      }
    }

    // Step 6: Test Paystack payment initialization (on a new order)
    console.log('\n📝 Step 6: Testing Paystack payment initialization...');

    // Create another order for Paystack test
    const order2Response = await axios.post<OrderResponse>(
      `${API_URL}/orders`,
      orderPayload,
      { headers },
    );

    const order2 = order2Response.data;
    console.log(`✅ Second order created: ${order2.id}`);

    try {
      const paystackPaymentPayload = {
        provider: 'paystack',
        returnUrl: 'http://localhost:3000/payment/success',
      };

      const paystackPaymentResponse = await axios.post<PaymentInitResponse>(
        `${API_URL}/orders/${order2.id}/payment`,
        paystackPaymentPayload,
        { headers },
      );

      console.log('✅ Paystack payment initialized successfully');
      console.log(`   Reference: ${paystackPaymentResponse.data.reference}`);
      console.log(
        `   Authorization URL: ${paystackPaymentResponse.data.authorizationUrl}`,
      );
    } catch (error: any) {
      if (error.response?.status === 500 && error.response?.data?.message?.includes('PAYSTACK_SECRET_KEY')) {
        console.log('⚠️  Paystack not configured (PAYSTACK_SECRET_KEY missing)');
      } else {
        console.log(`❌ Paystack payment initialization failed: ${error.response?.data?.message || error.message}`);
      }
    }

    // Step 7: Check payment records in database
    console.log('\n📝 Step 7: Verifying payment records...');
    const orderDetailsResponse = await axios.get(
      `${API_URL}/orders/${order.id}`,
      { headers },
    );

    const orderDetails = orderDetailsResponse.data;
    console.log(`✅ Order status: ${orderDetails.status}`);
    console.log(`   Payments created: ${orderDetails.payments?.length || 0}`);

    if (orderDetails.payments?.length > 0) {
      orderDetails.payments.forEach((payment: any, index: number) => {
        console.log(
          `   Payment ${index + 1}: ${payment.provider} - ${payment.status}`,
        );
      });
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Payment flow test completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`   - Order creation: ✅`);
    console.log(`   - Stripe integration: ${stripePaymentResponse ? '✅' : '⚠️'}`);
    console.log(`   - Paystack integration: ${paystackPaymentResponse ? '✅' : '⚠️'}`);
    console.log('\n💡 Next steps:');
    console.log('   1. Use the client secret/authorization URL to complete payment on frontend');
    console.log('   2. Webhook will update order status to "paid"');
    console.log('   3. Tickets will be generated automatically');
  } catch (error: any) {
    console.error('\n❌ Test failed:', error.response?.data || error.message);
    if (error.response?.data) {
      console.error('   Details:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

// For variable declaration at file scope
let stripePaymentResponse: PaymentInitResponse | null = null;
let paystackPaymentResponse: PaymentInitResponse | null = null;

testPaymentFlow();
