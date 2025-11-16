# Organizer Dashboard Overview API

The dashboard aggregates organization-level metrics, open tasks, and recent sales activity to power the organizer landing experience.

## Summary Endpoint

| Method | Path | Description |
| ------ | ---- | ----------- |
| `GET` | `/organizer/dashboard?orgId={organizationId}` | Returns headline metrics and tasks for the selected organization. |

### Request

All organizer dashboard endpoints require an authenticated organizer token. Supply the organization identifier via the mandatory `orgId` query parameter.

```
GET /organizer/dashboard?orgId=org_123
Authorization: Bearer <jwt>
```

### Response Shape

```json
{
  "organization": {
    "id": "org_123",
    "name": "Acme Events",
    "status": "approved",
    "role": "manager"
  },
  "metrics": {
    "upcomingEvents": 3,
    "grossRevenueCents": 1525000,
    "netRevenueCents": 1372000,
    "subtotalCents": 1400000,
    "feesCents": 153000,
    "ordersCount": 284,
    "ticketsSold": 812,
    "unsettledPayouts": {
      "count": 2,
      "amountCents": 420000
    }
  },
  "upcomingEvents": [
    {
      "id": "evt_live",
      "title": "Summer Nights",
      "status": "live",
      "startAt": "2025-07-04T17:00:00.000Z",
      "publishAt": "2025-05-01T12:00:00.000Z"
    }
  ],
  "recentOrders": [
    {
      "id": "ord_abc",
      "status": "paid",
      "totalCents": 4500,
      "currency": "USD",
      "createdAt": "2025-05-10T14:05:00.000Z",
      "buyer": {
        "id": "usr_1",
        "name": "Jane Doe",
        "email": "jane@example.com"
      },
      "event": {
        "id": "evt_live",
        "title": "Summer Nights"
      }
    }
  ],
  "tasks": {
    "drafts": [
      {
        "id": "evt_draft",
        "title": "Fall Preview",
        "status": "draft",
        "startAt": "2025-09-21T18:00:00.000Z"
      }
    ],
    "moderationAlerts": 1,
    "unsettledPayouts": {
      "count": 2,
      "amountCents": 420000
    }
  }
}
```

* `metrics.unsettledPayouts` echoes the count and value of payouts in `pending`, `in_review`, or `failed` states.
* `tasks.moderationAlerts` is the number of unresolved moderation flags tied to the organization’s events.
* Timestamps are returned in ISO 8601 format.

Use the dashboard payload to populate KPI cards, task lists, and recent sales widgets on the organizer home screen.
