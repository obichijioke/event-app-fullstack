# Ticket Purchase Flow Implementation

This document describes the complete ticket purchase flow implementation for the EventFlow platform.

## Overview

The ticket purchase flow is a **3-step checkout process** that allows users to select tickets, make payment, and receive confirmation. The implementation matches the design shown in the reference screenshot.

## Architecture

### Flow Steps

1. **Step 1: Select Tickets** - `/events/[eventId]/checkout`
   - Browse available ticket types
   - Select quantities with +/- controls
   - Apply promo codes
   - View real-time price calculations
   - See ticket hold countdown timer

2. **Step 2: Review & Payment** - `/events/[eventId]/checkout/payment`
   - Review order summary
   - Select payment method (Card, Bank Transfer, USSD)
   - Enter payment details
   - Complete purchase

3. **Step 3: Confirmation** - `/events/[eventId]/checkout/confirmation`
   - View order confirmation
   - Download/email tickets
   - See order details and next steps

## File Structure

```
frontend/web-app/
├── app/(aa)/events/[eventId]/checkout/
│   ├── page.tsx                      # Step 1: Ticket Selection
│   ├── payment/page.tsx              # Step 2: Payment
│   └── confirmation/page.tsx         # Step 3: Confirmation
├── components/checkout/
│   ├── step-indicator.tsx            # Progress indicator
│   ├── ticket-selector.tsx           # Individual ticket type selector
│   ├── order-summary.tsx             # Sticky order summary sidebar
│   └── countdown-timer.tsx           # Hold expiration timer
└── lib/api/
    ├── events-api.ts                 # Event API client
    ├── tickets-api.ts                # Tickets API client
    ├── orders-api.ts                 # Orders API client
    └── promotions-api.ts             # Promotions API client
```

## Components

### 1. StepIndicator
**Location:** `components/checkout/step-indicator.tsx`

Visual progress indicator showing the current step in the checkout process.

**Props:**
- `currentStep: number` - Current step (1, 2, or 3)
- `steps: Step[]` - Array of step objects with id, title, and subtitle

**Features:**
- Shows checkmarks for completed steps
- Highlights current step
- Connects steps with progress lines

### 2. TicketSelector
**Location:** `components/checkout/ticket-selector.tsx`

Individual ticket type card with quantity controls.

**Props:**
- `ticketType: TicketType` - Ticket type data
- `quantity: number` - Current selected quantity
- `onQuantityChange: (quantity: number) => void` - Callback for quantity changes
- `soldCount?: number` - Number of tickets already sold

**Features:**
- +/- quantity buttons with validation
- Shows price, fees, and availability
- Displays badges (Popular, Early Bird, Sold Out, etc.)
- Expandable "More info" section for descriptions
- Respects `perOrderLimit` and capacity constraints
- Disabled state for out-of-stock or not-yet-on-sale tickets

### 3. OrderSummary
**Location:** `components/checkout/order-summary.tsx`

Sticky sidebar showing order details and totals.

**Props:**
- `event: Event` - Event details
- `ticketSelections: Map<string, number>` - Selected ticket quantities
- `ticketTypes: TicketType[]` - Available ticket types
- `promoDiscount?: number` - Discount amount
- `onContinue?: () => void` - Continue button callback
- `buttonText?: string` - Custom button text
- `buttonDisabled?: boolean` - Disable button state
- `showSecurityBadges?: boolean` - Show security indicators

**Features:**
- Event thumbnail and details
- Selected tickets breakdown
- Real-time price calculations (subtotal, fees, discounts, total)
- Security badges (Secure, Encrypted, Protected)
- Sticky positioning for easy access
- Responsive design

### 4. CountdownTimer
**Location:** `components/checkout/countdown-timer.tsx`

Timer showing remaining time before ticket hold expires.

**Props:**
- `expiresAt: Date` - Expiration timestamp
- `onExpire?: () => void` - Callback when timer reaches zero

**Features:**
- Real-time countdown display (MM:SS format)
- Visual warning states (normal → warning → expired)
- Auto-cleanup on unmount
- Calls `onExpire` callback when timer reaches zero

