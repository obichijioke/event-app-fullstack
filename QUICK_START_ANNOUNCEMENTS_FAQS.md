# Quick Start Guide - Announcements & FAQs

## 🚀 Get Started in 5 Minutes

### 1. Install Dependencies (if not already done)
```bash
cd api
npm install
```

### 2. Sync Database Schema
```bash
npx prisma db push
npx prisma generate
```

### 3. Seed Sample Data
```bash
npx tsx prisma/seed-announcements-faqs.ts
```

### 4. Start Backend Server
```bash
npm run start:dev
```

The scheduler will automatically start running every minute! ✅

---

## 📌 Key Endpoints

### For Testing

**Get event announcements:**
```bash
curl http://localhost:3000/api/events/seed-event-lagos-soundfest/announcements
```

**Search FAQs:**
```bash
curl "http://localhost:3000/api/events/seed-event-lagos-soundfest/faqs/search?q=parking"
```

**Get all FAQs:**
```bash
curl http://localhost:3000/api/events/seed-event-lagos-soundfest/faqs
```

### For Organizers (Requires Auth Token)

**Get a token first:**
```bash
cd api
node scripts/get-token.js
# Copy the token from output
```

**Create an announcement:**
```bash
TOKEN="your-jwt-token-here"

curl -X POST http://localhost:3000/api/events/seed-event-lagos-soundfest/announcements \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Important Update",
    "message": "Event gates will open 1 hour early!",
    "type": "important",
    "isActive": true,
    "sendNotification": true
  }'
```

**Create a scheduled announcement:**
```bash
# Schedule for 2 minutes from now
FUTURE_TIME=$(date -u -d '+2 minutes' +"%Y-%m-%dT%H:%M:%SZ")

curl -X POST http://localhost:3000/api/events/seed-event-lagos-soundfest/announcements \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"Scheduled Test\",
    \"message\": \"This will publish in 2 minutes\",
    \"type\": \"info\",
    \"isActive\": false,
    \"scheduledFor\": \"$FUTURE_TIME\"
  }"
```

**Get analytics:**
```bash
curl -X GET http://localhost:3000/api/events/seed-event-lagos-soundfest/announcements/analytics \
  -H "Authorization: Bearer $TOKEN"
```

**Create a FAQ:**
```bash
curl -X POST http://localhost:3000/api/events/seed-event-lagos-soundfest/faqs \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Can I bring my own food?",
    "answer": "Outside food is not permitted, but we have a variety of food vendors on-site.",
    "isActive": true
  }'
```

---

## 🧪 Testing the Scheduler

Run the automated test:
```bash
cd api
node test-announcements-scheduler.js
```

This will:
1. Create a future-scheduled announcement
2. Create a past-scheduled announcement
3. Wait 65 seconds for scheduler to run
4. Verify the past one was auto-published
5. Test view and FAQ tracking

---

## 🎨 Frontend Components

### Public Event Page

Add to your event details page:

```tsx
import { EventAnnouncements } from '@/components/event-detail/event-announcements';
import { EventFAQ } from '@/components/event-detail/event-faq';

export default function EventDetailsPage({ params }) {
  const eventId = params.id;
  const userToken = getUserToken(); // Your auth logic

  return (
    <div>
      {/* Your event details... */}

      <EventAnnouncements
        eventId={eventId}
        userToken={userToken}
        className="mb-8"
      />

      <EventFAQ
        eventId={eventId}
        className="mb-8"
      />
    </div>
  );
}
```

### Organizer Dashboard

Navigate to:
- **Announcements:** `/organizer/events/[eventId]/announcements`
- **FAQs:** `/organizer/events/[eventId]/faqs`

---

## 📊 View Data in Prisma Studio

```bash
cd api
npx prisma studio
```

Then open http://localhost:5555 and browse:
- `EventAnnouncement` - View all announcements
- `EventFAQ` - View all FAQs
- `AnnouncementView` - See who viewed what
- `AnnouncementDismissal` - See dismissed announcements

---

## 🐛 Troubleshooting

### Scheduler not running?

**Check logs:** Look for `[AnnouncementsSchedulerService]` in console

**Verify module import:**
```typescript
// announcements.module.ts should have:
imports: [ScheduleModule.forRoot()]
```

**Check server is running:**
```bash
curl http://localhost:3000/api
```

### Views not tracking?

