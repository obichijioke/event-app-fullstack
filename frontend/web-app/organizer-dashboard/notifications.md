# Notifications & Moderation

The dashboard surfaces outstanding moderation actions and payout alerts via the Organizer notifications service.

| Method | Path | Description |
| ------ | ---- | ----------- |
| `GET` | `/organizer/notifications?orgId={organizationId}` | Returns unresolved moderation flags and non-settled payouts for the organization. |
| `POST` | `/organizer/flags/{flagId}/resolve?orgId={organizationId}` | Marks a moderation flag as `resolved`. |

### Response Structure

```json
{
  "role": "manager",
  "moderationFlags": [
    {
      "id": "flag_1",
      "targetKind": "event",
      "targetId": "evt_456",
      "reason": "Policy violation",
      "status": "open",
      "createdAt": "2025-05-09T10:20:00.000Z",
      "event": {
        "id": "evt_456",
        "title": "Launch Party"
      }
    }
  ],
  "payouts": [
    {
      "id": "payout_1",
      "status": "pending",
      "amountCents": 250000,
      "currency": "USD",
      "createdAt": "2025-05-08T12:00:00.000Z"
    }
  ]
}
```

Resolving a flag updates its status to `resolved` and stamps `resolvedAt`. The service validates that the flag belongs to the organization; otherwise it returns HTTP `404`.
