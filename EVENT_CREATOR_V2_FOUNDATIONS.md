# Event Creator v2 â€“ Foundations

Last updated: 2025-11-13 by Codex  
Status: Phaseâ€¯1 (requirements + architecture) complete

## 1. Objectives & Constraints
- **Primary goal:** help organizers reach a publishable event in minutes while still supporting complex scenarios (recurrence, multi-ticket, taxes/fees, roles).
- **Experience principles:** progressive disclosure, always-on autosave, inline guardrails, high-speed defaults/templates.
- **Hard requirements:** fresh implementation (no reuse of `wizard` components/tables), draft-first workflow with instant preview, modal-based entry (event type, organization, timezone, template).

## 2. Scope & Assumptions
- Backend is NestJS + Prisma (PostgreSQL). We will add a new module `event-creator-v2` and new tables; legacy wizard tables and routes have been removed.
- Frontend is Next.js/React (app router). New UI lives under `frontend/web-app/app/organizer/events/create-v2` with its own component tree + hooks. Legacy creator keeps functioning behind a feature flag until rollout completes.
- Storage for media uses existing asset pipeline (signed URLs) but new uploader components will wrap it.

## 3. Architecture Overview
```
Create Modal â†’ Draft Creation API â†’ CreatorV2Shell
                      â”‚
            Draft Sections Service
      (basics, story, tickets, schedule, checkout)
                      â”‚
            Autosave + Versioning service
                      â”‚
                Preview Renderer
                      â”‚
                Publish Service
```
- Each tab submits partial updates to the backend via React Query mutations.
- Autosave pipeline debounces input (1â€“2â€¯s), shows â€œSaved hh:mm:ssâ€, and stores snapshots for version history.
- Preview uses draft snapshot data rendered via the same components as public event pages but in a protected route (`/events/:id/preview?draft=...`).

## 4. Data Model Additions

| Table | Purpose | Key Columns / Notes |
| --- | --- | --- |
| `event_creator_drafts` | Master draft record per organizer/org | `id`, `eventId?`, `organizationId`, `ownerUserId`, `status` (`draft`,`ready`,`scheduled`,`published`), `eventType`, `timezone`, `visibility`, `currentStep`, timestamps |
| `event_creator_draft_sections` | Track section payload + validation state | `draftId`, `section` enum (`basics`,`story`,`tickets`,`schedule`,`checkout`), `payload` JSONB, `status` (`incomplete`,`valid`,`blocked`), `errors` JSONB |
| `event_creator_draft_versions` | Snapshot history for restore/versioning | `draftId`, `section`, `payload`, `createdBy`, `createdAt`, `reason` |
| `event_creator_templates` | Org-scoped templates selectable in modal | `id`, `organizationId`, `name`, `description`, `coverImage`, `sections` JSONB, `isDefault` |
| `event_creator_template_access` | Share templates across org members | `templateId`, `userId`/`role`, permissions |
| `draft_schedule_rules` | Handles recurrence definitions | `draftId`, `ruleType` (`single`,`multi_day`,`rrule`), `rrule`, `exceptions` JSONB |
| `draft_schedule_occurrences` | Materialized occurrences for overrides | `draftScheduleRuleId`, `startsAt`, `endsAt`, `capacityOverride`, `doorTime`, `venueOverrideId` |
| `draft_venues` | Draft-specific venue/location info | `draftId`, `mode` (`in_person`,`online`,`hybrid`), `placeId`, `address`, `onlineUrl`, `instructions`, `mapSnapshot` |
| `draft_ticket_types_v2` | Ticket builder data (free/paid/donation/hidden/hold) | `draftId`, `kind`, `name`, `description`, `priceCents`, `feeMode`, `quantity`, `salesWindow`, `visibility`, `perOrderMin/Max`, metadata |
| `draft_ticket_addons` | Bundles/add-ons/perks | `draftTicketTypeId`, `name`, `price`, `quantity` |
| `draft_taxes_fees` | Config per region | `draftId`, `region`, `taxType`, `rate`, `absorbFees` |
| `draft_promo_codes` | Promo/access code definitions | `draftId`, `code`, `discountType`, `amount`, `usageLimit`, `appliesTo` |
| `draft_checkout_form_fields` | Custom attendee/question builder | `draftId`, `fieldKey`, `fieldType`, `question`, `required`, `appliesTo` |
| `draft_collaborators` | Role-based access (owner/editor/finance/check-in) | `draftId`, `userId`, `role`, `permissions` |

