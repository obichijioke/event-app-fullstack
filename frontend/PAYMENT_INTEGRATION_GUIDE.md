# Payment Integration Setup Guide

## ✅ Implementation Complete

Both Stripe and Paystack payment providers have been fully integrated into the frontend. Follow this guide to configure and test the payment system.

---

## What Was Implemented

### 1. **Stripe Integration** ✅
- Installed `@stripe/stripe-js` and `@stripe/react-stripe-js` packages
- Created `StripePaymentForm` component with:
  - Stripe Elements for secure card input
  - Payment confirmation flow
  - 3D Secure (SCA) support
  - Real-time validation
  - Beautiful UI matching design system

**File**: [components/checkout/stripe-payment-form.tsx](./web-app/components/checkout/stripe-payment-form.tsx)

### 2. **Paystack Integration** ✅
- Created `PaystackPaymentButton` component using inline script (React 19 compatible)
- Features:
  - Popup payment modal
  - Multiple payment methods (card, bank transfer, USSD, mobile money)
  - Transaction verification
  - Callback handling
  - Clean, professional UI

**File**: [components/checkout/paystack-payment-button.tsx](./web-app/components/checkout/paystack-payment-button.tsx)

### 3. **Payment Provider Selector** ✅
- Smart provider selection UI
- Auto-detects available providers
- Graceful degradation if providers aren't configured
- Auto-selects if only one provider available
- Beautiful radio button UI with icons

**File**: [components/checkout/payment-provider-selector.tsx](./web-app/components/checkout/payment-provider-selector.tsx)

### 4. **Updated Payment Page** ✅
- Complete rewrite of payment flow
- Dynamic provider initialization
- Removed insecure card input form
- Proper error handling
- Loading states
- Provider switching

**File**: [app/(aa)/events/[id]/checkout/payment/page.tsx](./web-app/app/(aa)/events/[id]/checkout/payment/page.tsx)

---

## Setup Instructions

### Step 1: Configure Environment Variables

#### For Stripe (International Payments)

1. **Get Your Stripe Keys**:
   - Go to https://dashboard.stripe.com/apikeys
   - Copy your **Publishable key** (starts with `pk_test_` for test mode)

2. **Add to `.env.local`**:
   ```env
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51ABC...xyz
   ```

#### For Paystack (African Markets)

1. **Get Your Paystack Keys**:
   - Go to https://dashboard.paystack.com/#/settings/developer
   - Copy your **Public key** (starts with `pk_test_` for test mode)

2. **Add to `.env.local`**:
   ```env
   NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_abc123...xyz
   ```

#### Both Providers (Recommended)

To enable both payment methods, add both keys:

```env
# In frontend/web-app/.env.local

NEXT_PUBLIC_API_BASE_URL=http://localhost:3001

# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51ABC...xyz

# Paystack Configuration
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_abc123...xyz
```

**Note**: Users will see both options and can choose their preferred method.

---

### Step 2: Backend Configuration

The backend is already fully configured! Just ensure your backend `.env` has:

```env
# Backend: api/.env

# Stripe Secret Keys
STRIPE_SECRET_KEY=sk_test_51ABC...xyz
STRIPE_WEBHOOK_SECRET=whsec_...

# Paystack Secret Keys
PAYSTACK_SECRET_KEY=sk_test_abc123...xyz
PAYSTACK_PUBLIC_KEY=pk_test_abc123...xyz
PAYSTACK_WEBHOOK_SECRET=...
```

---

### Step 3: Start the Application

```bash
# Terminal 1: Start backend
cd api
npm run start:dev

# Terminal 2: Start frontend
cd frontend/web-app
npm run dev
```

Frontend will be available at http://localhost:3000

---

## Testing the Payment Flow

### Test with Stripe

1. **Navigate to an event** and click "Get Tickets"
2. **Select tickets** and proceed to checkout
3. **Payment page** should load with Stripe option
4. **Use Stripe test cards**:

   | Card Number | Description | Expected Result |
   |-------------|-------------|-----------------|
   | `4242 4242 4242 4242` | Success | Payment succeeds |
   | `4000 0027 6000 3184` | 3D Secure | Shows authentication modal |
   | `4000 0000 0000 0002` | Decline | Card declined error |
   | `4000 0000 0000 9995` | Insufficient Funds | Insufficient funds error |

   - **Expiry**: Any future date (e.g., `12/25`)
   - **CVV**: Any 3 digits (e.g., `123`)
   - **Name**: Any name

