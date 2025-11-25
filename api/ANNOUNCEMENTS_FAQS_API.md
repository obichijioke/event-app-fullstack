# Event Announcements & FAQs API Documentation

Complete API reference for the Event Announcements and FAQs system with scheduled publishing, analytics, and user engagement tracking.

---

## 📢 Event Announcements API

Base URL: `/api/events/:eventId/announcements`

### Create Announcement

**POST** `/api/events/:eventId/announcements`

Create a new announcement for an event with optional scheduling and notifications.

**Auth Required:** ✅ Yes (Organizer only)

**Request Body:**
```json
{
  "title": "Updated Gate Opening Time",
  "message": "Gates will now open at 5:00 PM instead of 6:00 PM.",
  "type": "important",
  "isActive": true,
  "scheduledFor": "2025-12-01T17:00:00Z",
  "sendNotification": true
}
```

**Fields:**
- `title` (string, required): Announcement title
- `message` (string, required): Announcement message
- `type` (enum, optional): `info` | `warning` | `important` | `urgent` (default: `info`)
- `isActive` (boolean, optional): Whether announcement is active (default: `true`)
- `scheduledFor` (ISO date string, optional): Schedule for future publication
- `sendNotification` (boolean, optional): Send immediate notification (default: `false`)

**Response:**
```json
{
  "id": "clx...",
  "eventId": "event-id",
  "title": "Updated Gate Opening Time",
  "message": "Gates will now open at 5:00 PM...",
  "type": "important",
  "isActive": true,
  "scheduledFor": "2025-12-01T17:00:00Z",
  "publishedAt": null,
  "viewCount": 0,
  "createdAt": "2025-11-25T14:00:00Z",
  "updatedAt": "2025-11-25T14:00:00Z"
}
```

**Notes:**
- If `scheduledFor` is provided, announcement will be inactive until scheduled time
- Scheduler (cron job) runs every minute to publish scheduled announcements
- If `sendNotification` is true and announcement type is `important` or `urgent`, multi-channel notifications are sent
- For `info` and `warning` types, only in-app notifications are sent

---

### Get All Announcements

**GET** `/api/events/:eventId/announcements`

Retrieve all active, published announcements for an event.

**Auth Required:** ❌ No (Public)

**Query Parameters:**
- `includeInactive` (boolean, optional): Include inactive announcements (organizer only)

**Response:**
```json
[
  {
    "id": "clx...",
    "title": "Updated Gate Opening Time",
    "message": "Gates will now open...",
    "type": "important",
    "isActive": true,
    "publishedAt": "2025-11-25T14:00:00Z",
    "viewCount": 42,
    "createdAt": "2025-11-25T14:00:00Z"
  }
]
```

---

### Update Announcement

**PATCH** `/api/events/:eventId/announcements/:announcementId`

Update an existing announcement.

**Auth Required:** ✅ Yes (Organizer only)

**Request Body:** (all fields optional)
```json
{
  "title": "New Title",
  "message": "Updated message",
  "type": "urgent",
  "isActive": false
}
```

---

### Delete Announcement

**DELETE** `/api/events/:eventId/announcements/:announcementId`

Delete an announcement.

**Auth Required:** ✅ Yes (Organizer only)

**Response:** `204 No Content`

---

### Track Announcement View

**POST** `/api/events/:eventId/announcements/:announcementId/view`

Track that a user viewed an announcement (creates unique view record).

**Auth Required:** ✅ Yes

**Response:**
```json
{
  "success": true
}
```

**Notes:**
- Uses `upsert` to prevent duplicate views per user
- Increments `viewCount` on announcement
- Creates `AnnouncementView` record with user ID and timestamp

---

### Dismiss Announcement

**POST** `/api/events/:eventId/announcements/:announcementId/dismiss`

Mark an announcement as dismissed for the current user.

**Auth Required:** ✅ Yes

**Response:**
```json
{
  "id": "clx...",
  "announcementId": "clx...",
  "userId": "user-id",
  "dismissedAt": "2025-11-25T14:30:00Z"
}
```

---

### Undismiss Announcement

**DELETE** `/api/events/:eventId/announcements/:announcementId/dismiss`

Remove dismissal (show announcement again).

**Auth Required:** ✅ Yes

**Response:** `204 No Content`

---

### Get Dismissed Announcements

**GET** `/api/events/:eventId/announcements/dismissed`

Get list of announcement IDs dismissed by current user.

**Auth Required:** ✅ Yes

**Response:**
```json
["clx...", "clx...", "clx..."]
```

---

### Get Announcement Analytics

**GET** `/api/events/:eventId/announcements/analytics`

