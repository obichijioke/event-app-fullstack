# Quick Start: Payment Setup

## 🚀 Get Running in 5 Minutes

### Step 1: Add Environment Variables (2 min)

Create `.env.local` in `frontend/web-app/`:

```env
# Choose ONE or BOTH:

# Option 1: Stripe (International)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51ABC...xyz

# Option 2: Paystack (African Markets)
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_abc123...xyz

# API Base URL
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
```

### Step 2: Start the Apps (1 min)

```bash
# Terminal 1: Backend
cd ../../api
npm run start:dev

# Terminal 2: Frontend
npm run dev
```

### Step 3: Test Payment (2 min)

1. Open http://localhost:3000
2. Find an event → Get Tickets
3. Select tickets → Proceed to Payment
4. Use test card:
   - **Stripe**: `4242 4242 4242 4242`
   - **Paystack**: `4084 0840 8408 4081`
   - **Expiry**: `12/25`
   - **CVV**: `123`
5. Complete payment → See confirmation!

## ✅ That's It!

**Full documentation**: [PAYMENT_INTEGRATION_GUIDE.md](./PAYMENT_INTEGRATION_GUIDE.md)

## 🔑 Get Your API Keys

- **Stripe**: https://dashboard.stripe.com/apikeys
- **Paystack**: https://dashboard.paystack.com/#/settings/developer

## 🧪 Test Cards

### Stripe
- Success: `4242 4242 4242 4242`
- 3DS: `4000 0027 6000 3184`
- Decline: `4000 0000 0000 0002`

### Paystack
- Success: `4084 0840 8408 4081`
- Fail: `5060 6666 6666 6666 4444`

## 🆘 Troubleshooting

**"No payment providers configured"**
→ Check `.env.local` has the API keys

**Stripe Elements not showing**
→ Verify `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is set

**Paystack popup not opening**
→ Disable ad blockers, check console for errors

## 📚 More Help

See the complete guide for production setup, webhook configuration, and advanced features.
