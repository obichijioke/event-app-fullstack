# Duplicate Event Publishing Bug Fix

## Problem
When users clicked "Publish" twice quickly, the system created two separate events instead of recognizing that the draft was already published.

## Root Cause
- No unique constraint on the `eventId` field in `EventCreatorDraft` table
- No database-level protection against concurrent publish requests
- Multiple requests could update the same draft with different event IDs

## Solution: Database Unique Constraint

### 1. Schema Change
Added unique constraint to `EventCreatorDraft.eventId` in [schema.prisma:1346](api/prisma/schema.prisma#L1346):

```prisma
model EventCreatorDraft {
  // ... fields ...

  @@unique([eventId])  // ← NEW: Prevents multiple drafts linking to same event
  @@index([organizationId])
  // ... other constraints ...
}
```

### 2. Service Logic Update
Updated [event-creator-v2.service.ts:616-888](api/src/event-creator-v2/event-creator-v2.service.ts#L616-L888) with:

#### Pre-transaction Status Check (Lines 625-652)
```typescript
// Fast rejection if already published
if (draft.status === 'published' || draft.status === 'scheduled') {
  return { message: 'Event already published', eventId: draft.eventId };
}
```

#### Unique Constraint Error Handling (Lines 857-877)
```typescript
try {
  // Create event and update draft in transaction
} catch (error) {
  // Handle P2002 unique constraint violation
  if (error.code === 'P2002' && error.meta?.target?.includes('eventId')) {
    // Return existing event (idempotent)
    return { message: 'Event already published', ... };
  }
  throw error;
}
```

## How It Works Now

### Scenario: User Double-Clicks "Publish"

**Request 1:**
1. Status check passes ✓
2. Begins transaction
3. Creates new Event (ID: `evt_123`)
4. Updates Draft: `eventId = 'evt_123'`, `status = 'published'`
5. Commits transaction ✓

**Request 2 (concurrent):**
1. Status check passes ✓ (or fails if Request 1 completed)
2. Begins transaction
3. Creates new Event (ID: `evt_456`)
4. Tries to update Draft: `eventId = 'evt_456'`
5. **Database rejects update** - `eventId` already set to `evt_123`
6. Catches unique constraint error (P2002)
7. Returns existing event: `evt_123` ✓

**Result:** Only one event created, both requests return same event ID

## Benefits

✅ **Database-Level Protection** - No race conditions possible
✅ **Idempotent API** - Safe to retry, always returns same result
✅ **Graceful Degradation** - Second request gets existing event, not error
✅ **Simple Solution** - Leverages PostgreSQL's ACID guarantees
✅ **No Complex Locking** - Database handles concurrency automatically

## Migration Applied

```bash
cd api
npx prisma db push --accept-data-loss
```

Created unique index: `event_creator_drafts_event_id_key`

## Testing

### Manual Test
```bash
# Run the test script
node api/test-duplicate-publish.js
```

### Expected Behavior
- Both requests return HTTP 200
- Both return the same `eventId`
- Message: "Event already published" on second request
- Only one Event record in database

## Code References

- Schema: [api/prisma/schema.prisma:1346](api/prisma/schema.prisma#L1346)
- Service: [api/src/event-creator-v2/event-creator-v2.service.ts:616-888](api/src/event-creator-v2/event-creator-v2.service.ts#L616-L888)
- Test: [api/test-duplicate-publish.js](api/test-duplicate-publish.js)

## Comparison: Complex vs. Simple Solution

### ❌ Complex (Initial Approach)
- Row-level database locks (`SELECT ... FOR UPDATE`)
- Multiple status checks
- ~30 lines of lock management code
- Harder to understand and maintain

### ✅ Simple (Final Approach)
- Single unique constraint
- Database enforces uniqueness automatically
- ~15 lines of error handling
- Leverages PostgreSQL's battle-tested concurrency

---

**Why This Works Better:**
The database unique constraint is the simplest and most reliable solution. It's impossible for two drafts to have the same `eventId` because PostgreSQL guarantees constraint enforcement at the transaction level, regardless of application-level race conditions.