> Implementation note: use Prisma `Json` columns for flexible blocks but keep denormalized fields (title, start date) on `event_creator_drafts` for listing/search.

## 5. API Surface (Draft)

| Method & Path | Description |
| --- | --- |
| `POST /creator-v2/drafts` | Called from create modal. Payload: `{organizationId, eventType, timezone, templateId?, sourceEventId?}`. Returns draft ID + prefilled sections. |
| `GET /creator-v2/drafts` | List user-accessible drafts with completion percent and last updated time. |
| `GET /creator-v2/drafts/:id` | Fetch draft with section statuses, used to hydrate shell. |
| `PUT /creator-v2/drafts/:id/basics` | Update basics payload, run validation, update status. Similar endpoints for `story`, `tickets`, `schedule`, `checkout`. |
| `POST /creator-v2/drafts/:id/autosave` | Optional hook if we decide to batch updates; otherwise use section PUT with `autosave=true`. |
| `POST /creator-v2/drafts/:id/preview` | Generate/refresh preview token + URL (signed, expires). |
| `POST /creator-v2/drafts/:id/publish` | Final validation across sections, create Event + Tickets + Schedules, update status. Supports immediate or scheduled publish. |
| `POST /creator-v2/drafts/:id/duplicate` | Clone existing event/draft into new draft. |
| `POST /creator-v2/templates` & CRUD | Manage org templates. |
| `POST /creator-v2/drafts/:id/version` | Capture snapshot manually (auto created on significant changes). |
| `POST /creator-v2/drafts/:id/restore` | Restore a snapshot to current sections. |

Permissions enforced via middleware that checks `draft_collaborators` + organization roles.

## 6. Frontend Architecture
- **Create Modal** (`components/creator-v2/create-modal/`): multi-step modal with event type, organization, timezone, template/duplicate picker. Submits to `POST /creator-v2/drafts`, then redirects to `/organizer/events/create-v2/:draftId`.
- **Creator Shell** (`components/creator-v2/shell/`):
  - Top tab nav (Basics, Story, Tickets & Pricing, Schedule & Venue, Checkout & Audience, Preview & Publish) with completion badges + error dots.
  - Header: event title inline edit, autosave indicator, preview button, shortcuts helper.
  - Footer: Back/Next, publish state, error summary.
  - Context provider handles current draft, section mutation hooks, analytics events.
- **Section Packages** (`components/creator-v2/sections/*`), each with:
  - Zod schema + React Hook Form.
  - Autosave hook with optimistic update and error display.
  - Progressive disclosure toggles for advanced settings.

## 7. Migration & Rollout Strategy
1. Feature flag `creator_v2` (backend + frontend). Gate new modal/route.
2. Keep legacy creator accessible via fallback route `/organizer/events/create`.
3. Provide migration script to copy active drafts from legacy tables into new schema (limited fields) for pilot users if needed.
4. Pilot with internal/staff â†’ small organizer cohort â†’ 100%. Monitor KPIs (draft-to-publish conversion, average completion time, autosave failure rate).
5. Once stable, sunset old wizard, remove routes, archive tables after data retention review.

## 8. Next Actions (Phaseâ€¯2+)
1. Scaffold NestJS module `event-creator-v2` with controllers/services/DTOs.
2. Extend Prisma schema with tables above + generate migration.
3. Build `POST /creator-v2/drafts` + list/get endpoints to unblock frontend modal work.
4. Create Next.js route + modal skeleton that hits new API and loads new shell.

This document completes Phaseâ€¯1: requirements captured, architecture defined, data/APIs planned. Phaseâ€¯2 will focus on backend schema and endpoint scaffolding.

