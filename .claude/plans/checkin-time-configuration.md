# Implementation Plan: Configurable Check-in Start Time

## Overview
Allow organizers to configure when check-in can begin before the event starts. Options: 1, 2, 3, or 4 hours before event start time.

## Current State Analysis

### Existing Fields
- **Event model** has:
  - `startAt` - Event start time
  - `endAt` - Event end time
  - `doorTime` - Optional door opening time (currently not used for check-in validation)

- **EventPolicies model** has:
  - `transferCutoff` - String interval (e.g., "2 hours")
  - Pattern we can follow for check-in settings

### Current Check-in Logic
Located in `api/src/tickets/tickets.service.ts:506-508`:
```typescript
// Check if event hasn't started yet
if (ticket.event.startAt > new Date()) {
  throw new BadRequestException('Event has not started yet');
}
```

**Problem**: Hard-coded to only allow check-in after event starts.

## Proposed Solution

### Option A: Use EventPolicies Table (Recommended)
Store check-in configuration in the `EventPolicies` model alongside other event policies.

**Advantages:**
- Follows existing pattern (`transferCutoff`)
- Centralized policy management
- Easy to extend with more check-in rules later

**Schema Change:**
```prisma
model EventPolicies {
  eventId           String  @id @map("event_id")
  refundPolicy      String? @map("refund_policy")
  transferAllowed   Boolean @default(true) @map("transfer_allowed")
  transferCutoff    String? @map("transfer_cutoff")
  resaleAllowed     Boolean @default(false) @map("resale_allowed")
  checkinStartHours Int?    @default(0) @map("checkin_start_hours") // NEW: 0, 1, 2, 3, or 4

  event Event @relation(fields: [eventId], references: [id], onDelete: Cascade)

  @@map("event_policies")
}
```

### Option B: Use Event.doorTime Field
Leverage the existing `doorTime` field that's already in the Event model.

**Advantages:**
- No schema migration needed
- Field already exists and is exposed in DTOs
- Semantic meaning aligns with "when doors open"

**Disadvantages:**
- `doorTime` is an absolute DateTime, not an offset
- Organizers would need to manually calculate the time
- Less flexible for recurring events

### Option C: Add Field to Event Model
Add a dedicated field directly to the Event model.

**Disadvantages:**
- Event model is already large
- Policies table exists for this purpose
- Less organized architecture

## Recommended Approach: Option A (EventPolicies)

### Implementation Steps

#### 1. Database Schema Migration
**File**: `api/prisma/schema.prisma`

Add to EventPolicies model:
```prisma
checkinStartHours Int? @default(0) @map("checkin_start_hours")
```

Values:
- `0` - Check-in starts when event starts (default/current behavior)
- `1` - Check-in starts 1 hour before event
- `2` - Check-in starts 2 hours before event
- `3` - Check-in starts 3 hours before event
- `4` - Check-in starts 4 hours before event

#### 2. Backend DTOs
**Files**:
- `api/src/events/dto/create-event.dto.ts`
- `api/src/events/dto/update-event.dto.ts`

Update DTOs:
```typescript
export class CreateEventPoliciesDto {
  @IsString()
  @IsOptional()
  refundPolicy?: string;

  @IsOptional()
  transferAllowed?: boolean = true;

  @IsString()
  @IsOptional()
  transferCutoff?: string;

  @IsOptional()
  resaleAllowed?: boolean = false;

  @IsNumber()
  @Min(0)
  @Max(4)
  @IsOptional()
  checkinStartHours?: number = 0; // NEW
}
```

#### 3. Check-in Validation Logic
**File**: `api/src/tickets/tickets.service.ts`

Update `checkInTicket` method around line 506:

**Current:**
```typescript
// Check if event hasn't started yet
if (ticket.event.startAt > new Date()) {
  throw new BadRequestException('Event has not started yet');
}
```

**New:**
```typescript
// Check if event hasn't started yet, accounting for early check-in policy
const now = new Date();
const eventStart = ticket.event.startAt;
const checkinStartHours = ticket.event.policies?.checkinStartHours ?? 0;
const checkinStartTime = new Date(eventStart.getTime() - (checkinStartHours * 60 * 60 * 1000));

if (now < checkinStartTime) {
  const hoursUntilCheckin = Math.ceil((checkinStartTime.getTime() - now.getTime()) / (1000 * 60 * 60));
  throw new BadRequestException(
    `Check-in has not opened yet. Check-in starts ${checkinStartHours > 0 ? checkinStartHours + ' hours before the event' : 'when the event starts'} (in ${hoursUntilCheckin} hour${hoursUntilCheckin !== 1 ? 's' : ''})`
  );
}
```

Also ensure policies are loaded in query (around line 444):
```typescript
const ticket = await this.prisma.ticket.findUnique({
  where: { id: ticketId },
  include: {
    event: {
      select: {
        id: true,
        title: true,
        startAt: true,
        endAt: true,
        policies: true, // ADD THIS
      },
    },
    // ... rest
  },
});
```

#### 4. Organizer Settings UI
**File**: Create `frontend/web-app/components/organizer/events/event-policies-form.tsx`

New form component for event policies with check-in configuration:

