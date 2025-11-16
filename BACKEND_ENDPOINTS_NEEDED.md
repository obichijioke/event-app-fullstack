# Missing Backend Endpoints

> Required for Check-in Interface Feature
> Date: 2025-11-08

---

## 📋 Overview

The Check-in Interface frontend is fully implemented but requires two additional backend endpoints to display statistics and recent check-ins. The core check-in functionality already works with the existing `POST /organizer/checkins` endpoint.

---

## 🔗 Required Endpoints

### 1. Get Check-in Statistics

**Endpoint**: `GET /organizer/events/:eventId/checkin-stats`

**Query Parameters**:
- `orgId` (required): Organization ID for authorization

**Authentication**: JWT Bearer token required

**Authorization**: User must be member of organization

**Response**:
```typescript
{
  totalTickets: number;      // Total tickets issued for this event
  checkedIn: number;         // Number of tickets checked in
  pending: number;           // Number of tickets not yet checked in
  checkInRate: number;       // Percentage (0-100) of tickets checked in
}
```

**Example Response**:
```json
{
  "totalTickets": 150,
  "checkedIn": 87,
  "pending": 63,
  "checkInRate": 58.0
}
```

**Implementation Notes**:
- Query the `Ticket` table for tickets belonging to the event
- Count tickets with `status = 'checked_in'` for checkedIn
- Count tickets with `status != 'checked_in'` for pending
- Calculate rate: `(checkedIn / totalTickets) * 100`
- Consider caching this for large events (1000+ tickets)

**Prisma Query Example**:
```typescript
const totalTickets = await prisma.ticket.count({
  where: { eventId, status: { not: 'void' } }
});

const checkedIn = await prisma.ticket.count({
  where: { eventId, status: 'checked_in' }
});

const pending = totalTickets - checkedIn;
const checkInRate = totalTickets > 0 ? (checkedIn / totalTickets) * 100 : 0;
```

---

### 2. Get Recent Check-ins

**Endpoint**: `GET /organizer/events/:eventId/recent-checkins`

**Query Parameters**:
- `orgId` (required): Organization ID for authorization
- `limit` (optional, default: 10): Number of recent check-ins to return

**Authentication**: JWT Bearer token required

**Authorization**: User must be member of organization

**Response**:
```typescript
Array<{
  id: string;              // Check-in record ID
  ticketId: string;        // Ticket ID
  attendeeName: string;    // Name of the ticket owner
  ticketType: string;      // Name of the ticket type
  scannedAt: string;       // ISO timestamp of check-in
}>
```

**Example Response**:
```json
[
  {
    "id": "clx1234567890",
    "ticketId": "clx0987654321",
    "attendeeName": "John Doe",
    "ticketType": "VIP Access",
    "scannedAt": "2025-11-08T14:32:15.000Z"
  },
  {
    "id": "clx2345678901",
    "ticketId": "clx1098765432",
    "attendeeName": "Jane Smith",
    "ticketType": "General Admission",
    "scannedAt": "2025-11-08T14:30:42.000Z"
  }
]
```

**Implementation Notes**:
- Query the `Checkin` table joined with `Ticket`, `TicketType`, and `User`
- Order by `scannedAt` descending (most recent first)
- Limit results to the specified limit (default 10)
- Only return check-ins for the specified event
- Consider real-time updates via WebSocket for live dashboard

**Prisma Query Example**:
```typescript
const recentCheckins = await prisma.checkin.findMany({
  where: { eventId },
  include: {
    ticket: {
      include: {
        ticketType: true,
        owner: {
          select: { name: true, email: true }
        }
      }
    }
  },
  orderBy: { scannedAt: 'desc' },
  take: limit || 10
});

// Transform to response format
return recentCheckins.map(checkin => ({
  id: checkin.id,
  ticketId: checkin.ticketId,
  attendeeName: checkin.ticket.owner.name || checkin.ticket.owner.email,
  ticketType: checkin.ticket.ticketType.name,
  scannedAt: checkin.scannedAt.toISOString()
}));
```

---

## 📝 Database Schema Reference

The endpoints will use these existing tables:

### Checkin Table
```prisma
model Checkin {
  id        String   @id @default(cuid())
  ticketId  String   @map("ticket_id")
  eventId   String   @map("event_id")
  scannerId String?  @map("scanner_id")
  gate      String?
  scannedAt DateTime @default(now()) @map("scanned_at")

  ticket Ticket @relation(fields: [ticketId], references: [id])
  event  Event  @relation(fields: [eventId], references: [id])

  @@unique([ticketId])
  @@index([eventId, scannedAt(sort: Desc)])
}
```

### Ticket Table
```prisma
model Ticket {
  id              String       @id @default(cuid())
  orderId         String       @map("order_id")
  eventId         String       @map("event_id")
  ticketTypeId    String       @map("ticket_type_id")
  ownerId         String       @map("owner_id")
  status          TicketStatus @default(issued)

  owner      User       @relation(fields: [ownerId], references: [id])
  ticketType TicketType @relation(fields: [ticketTypeId], references: [id])
  checkins   Checkin[]
}
```

