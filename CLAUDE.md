# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Table of Contents
- [Project Overview](#project-overview)
- [Development Commands](#development-commands)
- [Architecture Overview](#architecture-overview)
- [Frontend Application](#frontend-application)
- [Simplified User Onboarding](#simplified-user-onboarding)
- [Development Workflow](#development-workflow)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)
- [Quick Reference](#quick-reference)

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
- **Event Management**: Complete event lifecycle from draft to completion with announcements, FAQs, agenda, and speakers
- **Ticketing System**: GA and seated tickets with advanced pricing tiers and seatmap management
- **Payment Processing**: Dual payment providers (Stripe + Paystack) with webhook handling
- **Order Management**: Full order lifecycle with refunds, disputes, and chargebacks
- **Dispute Management**: Platform-level dispute handling system for payment chargebacks and buyer disputes
- **Creator Interface**: Multi-step event creation wizard (v2) with autosave, templates, and guided workflow
- **Verification System**: Document upload and review for organization verification with appeal process
- **Review System**: Separate reviews for events and organizers with moderation
- **Saved Events**: Users can save/bookmark events for later viewing
- **Notification System**: Multi-channel notifications (in-app, email, push, SMS) with real-time WebSocket support
- **Real-time Updates**: WebSocket gateway for live notifications and event updates
- **User Account Management**: Comprehensive profile, preferences, and account settings
- **Multi-currency Support**: Currency conversion and localization utilities
- **Analytics**: Creator usage analytics, audit logging, and behavioral tracking
- **File Storage**: AWS S3 integration for document and media storage with presigned URLs
- **Background Jobs**: Queue-based processing for async operations (BullMQ + Redis)
- **Health Monitoring**: Health check endpoints for database, Redis, and service monitoring
- **Location-based Search**: PostGIS-powered spatial queries for finding nearby events with city/region support

### Core Module Structure
- **account/** - User account management and profile settings
- **admin/** - Platform administration endpoints for system management
- **announcements/** - Event announcements and updates system
- **auth/** - JWT authentication, API keys, session management, and 2FA
- **buyer-disputes/** - Platform dispute management system for payment chargebacks and buyer disputes
- **categories/** - Event categorization and taxonomy
- **cities/** - City database and search for location-based features
- **common/** - Shared utilities, guards, decorators, pipes, geo services, and geolocation
- **currency/** - Multi-currency support and conversion utilities
- **event-creator-v2/** - Step-by-step event creation wizard with autosave and templates
- **events/** - Event management with occurrences, assets, policies, seatmaps, agenda, and speakers
- **faqs/** - Event FAQ management system
- **health/** - Health check endpoints for system monitoring
- **homepage/** - Public homepage API with featured events and categories
- **moderation/** - Content moderation and flagging system
- **notifications/** - Multi-channel notification delivery (in-app, email, push, SMS)
- **orders/** - Order processing, payment integration, and lifecycle management
- **organizations/** - Multi-tenant organization management with role-based permissions, verification documents, and appeals
- **organizer/** - Organizer-specific functionality and dashboard operations
- **payouts/** - Organizer payout management and financial tracking
- **promotions/** - Promo codes with various discount types and redemption tracking
- **queues/** - Background job processing (BullMQ + Redis)
- **reviews/** - Event reviews and organizer ratings system
- **saved-events/** - User saved/bookmarked events feature
- **seatmaps/** - Seating chart management for seated events
- **ticketing/** - Ticket types, price tiers, holds, and inventory management
- **tickets/** - Ticket generation, transfers, check-ins, and QR codes
- **venues/** - Venue management and location information
- **webhooks/** - Event-driven integrations with retry logic
- **websockets/** - Real-time WebSocket connections for live notifications

### Key Dependencies
- **Framework**: NestJS 11 with Express and Socket.IO
- **Database**: PostgreSQL with PostGIS 3.4 and Prisma ORM 6.18.0
- **Cache/Queue**: Redis with BullMQ 5.61.0 and IORedis 5.8.2
- **WebSockets**: @nestjs/websockets 11.1.8 with Socket.IO 4.8.1
- **Payments**: Stripe 19.1.0 (international) + Paystack (Africa-focused)
- **Authentication**: JWT with Passport (passport-jwt 4.0.1, bcrypt 6.0.0)
- **Validation**: class-validator 0.14.2 + class-transformer 0.5.1
- **Documentation**: Swagger/OpenAPI (@nestjs/swagger 11.2.1)
- **Logging**: Pino 10.1.0 with pino-pretty 13.1.2
- **Scheduling**: @nestjs/schedule 6.0.1 with RRule 2.8.1 for recurring events
- **Health Checks**: @nestjs/terminus 11.0.0
- **File Storage**: AWS S3 SDK 3.919.0 with presigned URLs
- **HTTP Client**: Axios 1.12.2
- **Email**: Nodemailer 6.9.16 for email delivery
- **Utilities**: cookie-parser 1.4.7, dotenv 17.2.3

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
- **Agenda Management**: Add agenda items with time slots, titles, descriptions, and speaker assignments
- **Speaker Management**: Define event speakers with bios, photos, titles, and social links

### Database Schema Highlights
- **Complex relationships**: User â†’ Organization â†’ Events â†’ Tickets with proper foreign keys
- **Audit trails**: AuditLog tracks all significant actions
- **Soft deletes**: Many entities use deletedAt for data retention
- **Optimistic concurrency**: updatedAt timestamps for conflict resolution
- **Indexed queries**: Performance indexes on frequently queried fields
- **New models added**:
  - **UserFollow**: User following organizations
  - **SavedEvent**: User saved/bookmarked events
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
  - **Dispute**: Platform dispute management for chargebacks and buyer disputes
  - **EventAgenda** & **EventSpeaker**: Event agenda items and speaker information
  - **Region** & **City**: Geographic data for location-based features with spatial indexes
  - **UserLocation**: User location storage with source tracking (ip, browser, manual)

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
  - Real-time delivery via WebSocket gateway

### Real-time WebSocket Features
WebSocket gateway for live updates and real-time communication:
- **Authentication**: JWT-based WebSocket authentication
- **Notification Gateway**: Real-time notification delivery to connected clients
- **Event-driven**: Subscribe to specific event types (orders, tickets, announcements)
- **Room-based**: Organize users into rooms (organization, event-specific)
- **Connection Management**: Automatic reconnection and session handling
- **Scalable**: Redis adapter support for horizontal scaling (planned)

### Dispute Management System
Comprehensive platform-level dispute handling for payment issues:
- **Dispute Types**: chargeback, buyer_complaint, fraudulent_transaction, service_not_provided, product_not_received, unauthorized_charge, other
- **Statuses**: open, under_review, awaiting_evidence, resolved_won, resolved_lost, closed
- **Evidence Management**: Support for evidence submission with document uploads
- **Order Integration**: Linked to orders with automatic status updates
- **Admin Tools**: Dispute resolution interface for platform administrators
- **Webhook Integration**: Automated dispute creation from payment provider webhooks
- **Timeline Tracking**: Complete audit trail of dispute status changes and actions
- **Resolution Outcomes**: Track won/lost disputes with reason codes

### Saved Events Feature
Users can save and bookmark events for later viewing:
- **Personal Collections**: Each user maintains their own saved events list
- **Quick Access**: Easily find and access saved events from user dashboard
- **Persistent Storage**: Saved events persist across sessions
- **Event Updates**: Users receive notifications for changes to saved events
- **Social Features**: Foundation for sharing and recommendation features

### Location-based Event Search
PostGIS-powered spatial queries for finding nearby events:
- **PostGIS Integration**: Database uses `postgis/postgis:15-3.4` image with spatial extensions
- **Spatial Indexes**: GIST indexes on geometry columns for efficient proximity queries
- **Search Methods**:
  - By coordinates: `GET /events/nearby?latitude=6.5244&longitude=3.3792&radius=50`
  - By city name: `GET /events/nearby?city=Lagos&radius=50`
  - By user location: `GET /events/nearby/me` (authenticated)
- **City Database**: 60+ major cities pre-seeded with focus on Africa and global coverage
- **User Location Management**:
  - Automatic IP geolocation on login (non-blocking)
  - Browser geolocation API support
  - Manual city selection
  - `GET/PUT/DELETE /account/location` endpoints
- **IP Geolocation**: Uses ip-api.com with Redis caching (24h TTL)
- **Haversine Fallback**: Falls back to in-memory Haversine calculation if PostGIS unavailable
- **New Models**:
  - **Region**: Geographic regions with coordinates
  - **City**: Cities with coordinates, population, timezone, aliases
  - **UserLocation**: User's stored location with source tracking (ip, browser, manual)

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
- **API Communication**: REST API calls to NestJS backend at `/api/*` endpoints
- **Authentication**: JWT token-based authentication with refresh tokens
- **Payment Integration**: Stripe and Paystack client-side SDKs for payment processing
- **Real-time Updates**: WebSocket connection for live notifications and updates
- **State Management**: Zustand stores synced with backend state
- **Form Validation**: Client-side validation with Zod schemas matching backend DTOs
- **Error Handling**: Standardized error responses and user-friendly error messages

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
- **Dispute Types**: chargeback, buyer_complaint, fraudulent_transaction, service_not_provided, product_not_received, unauthorized_charge, other
- **Dispute Status**: open, under_review, awaiting_evidence, resolved_won, resolved_lost, closed
- **Moderation Status**: open, needs_changes, approved, rejected, resolved
- **Verification Status**: pending, approved, rejected, expired
- **Notification Types**: info, success, warning, error
- **Notification Channels**: in_app, email, push, sms
- **Creator Steps**: basic_info, date_time, location, seating, ticket_types, price_tiers, policies, media, review
- **Creator Session Status**: in_progress, completed, abandoned, published
- **Location Source**: ip, browser, manual, address

## Best Practices

### API Design Guidelines
- **RESTful conventions**: Use standard HTTP methods (GET, POST, PUT, PATCH, DELETE)
- **Versioning**: API endpoints use versioning when breaking changes are introduced
- **DTOs**: All request/response objects use Data Transfer Objects for validation
- **Error handling**: Consistent error responses with appropriate HTTP status codes
- **Pagination**: Use cursor or offset-based pagination for list endpoints
- **Filtering**: Support query parameters for filtering, sorting, and searching
- **Rate limiting**: Implement rate limiting for public endpoints (planned)

### Security Best Practices
- **Authentication**: JWT tokens with short expiration times and refresh token rotation
- **Authorization**: Role-based access control (RBAC) with organization-level permissions
- **Input validation**: All inputs validated using class-validator decorators
- **SQL injection prevention**: Parameterized queries via Prisma ORM
- **XSS protection**: Content sanitization for user-generated content
- **CORS**: Configured CORS policies for frontend domains
- **Environment secrets**: All sensitive data stored in environment variables
- **File uploads**: File type validation and size limits enforced

### Performance Optimization
- **Database indexing**: Strategic indexes on frequently queried fields
- **Query optimization**: Use Prisma's select and include for efficient queries
- **Caching**: Redis caching for frequently accessed data
- **Background jobs**: Long-running tasks processed via BullMQ queues
- **Connection pooling**: Database connection pooling via Prisma
- **Lazy loading**: Load related data only when needed
- **Pagination**: Always paginate large result sets

### Code Organization
- **Module structure**: Each feature has its own module with controller, service, and DTOs
- **Dependency injection**: Use NestJS DI container for loose coupling
- **Service layer**: Business logic in services, controllers handle HTTP concerns
- **Reusability**: Common functionality in shared modules (common/)
- **Type safety**: Full TypeScript coverage with strict mode enabled
- **Testing**: Unit tests for services, E2E tests for critical workflows

### Development Tips
- **Hot reload**: Use `npm run start:dev` for automatic code reloading
- **Debugging**: Use `npm run start:debug` and attach debugger on port 9229
- **Prisma Studio**: Visual database browser at http://localhost:5555
- **API documentation**: Swagger UI available at http://localhost:3000/api (when configured)
- **Logging**: Structured logging with Pino for better debugging
- **Error tracking**: Log errors with context for easier troubleshooting

## Troubleshooting

### Common Issues

#### Database Issues
- **Prisma client not found**: Run `npx prisma generate` to generate the Prisma client
- **Migration failures**: Ensure Docker containers are running with `docker compose ps`
- **Connection refused**: Check DATABASE_URL in .env and verify PostgreSQL is running
- **Schema out of sync**: Run `npx prisma db push` to sync schema with database
- **Seed script fails**: Ensure database is empty or use `npx prisma migrate reset` to reset

#### Development Server Issues
- **Port conflicts**: Check if services are already running on ports 3000, 5432, or 6379
- **Frontend and backend collision**: Both use port 3000 by default - run separately or update PORT in .env
- **Hot reload not working**: Restart the dev server with `npm run start:dev`
- **Module not found errors**: Run `npm install` to ensure all dependencies are installed
- **TypeScript errors**: Check tsconfig.json and ensure all types are properly defined

#### Redis and Queue Issues
- **Redis connection refused**: Ensure Redis is running via Docker: `docker compose ps`
- **Jobs not processing**: Check Redis connection and ensure queue workers are running
- **Queue stuck**: Use Redis CLI to inspect queue status: `redis-cli`
- **BullMQ errors**: Verify REDIS_URL environment variable is set correctly

#### Authentication Issues
- **JWT errors**: Verify JWT_SECRET and JWT_REFRESH_SECRET are set in .env
- **Token expired**: Tokens have expiration times - use refresh token flow
- **Unauthorized errors**: Ensure Authorization header is set with valid JWT token
- **CORS errors**: Configure CORS settings for frontend domain

#### File Upload Issues
- **Upload fails**: Verify UPLOAD_DIR exists and has write permissions
- **S3 upload errors**: Ensure AWS credentials (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION) are configured
- **File size exceeded**: Check MAX_FILE_SIZE setting in environment variables
- **Invalid file type**: Verify file type validation in upload endpoints

#### Payment Integration Issues
- **Stripe webhook failures**: Verify STRIPE_WEBHOOK_SECRET matches Stripe dashboard
- **Payment intent errors**: Check STRIPE_SECRET_KEY is set correctly
- **Webhook signature mismatch**: Ensure webhook endpoint is publicly accessible for testing
- **Paystack issues**: Verify PAYSTACK_SECRET_KEY and webhook configuration

#### Windows-specific Issues
- **Docker not running**: Ensure Docker Desktop is running before starting services
- **Path issues**: Use forward slashes in paths or escape backslashes properly
- **Permission errors**: Run terminal as administrator for certain operations
- **Line ending issues**: Configure Git to use LF line endings: `git config core.autocrlf false`

## Quick Reference

### Common Commands Cheatsheet
```bash
# Start everything
docker compose up -d && cd api && npm run start:dev

# Reset database
cd api && npx prisma migrate reset && npm run db:seed

# Check logs
docker compose logs -f postgres
docker compose logs -f redis

# Prisma operations
npx prisma studio                    # Open database GUI
npx prisma generate                  # Regenerate client
npx prisma db push                   # Push schema changes
npx prisma migrate dev --name NAME   # Create migration

# Clean install
rm -rf node_modules package-lock.json && npm install

# Build production
npm run build && npm run start:prod
```

### Important Endpoints
- **Backend API**: http://localhost:3000
- **Swagger Docs**: http://localhost:3000/api (if configured)
- **Prisma Studio**: http://localhost:5555
- **Frontend**: http://localhost:3000 (separate process)
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

### Environment Variables Template
```bash
# Required
DATABASE_URL="postgresql://user:pass@localhost:5432/eventflow"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="your-secret-key-min-32-chars"
JWT_REFRESH_SECRET="your-refresh-secret-key"

# Optional but recommended
PORT=3000
NODE_ENV=development
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760

# Payment providers (for production)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
PAYSTACK_SECRET_KEY=sk_test_...

# AWS S3 (for file storage)
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket

# Email (optional)
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=your-email@example.com
EMAIL_PASS=your-password
```

### Key Conventions
- **Module naming**: kebab-case for folders, PascalCase for classes
- **File naming**: feature.module.ts, feature.controller.ts, feature.service.ts
- **DTO naming**: CreateFeatureDto, UpdateFeatureDto, FeatureResponseDto
- **Enum naming**: PascalCase for enum names, lowercase for values
- **API routes**: /api/resource, /api/resource/:id
- **Test files**: feature.service.spec.ts, feature.e2e-spec.ts

## Project Status & Roadmap

### Completed Features
- ✅ Multi-tenant organization management with verification
- ✅ Event creation wizard (v2) with autosave and templates
- ✅ Event agenda and speakers support
- ✅ Ticketing system with GA and seated tickets
- ✅ Order and payment processing (Stripe + Paystack)
- ✅ Dispute management system for chargebacks and buyer complaints
- ✅ Real-time notifications via WebSocket
- ✅ Review system for events and organizers
- ✅ Event announcements and FAQs
- ✅ Saved events / bookmarking feature
- ✅ Admin and moderator tools
- ✅ File upload and S3 integration
- ✅ Background job processing with queues
- ✅ User account management
- ✅ Health monitoring endpoints
- ✅ Enhanced Redis connection pooling and error handling

### In Progress / Planned Features
- 🚧 Rate limiting for API endpoints
- 🚧 Advanced analytics and reporting
- 🚧 Redis adapter for WebSocket horizontal scaling
- 🚧 Mobile application (React Native/Flutter)
- 🚧 Advanced search with Elasticsearch (planned)
- 🚧 Email template system improvements
- 🚧 Push notification service integration
- 🚧 SMS notification delivery
- 🚧 Two-factor authentication (2FA)
- 🚧 Social media integrations
- 🚧 Advanced fraud detection

### Known Limitations
- Frontend and backend share default port 3000 (configuration needed for concurrent run)
- WebSocket scaling requires Redis adapter implementation
- Some email features require external SMTP configuration
- S3 storage requires AWS credentials setup
- Limited test coverage in some modules

## Additional Resources

### Documentation
- **NestJS Docs**: https://docs.nestjs.com
- **Prisma Docs**: https://www.prisma.io/docs
- **Stripe API**: https://stripe.com/docs/api
- **Socket.IO Docs**: https://socket.io/docs
- **Next.js Docs**: https://nextjs.org/docs

### Related Files
- `tables.md` - Comprehensive database schema documentation
- `001_schema_improvements.sql` - Schema enhancement scripts
- `.env.example` - Environment variables template
- `docker-compose.yml` - Infrastructure services configuration
- `api/prisma/schema.prisma` - Prisma database schema
- `api/prisma/seed.ts` - Database seeding script

### Support and Contribution
This is an active development project. When making changes:
1. Follow the established code conventions and patterns
2. Write tests for new features
3. Update this CLAUDE.md file when adding new modules or major features
4. Keep the Prisma schema in sync with database changes
5. Document API endpoints with Swagger decorators
6. Ensure environment variables are documented in .env.example

---

**Last Updated**: 2025-12-05
**Project Version**: 0.0.1 (Active Development)
**NestJS Version**: 11.x
**Node Version**: 22.x (recommended)
**Recent Updates**:
- Added PostGIS-powered location-based event search with city/region support
- Implemented user location management (IP geolocation, browser geolocation, manual selection)
- Added cities database with 60+ major cities pre-seeded
- Created new endpoints: GET /events/nearby/me, GET/PUT/DELETE /account/location, GET /cities
- Added dispute management system for platform-level dispute handling
- Implemented saved events feature for user bookmarking
- Enhanced event management with agenda and speakers support
- Improved Redis connection pooling and error handling
- Added comprehensive webhook integration for dispute notifications