5. **Complete payment** - should redirect to confirmation page
6. **Check backend** - order status should be `paid`, tickets generated

### Test with Paystack

1. **Navigate to payment page** (same as above)
2. **Select Paystack** as payment method
3. **Click "Pay Now"** - Paystack popup opens
4. **Use Paystack test cards**:

   | Card Number | Description | Expected Result |
   |-------------|-------------|-----------------|
   | `4084 0840 8408 4081` | Success | Payment succeeds |
   | `5060 6666 6666 6666 4444` | Insufficient Funds | Transaction fails |
   | `5078 5078 5078 5078 12` | Success with PIN | Requires PIN (1234) |

   - **Expiry**: Any future date (e.g., `12/25`)
   - **CVV**: `123`
   - **PIN**: `1234` (if prompted)

5. **Complete payment** in Paystack popup
6. **Callback** returns to your site
7. **Verification** happens automatically
8. **Redirects** to confirmation page

---

## How It Works

### Stripe Flow

```
User selects Stripe
    ↓
Frontend: Initialize payment
    ↓
Backend: Create PaymentIntent
    ↓
Backend: Returns clientSecret
    ↓
Frontend: Stripe Elements loads
    ↓
User enters card details
    ↓
Frontend: stripe.confirmPayment()
    ↓
Stripe processes payment (3DS if needed)
    ↓
Stripe webhook → Backend updates order
    ↓
Frontend redirects to confirmation
```

### Paystack Flow

```
User selects Paystack
    ↓
Frontend: Initialize payment
    ↓
Backend: Create transaction
    ↓
Backend: Returns reference + authUrl
    ↓
Frontend: Paystack popup opens
    ↓
User completes payment
    ↓
Paystack webhook → Backend updates order
    ↓
Popup closes → callback fires
    ↓
Frontend verifies payment
    ↓
Redirects to confirmation
```

---

## Features

### ✅ Security
- **PCI Compliance**: Card data never touches your servers
- **Tokenization**: Stripe/Paystack handle all card data
- **3D Secure**: Automatic authentication for European cards
- **Webhook Verification**: Signatures validated on all webhooks
- **HTTPS Required**: Production requires SSL

### ✅ User Experience
- **Multiple Payment Methods**:
  - Stripe: Cards (Visa, Mastercard, Amex)
  - Paystack: Cards, Bank Transfer, USSD, Mobile Money
- **Real-time Validation**: Instant feedback on card errors
- **Loading States**: Clear indicators during processing
- **Error Handling**: Friendly error messages
- **Mobile Optimized**: Works on all device sizes
- **Auto-selection**: Smart defaults based on availability

### ✅ Developer Experience
- **TypeScript**: Fully typed components
- **Modular**: Easy to add more providers
- **Configurable**: Environment-based setup
- **Testable**: Works with test mode keys
- **Error Logging**: Console logs for debugging

---

## Component API Reference

### StripePaymentForm

```typescript
interface StripePaymentFormProps {
  amount: number;          // Amount in cents/kobo
  currency: string;        // Currency code (USD, NGN, etc.)
  onSuccess: () => void;   // Called on successful payment
  onError: (error: string) => void;  // Called on error
  returnUrl: string;       // URL for redirect after payment
}
```

**Usage**:
```tsx
<Elements stripe={stripePromise} options={{ clientSecret }}>
  <StripePaymentForm
    amount={totalCents}
    currency="USD"
    onSuccess={() => router.push('/confirmation')}
    onError={(err) => toast.error(err)}
    returnUrl={window.location.origin + '/confirmation'}
  />
</Elements>
```

### PaystackPaymentButton

```typescript
interface PaystackPaymentButtonProps {
  email: string;           // Customer email
  amount: number;          // Amount in kobo (smallest unit)
  currency: string;        // Currency code
  reference: string;       // Unique transaction reference
  publicKey: string;       // Paystack public key
  onSuccess: (reference: string) => void;  // Called on success
  onClose: () => void;     // Called when popup closes
}
```

**Usage**:
```tsx
<PaystackPaymentButton
  email={user.email}
  amount={totalCents}
  currency="NGN"
  reference={paystackRef}
  publicKey={process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY}
  onSuccess={(ref) => verifyAndRedirect(ref)}
  onClose={() => toast.error('Payment cancelled')}
/>
```

