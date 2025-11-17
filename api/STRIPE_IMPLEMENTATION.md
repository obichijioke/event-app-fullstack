# Stripe Payment Implementation Guide

## Overview

The Stripe payment provider is now fully implemented with webhook support, idempotency handling, and comprehensive event processing.

## Features

### ✅ Implemented Features

1. **Payment Intent Creation**
   - Automatic payment methods enabled
   - Idempotency key support (prevents duplicate payments)
   - Metadata tracking (orderId, buyerId, buyerEmail)
   - Return URL support for redirect flows

2. **Payment Confirmation**
   - Manual confirmation with payment method ID
   - Automatic confirmation support
   - Error handling with failure codes and messages

3. **Refund Processing**
   - Full and partial refunds
   - Refund tracking with provider reference
   - Metadata for audit trail

4. **Webhook Event Handling**
   - `payment_intent.succeeded` - Marks payment as captured, updates order
   - `payment_intent.payment_failed` - Marks payment as failed with error details
   - `payment_intent.canceled` - Handles canceled payments
   - `charge.refunded` - Updates refund records
   - `charge.dispute.created` - Logs chargebacks/disputes
   - `charge.dispute.closed` - Logs dispute resolutions

5. **Security**
   - Webhook signature verification using `stripe-signature` header
   - Raw body parsing for signature validation
   - HMAC validation through Stripe SDK

6. **Idempotency**
   - Duplicate webhook handling (checks if payment already captured)
   - Idempotency keys for payment intent creation
   - Transaction-based updates to prevent race conditions

## Configuration

### Environment Variables

Add these to your `.env` file:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY="sk_test_..." # Your Stripe secret key
STRIPE_WEBHOOK_SECRET="whsec_..." # Your webhook signing secret
```

### Getting Your Webhook Secret

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/webhooks)
2. Click "Add endpoint"
3. Enter your webhook URL: `https://yourdomain.com/api/webhooks/stripe`
4. Select events to listen for (or select "Select all events"):
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `payment_intent.canceled`
   - `charge.refunded`
   - `charge.dispute.created`
   - `charge.dispute.closed`
5. Click "Add endpoint"
6. Copy the "Signing secret" (starts with `whsec_`)
7. Add it to your `.env` file as `STRIPE_WEBHOOK_SECRET`

## API Endpoints

### 1. Create Payment Intent

**Endpoint:** `POST /api/orders/:orderId/payment`

**Request Body:**
```json
{
  "provider": "stripe",
  "returnUrl": "https://yourapp.com/payment/complete",
  "cancelUrl": "https://yourapp.com/payment/cancel",
  "paymentMethodId": "pm_..." // Optional, for immediate confirmation
}
```

**Response:**
```json
{
  "payment": {
    "id": "payment_...",
    "status": "requires_action",
    "provider": "stripe",
    "providerIntent": "pi_...",
    "amountCents": 5000,
    "currency": "usd"
  },
  "clientResponse": {
    "clientSecret": "pi_..._secret_...",
    "paymentIntentId": "pi_..."
  }
}
```

### 2. Confirm Payment

**Endpoint:** `POST /api/orders/:orderId/payment/process`

**Request Body:**
```json
{
  "provider": "stripe",
  "paymentIntentId": "pi_...",
  "paymentMethodId": "pm_..." // Optional
}
```

**Response:**
```json
{
  "payment": {
    "id": "payment_...",
    "status": "captured",
    "capturedAt": "2024-01-01T00:00:00.000Z"
  },
  "order": {
    "id": "order_...",
    "status": "paid",
    "paidAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 3. Webhook Endpoint

**Endpoint:** `POST /api/webhooks/stripe`

**Headers:**
- `stripe-signature`: Webhook signature for verification

**Handled Events:**
- `payment_intent.succeeded` → Payment captured, order marked as paid
- `payment_intent.payment_failed` → Payment failed
- `payment_intent.canceled` → Payment canceled
- `charge.refunded` → Refund processed
- `charge.dispute.created` → Dispute/chargeback created
- `charge.dispute.closed` → Dispute resolved

## Frontend Integration

### Using Stripe.js

```javascript
import { loadStripe } from '@stripe/stripe-js';

const stripe = await loadStripe('pk_test_...');

// 1. Create payment intent
const response = await fetch('/api/orders/order_123/payment', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    provider: 'stripe',
    returnUrl: window.location.origin + '/payment/complete'
  })
});

const { clientResponse } = await response.json();

// 2. Confirm payment on client side
const result = await stripe.confirmPayment({
  clientSecret: clientResponse.clientSecret,
  confirmParams: {
    return_url: window.location.origin + '/payment/complete',
  },
});

if (result.error) {
  // Handle error
  console.error(result.error.message);
} else {
  // Payment successful - webhook will update backend
  // Redirect user to success page
}
```

### Using Payment Element

```javascript
import { Elements, PaymentElement } from '@stripe/react-stripe-js';

function CheckoutForm({ clientSecret }) {
  const stripe = useStripe();
  const elements = useElements();

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin + '/payment/complete',
      },
    });

    if (error) {
      // Handle error
      setErrorMessage(error.message);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      <button type="submit">Pay</button>
    </form>
  );
}

// In your component
<Elements stripe={stripePromise} options={{ clientSecret }}>
  <CheckoutForm clientSecret={clientSecret} />
</Elements>
```

## Payment Flow

### 1. Client-Side Flow

```
User initiates checkout
   ↓
Create order (POST /api/orders)
   ↓
Create payment intent (POST /api/orders/:id/payment)
   ↓
Receive clientSecret
   ↓
Use Stripe.js to collect payment details
   ↓
Confirm payment (stripe.confirmPayment())
   ↓
User completes 3D Secure if required
   ↓