---

## 🔒 Security Considerations

### Authorization Checks:
1. Verify JWT token is valid
2. Verify `orgId` matches the event's organization
3. Verify user is a member of the organization
4. Return 403 Forbidden if authorization fails

### Rate Limiting:
- Consider rate limiting these endpoints (e.g., 60 requests/minute)
- Statistics endpoint can be cached for 30-60 seconds
- Recent check-ins should be near real-time

### Data Privacy:
- Only return attendee names to authorized organizers
- Don't expose email addresses unless necessary
- Filter out voided/refunded tickets from statistics

---

## 🚀 Implementation Priority

### High Priority:
1. **GET /organizer/events/:eventId/checkin-stats** - Needed for statistics dashboard
2. **GET /organizer/events/:eventId/recent-checkins** - Needed for activity feed

### Future Enhancements:
- WebSocket endpoint for real-time check-in notifications
- Export check-in report to CSV
- Check-in analytics (busiest times, average wait time, etc.)
- Bulk check-in endpoint for importing pre-checked attendees

---

## 📊 Performance Considerations

### Statistics Endpoint:
- Can be cached for 30-60 seconds (acceptable staleness)
- Consider using Redis for caching
- For events with 10,000+ tickets, use database aggregation queries
- Add database index on `(eventId, status)` if not exists

### Recent Check-ins Endpoint:
- Should be fast (< 100ms response time)
- Already has appropriate index: `@@index([eventId, scannedAt(sort: Desc)])`
- Limit to 50 records maximum to prevent abuse
- Consider cursor-based pagination for very active events

---

## 🧪 Testing Recommendations

### Unit Tests:
- Test statistics calculation with various ticket counts
- Test with 0 tickets (edge case)
- Test with all tickets checked in (100% rate)
- Test recent check-ins ordering (newest first)
- Test with different user roles (organizer, staff, attendee)

### Integration Tests:
- Test authorization (wrong org, no membership)
- Test with real check-in data
- Test rate limiting
- Test cache behavior (if implemented)

### Load Tests:
- Test with 1000 concurrent requests
- Test with events having 10,000+ tickets
- Measure response time under load

---

## 📞 Contact

If you need clarification on these endpoints or the frontend implementation:
- Review: `frontend/web-app/components/organizer/check-in/check-in-content.tsx`
- See: `IMPLEMENTATION_SUMMARY.md` for full feature details
- Check: `TESTING_GUIDE.md` for test cases

---

## ✅ Implementation Checklist

- [ ] Create controller method for check-in stats
- [ ] Create controller method for recent check-ins
- [ ] Add DTO validation for query parameters
- [ ] Implement authorization checks
- [ ] Add unit tests for both endpoints
- [ ] Add integration tests
- [ ] Update Swagger/OpenAPI documentation
- [ ] Test with frontend integration
- [ ] Consider caching strategy
- [ ] Deploy to staging environment
- [ ] Update API documentation

---

## 🎯 Success Criteria

The endpoints are complete when:
1. Frontend statistics dashboard shows real data (not all zeros)
2. Recent check-ins list updates after each check-in
3. Response time < 500ms for stats, < 200ms for recent check-ins
4. Authorization works correctly (403 for unauthorized)
5. All tests pass (unit, integration, e2e)
6. Swagger docs updated and accurate
7. Frontend team confirms functionality

---

## 📅 Estimated Effort

- **Statistics Endpoint**: 2-3 hours (including tests)
- **Recent Check-ins Endpoint**: 2-3 hours (including tests)
- **Testing & Documentation**: 1-2 hours
- **Total**: 5-8 hours

---

## Example Controller Implementation

```typescript
// src/organizer/checkin.controller.ts

@Controller('organizer/events')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OrganizerCheckinController {
  constructor(private readonly checkinService: OrganizerCheckinService) {}

  @Get(':eventId/checkin-stats')
  @ApiOperation({ summary: 'Get check-in statistics for an event' })
  @ApiQuery({ name: 'orgId', required: true })
  async getCheckinStats(
    @CurrentUser() user: any,
    @Param('eventId') eventId: string,
    @Query('orgId') orgId: string,
  ) {
    return this.checkinService.getCheckinStats(orgId, eventId, user.id);
  }

  @Get(':eventId/recent-checkins')
  @ApiOperation({ summary: 'Get recent check-ins for an event' })
  @ApiQuery({ name: 'orgId', required: true })
  @ApiQuery({ name: 'limit', required: false })
  async getRecentCheckins(
    @CurrentUser() user: any,
    @Param('eventId') eventId: string,
    @Query('orgId') orgId: string,
    @Query('limit') limit?: number,
  ) {
    return this.checkinService.getRecentCheckins(
      orgId,
      eventId,
      user.id,
      limit || 10
    );
  }
}
```
