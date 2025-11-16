# Analytics & Reviews

Use the analytics APIs to display ticket progress, review sentiment, and follower counts for events and the organization.

## Event Analytics

| Method | Path | Description |
| ------ | ---- | ----------- |
| `GET` | `/organizer/events/{eventId}/analytics?orgId={organizationId}` | Ticket status breakdown and recent event reviews. |

**Response**

```json
{
  "event": {
    "id": "evt_456",
    "title": "Launch Party",
    "status": "live",
    "startAt": "2025-08-01T18:00:00.000Z"
  },
  "tickets": {
    "issued": 280,
    "checked_in": 45,
    "refunded": 10
  },
  "reviews": {
    "averageRating": 4.6,
    "total": 32,
    "recent": [
      {
        "id": "rev_1",
        "rating": 5,
        "comment": "Amazing night!",
        "createdAt": "2025-05-11T09:00:00.000Z",
        "user": {
          "id": "usr_9",
          "name": "Chris",
          "email": "chris@example.com"
        }
      }
    ]
  }
}
```

## Organization Insights

| Method | Path | Description |
| ------ | ---- | ----------- |
| `GET` | `/organizer/organization/insights?orgId={organizationId}` | Organization review stats and follower count. |

**Response**

```json
{
  "followers": 1284,
  "reviews": {
    "averageRating": 4.8,
    "total": 54,
    "recent": [
      {
        "id": "orgrev_1",
        "rating": 5,
        "comment": "Always well organized",
        "createdAt": "2025-05-07T18:30:00.000Z",
        "user": {
          "id": "usr_44",
          "name": "Morgan",
          "email": "morgan@example.com"
        }
      }
    ]
  }
}
```

The analytics service respects organizer access control (owner/manager/staff). Use these payloads to populate review dashboards, follower widgets, and ticket-progress charts.
