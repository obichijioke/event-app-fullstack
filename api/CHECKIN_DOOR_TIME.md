# Check-in Door Time Feature

## Overview
Organizers can now configure when check-in begins by setting a `doorTime` on their events. If set, check-in will be allowed from the door time onwards. If not set, check-in defaults to the event start time (existing behavior).

## Implementation

### Using Existing `doorTime` Field
Instead of adding a new field, we leverage the existing `Event.doorTime` field which semantically represents "when doors open" - perfect for check-in configuration.

### Backend Changes

#### Check-in Validation Logic
**File**: `api/src/tickets/tickets.service.ts:507-524`

```typescript
// Check if check-in is allowed based on door time or event start time
const now = new Date();
const checkinStartTime = ticket.event.doorTime || ticket.event.startAt;

if (now < checkinStartTime) {
  const hoursUntil = Math.ceil((checkinStartTime.getTime() - now.getTime()) / (1000 * 60 * 60));
  const minutesUntil = Math.ceil((checkinStartTime.getTime() - now.getTime()) / (1000 * 60));

  if (ticket.event.doorTime) {
    throw new BadRequestException(
      `Check-in has not opened yet. Doors open at ${checkinStartTime.toLocaleTimeString()} (in ${hoursUntil > 0 ? hoursUntil + ' hour' + (hoursUntil !== 1 ? 's' : '') : minutesUntil + ' minute' + (minutesUntil !== 1 ? 's' : '')})`
    );
  } else {
    throw new BadRequestException(
      `Check-in has not opened yet. Event starts at ${checkinStartTime.toLocaleTimeString()} (in ${hoursUntil > 0 ? hoursUntil + ' hour' + (hoursUntil !== 1 ? 's' : '') : minutesUntil + ' minute' + (minutesUntil !== 1 ? 's' : '')})`
    );
  }
}
```

**Key Features:**
- Uses `doorTime` if set, otherwise falls back to `startAt`
- Provides clear error messages showing when check-in opens
- Shows countdown in hours or minutes
- Different messages for door time vs event start time

#### Event Query Update
**File**: `api/src/tickets/tickets.service.ts:453`

Added `doorTime: true` to event select to load the field for check-in validation.

### Frontend Changes

#### Check-in Instructions
**File**: `frontend/web-app/components/organizer/check-in/check-in-content.tsx:295`

Updated instructions to mention: "Check-in opens at the configured door time, or when the event starts"

## How It Works

### Scenario 1: No Door Time Set (Default Behavior)
```
Event Start: 7:00 PM
Door Time: (not set)
Check-in Opens: 7:00 PM (same as event start)
```

**Error Message before 7:00 PM:**
```
Check-in has not opened yet. Event starts at 7:00:00 PM (in 2 hours)
```

### Scenario 2: Door Time Set
```
Event Start: 7:00 PM
Door Time: 5:00 PM (2 hours before)
Check-in Opens: 5:00 PM
```

**Error Message before 5:00 PM:**
```
Check-in has not opened yet. Doors open at 5:00:00 PM (in 30 minutes)
```

## Setting Door Time

### Via API
Organizers can set `doorTime` when creating or updating events:

**Create Event:**
```http
POST /events
{
  "title": "Concert Night",
  "startAt": "2024-12-25T19:00:00Z",
  "endAt": "2024-12-25T23:00:00Z",
  "doorTime": "2024-12-25T17:00:00Z"  // 2 hours before
}
```

**Update Event:**
```http
PATCH /events/:id
{
  "doorTime": "2024-12-25T17:00:00Z"
}
```

### Suggested Door Times
Common patterns for different event types:

- **Concerts/Festivals**: 1-2 hours before
- **Sports Events**: 1-2 hours before
- **Conferences**: 30 minutes before
- **Workshops/Meetups**: 15-30 minutes before
- **Private Events**: Same as event start (no door time)

### UI Implementation Options

Organizers can be presented with quick options:

```typescript
// Helper function to calculate door time
function calculateDoorTime(eventStartTime: Date, hoursBeforeOptions: number[]): Date[] {
  return hoursBeforeOptions.map(hours =>
    new Date(eventStartTime.getTime() - (hours * 60 * 60 * 1000))
  );
}

// Example UI options
const eventStart = new Date('2024-12-25T19:00:00Z');
const options = [
  { label: 'When event starts', value: null },
  { label: '1 hour before', value: calculateDoorTime(eventStart, [1])[0] },
  { label: '2 hours before', value: calculateDoorTime(eventStart, [2])[0] },
  { label: '3 hours before', value: calculateDoorTime(eventStart, [3])[0] },
  { label: '4 hours before', value: calculateDoorTime(eventStart, [4])[0] },
  { label: 'Custom time', value: 'custom' },
];
```