```typescript
<FormField
  label="Check-in Start Time"
  description="When can attendees start checking in?"
  required
>
  <Select
    value={checkinStartHours}
    onChange={(e) => setCheckinStartHours(Number(e.target.value))}
  >
    <option value="0">When event starts</option>
    <option value="1">1 hour before event</option>
    <option value="2">2 hours before event</option>
    <option value="3">3 hours before event</option>
    <option value="4">4 hours before event</option>
  </Select>
</FormField>
```

#### 5. Event Creator Integration
**File**: `frontend/web-app/components/creator-v2/sections/policies-section.tsx` (if exists)

Add check-in configuration to the event creator flow in the policies step.

#### 6. Display Check-in Window Info
**Files**:
- `frontend/web-app/components/organizer/check-in/check-in-content.tsx`
- `frontend/web-app/components/organizer/events/event-detail-content.tsx`

Show check-in window information to organizers:
```typescript
<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
  <h3 className="font-medium text-blue-900">Check-in Window</h3>
  <p className="text-sm text-blue-800">
    Check-in opens: {formatCheckinStartTime(event.startAt, event.policies?.checkinStartHours)}
  </p>
  <p className="text-sm text-blue-800">
    Event starts: {formatDateTime(event.startAt)}
  </p>
</div>
```

#### 7. API Response Updates
**File**: `api/src/organizer/organizer-events.service.ts`

Ensure policies are included in event responses:
```typescript
include: {
  venue: true,
  category: true,
  policies: true, // ADD THIS
  ticketTypes: true,
  // ... rest
}
```

### Migration Strategy

#### Database Migration
```sql
-- Add column with default value
ALTER TABLE event_policies
ADD COLUMN checkin_start_hours INTEGER DEFAULT 0;

-- Add check constraint
ALTER TABLE event_policies
ADD CONSTRAINT checkin_start_hours_range
CHECK (checkin_start_hours >= 0 AND checkin_start_hours <= 4);

-- Add comment
COMMENT ON COLUMN event_policies.checkin_start_hours IS
'Hours before event start when check-in can begin. Values: 0-4.';
```

#### Default Behavior
- Existing events without this setting: Default to `0` (current behavior)
- New events: Default to `0`, organizer can configure
- No breaking changes to existing check-ins

### Testing Strategy

#### Unit Tests
**File**: `api/src/tickets/tickets.service.spec.ts`

Test cases:
1. Check-in succeeds when within allowed window
2. Check-in fails when before allowed window
3. Check-in fails when after event ends
4. Default behavior (0 hours) works like current system
5. Each configuration (1, 2, 3, 4 hours) works correctly
6. Error messages show correct information

#### Integration Tests
1. Create event with check-in policy
2. Update event check-in policy
3. Attempt check-in at various times
4. Verify error messages are user-friendly

### UI/UX Considerations

#### Clear Communication
- Show check-in window prominently on check-in page
- Display countdown to check-in opening if not yet available
- Clear error messages when check-in attempted too early

#### Default Selection
- Default to "When event starts" (current behavior)
- Most common use case: 1-2 hours before
- Recommend based on event type (concerts might want 2-4 hours)

#### Validation
- Ensure check-in start is always before event start
- Prevent negative values
- Cap at 4 hours (reasonable maximum)

## Files to Modify

### Backend
1. ✏️ `api/prisma/schema.prisma` - Add checkinStartHours field
2. ✏️ `api/src/events/dto/create-event.dto.ts` - Add DTO field
3. ✏️ `api/src/events/dto/update-event.dto.ts` - Add DTO field
4. ✏️ `api/src/tickets/tickets.service.ts` - Update check-in validation logic
5. ✏️ `api/src/organizer/organizer-events.service.ts` - Include policies in responses
6. ✏️ `api/src/events/events.service.ts` - Ensure policies handled in create/update

### Frontend
7. 📄 `frontend/web-app/components/organizer/events/event-policies-form.tsx` - NEW form component
8. ✏️ `frontend/web-app/components/organizer/check-in/check-in-content.tsx` - Display check-in window
9. ✏️ `frontend/web-app/components/organizer/events/event-detail-content.tsx` - Show policy info
10. ✏️ `frontend/web-app/lib/types/organizer.ts` - Add type definitions

### Documentation
11. 📄 `api/CHECKIN_START_TIME_FEATURE.md` - Feature documentation

## Alternative Considerations

### More Granular Control
If organizers need more flexibility in the future:
- Change to minutes instead of hours: `checkinStartMinutes`
- Allow custom DateTime like `doorTime`
- Support different check-in windows for different ticket types

### Per-Occurrence Configuration
For recurring events, each occurrence might need different check-in times:
- Add `checkinStartHours` to `EventOccurrence` table
- Fall back to event-level policy if not set per-occurrence

## Summary

**Recommended Implementation: Option A - EventPolicies Table**

This approach:
- ✅ Follows existing architectural patterns
- ✅ Minimal schema changes (one field)
- ✅ Easy to extend with more check-in rules
- ✅ No breaking changes
- ✅ Simple UI with 5 clear options
- ✅ Clear validation and error messages

The implementation is straightforward and maintains consistency with the existing codebase structure.
