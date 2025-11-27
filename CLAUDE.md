# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an event management platform backend built with NestJS, similar to Eventbrite/Ticketmaster. The system supports multi-tenant organizations, event creation, ticketing, payments (Stripe/Paystack), and comprehensive order management.

## Development Commands

### Essential Commands
```bash
# Development
cd api
npm run start:dev          # Start in watch mode
npm run start:debug        # Start with debug mode

# Build & Production
npm run build              # Build the application
npm run start:prod         # Start production build

# Code Quality
npm run lint               # Run ESLint with auto-fix
npm run format             # Format code with Prettier
npm run test               # Run unit tests
npm run test:watch         # Run tests in watch mode
npm run test:cov           # Run tests with coverage
npm run test:e2e           # Run end-to-end tests

# Database
npx prisma db pull         # Pull schema from database
npx prisma generate        # Generate Prisma client
npx prisma db push         # Push schema changes to database
npx prisma migrate dev     # Create and apply migration
npx prisma migrate deploy  # Apply migrations in production
npx prisma studio          # Open Prisma Studio GUI
npm run db:seed            # Seed database with sample data
```

### Infrastructure Setup
```bash
# Start PostgreSQL and Redis
docker compose up -d

# Verify services are running
docker compose ps

# Stop services
docker compose down

# View logs
docker compose logs -f postgres
docker compose logs -f redis
```

## Architecture Overview

### Key Features
- **Multi-tenant SaaS**: Organization-based isolation with role-based access control
- **Event Management**: Complete event lifecycle from draft to completion
- **Ticketing System**: GA and seated tickets with advanced pricing tiers
- **Payment Processing**: Dual payment providers (Stripe + Paystack) with webhook handling
- **Order Management**: Full order lifecycle with refunds, disputes, and chargebacks
- **Creator Interface**: Multi-step event creation with autosave and templates
- **Verification System**: Document upload and review for organization verification
- **Review System**: Separate reviews for events and organizers
- **Notification System**: Multi-channel notifications (in-app, email, push, SMS)
- **Analytics**: Creator usage analytics and audit logging
- **File Storage**: AWS S3 integration for document and media storage
- **Background Jobs**: Queue-based processing for async operations
- **Health Monitoring**: Health check endpoints for system monitoring