## API Integration

### Events API
**File:** `lib/api/events-api.ts`

```typescript
eventsApi.getEvent(eventId: string): Promise<Event>
eventsApi.getPublicEvents(params?: FilterParams): Promise<Event[]>
```

### Tickets API
**File:** `lib/api/tickets-api.ts`

```typescript
ticketsApi.getTicketTypes(eventId: string): Promise<TicketType[]>
ticketsApi.getTicketType(id: string): Promise<TicketType>
```

### Orders API
**File:** `lib/api/orders-api.ts`

```typescript
ordersApi.createOrder(data: CreateOrderDto): Promise<Order>
ordersApi.getOrder(id: string): Promise<Order>
ordersApi.initiatePayment(orderId: string, data: CreatePaymentDto): Promise<PaymentResponse>
ordersApi.processPayment(data: ProcessPaymentDto): Promise<Order>
ordersApi.cancelOrder(id: string): Promise<Order>
```

### Promotions API
**File:** `lib/api/promotions-api.ts`

```typescript
promotionsApi.validatePromoCode(data: ValidatePromoCodeDto): Promise<ValidatePromoCodeResponse>
```

## User Flow

### Step 1: Ticket Selection

1. User navigates to `/events/{eventId}/checkout`
2. Page loads event details and available ticket types
3. User selects ticket quantities using +/- buttons
4. Order summary updates in real-time
5. User optionally applies a promo code
6. System validates promo code and applies discount
7. User clicks "Continue to Details" button
8. System creates an order with status "pending"
9. User is redirected to payment page with `orderId` parameter

**Key Features:**
- Real-time validation of ticket availability
- Price tier support (Early Bird, Regular, etc.)
- Countdown timer for 10-minute hold
- Suggested promo codes display
- Responsive grid layout

### Step 2: Payment

1. User arrives at `/events/{eventId}/checkout/payment?orderId={orderId}`
2. Page loads order details
3. User selects payment method:
   - **Card**: Enter card details (number, expiry, CVV, name)
   - **Bank Transfer**: View bank account details
   - **USSD**: Get USSD code to dial
4. User clicks "Pay Now"
5. System initiates payment with payment provider
6. On success, user is redirected to confirmation page

**Key Features:**
- Multiple payment method support
- Card number formatting (spaces every 4 digits)
- Expiry date formatting (MM/YY)
- CVV validation (3-4 digits)
- Order summary persists from Step 1
- Countdown timer continues

### Step 3: Confirmation

1. User arrives at `/events/{eventId}/checkout/confirmation?orderId={orderId}`
2. Page loads order details and polls for payment confirmation
3. Success message displayed with order ID
4. User can:
   - Download tickets (PDF)
   - Email tickets
   - View order details
   - Browse more events
   - Go to orders dashboard

**Key Features:**
- Order status polling (checks every 2 seconds for payment confirmation)
- Downloadable tickets
- Email tickets option
- Next steps guide
- Quick navigation to orders or events

## State Management

The checkout flow uses **React hooks** for state management:

- `useState` for local component state
- `useEffect` for data fetching and timers
- `Map<string, number>` for ticket selections (efficient lookups)
- URL search params for passing order ID between steps

## Error Handling

- Network errors show toast notifications
- Invalid promo codes display error messages
- Expired holds redirect to ticket selection
- Missing orders redirect to appropriate pages
- Form validation prevents invalid submissions

## Responsive Design

- **Mobile**: Single column layout
- **Tablet**: Stacked columns with order summary below
- **Desktop**: 2-column layout with sticky sidebar (3:1 ratio)

## Payment Integration

### Current Implementation
The payment page includes UI for:
- Credit/Debit card input (Stripe-ready)
- Bank transfer instructions
- USSD payment codes

### Stripe Integration (Future Enhancement)

To fully integrate Stripe Elements:

1. Install Stripe packages:
```bash
npm install @stripe/stripe-js @stripe/react-stripe-js
```

2. Wrap payment page with Stripe provider:
```tsx
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function PaymentPage() {
  return (
    <Elements stripe={stripePromise}>
      {/* Payment form */}
    </Elements>
  );
}
```