Redirect to success page
```

### 2. Server-Side Flow (Webhook)

```
Stripe sends webhook (payment_intent.succeeded)
   ↓
Verify webhook signature
   ↓
Find payment record by providerIntent
   ↓
Check if already processed (idempotency)
   ↓
Update payment status to "captured"
   ↓
Update order status to "paid"
   ↓
Generate tickets (via existing order service)
   ↓
Send confirmation email
```

## Testing

### Test Cards

Use Stripe test cards for testing:

- **Success:** `4242 4242 4242 4242`
- **Requires 3D Secure:** `4000 0025 0000 3155`
- **Declined:** `4000 0000 0000 9995`
- **Insufficient funds:** `4000 0000 0000 9995`

Any future expiry date (e.g., 12/34) and any 3-digit CVC will work.

### Testing Webhooks Locally

Use Stripe CLI for local webhook testing:

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login to Stripe
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# This will output a webhook signing secret (whsec_...)
# Use this in your local .env file

# Trigger test events
stripe trigger payment_intent.succeeded
stripe trigger payment_intent.payment_failed
stripe trigger charge.refunded
```

### Running Unit Tests

```bash
cd api
npm test -- stripe-webhook.service.spec.ts
```

## Error Handling

### Common Errors

1. **Invalid Webhook Signature**
   - **Error:** `BadRequestException: Invalid Stripe webhook signature`
   - **Solution:** Check that `STRIPE_WEBHOOK_SECRET` is correctly set

2. **Payment Intent Not Found**
   - **Error:** `InternalServerErrorException: Stripe error retrieving payment intent`
   - **Solution:** Verify payment intent ID is correct

3. **Idempotency Error**
   - **Error:** Stripe returns 400 with idempotency key error
   - **Solution:** System automatically generates unique keys per order

4. **3D Secure Authentication Failed**
   - **Error:** `payment_intent.payment_failed` with code `authentication_required`
   - **Solution:** User needs to complete 3D Secure authentication

## Security Best Practices

1. **Always Verify Webhook Signatures**
   - Never process webhooks without signature verification
   - Use the Stripe SDK's `constructEvent` method

2. **Use HTTPS in Production**
   - Stripe requires HTTPS for webhook endpoints
   - Use SSL/TLS certificates

3. **Implement Idempotency**
   - Already implemented with idempotency keys
   - Prevents duplicate charges on retry

4. **Store Minimal Card Data**
   - Never store card numbers, CVV, or expiry dates
   - Use Stripe tokens and payment methods

5. **Log Webhook Events**
   - All events are logged for audit trail
   - Monitor for unusual patterns

## Monitoring

### Key Metrics to Monitor

1. **Payment Success Rate**
   - Track `payment_intent.succeeded` vs `payment_intent.payment_failed`
   - Target: >95% success rate

2. **Webhook Delivery**
   - Monitor webhook endpoint response times
   - Check Stripe dashboard for failed deliveries

3. **Refund Rate**
   - Track `charge.refunded` events
   - Monitor refund reasons

4. **Dispute Rate**
   - Track `charge.dispute.created` events
   - Aim for <0.5% dispute rate

### Stripe Dashboard

Monitor your integration in the [Stripe Dashboard](https://dashboard.stripe.com):
- **Payments** → View all transactions
- **Webhooks** → Check delivery status and retry failed webhooks
- **Disputes** → Manage chargebacks
- **Logs** → Debug API calls

## Migration from Manual Confirmation

If you were previously using manual confirmation only, the webhook implementation provides:

1. **Automatic Status Updates**
   - No need to poll for payment status
   - Real-time order updates

2. **Improved Reliability**
   - Handles edge cases (network failures, page closes)
   - Stripe retries failed webhooks automatically

3. **Better User Experience**
   - Users can close the page after payment
   - Status updates happen asynchronously

## Comparison: Stripe vs Paystack

| Feature | Stripe | Paystack |
|---------|--------|----------|
| **Webhook Signature** | HMAC SHA-256 via SDK | HMAC SHA-512 manual |
| **Payment Flow** | Payment Intent → Confirm | Transaction Init → Verify |
| **3D Secure** | Automatic via SCA | Handled by provider |
| **Idempotency** | Native support | Manual implementation |
| **Raw Body Required** | Yes (for webhooks) | No |
| **Event Types** | 6 events handled | 4 events handled |
| **Refund API** | Comprehensive | Basic |
| **Dispute Handling** | Advanced webhooks | Basic |

## Troubleshooting

### Webhook Not Receiving Events

1. **Check Endpoint URL**
   - Ensure it's publicly accessible
   - Use HTTPS in production

2. **Verify Signing Secret**
   - Check `STRIPE_WEBHOOK_SECRET` in `.env`
   - Ensure it matches Stripe dashboard

3. **Check Webhook Status**
   - Go to Stripe Dashboard → Webhooks
   - Check delivery logs for errors

### Payment Not Updating

1. **Check Webhook Logs**
   - Look for `Received Stripe webhook event` in server logs
   - Check for any errors during processing

2. **Verify Payment Intent ID**
   - Ensure `providerIntent` in database matches Stripe

3. **Check Order Status**
   - Verify order exists and is in `pending` status

## Support

For issues with:
- **Stripe Integration:** [Stripe Support](https://support.stripe.com)
- **This Implementation:** Check server logs and webhook delivery status
- **Testing:** Use Stripe CLI for local debugging

## Next Steps

Consider implementing:
1. **Payment Links** - Generate Stripe-hosted payment pages
2. **Subscriptions** - Recurring payments for memberships
3. **Connect** - Split payments to event organizers
4. **Radar** - Advanced fraud detection
5. **Reporting** - Custom payment analytics dashboard
