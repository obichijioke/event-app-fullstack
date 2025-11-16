# Homepage Aggregation API (GET `/homepage`)

**Last updated:** 2025-10-24  
**Audience:** Frontend engineers implementing the landing page

The backend exposes a single endpoint that assembles every tray required for the Eventbrite/Ticketmaster-style homepage. Calling this endpoint once per request keeps the UI, filters, hero, and organizer modules in sync.

---

## 1. Request Contract

```
GET {API_BASE_URL}/homepage
```

| Query Param | Type / Example | Purpose |
|-------------|----------------|---------|
| `city` | `string` (`?city=Lagos`) | Biases hero copy and section ordering toward a metro. |
| `category` | `string` (`?category=music`) | Prefers events/categories for that slug; used by quick-filter pills. |
| `timeframe` | `'today' \| 'weekend' \| 'upcoming'` | Constrains `startAt` windows (today, next weekend, next 30 days). |
| `segment` | `string` (`?segment=family`) | Future use for audience tagging; safe to omit. |

Authentication: optional. Signed-in requests (Bearer token) unlock personalized sections (`for-you`, organizer recommendations, etc.). Anonymous users still receive hero/trending/category trays.

Revalidation: 60 seconds (server caches results in Redis). The frontend can rely on ISR/SWR or standard fetch caching.

---

## 2. Response Shape (TypeScript)

See `frontend/web-app/lib/homepage.ts` for the exact types. Key interfaces:

```ts
interface HomepageResponse {
  hero: HomepageHero | null;
  filters: HomepageFilters;
  sections: HomepageSection[];
  organizers: OrganizerSummary[];
  generatedAt: string;
  cache: { key: string; ttlSeconds: number; hit: boolean };
}
```

### 2.1 Hero (`HomepageHero`)
- `headline`, `subheading`: copy to render inside the hero slab.
- `featured`: array of `EventSummary` cards for the hero grid.
- `backgroundImage`: optional full-bleed asset; fall back to gradient if null.

### 2.2 Filters (`HomepageFilters`)
- `categories`: top-level category summaries for pills.
- `timeframes`: array of `{ id: 'today' | 'weekend' | 'upcoming'; label: string }`.
- `selected`: normalized current filters ({ city, category, timeframe }).

### 2.3 Sections (`HomepageSection`)
- `id`: unique key (e.g., `trending`, `category-music`, `flash-sales`, `seatmap-showcase`, `for-you`).
- `title`, `subtitle`: render above the section.
- `layout`: `'carousel' | 'grid' | 'marquee'`; drives component choice.
- `items`: `EventSummary[]` with pricing badges, seatmap flags, etc.
- `cta`: optional `{ label, href }` for “See all” buttons.

### 2.4 Organizers (`OrganizerSummary`)
- Basic profile data + `followerCount`.
- `upcomingEvents`: small list for preview cards.

### 2.5 EventSummary Highlights
- `pricing.label`: already formatted (“From ₦25,000”). Use directly.
- `seatmap.hasSeatmap` / `seatmap.isSeated`: show “Interactive seating” badges.
- `stats.isLowInventory`: display urgency chip.
- `promo`: optional highlight (“20% off”, “Exclusive access”).
- `assets`: lightweight gallery; use first image when `coverImageUrl` missing.

---

## 3. Frontend Usage Patterns

1. **Fetch once per request** in `app/page.tsx` via `fetchHomepageData()` (server-only helper). Pass normalized `searchParams` to mirror the backend filters.
2. **Hero**: supply `hero` data to `HomepageHero`. Use fallback copy when `hero === null`.
3. **Filters Bar**: pass `homepage.filters` to `HomepageFiltersBar`. The component builds URLs using the selected filters so clicking pills re-requests `/homepage` with new query params.
4. **Sections**: iterate over `homepage.sections`. The existing `HomepageSectionBlock` handles layout differences (grid vs. carousel).
5. **Organizer Grid**: render `OrganizersGrid` when `homepage.organizers` is non-empty; otherwise omit.
6. **Empty State**: if `sections` is empty, show the built-in placeholder (already handled in `app/page.tsx`).

---

## 4. Error Handling

`fetchHomepageData` already wraps the fetch in `try/catch`:
- On failure, it returns a default response with empty arrays so the UI can safely render skeleton states.
- It logs the error server-side for observability.

Ensure any client-specific logic (e.g., deferred data) checks for `sections.length === 0` before rendering carousels.

---

## 5. Example Request / Response

**Request**
```
GET /homepage?city=Lagos&category=music&timeframe=weekend
Authorization: Bearer <token> (optional)
```

**Response (abridged)**
```json
{
  "hero": {
    "headline": "Events lighting up Lagos",
    "subheading": "3 picks for this weekend",
    "featured": [{ "id": "evt_1", "title": "...", "pricing": { "label": "From ₦15,000" } }],
    "backgroundImage": "https://cdn.example.com/hero.jpg"
  },
  "filters": {
    "categories": [{ "id": "cat_1", "name": "Music", "slug": "music" }],
    "timeframes": [{ "id": "weekend", "label": "This weekend" }],
    "selected": { "category": "music", "timeframe": "weekend", "city": "Lagos" }
  },
  "sections": [
    {
      "id": "trending",
      "title": "Trending in Lagos",
      "layout": "carousel",
      "items": [{ "id": "evt_1", "title": "...", "seatmap": { "hasSeatmap": true, "isSeated": true } }],
      "cta": { "label": "See all trending events", "href": "/events?sort=trending" }
    }
  ],
  "organizers": [{ "id": "org_7", "name": "King Street Live", "followerCount": 2410, "upcomingEvents": [...] }],
  "generatedAt": "2025-10-24T19:52:00.123Z",
  "cache": { "key": "homepage:city:lagos:category:music:timeframe:weekend:segment:all:radius:100:user:anon", "ttlSeconds": 60, "hit": false }
}
```

---

## 6. Styling & Components

- Use the design system tokens described in `DESIGN_SYSTEM.md`.
- The homepage components (`components/homepage/*`) abstract most markup; extend them instead of rebuilding from scratch.
- Buttons inside hero/sections/organizers should use `buttonVariants` to stay consistent (avoid `Button asChild` due to Next.js 16/Slot limitations).

---

## 7. Troubleshooting

- **Promise-based `searchParams`** (Next.js ≥15): always `await` before passing to `fetchHomepageData`.
- **React.Children.only** errors: don’t wrap Next `<Link>` in Slot-based components (`Button asChild`). Use anchors styled with variants.
- **Cache mismatch**: check `response.cache.key` to verify which variant was returned; mismatches usually mean the frontend forgot to include a query param.

---

## 8. Future Enhancements

- Add client-side revalidation (SWR) for lightweight filter changes.
- Introduce skeleton loaders per section using the `Skeleton` UI component.
- Surface `cache.hit` telemetry to datadog/logging for monitoring.

For backend context, see `api/src/homepage/homepage.service.ts` and `FRONTEND_INTEGRATION.md` (Homepage section). Feel free to extend this document as new homepage features ship.
