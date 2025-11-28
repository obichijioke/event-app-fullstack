# Door Time UI - Event Creator V2

## Overview
Enhanced the Event Creator V2 to provide an intuitive dropdown selector for configuring when check-in opens for events. Organizers can choose from preset options (1-4 hours before event) or set a custom time.

## Implementation

### Component Updated
**File**: `frontend/web-app/components/creator-v2/occurrence-card.tsx`

### User Interface

#### Dropdown Options
Located in the "Advanced Options" section of each occurrence card:

```
Check-in opens:
┌─────────────────────────────┐
│ When event starts          ▼│
├─────────────────────────────┤
│ When event starts           │
│ 1 hour before event         │
│ 2 hours before event        │
│ 3 hours before event        │
│ 4 hours before event        │
│ Custom time                 │
└─────────────────────────────┘
```

**Custom Time Mode:**
When "Custom time" is selected, a datetime picker appears below the dropdown for precise control.

### How It Works

#### Preset Calculation
When a preset is selected (e.g., "2 hours before event"):
1. Gets the event start time
2. Subtracts the specified hours (e.g., 2 hours = 7,200,000 milliseconds)
3. Converts to ISO string format
4. Saves as `doorTime` field

**Example:**
```typescript
Event Start: 2024-12-25T19:00:00Z (7:00 PM)
Preset: "2hr" (2 hours before)
Calculated doorTime: 2024-12-25T17:00:00Z (5:00 PM)
```

#### Smart Detection
The component detects which preset is currently selected:
- Compares `doorTime` with `startsAt`
- Calculates the hour difference
- Automatically selects the matching preset
- Falls back to "Custom time" if no preset matches

### Code Changes

#### New Functions

**`getDoorTimePreset()`** - Determines current preset
```typescript
const getDoorTimePreset = (): string => {
  if (!startsAt) return 'at_start';
  if (!doorTime) return 'at_start';

  const start = new Date(startsAt);
  const door = new Date(doorTime);
  const diffHours = Math.round((start.getTime() - door.getTime()) / (1000 * 60 * 60));

  if (diffHours === 0) return 'at_start';
  if (diffHours === 1) return '1hr';
  if (diffHours === 2) return '2hr';
  if (diffHours === 3) return '3hr';
  if (diffHours === 4) return '4hr';

  return 'custom';
};
```

**`handleDoorTimePresetChange(preset)`** - Applies preset selection
```typescript
const handleDoorTimePresetChange = (preset: string) => {
  if (!startsAt) return;

  const start = new Date(startsAt);

  switch (preset) {
    case 'at_start':
      onDoorTimeChange(undefined); // No door time = starts at event time
      break;
    case '1hr':
      onDoorTimeChange(new Date(start.getTime() - 1 * 60 * 60 * 1000).toISOString());
      break;
    // ... other cases
  }
};
```

### UI States

#### 1. No Event Start Time
- Dropdown is **disabled**
- Shows "When event starts" (default)
- Tooltip: Must set event start time first

#### 2. Event Start Time Set, No Door Time
- Dropdown is **enabled**
- Shows "When event starts" (default)
- Organizer can select any preset

#### 3. Preset Selected
- Dropdown shows selected preset
- `doorTime` is calculated and saved
- Updates automatically if start time changes

#### 4. Custom Time Selected
- Dropdown shows "Custom time"
- Datetime picker appears below
- Organizer can set any time before event start

### User Experience

#### Benefits
✅ **Simple** - One dropdown for common cases
✅ **Flexible** - Custom option for specific needs
✅ **Intuitive** - Natural language options (1 hour before, 2 hours before)
✅ **Smart** - Auto-detects current selection
✅ **Validated** - Only allows times before event start

#### Validation
- Dropdown is disabled if no event start time
- Custom times are validated to be before event start
- Clear helper text: "When attendees can start checking in"

### Data Flow

```
User selects "2 hours before"
         ↓
handleDoorTimePresetChange('2hr')
         ↓
Calculate: eventStart - 2 hours
         ↓
Convert to ISO string
         ↓
onDoorTimeChange(isoString)
         ↓
Saved to occurrence.doorTime
         ↓
Sent to backend on publish
```

### Backend Integration

The `doorTime` value is stored as an ISO timestamp:

**Single Occurrence:**
```json
{
  "startsAt": "2024-12-25T19:00:00Z",
  "endsAt": "2024-12-25T23:00:00Z",
  "doorTime": "2024-12-25T17:00:00Z"
}
```

**Recurring Event with Override:**
```json
{
  "overrides": [
    {
      "sourceStart": "2024-12-25T19:00:00Z",
      "doorTime": "2024-12-25T17:00:00Z"
    }
  ]
}
```

### Common Use Cases

#### Concert Event
```
Event starts: 8:00 PM
Check-in opens: 2 hours before (6:00 PM)
Rationale: Give attendees time to arrive, get drinks, find seats
```

#### Conference
```
Event starts: 9:00 AM
Check-in opens: 30 minutes before (8:30 AM)
Rationale: Quick check-in for business attendees
```

#### Sports Event
```
Event starts: 7:00 PM
Check-in opens: 1 hour before (6:00 PM)
Rationale: Manage crowd flow, early entry for premium seats
```

#### Workshop/Meetup
```
Event starts: 6:00 PM
Check-in opens: When event starts (6:00 PM)
Rationale: Small group, no early entry needed
```

### Visual Design

The door time selector appears in the **Advanced Options** section with:
- 🚪 DoorOpen icon for visual clarity
- Descriptive label: "Check-in opens"
- Helper text: "When attendees can start checking in"
- Seamless integration with existing occurrence card design

### Future Enhancements

Possible improvements:
1. **Preset customization** - Allow org to set default presets
2. **Smart suggestions** - Recommend based on event type
3. **Bulk apply** - Apply same door time to all occurrences
4. **Event templates** - Save door time preferences per event type

## Testing

### Manual Test Cases

1. **Select preset "2 hours before"**
   - Set event start to 7:00 PM
   - Select "2 hours before event"
   - Verify doorTime is 5:00 PM

2. **Change start time with preset active**
   - Set preset to "1 hour before"
   - Change event start from 7:00 PM to 8:00 PM
   - Verify doorTime updates to 7:00 PM

3. **Switch to custom time**
   - Select "Custom time"
   - Verify datetime picker appears
   - Set custom time of 4:45 PM
   - Verify it saves correctly

4. **Load existing event with door time**
   - Event has doorTime 2 hours before start
   - Verify dropdown shows "2 hours before event"
   - Event has custom doorTime
   - Verify dropdown shows "Custom time"

## Files Modified

1. ✏️ `frontend/web-app/components/creator-v2/occurrence-card.tsx`
   - Added dropdown selector for door time presets
   - Added helper functions for preset calculation
   - Updated UI to show custom picker when needed

2. 📄 `frontend/web-app/DOOR_TIME_UI.md` - This documentation

## Summary

✅ Intuitive dropdown UI for check-in time configuration
✅ Preset options: Event start, 1hr, 2hr, 3hr, 4hr before
✅ Custom time option for flexibility
✅ Automatic calculation of door time based on event start
✅ Smart detection of current preset
✅ Seamless integration with existing Event Creator V2
✅ Works for single and recurring events

The door time configuration is now simple and user-friendly, making it easy for organizers to control when attendees can check in to their events.