Get comprehensive analytics for all announcements.

**Auth Required:** ✅ Yes (Organizer only)

**Response:**
```json
{
  "totalAnnouncements": 10,
  "activeAnnouncements": 8,
  "scheduledAnnouncements": 2,
  "totalViews": 342,
  "uniqueViewers": 87,
  "totalDismissals": 23,
  "byType": {
    "info": { "count": 4, "views": 120, "dismissals": 10 },
    "warning": { "count": 3, "views": 98, "dismissals": 5 },
    "important": { "count": 2, "views": 84, "dismissals": 6 },
    "urgent": { "count": 1, "views": 40, "dismissals": 2 }
  },
  "topAnnouncements": [
    {
      "id": "clx...",
      "title": "Gate Opening Change",
      "viewCount": 84,
      "dismissalCount": 6,
      "engagementRate": 0.93
    }
  ]
}
```

**Analytics Metrics:**
- `totalAnnouncements`: Total count of all announcements
- `activeAnnouncements`: Currently active announcements
- `scheduledAnnouncements`: Announcements scheduled for future
- `totalViews`: Sum of all view counts
- `uniqueViewers`: Count of distinct users who viewed
- `totalDismissals`: Sum of all dismissals
- `byType`: Breakdown by announcement type
- `topAnnouncements`: Top 5 by view count with engagement rate

---

### Send Manual Notification

**POST** `/api/events/:eventId/announcements/:announcementId/notify`

Manually trigger notifications for an announcement.

**Auth Required:** ✅ Yes (Organizer only)

**Response:**
```json
{
  "success": true,
  "message": "Notifications queued"
}
```

**Notes:**
- Queues notifications for all ticket holders
- Uses existing queue system (BullMQ)
- Notification channels based on announcement type

---

## ❓ Event FAQs API

Base URL: `/api/events/:eventId/faqs`

### Create FAQ

**POST** `/api/events/:eventId/faqs`

Create a new FAQ for an event.

**Auth Required:** ✅ Yes (Organizer only)

**Request Body:**
```json
{
  "question": "What should I bring to the event?",
  "answer": "Please bring your ticket, a valid ID, and any personal items.",
  "sortOrder": 1,
  "isActive": true
}
```

**Fields:**
- `question` (string, required): The question text
- `answer` (string, required): The answer text
- `sortOrder` (number, optional): Display order (auto-incremented if not provided)
- `isActive` (boolean, optional): Whether FAQ is active (default: `true`)

**Response:**
```json
{
  "id": "clx...",
  "eventId": "event-id",
  "question": "What should I bring to the event?",
  "answer": "Please bring your ticket...",
  "sortOrder": 1,
  "isActive": true,
  "viewCount": 0,
  "helpfulCount": 0,
  "source": "organizer",
  "sourceQuestionId": null,
  "createdAt": "2025-11-25T14:00:00Z"
}
```

---

### Get All FAQs

**GET** `/api/events/:eventId/faqs`

Retrieve all FAQs for an event, sorted by `sortOrder`.

**Auth Required:** ❌ No (Public)

**Query Parameters:**
- `includeInactive` (boolean, optional): Include inactive FAQs (organizer only)

**Response:**
```json
[
  {
    "id": "clx...",
    "question": "What should I bring?",
    "answer": "Please bring your ticket...",
    "sortOrder": 1,
    "viewCount": 45,
    "helpfulCount": 32,
    "source": "organizer"
  }
]
```

---

### Search FAQs

**GET** `/api/events/:eventId/faqs/search`

Search FAQs by question or answer text (case-insensitive).

**Auth Required:** ❌ No (Public)

**Query Parameters:**
- `q` (string, required): Search query

**Example:** `/api/events/:eventId/faqs/search?q=parking`

**Response:**
```json
[
  {
    "id": "clx...",
    "question": "Is parking available at the venue?",
    "answer": "Yes, parking is available...",
    "sortOrder": 2,
    "viewCount": 28,
    "helpfulCount": 19
  }
]
```

**Notes:**
- Searches both `question` and `answer` fields
- Uses PostgreSQL `ILIKE` for case-insensitive matching
- Returns only active FAQs
- Results sorted by `sortOrder`

---

### Update FAQ

**PATCH** `/api/events/:eventId/faqs/:faqId`

Update an existing FAQ.

**Auth Required:** ✅ Yes (Organizer only)

**Request Body:** (all fields optional)
```json
{
  "question": "Updated question?",
  "answer": "Updated answer.",
  "sortOrder": 5,
  "isActive": false
}
```

---

### Delete FAQ

**DELETE** `/api/events/:eventId/faqs/:faqId`