**Test the endpoint directly:**
```bash
curl -X POST http://localhost:3000/api/events/EVENT_ID/announcements/ANNOUNCEMENT_ID/view \
  -H "Authorization: Bearer $TOKEN"
```

**Check database:**
```sql
SELECT * FROM "AnnouncementView" ORDER BY "viewedAt" DESC LIMIT 10;
```

### FAQs search not working?

**Test with simple query:**
```bash
curl "http://localhost:3000/api/events/seed-event-lagos-soundfest/faqs/search?q=a"
```

**Check FAQ exists:**
```bash
curl http://localhost:3000/api/events/seed-event-lagos-soundfest/faqs
```

---

## 📖 Full Documentation

- **API Reference:** [ANNOUNCEMENTS_FAQS_API.md](api/ANNOUNCEMENTS_FAQS_API.md)
- **Implementation Details:** [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)
- **Project Setup:** [CLAUDE.md](CLAUDE.md)

---

## 🎯 Common Use Cases

### 1. Last-Minute Event Update
```bash
# Create urgent announcement with immediate notification
curl -X POST http://localhost:3000/api/events/EVENT_ID/announcements \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Venue Change - Urgent",
    "message": "Event moved to indoor venue due to weather",
    "type": "urgent",
    "isActive": true,
    "sendNotification": true
  }'
```

### 2. Schedule Announcement for Event Day
```bash
# Set scheduledFor to event start time - 1 hour
curl -X POST http://localhost:3000/api/events/EVENT_ID/announcements \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Gates Opening Soon",
    "message": "Gates will open in 1 hour. See you soon!",
    "type": "info",
    "scheduledFor": "2025-12-15T17:00:00Z"
  }'
```

### 3. Add Common FAQ
```bash
curl -X POST http://localhost:3000/api/events/EVENT_ID/faqs \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What is your refund policy?",
    "answer": "Full refunds available up to 7 days before event. No refunds within 7 days unless event is canceled.",
    "isActive": true
  }'
```

### 4. Track Announcement Performance
```bash
# Get detailed analytics
curl http://localhost:3000/api/events/EVENT_ID/announcements/analytics \
  -H "Authorization: Bearer $TOKEN" | jq

# Look for:
# - totalViews: How many people saw announcements
# - uniqueViewers: How many distinct users
# - totalDismissals: How many dismissed
# - Engagement rate: (views - dismissals) / views
```

### 5. Bulk Import FAQs
```javascript
// Save as import-faqs.js
const faqs = [
  { question: 'Q1', answer: 'A1' },
  { question: 'Q2', answer: 'A2' },
  // ... more
];

async function importFAQs() {
  for (const faq of faqs) {
    await fetch(`http://localhost:3000/api/events/EVENT_ID/faqs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(faq),
    });
  }
}

importFAQs();
```

---

## ⚡ Quick Wins

**Monitor scheduler in real-time:**
```bash
# In one terminal:
npm run start:dev

# Watch for these logs every minute:
# [AnnouncementsSchedulerService] Checking for scheduled announcements...
```

**See what attendees see:**
```bash
# Public announcements (no auth needed):
curl http://localhost:3000/api/events/EVENT_ID/announcements

# Public FAQs (no auth needed):
curl http://localhost:3000/api/events/EVENT_ID/faqs
```

**Quick analytics check:**
```bash
# Total announcement count:
curl http://localhost:3000/api/events/EVENT_ID/announcements | jq 'length'

# Total FAQ count:
curl http://localhost:3000/api/events/EVENT_ID/faqs | jq 'length'
```

---

## 🎓 Next Steps

1. **Run the test script** to see scheduler in action
2. **Create sample announcements** with different types
3. **Test search functionality** with various queries
4. **Try drag-and-drop reordering** in FAQ dashboard
5. **Monitor analytics** to see engagement patterns

---

## 💡 Pro Tips

- **Scheduler runs every minute** - Wait at least 60 seconds to see scheduled announcements publish
- **Use localStorage for guests** - Dismissals work even without login
- **Type matters for notifications** - `important` and `urgent` send multi-channel, others in-app only
- **Analytics are cached** - Refresh page to see latest stats
- **Search is case-insensitive** - Works on both question and answer fields
- **Reordering is atomic** - All FAQs update together or none at all

---

*Happy announcing! 🎉*
