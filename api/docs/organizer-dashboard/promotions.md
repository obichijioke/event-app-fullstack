# Promotions & Access Controls

Promo campaigns and discount codes reuse the shared Promotions module. Organizer-authenticated requests must call the `/promotions` namespace with the organization identifier in the path.

## Promotion Campaigns

| Method | Path | Description |
| ------ | ---- | ----------- |
| `POST` | `/promotions/orgs/{orgId}/promotions` | Create a promotion campaign (`CreatePromotionDto`). |
| `GET` | `/promotions/orgs/{orgId}/promotions` | List campaigns for the organization. |
| `GET` | `/promotions/orgs/{orgId}/promotions/{promotionId}` | Retrieve a specific campaign. |
| `PATCH` | `/promotions/orgs/{orgId}/promotions/{promotionId}` | Update promotion metadata or targeting. |
| `DELETE` | `/promotions/orgs/{orgId}/promotions/{promotionId}` | Remove a promotion. |

### Create Promotion Example

```json
POST /promotions/orgs/org_123/promotions
{
  "name": "Early Bird",
  "type": "discount",
  "discountType": "percentage",
  "discountValue": 15,
  "eventIds": ["evt_456"],
  "startsAt": "2025-06-01T12:00:00.000Z",
  "endsAt": "2025-07-01T23:59:59.000Z",
  "maxUses": 200
}
```

## Promo Codes

| Method | Path | Description |
| ------ | ---- | ----------- |
| `POST` | `/promotions/orgs/{orgId}/promo-codes` | Create a promo code linked to a promotion (`CreatePromoCodeDto`). |
| `GET` | `/promotions/orgs/{orgId}/promo-codes` | List codes; optional `promotionId` query parameter. |
| `PATCH` | `/promotions/orgs/{orgId}/promo-codes/{promoId}` | Update usage limits or active dates. |
| `DELETE` | `/promotions/orgs/{orgId}/promo-codes/{promoId}` | Delete a promo code. |

**Promo Code Response Structure**

```json
{
  "id": "code_1",
  "code": "EARLY15",
  "promotionId": "promo_1",
  "maxUses": 200,
  "startsAt": "2025-06-01T12:00:00.000Z",
  "endsAt": "2025-07-01T23:59:59.000Z",
  "redemptions": 45
}
```

The organizer dashboard can reuse these endpoints to manage discount strategies alongside the ticketing APIs documented in [tickets.md](./tickets.md). Holds and seat reservations are covered in the ticketing document.