### PaymentProviderSelector

```typescript
interface PaymentProviderSelectorProps {
  selectedProvider: 'stripe' | 'paystack';
  onProviderChange: (provider: 'stripe' | 'paystack') => void;
  stripeAvailable: boolean;
  paystackAvailable: boolean;
}
```

**Usage**:
```tsx
<PaymentProviderSelector
  selectedProvider={selectedProvider}
  onProviderChange={setSelectedProvider}
  stripeAvailable={!!STRIPE_PUBLISHABLE_KEY}
  paystackAvailable={!!PAYSTACK_PUBLIC_KEY}
/>
```

---

## Troubleshooting

### Issue: "No payment providers configured"

**Cause**: Missing environment variables

**Solution**: Add `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` or `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` to `.env.local`

---

### Issue: "Payment provider not available"

**Cause**: Payment initialization failed or wrong provider selected

**Solution**:
- Check browser console for errors
- Verify API keys are correct
- Ensure backend is running
- Check backend has matching secret keys

---

### Issue: Stripe Elements not showing

**Cause**: Invalid `clientSecret` or Stripe not loaded

**Solution**:
- Check backend returned `clientSecret` in response
- Verify `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is set
- Check browser console for Stripe.js errors
- Ensure you're using `pk_test_` key in test mode

---

### Issue: Paystack popup not opening

**Cause**: Paystack script not loaded or blocked

**Solution**:
- Check browser console for script loading errors
- Disable ad blockers (they may block Paystack)
- Verify `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` is set
- Check network tab for `https://js.paystack.co/v1/inline.js`

---

### Issue: Payment succeeds but order not updated

**Cause**: Webhook not configured or failing

**Solution**:
- Check backend logs for webhook errors
- Verify webhook secrets in backend `.env`
- For local testing, use ngrok or similar to expose webhooks
- Stripe: Set webhook URL in dashboard to `https://yourdomain.com/api/webhooks/stripe`
- Paystack: Set webhook URL to `https://yourdomain.com/api/webhooks/paystack`

---

## Production Checklist

Before going live:

- [ ] **Switch to live API keys**:
  - Replace `pk_test_` with `pk_live_` for Stripe
  - Replace `pk_test_` with `pk_live_` for Paystack
  - Update backend with `sk_live_` keys

- [ ] **Configure webhooks** in provider dashboards:
  - Stripe: https://dashboard.stripe.com/webhooks
  - Paystack: https://dashboard.paystack.com/#/settings/developer

- [ ] **Test end-to-end** with live keys in test mode

- [ ] **Enable HTTPS** (required for production)

- [ ] **Test 3D Secure** flows with European cards

- [ ] **Verify webhook signatures** are working

- [ ] **Set up monitoring** for failed payments

- [ ] **Test refund flow** (if implemented)

- [ ] **Add error tracking** (Sentry, LogRocket, etc.)

- [ ] **Load test** payment endpoints

- [ ] **Security audit** of payment flow

---

## Additional Resources

### Stripe Documentation
- Dashboard: https://dashboard.stripe.com/
- API Docs: https://stripe.com/docs/api
- Testing: https://stripe.com/docs/testing
- Webhooks: https://stripe.com/docs/webhooks
- 3D Secure: https://stripe.com/docs/strong-customer-authentication

### Paystack Documentation
- Dashboard: https://dashboard.paystack.com/
- API Docs: https://paystack.com/docs/api/
- Testing: https://paystack.com/docs/getting-started/test-cards/
- Webhooks: https://paystack.com/docs/payments/webhooks/
- Integration: https://paystack.com/docs/guides/

---

## Support

### Need Help?

1. **Check browser console** for JavaScript errors
2. **Check backend logs** for API errors
3. **Review network tab** to see API requests/responses
4. **Test with curl** to isolate backend issues
5. **Use provider dashboards** to view payment logs

### Common Support Contacts

- **Stripe Support**: https://support.stripe.com/
- **Paystack Support**: https://paystack.com/support
- **Project Issues**: Create a GitHub issue

---

## Summary

You now have a **production-ready payment system** with:

✅ Stripe integration (international cards)
✅ Paystack integration (African payments)
✅ Secure, PCI-compliant implementation
✅ Beautiful, responsive UI
✅ Smart provider selection
✅ Comprehensive error handling
✅ Test cards for development
✅ Ready for production deployment

**Next step**: Add your API keys and start testing!
