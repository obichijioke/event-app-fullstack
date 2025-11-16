# Orders, Refunds, and Attendee Management

The organizer dashboard exposes dedicated endpoints to manage orders, trigger refunds, view attendees, and perform manual check-ins.

## Orders API

| Method | Path | Description |
| ------ | ---- | ----------- |
| `GET` | `/organizer/orders?orgId={organizationId}` | List orders with optional filters (`status`, `eventId`, `search`, `startDate`, `endDate`, `page`, `limit`). |
| `GET` | `/organizer/orders/{orderId}?orgId={organizationId}` | Retrieve a specific order including items, tickets, payments, and refunds. |
| `POST` | `/organizer/orders/{orderId}/refund?orgId={organizationId}` | Initiate a full or partial refund. |

### List Orders

```
GET /organizer/orders?orgId=org_123&eventId=evt_456&status=paid&page=1&limit=20
Authorization: Bearer <jwt>
```

**Response**

```json
{
  "data": [
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
      "items": [
        {
          "ticketType": {
            "id": "tkt_ga",
            "name": "General Admission",
            "kind": "GA"
          },
          "quantity": 2,
          "unitPriceCents": 2000
        }
      ],
      "tickets": [
        {
          "id": "tic_1",
          "status": "issued",
          "ownerId": "usr_1"
        }
      ],
      "payments": [
        {
          "id": "pay_1",
          "status": "captured",
          "amountCents": 4500,
          "currency": "USD"
        }
      ],
      "refunds": []
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 54,
    "totalPages": 3
  }
}
```

### Refund an Order

```json
POST /organizer/orders/ord_abc/refund?orgId=org_123
{
  "amountCents": 4500,
  "reason": "Customer requested refund"
}
```

The API validates organizer finance permissions, calls the payment provider, updates order status to `refunded`, and marks all associated tickets as `refunded`. Responses include the provider refund identifier and status.

## Attendee API

| Method | Path | Description |
| ------ | ---- | ----------- |
| `GET` | `/organizer/events/{eventId}/attendees?orgId={organizationId}` | List issued tickets and their owners (supports `search` and `status` filters). |
| `POST` | `/organizer/tickets/{ticketId}/transfer?orgId={organizationId}` | Reassign a ticket to a different user. |
| `POST` | `/organizer/tickets/{ticketId}/resend?orgId={organizationId}` | Queue a resend notification to the ticket owner. |
| `POST` | `/organizer/checkins?orgId={organizationId}` | Record a manual check-in via `CreateCheckinDto`. |

**Transfer Request Example**

```json
POST /organizer/tickets/tic_1/transfer?orgId=org_123
{
  "toUserId": "usr_2"
}
```

**Manual Check-In Example**

```json
POST /organizer/checkins?orgId=org_123
{
  "ticketId": "tic_1",
  "gate": "North Gate"
}
```

*Transfers* only succeed for tickets in the `issued` state. The service validates the destination user and returns the updated ticket owner.

*Check-ins* leverage the shared `TicketsService` validation, ensuring events have started and tickets have not already been scanned.
