# Check-in QR Code Bug Fix

## Problem Statement

The check-in feature had a critical bug where QR codes generated at ticket issuance did not contain the ticket ID, causing all check-ins via QR code scanning to fail.

### Original Bug

**QR Code Generation (Before Fix):**
```typescript
generateQRCode(orderId, ticketTypeId, seatId) {
  const data = `${orderId}-${ticketTypeId}${seatId ? `-${seatId}` : ''}`;
  return Buffer.from(data).toString('base64');
}
```
- QR code contained: `orderId-ticketTypeId-seatId`
- **Missing**: Ticket ID

**Check-in Expected:**
```typescript
POST /tickets/checkin
{
  "ticketId": "clxxx123456789"  // But QR code didn't contain this!
}
```

**Result:** Check-in would fail because the QR code value couldn't be matched to a ticket ID.

---

## Solution Implementation

### 1. Updated QR Code Format

**New Format:** `ticketId|orderId|ticketTypeId|seatId` (pipe-separated, base64 encoded)

Example:
```
Raw: clxxx123456789|clyyyy987654321|clzzz111222333|A-12-5
Base64: Y2x4eHgxMjM0NTY3ODl8Y2x5eXl5OTg3NjU0MzIxfGNsenp6MTExMjIyMzMzfEEtMTItNQ==
```

### 2. Updated QR Code Generation

**Modified Files:**
- `api/src/orders/orders.service.ts`
- `api/src/queues/processors/payment.processor.ts`
- `api/src/tickets/tickets.service.ts`

**New Logic with Barcode-Based Deduplication:**
```typescript
// Use barcode (stable before ticket creation) for idempotency checks
const existingBarcodes = new Set(order.tickets?.map((t) => t.barcode) || []);

for (const item of order.items) {
  for (let i = 0; i < item.quantity; i++) {
    // Generate deterministic barcode
    const barcode = generateBarcode(orderId, ticketTypeId, seatId, i);

    // Skip if ticket already exists (webhook retry protection)
    if (existingBarcodes.has(barcode)) {
      continue;
    }

    // Step 1: Create ticket first (to get ID)
    const ticket = await prisma.ticket.create({
      data: {
        orderId,
        eventId,
        ticketTypeId,
        seatId,
        ownerId,
        status: 'issued',
        qrCode: '',  // Temporary empty
        barcode,
        issuedAt: new Date(),
      },
    });

    // Step 2: Generate QR code with ticket ID
    const qrCode = generateQRCode(
      ticket.id,      // Now includes ticket ID!
      orderId,
      ticketTypeId,
      seatId,
      i,
    );

    // Step 3: Update ticket with final QR code
    await prisma.ticket.update({
      where: { id: ticket.id },
      data: { qrCode },
    });

    // Step 4: Track created ticket to prevent duplicates in same call
    existingBarcodes.add(barcode);
  }
}
```

**Key Improvement - Barcode-Based Deduplication:**
- Barcodes are deterministic: `${orderId}-${ticketTypeId}-${seatId}-${index}`
- Generated BEFORE ticket creation (no chicken-egg problem)
- Prevents duplicate tickets on webhook retries
- O(1) lookup performance with Set
- Works correctly even if QR code format changes

### 3. Added QR Code Decoder with Validation

**File:** `api/src/tickets/tickets.service.ts`

**Critical Fix**: The decoder now validates inputs to distinguish between QR codes and direct ticket IDs

```typescript
private decodeQRCode(qrCode: string): string {
  try {
    // First, check if this looks like a base64-encoded QR code
    const base64Regex = /^[A-Za-z0-9+/]+=*$/;

    if (!base64Regex.test(qrCode)) {
      throw new Error('Not a QR code');
    }

    const decoded = Buffer.from(qrCode, 'base64').toString('utf-8');

    // Check if decoded string contains our expected format (pipe-separated)
    if (!decoded.includes('|')) {
      throw new Error('Not a QR code');
    }

    const parts = decoded.split('|');

    if (parts.length >= 4 && parts[0] !== 'PENDING') {
      return parts[0]; // Return ticket ID
    }

    throw new BadRequestException('Invalid QR code format');
  } catch (error) {
    if (error instanceof Error && error.message === 'Not a QR code') {
      throw error;
    }
    throw new BadRequestException('Invalid QR code: Unable to decode');
  }
}
```