Delete a FAQ.

**Auth Required:** ✅ Yes (Organizer only)

**Response:** `204 No Content`

---

### Track FAQ View

**POST** `/api/events/:eventId/faqs/:faqId/view`

Increment view count when a FAQ is viewed/expanded.

**Auth Required:** ❌ No (Public)

**Response:**
```json
{
  "success": true
}
```

**Notes:**
- Increments `viewCount` by 1
- No duplicate prevention (allows multiple views per user)
- Call when user expands FAQ accordion

---

### Mark FAQ as Helpful

**POST** `/api/events/:eventId/faqs/:faqId/helpful`

Increment helpful count when user marks FAQ as helpful.

**Auth Required:** ❌ No (Public)

**Response:**
```json
{
  "success": true
}
```

**Notes:**
- Increments `helpfulCount` by 1
- Client should prevent multiple clicks per user (client-side state)
- Used for engagement metrics

---

### Reorder FAQs

**POST** `/api/events/:eventId/faqs/reorder`

Update the sort order of multiple FAQs atomically.

**Auth Required:** ✅ Yes (Organizer only)

**Request Body:**
```json
{
  "faqIds": ["clx-faq-1", "clx-faq-2", "clx-faq-3"]
}
```

**Response:**
```json
{
  "success": true
}
```

**Notes:**
- Array order determines new `sortOrder` (index + 1)
- Updates happen in a transaction (all-or-nothing)
- Example: First FAQ gets `sortOrder: 1`, second gets `sortOrder: 2`, etc.

---

## 🔄 Automatic Scheduler

The **AnnouncementsSchedulerService** runs automatically via `@Cron` decorator.

### Schedule Configuration

```typescript
@Cron(CronExpression.EVERY_MINUTE)
async publishScheduledAnnouncements()
```

**Behavior:**
1. Runs every minute (60 seconds)
2. Finds announcements where:
   - `scheduledFor` ≤ current time
   - `publishedAt` is `null`
   - `isActive` is `false`
3. Updates each announcement:
   - Sets `isActive` to `true`
   - Sets `publishedAt` to current time
4. For `important` or `urgent` announcements:
   - Automatically sends notifications to all ticket holders
   - Uses multi-channel delivery (in-app, email, push)

### Monitoring Scheduler

Check server logs for scheduler activity:

```bash
[Nest] [AnnouncementsSchedulerService] Publishing scheduled announcements...
[Nest] [AnnouncementsSchedulerService] Published announcement: Gate Opening Change
```

---

## 📊 Database Models

### EventAnnouncement

```prisma
model EventAnnouncement {
  id           String      @id @default(cuid())
  eventId      String
  title        String
  message      String      @db.Text
  type         String      @default("info")
  isActive     Boolean     @default(true)
  scheduledFor DateTime?
  publishedAt  DateTime?
  viewCount    Int         @default(0)
  createdAt    DateTime    @default(now())
  updatedAt    DateTime    @updatedAt

  event        Event       @relation(fields: [eventId])
  views        AnnouncementView[]
  dismissals   AnnouncementDismissal[]

  @@index([scheduledFor])
  @@index([eventId, publishedAt(sort: Desc)])
}
```

### AnnouncementView

```prisma
model AnnouncementView {
  id              String            @id @default(cuid())
  announcementId  String
  userId          String
  viewedAt        DateTime          @default(now())

  announcement    EventAnnouncement @relation(fields: [announcementId])
  user            User              @relation(fields: [userId])

  @@unique([announcementId, userId])
  @@index([userId])
}
```

### AnnouncementDismissal

```prisma
model AnnouncementDismissal {
  id              String            @id @default(cuid())
  announcementId  String
  userId          String
  dismissedAt     DateTime          @default(now())

  announcement    EventAnnouncement @relation(fields: [announcementId])
  user            User              @relation(fields: [userId])

  @@unique([announcementId, userId])
  @@index([userId])
}
```

### EventFAQ

```prisma
model EventFAQ {
  id               String         @id @default(cuid())
  eventId          String
  question         String         @db.Text
  answer           String         @db.Text
  sortOrder        Int            @default(0)
  isActive         Boolean        @default(true)
  viewCount        Int            @default(0)
  helpfulCount     Int            @default(0)
  source           String         @default("organizer")
  sourceQuestionId String?
  createdAt        DateTime       @default(now())
  updatedAt        DateTime       @updatedAt

  event            Event          @relation(fields: [eventId])
  sourceQuestion   EventQuestion? @relation(fields: [sourceQuestionId])

  @@index([eventId, sortOrder])
}
```

---

## 🎯 Usage Examples

### Frontend Integration

