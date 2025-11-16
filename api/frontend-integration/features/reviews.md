# Feature: Event & Organization Reviews

This guide describes the frontend responsibilities for collecting, displaying, and managing reviews for both events and organizers.

## Experience Overview

- **Event reviews** let verified attendees share feedback about a specific event. Endpoints live under `/events/:eventId/reviews`.
- **Organization reviews** capture broader sentiment about an organizer. Endpoints live under `/organizations/:orgId/reviews`.
- Ratings are integers from 1 to 5. Comments are optional but capped at 1000 characters.
- Users may submit **only one review** per event or organization, but they can edit or delete it afterwards.
- Creation requires authentication and a qualifying ticket history (the API rejects users without a non-refunded, non-void ticket).

## API Integration Checklist

| Capability | Endpoint | Notes |
| --- | --- | --- |
| Create | `POST /events/:eventId/reviews`<br>`POST /organizations/:orgId/reviews` | Auth required. Validate the user has not already reviewed. Surface server errors for ineligible users. |
| Update | `PATCH /events/:eventId/reviews/:reviewId`<br>`PATCH /organizations/:orgId/reviews/:reviewId` | Send only changed fields. Optimistically update UI, but rollback on failure. |
| Delete | `DELETE /events/:eventId/reviews/:reviewId`<br>`DELETE /organizations/:orgId/reviews/:reviewId` | Replace review UI with a call-to-action prompting the user to review again. |
| List | `GET /events/:eventId/reviews`<br>`GET /organizations/:orgId/reviews` | Supports pagination via `page` (1-based) and `limit` (max 100). The response includes `{ data, meta }`. |
| Summary | `GET /events/:eventId/reviews/summary`<br>`GET /organizations/:orgId/reviews/summary` | Returns `{ averageRating: number, reviewCount: number }`. Cache aggressively for list views. |

### Error Cases to Handle

- `409` when attempting to create a duplicate review — prompt the user to edit instead.
- `403` when the user lacks a qualifying ticket — explain the attendance requirement.
- `404` when the review ID no longer exists — refresh the list and summary.
- Validation errors (400) for rating range or comment length — surface inline next to the form fields.

## Types

```typescript
export interface Review {
  id: string;
  rating: number; // 1-5 inclusive
  comment?: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
  eventId?: string;
  orgId?: string;
}

export interface ReviewMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ReviewListResponse {
  data: Review[];
  meta: ReviewMeta;
}

export interface ReviewSummary {
  averageRating: number;
  reviewCount: number;
}
```

Extend `Review` with additional presenter fields (e.g., formatted timestamps, derived stars) in selectors rather than altering the transport shape.

## Services

Create domain-specific services for events and organizations. Both share the same shape, so consider extracting a helper.

```typescript
class ReviewService {
  constructor(private readonly resource: 'events' | 'organizations') {}

  private base(id: string) {
    return `/${this.resource}/${id}/reviews`;
  }

  async create(id: string, payload: Pick<Review, 'rating' | 'comment'>, token: string) {
    return apiClient.post<Review>(this.base(id), payload, token);
  }

  async update(id: string, reviewId: string, payload: Partial<Pick<Review, 'rating' | 'comment'>>, token: string) {
    return apiClient.patch<Review>(`${this.base(id)}/${reviewId}`, payload, token);
  }

  async remove(id: string, reviewId: string, token: string) {
    return apiClient.delete<void>(`${this.base(id)}/${reviewId}`, token);
  }

  async list(id: string, query: { page?: number; limit?: number } = {}) {
    return apiClient.get<ReviewListResponse>(this.base(id), { params: query });
  }

  async summary(id: string) {
    return apiClient.get<ReviewSummary>(`${this.base(id)}/summary`);
  }
}

export const eventReviewService = new ReviewService('events');
export const organizationReviewService = new ReviewService('organizations');
```

Key implementation notes:

- Inject auth tokens explicitly; anonymous calls should still work for `list` and `summary` requests.
- Respect the backend pagination defaults. When requesting additional pages, merge `data` arrays while updating `meta`.
- Debounce or throttle repeated summary refetches (e.g., `staleTime` of 60s in React Query).

## State & Caching Patterns

- **React Query**: use separate keys such as `['eventReviews', eventId, page, limit]` and `['eventReviewSummary', eventId]`. Invalidate the list and summary after create/update/delete.
- **Optimistic updates**: after submitting a review, update the cached list entry and summary with the new rating before awaiting the server. Roll back on error.
- **Editing**: maintain local form state seeded from the user’s existing review (fetch by scanning the first page result or storing the review ID in session state).
- **Pagination**: support infinite scrolling or classic pagination. Always append new pages instead of replacing the list to avoid jarring UI resets.

## UI Patterns

- **Event Detail Page**
  - Show the summary (average rating, count) near the hero section.
  - Provide a “Write a Review” button for eligible attendees; disable with tooltip otherwise.
  - Display the user’s own review pinned to the top with edit/delete controls.
  - Render remaining reviews sorted by `createdAt` desc.

- **Organization Profile**
  - Mirror the event layout but reference organization IDs.
  - Highlight the organization rating alongside follower counts.

- **Forms**
  - Use a star-rating input bound to the integer scale.
  - Validate comment length client-side (max 1000).
  - Show submission progress indicators; disable submit while pending.

- **Empty States**
  - Summary: “No reviews yet” with a neutral illustration.
  - List: if the user is eligible, encourage them to be the first reviewer.

## Accessibility & Internationalization

- Ensure rating inputs are keyboard accessible (e.g., radio group styled as stars).
- Announce validation errors via `aria-live` regions.
- Localize review counts and timestamps. Use `Intl.NumberFormat` and `Intl.DateTimeFormat`.

## QA Checklist

- Verify summary metrics update after creating, editing, and deleting a review.
- Confirm duplicate creation attempts surface an actionable error.
- Ensure unauthorized users see appropriate messaging and are redirected to login when necessary.
- Test pagination with `limit=5` to ensure navigation controls work.
- Validate long comments truncate gracefully in cards with `title` tooltips for full text.

## Future Enhancements

- Pull review totals into organizer/event cards in grids for quick scanning.
- Support reactions or helpful votes on reviews.
- Aggregate keyword highlights (e.g., “mentions sound quality”).

