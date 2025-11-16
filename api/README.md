# Event Management API

A comprehensive backend system for managing events, ticketing, organizations, and payments - similar to Eventbrite or Ticketmaster.

## Description

This is a production-ready event management platform built with NestJS, Prisma, PostgreSQL, and Redis. It provides a complete solution for event organizers to create, manage, and sell tickets for events.

## Features

- 🎫 **Event Management**: Create and manage events with multiple occurrences
- 🏢 **Multi-tenant Organizations**: Support for multiple organizations with role-based access
- 💳 **Payment Processing**: Integrated with Stripe and Paystack
- 🎟️ **Ticketing System**: Ticket types, price tiers, holds, and transfers
- 🪑 **Seatmap Management**: Define venue layouts and seat assignments
- 🎁 **Promotions**: Discount codes and promotional campaigns
- 📊 **Analytics**: Order statistics and reporting
- 🔐 **Authentication**: JWT-based auth with API keys support
- 🔔 **Webhooks**: Real-time event notifications
- 📝 **Moderation**: Content moderation and dispute management

## Tech Stack

- **Framework**: NestJS
- **Database**: PostgreSQL with Prisma ORM
- **Cache/Queue**: Redis with Bull
- **Authentication**: JWT with bcrypt
- **Payments**: Stripe & Paystack
- **Documentation**: Swagger/OpenAPI
- **Testing**: Jest

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+
- Redis 6+
- Docker and Docker Compose (optional, for running services)

### Installation

1. **Clone the repository**

```bash
git clone <repository-url>
cd api
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Required environment variables:

- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `JWT_SECRET`: Secret for JWT tokens
- `JWT_REFRESH_SECRET`: Secret for refresh tokens
- `STRIPE_SECRET_KEY`: Stripe API key
- `PAYSTACK_SECRET_KEY`: Paystack secret key used for API calls and webhook validation (required)
- `PAYSTACK_PUBLIC_KEY`: Paystack publishable key used on the frontend (optional but recommended)
- `PAYSTACK_WEBHOOK_SECRET`: Override secret for verifying Paystack webhooks (falls back to `PAYSTACK_SECRET_KEY`)

4. **Start PostgreSQL and Redis**

Using Docker Compose:

```bash
docker-compose up postgres redis -d
```

Or install and run them locally.

5. **Run database migrations**

```bash
# Push Prisma schema to database
npx prisma db push

# Apply schema improvements (triggers, functions)
psql $DATABASE_URL -f prisma/migrations/001_schema_improvements.sql
```

6. **Start the application**

```bash
# Development mode with hot reload
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

The API will be available at `http://localhost:3000`

## Documentation

- **API Documentation**: http://localhost:3000/api (Swagger/OpenAPI)
- **Comprehensive API Guide**: [API.md](./API.md)
- **Testing Guide**: [TESTING.md](./TESTING.md)
- **Deployment Guide**: [DEPLOYMENT.md](./DEPLOYMENT.md)

## Project Structure

```
api/
├── src/
│   ├── auth/              # Authentication & authorization
│   ├── organizations/     # Organization management
│   ├── events/            # Event management
│   ├── venues/            # Venue management
│   ├── seatmaps/          # Seatmap management
│   ├── ticketing/         # Ticket types, holds, price tiers
│   ├── orders/            # Order processing
│   ├── tickets/           # Ticket management & transfers
│   ├── promotions/        # Promotions & promo codes
│   ├── payments/          # Payment processing
│   ├── payouts/           # Payout management
│   ├── webhooks/          # Webhook management
│   ├── moderation/        # Content moderation
│   ├── common/            # Shared utilities
│   └── queue/             # Background jobs
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── migrations/        # SQL migrations
├── test/                  # E2E tests
└── docker-compose.yml     # Docker services
```

## Development

### Running Tests

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

### Database Management

```bash
# Generate Prisma client
npx prisma generate

# Push schema changes
npx prisma db push

# Open Prisma Studio
npx prisma studio

# Create migration
npx prisma migrate dev --name migration_name

# Seed sample data (organizer, venues, events)
npm run db:seed
```

The seed script provisions an organizer account (`organizer@eventflow.dev` / `Password123!` by default), a demo organization, venues across Lagos/Abuja/Accra, and several live events with ticket types so the homepage/feed endpoints have meaningful data. Override the default password by setting `SEED_USER_PASSWORD` before running the command.

### Code Quality

```bash
# Lint code
npm run lint

# Format code
npm run format
```

## API Usage Examples

### Authentication

```bash
# Register
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"Password123!","name":"John Doe"}'

# Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"Password123!"}'
```

### Create Organization

```bash
curl -X POST http://localhost:3000/organizations \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name":"My Organization","country":"Nigeria"}'
```

### Create Event

```bash
curl -X POST http://localhost:3000/events/org/<orgId> \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"title":"Tech Conference 2025","timezone":"Africa/Lagos","currency":"NGN"}'
```

See [API.md](./API.md) for complete API documentation.

## Environment Variables

| Variable                 | Description                  | Required | Default               |
| ------------------------ | ---------------------------- | -------- | --------------------- |
| `PORT`                   | Server port                  | No       | 3000                  |
| `DATABASE_URL`           | PostgreSQL connection string | Yes      | -                     |
| `REDIS_URL`              | Redis connection string      | Yes      | -                     |
| `JWT_SECRET`             | JWT access token secret      | Yes      | -                     |
| `JWT_REFRESH_SECRET`     | JWT refresh token secret     | Yes      | -                     |
| `JWT_EXPIRES_IN`         | Access token expiration      | No       | 15m                   |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token expiration     | No       | 7d                    |
| `STRIPE_SECRET_KEY`      | Stripe API key               | Yes      | -                     |
| `PAYSTACK_SECRET_KEY`    | Paystack secret key          | Yes      | -                     |
| `PAYSTACK_PUBLIC_KEY`    | Paystack publishable key     | No       | -                     |
| `PAYSTACK_WEBHOOK_SECRET` | Paystack webhook signing secret | No   | Uses secret key       |
| `FRONTEND_URL`           | Frontend URL for CORS        | No       | http://localhost:3000 |

## Paystack Integration

- Paystack transactions are initialized server-side and return an `authorizationUrl` and `reference` for the client to complete checkout.
- The backend exposes `POST /webhooks/paystack` for Paystack webhooks. Configure Paystack to send events to this endpoint and include the `x-paystack-signature` header. The service verifies the signature with `PAYSTACK_WEBHOOK_SECRET` (or `PAYSTACK_SECRET_KEY`) before reconciling order status.
- Ensure buyer profiles contain a valid email address—Paystack requires this during initialization.

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions including:

- Docker deployment
- SSL configuration
- Monitoring setup
- Backup strategies
- Scaling guidelines

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.
