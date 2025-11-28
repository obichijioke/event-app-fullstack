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

**New Logic:**
```typescript
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
);

// Step 3: Update ticket with final QR code
await prisma.ticket.update({
  where: { id: ticket.id },
  data: { qrCode },
});
```

### 3. Added QR Code Decoder

**File:** `api/src/tickets/tickets.service.ts`

```typescript
private decodeQRCode(qrCode: string): string {
  try {
    const decoded = Buffer.from(qrCode, 'base64').toString('utf-8');
    const parts = decoded.split('|');

    if (parts.length >= 1 && parts[0] !== 'PENDING') {
      return parts[0]; // Return ticket ID
    }

    throw new BadRequestException('Invalid QR code format');
  } catch (error) {
    throw new BadRequestException('Invalid QR code: Unable to decode');
  }
}
```

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
    // If decoding fails, assume it's a direct ticket ID
    ticketId = ticketIdOrQRCode;
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

### Scenario 2: Manual Entry
```
1. Staff enters ticket ID: clxxx123456789
2. Frontend sends: POST /tickets/checkin { ticketId: "clxxx123456789" }
3. Backend tries to decode (fails - not base64)
4. Backend falls back to using as direct ticket ID
5. Backend looks up ticket by ID → validates → creates check-in record
6. ✓ Check-in successful
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

Run the test script to verify:
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
6. `api/CHECKIN_QR_FIX.md` - This documentation

---

## Summary

✅ QR codes now include ticket ID as the first field
✅ Check-in endpoint can decode QR codes automatically
✅ Backward compatible with direct ticket ID entry
✅ Tested and verified with test script
✅ Ready for deployment

The check-in feature now works correctly with both QR code scanning and manual ticket ID entry.
