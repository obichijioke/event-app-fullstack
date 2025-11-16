# Ticket & Inventory Management API

Use these endpoints to configure ticket types, price tiers, seat assignments, and holds for organizer-managed events.

## Ticket Types

| Method | Path | Description |
| ------ | ---- | ----------- |
| `GET` | `/organizer/events/{eventId}/tickets` | List ticket types (requires `Authorization`). |
| `POST` | `/organizer/events/{eventId}/tickets` | Create a ticket type using `CreateTicketTypeDto`. |
| `GET` | `/organizer/tickets/{ticketTypeId}` | Retrieve details for a single ticket type. |
| `PATCH` | `/organizer/tickets/{ticketTypeId}` | Update fields on a ticket type (respecting the sold-ticket guard rails). |
| `DELETE` | `/organizer/tickets/{ticketTypeId}` | Archive (soft-delete) a ticket type with no sold inventory. |

### Sample Create Request

```json
POST /organizer/events/evt_456/tickets
{
  "name": "VIP",
  "kind": "SEATED",
  "currency": "USD",
  "priceCents": 15000,
  "feeCents": 250,
  "capacity": 120,
  "salesStart": "2025-07-01T16:00:00.000Z",
  "salesEnd": "2025-08-01T20:00:00.000Z",
  "status": "active"
}
```

## Price Tiers & Seats

| Method | Path | Description |
| ------ | ---- | ----------- |
| `POST` | `/organizer/tickets/{ticketTypeId}/tiers` | Create a price tier (`CreateTicketPriceTierDto`). |
| `PATCH` | `/organizer/tiers/{tierId}` | Update an existing tier. |
| `DELETE` | `/organizer/tiers/{tierId}` | Remove a tier. |
| `POST` | `/organizer/tickets/{ticketTypeId}/seats/bulk` | Assign an array of `seatIds` to a seated ticket type. |

**Bulk Seat Assignment Request:**

```json
POST /organizer/tickets/tkt_vip/seats/bulk
{
  "seatIds": ["seat_a1", "seat_a2", "seat_a3"]
}
```

The service validates that all seats belong to seatmaps attached to the event and ignores duplicates by using `createMany` with `skipDuplicates`.

## Inventory Snapshot

| Method | Path | Description |
| ------ | ---- | ----------- |
| `GET` | `/organizer/events/{eventId}/inventory` | Aggregates sold, checked-in, hold, and revenue metrics per ticket type. |

**Response Example:**

```json
{
  "event": {
    "id": "evt_456",
    "title": "Launch Party",
    "status": "live",
    "startAt": "2025-08-01T18:00:00.000Z"
  },
  "totals": {
    "sold": 312,
    "checkedIn": 40,
    "holds": 5,
    "grossRevenueCents": 4825000,
    "feeRevenueCents": 86000
  },
  "ticketTypes": [
    {
      "id": "tkt_vip",
      "name": "VIP",
      "kind": "SEATED",
      "capacity": 120,
      "sold": 95,
      "checkedIn": 20,
      "holds": 2,
      "available": 23,
      "grossRevenueCents": 1425000,
      "feeRevenueCents": 23750,
      "currency": "USD"
    }
  ]
}
```

## Holds & Reservations

| Method | Path | Description |
| ------ | ---- | ----------- |
| `POST` | `/organizer/events/{eventId}/holds` | Create a hold (`CreateHoldDto`) for checkout, organizer reservations, or seat locks. |
| `GET` | `/organizer/events/{eventId}/holds` | View active holds ordered by expiration. |
| `DELETE` | `/organizer/holds/{holdId}` | Release a hold immediately. |

All ticket endpoints require organizer membership with `owner` or `manager` roles (holds additionally allow `staff`). Unauthorized access returns HTTP `403`.