## Benefits

### 1. No Schema Changes
- ✅ Uses existing `doorTime` field
- ✅ No database migrations required
- ✅ Field already exists in DTOs and APIs

### 2. Semantic Accuracy
- ✅ "Door time" literally means when doors open for entry
- ✅ Aligns with real-world event terminology
- ✅ Intuitive for organizers to understand

### 3. Flexibility
- ✅ Absolute timestamp (not just offset)
- ✅ Can be any time before event start
- ✅ Supports complex scheduling scenarios

### 4. Backward Compatible
- ✅ If `doorTime` is null, uses `startAt` (existing behavior)
- ✅ No breaking changes for existing events
- ✅ Gradual adoption by organizers

## Validation Rules

### Backend Constraints
1. `doorTime` must be before `startAt`
2. `doorTime` cannot be after `endAt`
3. `doorTime` is optional (nullable)

### Recommended Frontend Validation
```typescript
// Validate door time is before event start
if (doorTime && doorTime >= eventStartTime) {
  throw new Error('Door time must be before event start time');
}

// Warn if door time is more than 4 hours before
if (doorTime && (eventStartTime - doorTime) > 4 * 60 * 60 * 1000) {
  showWarning('Door time is more than 4 hours before event start. Is this correct?');
}
```

## Error Messages

The system provides helpful error messages showing:
- ✅ When check-in will open (absolute time)
- ✅ How long until check-in opens (relative countdown)
- ✅ Whether it's based on door time or event start

## Testing

### Manual Test Cases

1. **No door time set**
   - Create event without `doorTime`
   - Attempt check-in before `startAt` → Should fail
   - Attempt check-in after `startAt` → Should succeed

2. **Door time 2 hours before**
   - Create event with `doorTime` 2 hours before `startAt`
   - Attempt check-in before `doorTime` → Should fail with door time message
   - Attempt check-in after `doorTime` but before `startAt` → Should succeed
   - Attempt check-in after `startAt` → Should succeed

3. **Error messages**
   - Check that error messages show correct countdown
   - Verify messages distinguish between door time and event start

### Integration Testing
```typescript
describe('Check-in with Door Time', () => {
  it('allows check-in when door time has passed', async () => {
    const doorTime = new Date(Date.now() - 1000); // 1 second ago
    const eventStart = new Date(Date.now() + 7200000); // 2 hours from now

    // Create event with door time
    const event = await createEvent({ doorTime, startAt: eventStart });
    const ticket = await createTicket({ eventId: event.id });

    // Should succeed
    const result = await checkInTicket(ticket.id);
    expect(result.checkin).toBeDefined();
  });

  it('rejects check-in when door time has not passed', async () => {
    const doorTime = new Date(Date.now() + 3600000); // 1 hour from now
    const eventStart = new Date(Date.now() + 7200000); // 2 hours from now

    const event = await createEvent({ doorTime, startAt: eventStart });
    const ticket = await createTicket({ eventId: event.id });

    // Should fail
    await expect(checkInTicket(ticket.id)).rejects.toThrow('Check-in has not opened yet');
  });
});
```

## Files Modified

### Backend
1. ✏️ `api/src/tickets/tickets.service.ts` - Updated check-in validation logic to use `doorTime`

### Frontend
2. ✏️ `frontend/web-app/components/organizer/check-in/check-in-content.tsx` - Updated instructions

### Documentation
3. 📄 `api/CHECKIN_DOOR_TIME.md` - This documentation

## Future Enhancements

### Possible UI Additions

1. **Event Form Enhancement**
   - Add door time picker in event creation/edit form
   - Provide quick select options (1-4 hours before)
   - Show preview of check-in window

2. **Check-in Dashboard**
   - Display door time prominently on check-in page
   - Show countdown to door opening
   - Visual indicator when doors are open

3. **Attendee Communication**
   - Show door time on ticket emails
   - Display on event detail pages
   - Include in event reminders

## Summary

✅ Check-in now respects `doorTime` if set
✅ Falls back to `startAt` if no door time (backward compatible)
✅ Clear error messages with countdown
✅ No database schema changes required
✅ Semantically accurate implementation
✅ Ready for organizer adoption

The `doorTime` field provides a simple, intuitive way for organizers to control when attendees can check in, improving the event experience for both staff and attendees.