#### Track Announcement View (Logged-in User)

```typescript
import { trackAnnouncementView } from '@/lib/events';

useEffect(() => {
  async function trackView() {
    if (userToken && !dismissed.has(announcement.id)) {
      await trackAnnouncementView(announcement.id, userToken);
    }
  }
  trackView();
}, [announcement.id, userToken]);
```

#### Search FAQs

```typescript
import { searchFAQs } from '@/lib/events';

const [searchQuery, setSearchQuery] = useState('');
const [results, setResults] = useState([]);

useEffect(() => {
  async function search() {
    if (searchQuery.trim()) {
      const faqs = await searchFAQs(eventId, searchQuery);
      setResults(faqs);
    }
  }
  search();
}, [searchQuery]);
```

#### Mark FAQ as Helpful

```typescript
import { markFAQHelpful } from '@/lib/events';

const handleHelpful = async (faqId: string) => {
  await markFAQHelpful(faqId);
  setMarkedHelpful(prev => new Set(prev).add(faqId));
};
```

### Backend Testing

#### Create Scheduled Announcement

```bash
curl -X POST http://localhost:3000/api/events/EVENT_ID/announcements \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Last Minute Update",
    "message": "Important announcement",
    "type": "urgent",
    "scheduledFor": "2025-12-01T18:00:00Z",
    "sendNotification": true
  }'
```

#### Get Analytics

```bash
curl -X GET http://localhost:3000/api/events/EVENT_ID/announcements/analytics \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Search FAQs

```bash
curl -X GET "http://localhost:3000/api/events/EVENT_ID/faqs/search?q=refund"
```

---

## 🔐 Authentication & Authorization

### Endpoints Requiring Auth

**Organizer-only (requires organization membership):**
- Create/Update/Delete Announcements
- Create/Update/Delete FAQs
- Reorder FAQs
- Get Analytics
- Send Manual Notifications

**User-authenticated:**
- Track Announcement Views
- Dismiss/Undismiss Announcements
- Get Dismissed Announcements

**Public (no auth required):**
- Get All Announcements
- Get All FAQs
- Search FAQs
- Track FAQ Views
- Mark FAQ as Helpful

### Permission Verification

The backend verifies organization membership for protected endpoints:

```typescript
private async verifyEventAccess(eventId: string, userId: string) {
  const event = await this.prisma.event.findUnique({
    where: { id: eventId },
    include: {
      org: {
        include: {
          members: { where: { userId } }
        }
      }
    }
  });

  if (!event) {
    throw new NotFoundException('Event not found');
  }

  if (event.org.members.length === 0) {
    throw new ForbiddenException('You do not have permission');
  }
}
```

---

## 📈 Best Practices

### Announcement Scheduling

1. **Immediate announcements:** Don't set `scheduledFor`, set `isActive: true`
2. **Future announcements:** Set `scheduledFor`, leave `isActive: false`
3. **Draft announcements:** Set `isActive: false`, no `scheduledFor`

### Notification Strategy

- **Urgent/Important:** Auto-send via multiple channels (in-app, email, push)
- **Info/Warning:** In-app only to avoid notification fatigue
- **Manual trigger:** Use `/notify` endpoint for re-sending

### FAQ Organization

1. Use `sortOrder` to control display sequence
2. Keep questions concise and scannable
3. Use search for long FAQ lists (10+)
4. Monitor `helpfulCount` to identify gaps

### Performance Optimization

- Announcements are indexed by `[eventId, publishedAt]`
- FAQs are indexed by `[eventId, sortOrder]`
- Use `includeInactive=false` for public endpoints (default)
- Scheduler is debounced (1-minute intervals)

---

## 🐛 Troubleshooting

### Scheduler Not Running

1. Verify `@nestjs/schedule` is imported in module
2. Check `ScheduleModule.forRoot()` is called
3. Look for scheduler logs in console
4. Ensure server is running (not stopped)

### Views Not Tracking

1. Check user is authenticated (for announcement views)
2. Verify JWT token is valid
3. Check for duplicate view prevention (AnnouncementView unique constraint)

### Notifications Not Sending

1. Ensure announcement type is `important` or `urgent`
2. Check Redis is running (required for queues)
3. Verify queue worker is processing jobs
4. Check notification service logs

---

## 📚 Related Documentation

- [CLAUDE.md](../CLAUDE.md) - Project overview and setup
- [Prisma Schema](./prisma/schema.prisma) - Complete database schema
- [Queue System](./src/queues/README.md) - Background job processing
- [Notification System](./src/notifications/README.md) - Multi-channel notifications

---

Generated: 2025-11-25
Version: 1.0.0