### Core Module Structure
- **auth/** - JWT authentication, API keys, session management (see [SESSION_MANAGEMENT.md](api/SESSION_MANAGEMENT.md) for details)
- **organizations/** - Multi-tenant organization management with role-based permissions, verification documents, and appeals
- **organizer/** - Organizer-specific functionality and dashboard operations
- **events/** - Event management with occurrences, assets, policies, and seatmaps
- **ticketing/** - Ticket types, price tiers, holds, and inventory management
- **orders/** - Order processing, payment integration, and lifecycle management
- **tickets/** - Ticket generation, transfers, check-ins, and QR codes
- **promotions/** - Promo codes with various discount types and redemption tracking
- **venues/** & **seatmaps/** - Venue management and seating arrangements
- **webhooks/** - Event-driven integrations with retry logic
- **queues/** - Background job processing (BullMQ + Redis)
- **homepage/** - Public homepage API with featured events and categories
- **reviews/** - Event reviews and organizer ratings system
- **creator-v2/** - Step-by-step event creation wizard with autosave and templates
- **categories/** - Event categorization and taxonomy
- **admin/** - Platform administration endpoints
- **moderation/** - Content moderation and flagging system
- **payouts/** - Organizer payout management
- **common/** - Shared utilities, guards, decorators, and pipes
- **health/** - Health check endpoints for monitoring

### Key Dependencies
- **Framework**: NestJS 11 with Express
- **Database**: PostgreSQL with Prisma ORM 6.18.0
- **Cache/Queue**: Redis with BullMQ 5.61.0 and IORedis 5.8.2
- **Payments**: Stripe 19.1.0 (international) + Paystack (Africa-focused)
- **Authentication**: JWT with Passport (passport-jwt 4.0.1, bcrypt 6.0.0)
- **Validation**: class-validator 0.14.2 + class-transformer 0.5.1
- **Documentation**: Swagger/OpenAPI (@nestjs/swagger 11.2.1)
- **Logging**: Pino 10.1.0 with pino-pretty 13.1.2
- **Scheduling**: @nestjs/schedule 6.0.1
- **Health Checks**: @nestjs/terminus 11.0.0
- **File Storage**: AWS S3 SDK 3.919.0 with presigned URLs
- **HTTP Client**: Axios 1.12.2

### Multi-Tenancy Pattern
The system uses organization-based multi-tenancy where:
- All business resources (events, venues, tickets) belong to an organization
- Organization membership controls access with roles: owner, manager, finance, staff
- Database queries are filtered by organization ID
- Services verify membership before operations
- **Organization Types**: business, personal, nonprofit, government
  - **Personal organizations**: Auto-approved for individual event creators, simplified requirements
  - **Business organizations**: Require verification documents and admin approval
  - **Nonprofit/Government**: Require additional verification and documentation

### Organization Verification System
Organizations go through a verification process with multiple statuses and type-specific requirements:
- **Statuses**: pending, submitted, under_review, approved, rejected, suspended, banned
- **Organization Types**:
  - **Personal**: Auto-approved, ideal for individuals hosting small/local events
  - **Business**: Requires full verification with documentation
  - **Nonprofit/Government**: Enhanced verification requirements
- **Document Types**: business_license, tax_id, bank_statement, identity_proof, address_proof, incorporation_docs
- **Verification Flow**:
  1. Personal organizations: Auto-approved with moderate trust score (50)
  2. Business organizations: Submit verification documents (stored in S3 or local storage)
  3. Admin reviews documents and approves/rejects
  4. Rejected organizations can submit appeals with additional information
  5. Trust score calculation based on verification status and history
- **Document Management**: Files stored with original name, MIME type, file size tracking
- **Appeal System**: Organizations can appeal rejections with detailed reasoning
- **Simplified Onboarding**: Users without organizations can automatically create personal organizations

### Event Creation Creator
Multi-step wizard for creating events with comprehensive features:
- **Steps**: basic_info, date_time, location, seating, ticket_types, price_tiers, policies, media, review
- **Session Management**: Tracks current step, status (in_progress, completed, abandoned, published)
- **Auto-save**: Automatic saving of progress with snapshot data
- **Draft Management**: Draft ticket types, price tiers, assets, and policies stored separately
- **Step Validation**: Track completion status, validation errors, and time spent per step
- **Templates**: Pre-built templates for common event types (concerts, conferences, sports)
- **Analytics**: Track user behavior, step transitions, and validation errors
- **Resume Capability**: Users can abandon and resume wizard sessions later

### Database Schema Highlights
- **Complex relationships**: User â†’ Organization â†’ Events â†’ Tickets with proper foreign keys
- **Audit trails**: AuditLog tracks all significant actions
- **Soft deletes**: Many entities use deletedAt for data retention
- **Optimistic concurrency**: updatedAt timestamps for conflict resolution
- **Indexed queries**: Performance indexes on frequently queried fields
- **New models added**:
  - **UserFollow**: User following organizations
  - **VerificationDocument**: Organization verification documents with S3 storage
  - **OrganizationAppeal**: Appeals for rejected organizations
  - **CreatorDraft**: Multi-step event creation with autosave
  - **CreatorStepCompletion**: Track wizard progress and validation
  - **DraftTicketType** & **DraftPriceTier**: Draft ticket types during event creation
  - **DraftAsset** & **DraftPolicies**: Draft assets and policies for events
  - **CreatorAutoSave**: Automatic saving of wizard progress
  - **CreatorAnalytics**: Analytics tracking for wizard usage
  - **CreatorTemplate**: Pre-built templates for common event types
  - **EventReview** & **OrganizerReview**: Separate reviews for events and organizers
  - **Notification**: In-app, email, push, and SMS notifications

### Payment Flow
1. Create order (status: pending) with inventory holds
2. Generate payment intent with Stripe/Paystack
3. Client confirms payment on frontend
4. Webhook receives payment confirmation
5. Order status updated to paid, tickets generated
6. Inventory holds released, tickets sent to buyer

### Background Jobs
- **Hold expiration**: Release expired ticket reservations
- **Email notifications**: Order confirmations, ticket transfers
- **Webhook delivery**: Event notifications with exponential backoff and retry logic
- **Payment reconciliation**: Match provider payments with orders
- **Creator cleanup**: Abandon inactive wizard sessions after timeout
- **Notification delivery**: Send notifications via email, push, SMS, or in-app

### Notification System
Multi-channel notification system with comprehensive features:
- **Types**: info, success, warning, error
- **Channels**: in_app, email, push, sms
- **Features**:
  - Track read/unread status per user
  - Store structured data payload for rich notifications
  - Support multiple delivery channels simultaneously
  - Indexed queries for efficient retrieval
  - Timestamp tracking (createdAt, updatedAt, readAt)

### Environment Configuration
- Copy `.env.example` to `.env`
- **Required**:
  - DATABASE_URL: PostgreSQL connection string
  - REDIS_URL: Redis connection string
  - JWT_SECRET: Secret key for JWT token signing
  - JWT_REFRESH_SECRET: Secret key for refresh tokens
- **Payment Providers**:
  - STRIPE_SECRET_KEY & STRIPE_WEBHOOK_SECRET
  - PAYSTACK_SECRET_KEY & PAYSTACK_WEBHOOK_SECRET
- **Application**:
  - PORT: Server port (default: 3000)
  - NODE_ENV: Environment mode (development/production)
- **File Upload**:
  - UPLOAD_DIR: Local upload directory (default: ./uploads)
  - MAX_FILE_SIZE: Maximum file size in bytes (default: 10MB)
- **Email (Optional)**:
  - EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS

### Testing Strategy
- **Unit tests**: Jest for service logic and utilities
- **Integration tests**: Supertest for API endpoints
- **E2E tests**: Full payment and ticketing workflows
- Database is reset between test suites

## Frontend Application

### Web Application (Next.js)
Located in `frontend/web-app/`, this is a modern Next.js 15+ application built with:

#### Tech Stack
- **Framework**: Next.js 16.0.0 with App Router (using --webpack flag)
- **UI Framework**: React 19.2.0
- **Styling**: TailwindCSS v4 with custom design system
- **Components**: Radix UI primitives (@radix-ui/react-slot 1.2.3)
- **TypeScript**: Full type safety throughout
- **Form Handling**: React Hook Form 7.65.0 with Zod 4.1.12 validation
- **State Management**: Zustand 5.0.8
- **Animations**: Framer Motion 12.23.24
- **Icons**: Lucide React 0.548.0
- **Charts**: Recharts 3.3.0
- **Date Handling**: date-fns 4.1.0 with react-datepicker 8.8.0
- **Notifications**: React Hot Toast 2.6.0
- **Styling Utilities**: clsx 2.1.1, tailwind-merge 3.3.1, class-variance-authority 0.7.1

#### Frontend Commands
```bash
# Navigate to frontend
cd frontend/web-app

# Development
npm run dev              # Start dev server on localhost:3000 (uses --webpack flag)

# Build & Production
npm run build            # Build for production (uses --webpack flag)
npm run start            # Start production server

# Code Quality
npm run lint             # Run ESLint

# Note: Commands use --webpack flag for Next.js compatibility
```

#### Design System
The application follows a flat, minimal design with:
- **Primary Colors**: Blue (#1e40af), Purple (#7c3aed), Amber (#f59e0b)
- **Border-based design**: No shadows or glassmorphism
- **Professional aesthetic**: Suitable for financial transactions
- **High contrast**: AAA accessibility compliance
- **Responsive design**: Mobile-first with comprehensive breakpoints

#### Route Structure
Complete route structure with 92+ pages:
- **Public routes**: Event browsing, search, organizer profiles
- **Authentication**: Login, register, email verification, 2FA
- **User account**: Orders, tickets, transfers, profile management
- **Organizer dashboard**: Event management, analytics, payouts
- **Admin panel**: User/org management, platform configuration
- **Moderator tools**: Content moderation, flag management

#### Environment Setup
```bash
# Copy environment template
cp .env.example .env

# Required variables:
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

#### Integration with Backend
- API calls to NestJS backend at `/api/*` endpoints
- Authentication via JWT tokens
- Payment integration with Stripe/Paystack
- Real-time updates via WebSocket (planned)

### Mobile Application
Currently planned in `frontend/mobile/` (empty directory) - likely React Native or Flutter implementation.

### Simplified User Onboarding

The platform supports individual event creators without requiring business verification:

#### For Users Without Organizations
1. **Automatic Organization Creation**:
   - Call `GET /organizations/default` to get or create a personal organization
   - If user has no organization, a personal one is automatically created
   - Organization name defaults to "{User Name}'s Events" or "My Events"

2. **Manual Personal Organization**:
   - Call `POST /organizations/personal` with minimal data (name, optional country)
   - Personal organizations are auto-approved and verified
   - Ideal for individuals hosting community events, workshops, or small gatherings

3. **Event Creation Flow**:
   ```
   User signup â†’ Login â†’ GET /organizations/default â†’ Create event with orgId
   ```

#### Organization Type Characteristics
- **Personal Organizations**:
  - Auto-approved status
  - Trust score: 50 (moderate)
  - No verification documents required
  - Suitable for small-scale events
  - Can upgrade to business later

- **Business Organizations**:
  - Manual approval required
  - Must submit verification documents
  - Higher trust score potential
  - Required for large-scale commercial events

### Development Workflow
1. **Schema changes**: Update Prisma schema â†’ `npx prisma db push` â†’ `npx prisma generate`
2. **API changes**: Update DTOs, controllers, services â†’ run tests â†’ update documentation
3. **Frontend development**: Update types, components, pages â†’ test in browser
4. **Queue jobs**: Test job processing locally with Redis
5. **Payments**: Use Stripe/Paystack test keys for development
6. **Full-stack testing**: Run both backend (`npm run start:dev`) and frontend (`npm run dev`) simultaneously

### Project Structure
```
event-app-comprehensive/backend/
â”œâ”€â”€ api/                    # NestJS backend application
â”‚   â”œâ”€â”€ src/               # Source code (modules, controllers, services)
â”‚   â”œâ”€â”€ prisma/            # Prisma schema, migrations, and seed scripts
â”‚   â”œâ”€â”€ test/              # E2E tests
â”‚   â””â”€â”€ uploads/           # File uploads directory
â”œâ”€â”€ frontend/
â”‚   â”œâ”€â”€ web-app/           # Next.js frontend application
â”‚   â””â”€â”€ mobile/            # (Planned) Mobile app
â”œâ”€â”€ docker-compose.yml     # PostgreSQL + Redis services
â”œâ”€â”€ tables.md              # Database schema documentation
â””â”€â”€ 001_schema_improvements.sql  # Schema enhancement scripts
```

### Initial Setup Steps
1. Clone repository and navigate to backend directory
2. Start infrastructure: `docker compose up -d`
3. Navigate to api directory: `cd api`
4. Install dependencies: `npm install`
5. Copy environment file: `cp .env.example .env` and configure
6. Generate Prisma client: `npx prisma generate`
7. Run database seed: `npm run db:seed`
8. Start backend: `npm run start:dev`
9. (Optional) Navigate to frontend: `cd ../frontend/web-app`
10. (Optional) Install frontend deps: `npm install`
11. (Optional) Start frontend: `npm run dev`

### Service Ports
- **Backend API**: http://localhost:3000
- **Frontend**: http://localhost:3000 (note: both use same port, run separately or configure)
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379
- **Prisma Studio**: http://localhost:5555 (when running `npx prisma studio`)

### API Enumerations

The system uses comprehensive enumerations for type safety:
- **Platform Roles**: attendee, organizer, moderator, admin
- **Organization Types**: business, personal, nonprofit, government
- **Organization Roles**: owner, manager, finance, staff
- **Organization Status**: pending, submitted, under_review, approved, rejected, suspended, banned
- **Event Status**: draft, pending, approved, live, paused, ended, canceled
- **Event Visibility**: public, unlisted, private
- **Ticket Types**: GA (General Admission), SEATED
- **Order Status**: pending, paid, canceled, refunded, chargeback
- **Ticket Status**: issued, transferred, refunded, checked_in, void
- **Hold Reason**: checkout, reservation, organizer_hold
- **Payment Status**: requires_action, authorized, captured, voided, failed
- **Payout Status**: pending, in_review, paid, failed, canceled
- **Refund Status**: pending, approved, processed, failed, canceled
- **Moderation Status**: open, needs_changes, approved, rejected, resolved
- **Verification Status**: pending, approved, rejected, expired
- **Notification Types**: info, success, warning, error
- **Notification Channels**: in_app, email, push, sms
- **Creator Steps**: basic_info, date_time, location, seating, ticket_types, price_tiers, policies, media, review
- **Creator Session Status**: in_progress, completed, abandoned, published

### Common Issues
- If Prisma client is not found, run `npx prisma generate`
- If migrations fail, ensure Docker containers are running: `docker compose ps`
- For port conflicts, check if services are already running on ports 3000, 5432, or 6379
- Frontend and backend both use port 3000 by default - run them separately or update PORT in .env
- On Windows, ensure Docker Desktop is running before starting services
- If uploads fail, verify UPLOAD_DIR exists and has write permissions
- For S3 uploads, ensure AWS credentials are properly configured
