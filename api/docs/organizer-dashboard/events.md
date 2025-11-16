# Event Lifecycle Management API

These endpoints power the organizer event builder, publishing workflow, and scheduling tools. All routes require authentication and an `orgId` context supplied either in the request body or query string.

## CRUD & Status Endpoints

| Method | Path | Notes |
| ------ | ---- | ----- |
| `GET` | `/organizer/events?orgId={organizationId}` | Returns events the current organizer can manage. Supports optional filters (`status`, `categoryId`, `upcoming`, `search`). |
| `POST` | `/organizer/events` | Create a new event draft. Requires `orgId` in the body. |
| `GET` | `/organizer/events/{eventId}` | Retrieve full event details including occurrences, ticket configuration, and assets. |
| `PATCH` | `/organizer/events/{eventId}` | Update core event metadata. |
| `DELETE` | `/organizer/events/{eventId}` | Soft-archive the event (sets `deletedAt`). |
| `POST` | `/organizer/events/{eventId}/publish` | Transition an event to `live`. |
| `POST` | `/organizer/events/{eventId}/pause` | Set event status to `paused`. |
| `POST` | `/organizer/events/{eventId}/cancel` | Set event status to `canceled`. |

### Create Event

```json
POST /organizer/events
Authorization: Bearer <jwt>
Content-Type: application/json

{
  "orgId": "org_123",
  "title": "Launch Party",
  "descriptionMd": "## Welcome",
  "status": "draft",
  "visibility": "unlisted",
  "categoryId": "cat_music",
  "startAt": "2025-08-01T18:00:00.000Z",
  "endAt": "2025-08-01T22:00:00.000Z",
  "doorTime": "2025-08-01T17:00:00.000Z",
  "venueId": "ven_main",
  "seatmapId": "smap_floor"
}
```

Response includes the persisted event object with related organization, venue, seatmap, and category references. BigInt fields are normalized to numbers.

### Update Event

Send a partial payload with only the fields to change:

```json
PATCH /organizer/events/evt_456
{
  "title": "Launch Party 2.0",
  "publishAt": "2025-07-15T16:00:00.000Z",
  "coverImageUrl": "https://cdn.example.com/events/evt_456/hero.jpg"
}
```

### Status Transitions

* `publish` accepts events in `draft`, `pending`, `approved`, or `paused` states and sets the status to `live` (updating `publishAt` when needed).
* `pause` requires a `live` event.
* `cancel` supports `live`, `pending`, or `approved` events.

## Policies & Scheduling

| Method | Path | Description |
| ------ | ---- | ----------- |
| `POST`/`PATCH` | `/organizer/events/{eventId}/policies` | Create or update refund and transfer policies. |
| `POST` | `/organizer/events/{eventId}/occurrences` | Append an occurrence (`startsAt`, `endsAt`, optional `gateOpenAt`). |
| `GET` | `/organizer/events/{eventId}/occurrences` | List scheduled occurrences in chronological order. |

## Asset Management

| Method | Path | Description |
| ------ | ---- | ----------- |
| `POST` | `/organizer/events/{eventId}/assets` | Register an asset reference (`kind`, `url`, optional `altText`). |
| `GET` | `/events/{eventId}/assets` *(public controller)* | Existing public endpoint for viewing assets. |

**Response Example (occurrence creation):**

```json
{
  "id": "occ_123",
  "eventId": "evt_456",
  "startsAt": "2025-08-02T18:00:00.000Z",
  "endsAt": "2025-08-02T22:00:00.000Z",
  "gateOpenAt": "2025-08-02T17:00:00.000Z"
}
```

Use these endpoints to power the Creator v2, scheduling pickers, and status controls inside the dashboard.

