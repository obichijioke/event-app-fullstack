# Checkout Flow Troubleshooting Guide

## Common Issues and Solutions

### 1. POST /api/orders 500 (Internal Server Error)

**Symptoms:**
- Order creation fails with 500 error
- Console shows: `POST http://localhost:3000/api/orders 500 (Internal Server Error)`

**Possible Causes:**

#### A. Backend Not Running or Database Issues
```bash
# Check if backend is running
cd backend/api
npm run start:dev

# Check database connection
npx prisma db push
```

#### B. Missing Required Data
The backend expects:
- Valid `eventId` (event must exist and be `live` with `public` visibility)
- Valid `ticketTypeId` (ticket type must be `active`)
- User must be authenticated (JWT token required)

**Solution:**
1. Check backend logs in the terminal where `npm run start:dev` is running
2. Verify the event exists and is live:
   ```sql
   SELECT id, title, status, visibility FROM events WHERE id = 'your-event-id';
   ```
3. Verify ticket types exist and are active:
   ```sql
   SELECT id, name, status FROM ticket_types WHERE event_id = 'your-event-id';
   ```
4. Ensure user is logged in (check JWT token in browser DevTools → Application → Local Storage)

#### C. Ticket Availability Issues
The backend checks:
- Ticket capacity (for GA tickets)
- Seat availability (for SEATED tickets)
- Sales time windows (`salesStart` and `salesEnd`)

**Debug Steps:**
1. Open backend terminal and look for the actual error message
2. Common errors:
   - `"Event not found"` - Invalid eventId
   - `"Event is not available for purchase"` - Event status not live or visibility not public
   - `"Not enough tickets available"` - Capacity exceeded
   - `"Ticket type {name} is not yet on sale"` - Before salesStart time
   - `"Ticket type {name} is no longer on sale"` - After salesEnd time

#### D. Database Constraints
Check if there are any database constraint violations:
```bash
cd backend/api
# View recent migrations
npx prisma migrate status

# If needed, reset database (WARNING: This deletes all data)
npx prisma migrate reset

# Seed database with sample data
npm run db:seed
```

### 2. Authentication Errors (401 Unauthorized)

**Symptoms:**
- API calls fail with 401 error
- Redirected to login page

**Solutions:**
1. **Check if logged in:**
   - Browser DevTools → Application → Local Storage
   - Look for `accessToken` key

2. **Token expired:**
   - Log out and log back in
   - Or call the refresh endpoint (automatic in API client)

3. **Backend requires authentication:**
   ```typescript
   // All checkout endpoints require authentication
   @UseGuards(JwtAuthGuard)
   @ApiBearerAuth()
   ```

### 3. CORS Errors

**Symptoms:**
- `Access-Control-Allow-Origin` errors in console
- Requests blocked by browser

**Solutions:**
1. **Check backend CORS configuration:**
   ```typescript
   // backend/api/src/main.ts
   app.enableCors({
     origin: 'http://localhost:3001', // Update if frontend port changes
     credentials: true,
   });
   ```

2. **Verify API URL in frontend:**
   ```env
   # frontend/web-app/.env.local
   NEXT_PUBLIC_API_URL=http://localhost:3000
   ```

### 4. Promo Code Validation Fails

**Symptoms:**
- Promo code shows as invalid even when it exists
- No discount applied

**Possible Causes:**
1. **Promo code expired:**
   - Check `endsAt` date in database

2. **Max uses reached:**
   - Check `maxUses` vs `currentUses` in database

3. **Not applicable to event:**
   - Check `eventIds` array in promotion

4. **Not applicable to ticket types:**
   - Check `ticketTypeIds` array in promotion

**Debug:**
```sql
-- Check promo code status
SELECT
  pc.code,
  p.name,
  p.active,
  p.discount_type,
  p.discount_value,
  pc.max_uses,
  pc.current_uses,
  pc.expires_at
FROM promo_codes pc
JOIN promotions p ON p.id = pc.promotion_id
WHERE pc.code = 'YOUR_CODE';
```

### 5. Timer Shows Wrong Time or Doesn't Count Down

**Symptoms:**
- Timer stuck at 10:00
- Timer shows negative time

**Solutions:**
1. **Check system time:**
   - Ensure client system time is correct

2. **Inspect component:**
   ```javascript
   // Check if expiresAt is valid
   console.log('Hold expires at:', holdExpiresAt);
   console.log('Current time:', new Date());
   ```

3. **Backend hold expiration:**
   ```sql
   -- Check active holds
   SELECT * FROM holds WHERE user_id = 'your-user-id' AND expires_at > NOW();
   ```