**Validation Steps:**
1. ✅ Check if input matches base64 character set
2. ✅ Verify decoded string contains pipe separator
3. ✅ Ensure QR has all required fields (≥4 parts)
4. ✅ Throw specific error for non-QR inputs

### 4. Updated Check-in Logic

**File:** `api/src/tickets/tickets.service.ts`

```typescript
async checkInTicket(createCheckinDto: CreateCheckinDto, scannerId?: string) {
  const { ticketId: ticketIdOrQRCode, gate } = createCheckinDto;

  // Try to decode QR code first, fall back to direct ticket ID lookup
  let ticketId: string;
  try {
    ticketId = this.decodeQRCode(ticketIdOrQRCode);
  } catch (error) {
    // If it's not a QR code, use input as direct ticket ID
    if (error instanceof Error && error.message === 'Not a QR code') {
      ticketId = ticketIdOrQRCode;
    } else {
      // Invalid QR code format - re-throw the error
      throw error;
    }
  }

  // Now proceed with check-in using the extracted ticket ID
  const ticket = await this.prisma.ticket.findUnique({
    where: { id: ticketId },
    // ... rest of check-in logic
  });
}
```

---

## Check-in Flow (After Fix)

### Scenario 1: QR Code Scan
```
1. Scanner reads QR code: Y2x4eHgxMjM0NTY3ODl8Y2x5eXl5OTg3NjU0MzIxfGNsenp6MTExMjIyMzMzfEEtMTItNQ==
2. Frontend sends: POST /tickets/checkin { ticketId: "Y2x4eHgx..." }
3. Backend decodes QR code → extracts ticket ID: clxxx123456789
4. Backend looks up ticket by ID → validates → creates check-in record
5. ✓ Check-in successful
```

### Scenario 2: Manual Entry (Direct Ticket ID)
```
1. Staff enters ticket ID: clxxx123456789
2. Frontend sends: POST /tickets/checkin { ticketId: "clxxx123456789" }
3. Backend validates format:
   - Contains non-base64 characters (no underscores in base64) → "Not a QR code"
   - Falls back to using as direct ticket ID
4. Backend looks up ticket by ID → validates → creates check-in record
5. ✓ Check-in successful
```

### Scenario 3: Manual Entry (Ticket ID with Special Characters)
```
1. Staff enters ticket ID: ti_123abc
2. Frontend sends: POST /tickets/checkin { ticketId: "ti_123abc" }
3. Backend validates format:
   - Contains underscore → fails base64 regex → "Not a QR code"
   - Falls back to using as direct ticket ID
4. Backend looks up ticket by ID → validates → creates check-in record
5. ✓ Check-in successful
```

---

## Benefits of This Approach

1. **Backward Compatibility**: Supports both QR codes and direct ticket ID entry
2. **Self-Contained QR Codes**: QR code includes all necessary information
3. **Faster Lookups**: Direct ID lookup instead of searching by QR field
4. **Redundancy**: QR code contains additional data (orderId, ticketTypeId, seatId) for audit/verification
5. **Error Handling**: Graceful fallback if QR decode fails

---

## Testing

### Test 1: QR Code Generation and Decoding
Run the test script to verify QR code logic:
```bash
cd api
node test-checkin-qr.js
```

Expected output:
```
=== QR Code Check-in Flow Test ===
Match: ✓ PASS
Match: ✓ PASS
✓ Both methods work correctly!
```

### Test 2: Ticket Deduplication
Run the test script to verify webhook retry protection:
```bash
cd api
node test-ticket-deduplication.js
```

Expected output:
```
=== Ticket Deduplication Test ===
Duplicates prevented: ✓ PASS
No new tickets created: ✓ PASS
Total matches expected: ✓ PASS
✓ Deduplication logic working correctly!
```

**What this verifies:**
- Barcode-based deduplication prevents duplicate tickets
- Webhook retries don't create extra tickets
- All tickets are correctly skipped on retry
- Final ticket count matches expected count

### Test 3: QR Code vs Direct ID Validation
Run the test script to verify input validation:
```bash
cd api
node test-qr-decode-validation.js
```