3. Use Stripe Elements components:
```tsx
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const { clientSecret } = await ordersApi.initiatePayment(orderId, { provider: 'stripe' });
const result = await stripe.confirmCardPayment(clientSecret);
```

## Security Features

- All API calls use JWT authentication
- Payment processing via secure providers (Stripe/Paystack)
- Order verification before payment
- HTTPS-only in production
- No credit card data stored on frontend

## Performance Optimizations

- Lazy loading of images
- Debounced API calls for promo code validation
- Optimistic UI updates for quantity changes
- Minimal re-renders with React.memo (can be added)
- Efficient Map data structure for selections

## Accessibility

- Semantic HTML elements
- ARIA labels for screen readers
- Keyboard navigation support
- Focus indicators
- Color contrast compliance (AAA)

## Testing Recommendations

### Unit Tests
- Component rendering
- Quantity controls validation
- Price calculations
- Timer countdown logic

### Integration Tests
- Full checkout flow end-to-end
- Payment processing
- Order creation and confirmation
- Promo code application

### E2E Tests (Playwright/Cypress)
```javascript
test('Complete ticket purchase', async () => {
  // Navigate to event
  await page.goto('/events/test-event-id/checkout');

  // Select tickets
  await page.click('[data-testid="ticket-increase-btn-1"]');
  await page.click('[data-testid="ticket-increase-btn-1"]');

  // Apply promo code
  await page.fill('[data-testid="promo-input"]', 'SAVE20');
  await page.click('[data-testid="apply-promo-btn"]');

  // Continue to payment
  await page.click('[data-testid="continue-btn"]');

  // Enter card details
  await page.fill('[data-testid="card-number"]', '4242424242424242');
  await page.fill('[data-testid="expiry"]', '12/25');
  await page.fill('[data-testid="cvv"]', '123');

  // Submit payment
  await page.click('[data-testid="pay-btn"]');

  // Verify confirmation
  await expect(page.locator('text=Order Confirmed')).toBeVisible();
});
```

## Configuration

### Environment Variables
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### Constants
- Hold expiration: 10 minutes
- Poll interval: 2 seconds
- Max poll attempts: 10
- Default currency: USD
- Fee percentage: Calculated by backend

## Known Limitations

1. **Stripe Elements**: Not fully integrated (requires Stripe SDK)
2. **Real-time inventory**: No WebSocket updates for ticket availability
3. **Seat selection**: Not implemented for seated events (shows seat picker TODO)
4. **Multiple occurrences**: Single occurrence only (recurring events not handled)
5. **Save payment methods**: No payment method saving for future purchases

## Future Enhancements

1. **Payment Methods**
   - Full Stripe Elements integration
   - Paystack integration for African markets
   - Apple Pay / Google Pay
   - Crypto payments

2. **Features**
   - Seat map selection for seated events
   - Guest checkout (no account required)
   - Split payment between multiple users
   - Installment payment plans
   - Wishlist/Save for later

3. **UX Improvements**
   - Animated transitions between steps
   - Progress persistence (resume from abandoned cart)
   - Social proof (X people viewing this event)
   - Countdown to price tier changes
   - Mobile app deep linking

4. **Performance**
   - Server-side rendering for initial load
   - Redis caching for ticket availability
   - WebSocket for real-time inventory updates
   - CDN for static assets

## Troubleshooting

### Issue: Timer not counting down
**Solution:** Check that `expiresAt` is a valid Date object and in the future.

### Issue: Order not found on payment page
**Solution:** Verify `orderId` is in URL search params and order exists in backend.

### Issue: Promo code not applying
**Solution:** Check that ticket types are valid for the promotion and code hasn't expired.

### Issue: Payment fails
**Solution:** Check console for API errors, verify payment provider configuration, ensure order total is correct.

## Support

For issues or questions:
- GitHub Issues: [event-app-comprehensive/issues](https://github.com/your-repo/issues)
- Documentation: [docs.eventflow.dev](https://docs.eventflow.dev)
- Email: support@eventflow.dev
