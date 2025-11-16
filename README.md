# Event Management Backend (NestJS + Prisma)

This repository will host an Eventbrite/Ticketmaster-like backend using NestJS, Prisma, PostgreSQL, Redis, Stripe, and Paystack.

## Stack
- Runtime: Node.js (LTS)
- Framework: NestJS
- ORM: Prisma
- DB: PostgreSQL
- Cache/Queue: Redis (BullMQ)
- Auth: JWT (email/password), access + refresh tokens
- Payments: Stripe + Paystack (NGN primary)

## Getting Started

1. Prerequisites
   - Node.js 20+
   - npm (or yarn/pnpm)
   - Docker + Docker Compose

2. Start infra (Postgres + Redis)
   ```bash
   docker compose up -d
   ```

3. Apply schema improvements
   - Connect to the Postgres container and run `migrations/001_schema_improvements.sql` (or use Prisma migrate once Prisma is initialized).

4. Environment
   - Copy `.env.example` to `.env` and fill in secrets (Stripe, Paystack, JWT).

5. Project scaffold (to be generated)
   - We'll initialize a NestJS project with modules:
     - Auth, Users, Orgs, Venues, Seatmaps, Events (Occurrences/Assets/Policies), Ticketing (Types/Holds/Tickets), Orders, Payments, Promotions, Payouts, Webhooks, Moderation, Audit
   - Prisma migration + client
   - BullMQ for holds expiry and background jobs

## Commands we will run (pending your approval)

> IMPORTANT: We will not run package manager commands until you confirm.

```bash
# 1) Scaffold NestJS
npm i -g @nestjs/cli
nest new api

# 2) Inside api/
cd api
npm i -E @nestjs/config @nestjs/jwt passport passport-jwt bcrypt
npm i -E @nestjs/terminus pino pino-pretty @nestjs/pino
npm i -E class-validator class-transformer
npm i -E stripe axios
npm i -E bullmq ioredis
npm i -D @types/bcrypt @types/passport-jwt @types/node ts-node ts-node-dev

# 3) Prisma
npm i -E prisma @prisma/client
npx prisma init --datasource-provider postgresql
# Set DATABASE_URL in .env, then either push empty schema or pull from DB
npx prisma db pull   # Generate Prisma schema from the existing DB
npx prisma generate
```

We’ll integrate Paystack using its REST API via axios (no extra SDK required). Stripe uses the official `stripe` SDK.

## Development workflow
- Migrations: Prefer Prisma Migrate after the initial import. For the provided SQL (tables.md + improvements), we’ll use `prisma db pull` to generate the Prisma schema.
- Testing: Jest + Supertest for integration tests (checkout, payments, ticket issuance).
- Jobs: BullMQ queues for holds expiry, webhook retries, payout scheduling.

## Next steps
- With your approval, we will:
  1. Initialize NestJS app and install dependencies.
  2. Initialize Prisma, import DB structure via `db pull`.
  3. Implement core vertical slice endpoints.
  4. Add seed scripts and tests.

---

If you prefer yarn or pnpm, let us know and we’ll adjust commands accordingly.