Expected output:
```
=== QR Code Validation Test ===
Test 1: Valid QR Code - ✓ PASS
Test 2: Direct Ticket ID (ti_123abc) - ✓ PASS
Test 3: Direct Ticket ID (CUID) - ✓ PASS
Test 4: Direct Ticket ID (with dashes) - ✓ PASS
Test 5: Invalid QR Code (base64 without pipes) - ✓ PASS
Test 6: Valid QR Code (GA ticket) - ✓ PASS
Test 7: Malformed QR Code - ✓ PASS
✓ System handles both QR codes and manual ticket ID entry
```

**What this verifies:**
- Valid QR codes are properly decoded to extract ticket ID
- Direct ticket IDs pass through without modification
- Base64-like strings without pipe separators are treated as ticket IDs
- Manual check-in works correctly for all ticket ID formats
- No false positives (direct IDs aren't mistaken for QR codes)

---

## Migration Considerations

### For Existing Tickets (Already Issued)

Existing tickets with old QR code format will need to be regenerated:

**Option 1: Regenerate on demand**
- When a ticket is scanned with old format, trigger regeneration
- Update ticket with new QR code

**Option 2: Batch migration**
- Run migration script to update all existing tickets
- Generate new QR codes for all issued tickets

**Option 3: Support legacy format temporarily**
- Add logic to handle both old and new formats
- Gradually phase out old format

**Recommended:** Option 2 (batch migration) for consistency

### Migration Script Example
```typescript
// Migration: Update existing tickets with new QR codes
async function migrateExistingTickets() {
  const tickets = await prisma.ticket.findMany({
    where: { status: 'issued' }
  });

  for (const ticket of tickets) {
    const newQrCode = generateQRCode(
      ticket.id,
      ticket.orderId,
      ticket.ticketTypeId,
      ticket.seatId
    );

    await prisma.ticket.update({
      where: { id: ticket.id },
      data: { qrCode: newQrCode }
    });
  }

  console.log(`Migrated ${tickets.length} tickets`);
}
```

---

## Frontend Updates

**File:** `frontend/web-app/components/organizer/check-in/check-in-content.tsx`

- Updated instructions to clarify QR code support
- Updated input placeholder for better UX
- No breaking changes to API calls

---

## Files Modified

### Backend
1. `api/src/orders/orders.service.ts` - Updated generateQRCode, ticket creation flow
2. `api/src/queues/processors/payment.processor.ts` - Updated generateQRCode, ticket creation flow
3. `api/src/tickets/tickets.service.ts` - Added decodeQRCode, updated checkInTicket, regenerateQRCode

### Frontend
4. `frontend/web-app/components/organizer/check-in/check-in-content.tsx` - Updated labels and instructions

### Documentation/Testing
5. `api/test-checkin-qr.js` - Test script to verify QR code generation and decoding
6. `api/test-ticket-deduplication.js` - Test script to verify webhook retry protection
7. `api/CHECKIN_QR_FIX.md` - This documentation

---

## Summary

✅ QR codes now include ticket ID as the first field
✅ Check-in endpoint can decode QR codes automatically
✅ Backward compatible with direct ticket ID entry
✅ Barcode-based deduplication prevents duplicate tickets on webhook retries
✅ Two-step ticket creation: create ticket → generate QR with ID → update ticket
✅ Tested and verified with comprehensive test scripts
✅ Ready for deployment

The check-in feature now works correctly with both QR code scanning and manual ticket ID entry, with robust protection against duplicate ticket creation.

---

## Important Notes

### Deduplication Strategy

The system uses **barcode-based deduplication** instead of QR code-based:

**Why barcodes?**
- Deterministic (same inputs = same barcode)
- Generated before ticket creation (no circular dependency)
- Stable across webhook retries

**Why not QR codes?**
- QR codes include ticket ID (only available AFTER ticket creation)
- Creates chicken-and-egg problem for deduplication
- Would require temporary QR codes that don't match final QR codes

**Format:**
```
Barcode: orderId-ticketTypeId-seatId-index
Example: order_123-vip_001-A-12-0
```

This ensures webhook retries safely skip already-created tickets while allowing QR codes to include the ticket ID for check-in functionality.