### 6. Payment Processing Fails

**Symptoms:**
- Payment button doesn't work
- Redirected back to checkout

**Note:** Stripe Elements is not yet fully integrated. Current implementation is UI-only.

**For Full Stripe Integration:**
1. Install dependencies:
   ```bash
   npm install @stripe/stripe-js @stripe/react-stripe-js
   ```

2. Add environment variable:
   ```env
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   ```

3. See [CHECKOUT_FLOW.md](CHECKOUT_FLOW.md#stripe-integration-future-enhancement) for full integration guide

### 7. Images Not Loading

**Symptoms:**
- Event banner shows broken image
- Ticket thumbnails missing

**Solutions:**
1. **Check image URLs in database:**
   ```sql
   SELECT banner_image_url, thumbnail_url FROM events WHERE id = 'your-event-id';
   ```

2. **Configure Next.js image domains:**
   ```javascript
   // next.config.js
   module.exports = {
     images: {
       domains: ['your-image-host.com', 's3.amazonaws.com'],
     },
   };
   ```

### 8. Route Not Found (404)

**Symptoms:**
- Clicking "Get Tickets" shows 404
- Checkout page doesn't load

**Solutions:**
1. **Check URL structure:**
   - Should be: `/events/{id}/checkout`
   - NOT: `/checkout/{id}` (old path, should redirect)

2. **Verify file structure:**
   ```
   app/(aa)/events/[id]/checkout/page.tsx ✅
   app/(aa)/events/[id]/checkout/payment/page.tsx ✅
   app/(aa)/events/[id]/checkout/confirmation/page.tsx ✅
   ```

3. **Clear Next.js cache:**
   ```bash
   rm -rf .next
   npm run dev
   ```

## Debugging Checklist

When encountering issues, check these in order:

- [ ] Backend is running (`npm run start:dev` in `backend/api`)
- [ ] Database is connected (check backend logs)
- [ ] Frontend is running (`npm run dev` in `frontend/web-app`)
- [ ] User is authenticated (check localStorage for accessToken)
- [ ] Event exists and is live/public
- [ ] Ticket types exist and are active
- [ ] Browser console shows no errors
- [ ] Network tab shows requests are reaching backend
- [ ] Backend terminal shows no errors

## Getting Detailed Error Information

### Backend Logs
```bash
cd backend/api
npm run start:dev

# Watch for errors when making requests
# Look for stack traces and error messages
```

### Frontend Console
```javascript
// Browser DevTools Console
// Check for API errors
console.log('Order creation error:', error);

// Check API response
fetch('http://localhost:3000/api/events/your-event-id')
  .then(r => r.json())
  .then(console.log);
```

### Database Queries
```bash
# Connect to database
cd backend/api
npx prisma studio

# Or use psql directly
psql -d your_database_name
```

## Still Having Issues?

If you've tried all the above and still encountering problems:

1. **Check GitHub Issues:** Search for similar issues
2. **Review Backend Logs:** Look for the actual error message
3. **Test with Seed Data:** Use `npm run db:seed` to create test data
4. **Verify API Endpoints:** Use Postman/Insomnia to test backend directly
5. **Check Network Tab:** Verify request payload and response

## Quick Test Flow

To verify the checkout flow is working:

```bash
# 1. Start backend
cd backend/api
npm run start:dev

# 2. Seed database (if empty)
npm run db:seed

# 3. Start frontend
cd ../../frontend/web-app
npm run dev

# 4. Navigate to:
http://localhost:3001/events

# 5. Click on any event → "Get Tickets"
# 6. Select tickets and continue
# 7. Check browser console and backend terminal for errors
```

## Common Error Messages and Solutions

| Error Message | Cause | Solution |
|--------------|-------|----------|
| "Event not found" | Invalid eventId | Verify event exists in database |
| "Event is not available for purchase" | Event not live/public | Update event status/visibility |
| "Not enough tickets available" | Capacity exceeded | Increase capacity or wait for cancellations |
| "Invalid ticket type" | ticketTypeId not found | Verify ticket type exists for event |
| "Unauthorized" | No JWT token | Log in and try again |
| "Forbidden" | Invalid permissions | Check user has access to resource |
| "Network error" | Backend not running | Start backend with `npm run start:dev` |

## Contact Support

For additional help:
- Documentation: [CHECKOUT_FLOW.md](CHECKOUT_FLOW.md)
- GitHub Issues: Create a new issue with error logs
- Backend API Docs: http://localhost:3000/api/docs (Swagger)
