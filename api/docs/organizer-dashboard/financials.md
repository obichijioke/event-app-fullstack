# Financial Reporting & Payouts

These APIs provide finance teams with revenue summaries, exports, and payout lifecycle management.

## Revenue Summary

| Method | Path | Description |
| ------ | ---- | ----------- |
| `GET` | `/organizer/financials/summary?orgId={organizationId}` | Aggregated gross/net revenue, refunds, fees, ticket counts, and daily totals. |

**Query Parameters**

* `startDate` *(optional)* – ISO timestamp lower bound.
* `endDate` *(optional)* – ISO timestamp upper bound.

**Response**

```json
{
  "totals": {
    "grossRevenueCents": 4825000,
    "netRevenueCents": 4630000,
    "feeCents": 150000,
    "refundCents": 45000,
    "taxCents": 305000,
    "subtotalCents": 4370000,
    "ordersCount": 284,
    "ticketsSold": 812,
    "payoutsCents": 3000000
  },
  "ordersByDay": {
    "2025-05-10": 120000,
    "2025-05-11": 95000
  }
}
```

## Order Export

| Method | Path | Description |
| ------ | ---- | ----------- |
| `GET` | `/organizer/financials/orders/export?orgId={organizationId}` | Returns the raw order list for CSV export. Supports the same filters as the orders listing (`eventId`, `startDate`, `endDate`). |

## Payout Management

| Method | Path | Description |
| ------ | ---- | ----------- |
| `GET` | `/organizer/payouts?orgId={organizationId}` | List payouts with optional `status`, `startDate`, `endDate` filters. |
| `GET` | `/organizer/payouts/{payoutId}?orgId={organizationId}` | View a single payout. |
| `POST` | `/organizer/payouts?orgId={organizationId}` | Create a manual payout request (`CreatePayoutDto`). |
| `POST` | `/organizer/payout-accounts?orgId={organizationId}` | Register or update payout account details (`CreatePayoutAccountDto`). |

**Create Payout Example**

```json
POST /organizer/payouts?orgId=org_123
{
  "amountCents": 1500000,
  "currency": "USD",
  "scheduledFor": "2025-05-20T18:00:00.000Z",
  "provider": "stripe"
}
```

Finance endpoints require organizer membership with `owner`, `manager`, or `finance` roles.
