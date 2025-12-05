# Platform Dispute System - Complete Implementation Plan

**Date:** 2025-12-05
**Status:** Planning Complete, Ready for Implementation

---

## Design Decisions (Confirmed)

1. ✅ **Architecture:** Extend existing `Dispute` model with `type` field ('payment_provider' | 'platform')
2. ✅ **Mediation:** Moderator role handles disputes, admins can override
3. ✅ **Refund Integration:** Keep both - refunds for simple cases, disputes for contested. Refunds can escalate.
4. ✅ **Resolution Outcomes:** Full refund, partial refund, no refund, credit/voucher, ticket replacement
5. ✅ **Dispute Rules:** 90-day limit from order OR 30 days after event (whichever later)
6. ✅ **Escalation:** Buyer → Organizer (7 days) → Moderator review → Final decision (1 appeal allowed)

---

## Phase 1: Database Schema & Core Models (2-3 hours)

### 1.1 Update Dispute Model

**File:** `api/prisma/schema.prisma`

```prisma
enum DisputeType {
  payment_provider  // Existing: Stripe/Paystack chargebacks
  platform         // New: Buyer-initiated disputes
}

enum DisputeCategory {
  duplicate_charge
  tickets_not_delivered
  wrong_ticket_type
  refund_not_processed
  partial_refund_issue
  event_mismatch
  venue_changed
  time_changed
  unauthorized_purchase
  counterfeit_tickets
  account_compromise
  other
}

enum DisputeStatus {
  // Existing payment provider statuses
  needs_response
  under_review
  won
  lost
  warning
  charge_refunded

  // New platform dispute statuses
  open                    // Buyer submitted, awaiting organizer
  organizer_responded     // Organizer responded, awaiting buyer
  escalated              // Sent to moderator
  moderator_review       // Moderator reviewing
  resolved               // Final decision made
  appealed               // Appeal submitted
  appeal_review          // Appeal under review
  closed                 // Final, no further action
}

enum DisputeResolution {
  pending
  full_refund
  partial_refund
  no_refund
  credit_issued
  ticket_replacement
  custom
}

model Dispute {
  id              String            @id @default(cuid())
  orderId         String            @map("order_id")

  // Type differentiation
  type            DisputeType       @default(platform)

  // Payment provider fields (existing)
  provider        String?           // 'stripe', 'paystack' (null for platform disputes)
  caseId          String?           @map("case_id") // Provider's case ID (null for platform)

  // Platform dispute fields (new)
  initiatorId     String?           @map("initiator_id") // Buyer who initiated
  category        DisputeCategory?
  subcategory     String?           // Free-form subcategory
  description     String?           @db.Text // Buyer's description

  // Status and resolution
  status          String            @default("open")
  resolution      DisputeResolution @default(pending)
  resolutionNote  String?           @map("resolution_note") @db.Text

  // Amounts
  amountCents     BigInt?           @map("amount_cents")
  refundedCents   BigInt?           @map("refunded_cents") // Actual refunded amount

  // Reason/notes
  reason          String?           @db.Text

  // Timestamps
  openedAt        DateTime          @default(now()) @map("opened_at")
  closedAt        DateTime?         @map("closed_at")
  respondByAt     DateTime?         @map("respond_by_at") // Organizer deadline
  submittedAt     DateTime?         @map("submitted_at") // Organizer response time
  escalatedAt     DateTime?         @map("escalated_at") // When escalated to moderator
  resolvedAt      DateTime?         @map("resolved_at") // When final decision made

  // Response tracking
  responseNote    String?           @map("response_note") @db.Text // Organizer's response
  organizerResponse String?         @map("organizer_response") @db.Text
  moderatorNote   String?           @map("moderator_note") @db.Text

  // Assignment
  moderatorId     String?           @map("moderator_id") // Assigned moderator

  // Appeal
  appealedAt      DateTime?         @map("appealed_at")
  appealNote      String?           @map("appeal_note") @db.Text
  appealedBy      String?           @map("appealed_by") // User who appealed

  // Metadata
  createdAt       DateTime          @default(now()) @map("created_at")
  updatedAt       DateTime          @updatedAt @map("updated_at")

  // Relations
  order           Order             @relation(fields: [orderId], references: [id])
  initiator       User?             @relation("DisputeInitiator", fields: [initiatorId], references: [id])
  moderator       User?             @relation("DisputeModerator", fields: [moderatorId], references: [id])
  appealer        User?             @relation("DisputeAppealer", fields: [appealedBy], references: [id])
  evidence        DisputeEvidence[]
  messages        DisputeMessage[]

  @@unique([provider, caseId], name: "provider_caseId")
  @@index([orderId])
  @@index([type])
  @@index([status])
  @@index([category])
  @@index([initiatorId])
  @@index([moderatorId])
  @@index([openedAt])
  @@map("disputes")
}
```

### 1.2 Add DisputeMessage Model (New)

For communication thread between buyer, organizer, and moderator:

```prisma
model DisputeMessage {
  id          String   @id @default(cuid())
  disputeId   String   @map("dispute_id")
  senderId    String   @map("sender_id")
  senderRole  String   @map("sender_role") // 'buyer', 'organizer', 'moderator', 'admin'
  message     String   @db.Text
  isInternal  Boolean  @default(false) @map("is_internal") // Only visible to moderators/admins
  createdAt   DateTime @default(now()) @map("created_at")

  dispute     Dispute  @relation(fields: [disputeId], references: [id], onDelete: Cascade)
  sender      User     @relation(fields: [senderId], references: [id])

  @@index([disputeId])
  @@index([createdAt])
  @@map("dispute_messages")
}
```

### 1.3 Update User Model Relations

```prisma
model User {
  // Existing fields...

  // Add new relations
  initiatedDisputes   Dispute[]        @relation("DisputeInitiator")
  moderatedDisputes   Dispute[]        @relation("DisputeModerator")
  appealedDisputes    Dispute[]        @relation("DisputeAppealer")
  disputeMessages     DisputeMessage[]
  disputeEvidence     DisputeEvidence[]
}
```

### 1.4 Migration Commands

```bash
# Generate migration
npx prisma migrate dev --name add_platform_disputes

# Generate Prisma client
npx prisma generate
```

---

## Phase 2: Buyer Dispute Creation (4-5 hours)

### 2.1 Create Buyer Dispute Module

**Location:** `api/src/buyer-disputes/`

**Files to create:**
- `buyer-disputes.module.ts`
- `buyer-disputes.controller.ts`
- `buyer-disputes.service.ts`
- `dto/create-dispute.dto.ts`
- `dto/dispute-query.dto.ts`
- `dto/add-message.dto.ts`

### 2.2 DTOs

**File:** `api/src/buyer-disputes/dto/create-dispute.dto.ts`

```typescript
import { IsEnum, IsString, IsOptional, IsArray, MaxLength, MinLength } from 'class-validator';
import { DisputeCategory } from '@prisma/client';

export class CreateDisputeDto {
  @IsString()
  orderId: string;

  @IsEnum(DisputeCategory)
  category: DisputeCategory;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  subcategory?: string;

  @IsString()
  @MinLength(50)
  @MaxLength(2000)
  description: string;

  @IsArray()
  @IsOptional()
  evidenceUrls?: string[]; // URLs of uploaded evidence
}

export class AddDisputeMessageDto {
  @IsString()
  @MinLength(10)
  @MaxLength(1000)
  message: string;
}

export class AppealDisputeDto {
  @IsString()
  @MinLength(50)
  @MaxLength(1000)
  appealNote: string;
}
```

### 2.3 Buyer Disputes Service

**File:** `api/src/buyer-disputes/buyer-disputes.service.ts`

**Key Methods:**
- `create(userId: string, dto: CreateDisputeDto)` - Create new dispute
- `findAll(userId: string, query: DisputeQueryDto)` - List user's disputes
- `findOne(userId: string, disputeId: string)` - Get dispute details
- `addMessage(userId: string, disputeId: string, dto: AddDisputeMessageDto)` - Add message
- `uploadEvidence(userId: string, disputeId: string, file)` - Upload evidence
- `appeal(userId: string, disputeId: string, dto: AppealDisputeDto)` - Appeal decision
- `validateDisputeEligibility(orderId: string, userId: string)` - Check if can dispute

### 2.4 Buyer Disputes Controller

**File:** `api/src/buyer-disputes/buyer-disputes.controller.ts`

**Endpoints:**
```typescript
@Controller('buyer/disputes')
@UseGuards(JwtAuthGuard)
export class BuyerDisputesController {

  @Post()
  @ApiOperation({ summary: 'Create a new dispute' })
  create(@CurrentUser() user, @Body() dto: CreateDisputeDto)

  @Get()
  @ApiOperation({ summary: 'Get my disputes' })
  findAll(@CurrentUser() user, @Query() query: DisputeQueryDto)

  @Get(':id')
  @ApiOperation({ summary: 'Get dispute details' })
  findOne(@CurrentUser() user, @Param('id') id: string)

  @Post(':id/messages')
  @ApiOperation({ summary: 'Add message to dispute' })
  addMessage(@CurrentUser() user, @Param('id') id: string, @Body() dto: AddDisputeMessageDto)

  @Post(':id/evidence')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload evidence' })
  uploadEvidence(@CurrentUser() user, @Param('id') id: string, @UploadedFile() file)

  @Post(':id/appeal')
  @ApiOperation({ summary: 'Appeal dispute decision' })
  appeal(@CurrentUser() user, @Param('id') id: string, @Body() dto: AppealDisputeDto)
}
```

### 2.5 Business Logic - Dispute Eligibility

```typescript
async validateDisputeEligibility(orderId: string, userId: string) {
  const order = await this.prisma.order.findUnique({
    where: { id: orderId },
    include: { event: true, disputes: true },
  });

  // Validation checks:
  // 1. Order exists and belongs to user
  if (!order || order.buyerId !== userId) {
    throw new ForbiddenException('Order not found or access denied');
  }

  // 2. Order is paid
  if (order.status !== 'paid' && order.status !== 'refunded') {
    throw new BadRequestException('Can only dispute paid orders');
  }

  // 3. Check time limits (90 days from order OR 30 days after event)
  const orderAge = Date.now() - order.createdAt.getTime();
  const ninetyDays = 90 * 24 * 60 * 60 * 1000;

  if (order.event.startDate) {
    const eventEnded = new Date(order.event.startDate).getTime() < Date.now();
    if (eventEnded) {
      const daysSinceEvent = (Date.now() - new Date(order.event.startDate).getTime()) / (24 * 60 * 60 * 1000);
      if (daysSinceEvent > 30) {
        throw new BadRequestException('Dispute window closed (30 days after event)');
      }
    }
  } else {
    if (orderAge > ninetyDays) {
      throw new BadRequestException('Dispute window closed (90 days from purchase)');
    }
  }

  // 4. No existing open disputes on this order
  const openDispute = order.disputes.find(d =>
    d.type === 'platform' &&
    !['resolved', 'closed'].includes(d.status)
  );

  if (openDispute) {
    throw new BadRequestException('An open dispute already exists for this order');
  }

  return true;
}
```

---

## Phase 3: Organizer Response System (3-4 hours)

### 3.1 Update Existing Organizer Disputes Service

**File:** `api/src/organizer/organizer-disputes.service.ts`

**Add new methods:**
- `findPlatformDisputes(orgId: string, query)` - List platform disputes for org's events
- `respondToPlatformDispute(orgId: string, disputeId: string, response)` - Respond to buyer dispute
- `proposeResolution(orgId: string, disputeId: string, proposal)` - Propose resolution
- `acceptResolution(orgId: string, disputeId: string)` - Accept moderator decision
- `getDisputeMessages(orgId: string, disputeId: string)` - Get conversation thread

### 3.2 Update Organizer Disputes Controller

**File:** `api/src/organizer/disputes.controller.ts`

**Add new endpoints:**
```typescript
@Get('platform')
@ApiOperation({ summary: 'Get platform disputes for organization events' })
getPlatformDisputes(@OrgId() orgId: string, @Query() query)

@Post(':id/respond')
@ApiOperation({ summary: 'Respond to platform dispute' })
respondToDispute(@OrgId() orgId: string, @Param('id') id: string, @Body() dto)

@Post(':id/propose-resolution')
@ApiOperation({ summary: 'Propose resolution to buyer' })
proposeResolution(@OrgId() orgId: string, @Param('id') id: string, @Body() dto)

@Post(':id/accept')
@ApiOperation({ summary: 'Accept dispute resolution' })
acceptResolution(@OrgId() orgId: string, @Param('id') id: string)
```

### 3.3 Auto-Escalation Job

**File:** `api/src/queues/processors/dispute-escalation.processor.ts`

```typescript
@Processor('dispute-escalation')
export class DisputeEscalationProcessor {

  @Cron('0 */6 * * *') // Every 6 hours
  async checkOverdueDisputes() {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Find disputes where organizer hasn't responded in 7 days
    const overdueDisputes = await this.prisma.dispute.findMany({
      where: {
        type: 'platform',
        status: 'open',
        openedAt: { lte: sevenDaysAgo },
        submittedAt: null,
      },
      include: { order: { include: { event: true } } },
    });

    for (const dispute of overdueDisputes) {
      // Auto-escalate to moderator
      await this.prisma.dispute.update({
        where: { id: dispute.id },
        data: {
          status: 'escalated',
          escalatedAt: new Date(),
          responseNote: 'Auto-escalated: Organizer did not respond within 7 days',
        },
      });

      // Notify moderators
      await this.notifyModerators(dispute);
    }
  }
}
```

---

## Phase 4: Moderator Review System (4-5 hours)

### 4.1 Create Moderator Disputes Module

**Location:** `api/src/moderator/disputes/`

**Files to create:**
- `moderator-disputes.module.ts`
- `moderator-disputes.controller.ts`
- `moderator-disputes.service.ts`
- `dto/resolve-dispute.dto.ts`

### 4.2 Moderator Role Guard

**File:** `api/src/common/guards/moderator.guard.ts`

```typescript
@Injectable()
export class ModeratorGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) return false;

    // Check if user has moderator or admin role
    return user.role === 'moderator' || user.role === 'admin';
  }
}
```

### 4.3 Moderator Disputes Controller

**File:** `api/src/moderator/disputes/moderator-disputes.controller.ts`

```typescript
@Controller('moderator/disputes')
@UseGuards(JwtAuthGuard, ModeratorGuard)
export class ModeratorDisputesController {

  @Get('queue')
  @ApiOperation({ summary: 'Get disputes queue (pending review)' })
  getQueue(@CurrentUser() user, @Query() query)

  @Get(':id')
  @ApiOperation({ summary: 'Get dispute details for review' })
  getDetails(@Param('id') id: string)

  @Post(':id/assign')
  @ApiOperation({ summary: 'Assign dispute to self' })
  assignToSelf(@CurrentUser() user, @Param('id') id: string)

  @Post(':id/request-evidence')
  @ApiOperation({ summary: 'Request additional evidence from party' })
  requestEvidence(@Param('id') id: string, @Body() dto)

  @Post(':id/resolve')
  @ApiOperation({ summary: 'Make final decision on dispute' })
  resolve(@CurrentUser() user, @Param('id') id: string, @Body() dto: ResolveDisputeDto)

  @Get('stats')
  @ApiOperation({ summary: 'Get moderator dispute statistics' })
  getStats(@CurrentUser() user)
}
```

### 4.4 Resolution DTO

```typescript
export class ResolveDisputeDto {
  @IsEnum(DisputeResolution)
  resolution: DisputeResolution; // full_refund, partial_refund, no_refund, etc.

  @IsNumber()
  @IsOptional()
  refundAmountCents?: number; // For partial refunds

  @IsString()
  @MinLength(50)
  @MaxLength(2000)
  moderatorNote: string; // Explanation of decision

  @IsBoolean()
  @IsOptional()
  notifyParties?: boolean; // Send notifications
}
```

### 4.5 Resolution Processing

```typescript
async resolveDispute(moderatorId: string, disputeId: string, dto: ResolveDisputeDto) {
  const dispute = await this.prisma.dispute.findUnique({
    where: { id: disputeId },
    include: { order: true, initiator: true },
  });

  // Update dispute status
  const updatedDispute = await this.prisma.dispute.update({
    where: { id: disputeId },
    data: {
      status: 'resolved',
      resolution: dto.resolution,
      moderatorNote: dto.moderatorNote,
      moderatorId,
      resolvedAt: new Date(),
      refundedCents: dto.refundAmountCents,
    },
  });

  // Process resolution
  if (dto.resolution === 'full_refund') {
    await this.createRefund({
      orderId: dispute.orderId,
      amountCents: dispute.order.totalCents,
      reason: `Dispute resolved: ${dto.moderatorNote}`,
      createdBy: moderatorId,
    });
  } else if (dto.resolution === 'partial_refund' && dto.refundAmountCents) {
    await this.createRefund({
      orderId: dispute.orderId,
      amountCents: dto.refundAmountCents,
      reason: `Partial refund: ${dto.moderatorNote}`,
      createdBy: moderatorId,
    });
  }

  // Send notifications
  if (dto.notifyParties) {
    await this.notifyDisputeResolution(updatedDispute);
  }

  return updatedDispute;
}
```

---

## Phase 5: Frontend Implementation (6-8 hours)

### 5.1 Buyer Dispute Creation Wizard

**Location:** `frontend/web-app/app/(account)/account/disputes/create/page.tsx`

**Steps:**
1. Select order from list
2. Choose category and subcategory
3. Enter description (rich text editor)
4. Upload evidence (drag-and-drop)
5. Review and submit
6. Confirmation with case number

**Components:**
- `components/buyer/disputes/dispute-wizard.tsx`
- `components/buyer/disputes/order-selector.tsx`
- `components/buyer/disputes/category-selector.tsx`
- `components/buyer/disputes/evidence-uploader.tsx`

### 5.2 Buyer Disputes List

**Location:** `frontend/web-app/app/(account)/account/disputes/page.tsx`

**Features:**
- List all disputes with status badges
- Filter by status, category
- Search by order ID or case number
- Click to view details

**Component:**
- `components/buyer/disputes/dispute-list.tsx`

### 5.3 Buyer Dispute Detail

**Location:** `frontend/web-app/app/(account)/account/disputes/[id]/page.tsx`

**Sections:**
- Dispute overview (status, category, amounts)
- Conversation thread (messages from buyer, organizer, moderator)
- Evidence gallery
- Action buttons (add message, upload evidence, appeal)

**Components:**
- `components/buyer/disputes/dispute-detail.tsx`
- `components/buyer/disputes/dispute-timeline.tsx`
- `components/buyer/disputes/message-thread.tsx`

### 5.4 Organizer Disputes Tab

**Location:** `frontend/web-app/app/(organizer)/organizer/disputes/page.tsx`

**Update existing page to show both:**
- Payment provider disputes (existing)
- Platform disputes (new)
- Tabs to switch between types
- Combined statistics

### 5.5 Moderator Dashboard

**Location:** `frontend/web-app/app/(moderator)/moderator/disputes/page.tsx`

**Features:**
- Queue view (pending disputes)
- Assignment system
- Review interface with split view (buyer vs organizer)
- Decision form with resolution options
- Statistics dashboard

**Components:**
- `components/moderator/disputes/dispute-queue.tsx`
- `components/moderator/disputes/dispute-review.tsx`
- `components/moderator/disputes/resolution-form.tsx`

---

## Phase 6: Notifications & Integration (2-3 hours)

### 6.1 Notification Events

**Add to:** `api/src/buyer-disputes/buyer-disputes.service.ts` and others

**Events to trigger:**
1. **Dispute Created** → Notify organizer
2. **Organizer Responded** → Notify buyer
3. **Escalated to Moderator** → Notify moderator pool
4. **Resolution Reached** → Notify buyer and organizer
5. **Appeal Submitted** → Notify moderators
6. **Deadline Approaching** → Warn organizer (3 days, 1 day, 6 hours)

**Notification channels:** In-app + Email (existing system)

### 6.2 Refund System Integration

**Update:** `api/src/admin/services/refund.service.ts`

Add method to create refund from dispute resolution:

```typescript
async createFromDispute(dispute: Dispute, amountCents: number) {
  return this.prisma.refund.create({
    data: {
      orderId: dispute.orderId,
      amountCents,
      currency: dispute.order.currency,
      reason: `Dispute ${dispute.id} resolved in buyer's favor`,
      status: 'approved',
      createdBy: dispute.moderatorId,
      metadata: { disputeId: dispute.id },
    },
  });
}
```

### 6.3 Order Status Updates

When dispute is resolved:
- Full refund → Order status = 'refunded'
- Partial refund → Order status stays 'paid' (track in refunds)
- No refund → Order status stays 'paid'

---

## Phase 7: Admin Override & Analytics (2-3 hours)

### 7.1 Admin Endpoints

**Update:** `api/src/admin/controllers/dispute.controller.ts`

```typescript
@Patch(':id/override')
@ApiOperation({ summary: 'Admin override dispute decision' })
overrideDecision(@Param('id') id: string, @Body() dto)

@Post(':id/reassign')
@ApiOperation({ summary: 'Reassign dispute to different moderator' })
reassignModerator(@Param('id') id: string, @Body() dto)

@Get('analytics')
@ApiOperation({ summary: 'Get comprehensive dispute analytics' })
getAnalytics(@Query() query)
```

### 7.2 Analytics Dashboard

**Metrics to track:**
- Total disputes by type (payment vs platform)
- Resolution rates by category
- Average resolution time
- Organizer response rates
- Moderator workload distribution
- Win/loss rates per organizer
- Common dispute reasons

---

## Implementation Order Summary

### Week 1: Core Infrastructure
- ✅ Day 1-2: Database schema updates + migrations
- ✅ Day 3-4: Buyer dispute creation (backend + frontend)
- ✅ Day 5: Testing dispute creation flow

### Week 2: Response & Review
- ✅ Day 1-2: Organizer response system
- ✅ Day 3-4: Moderator review system
- ✅ Day 5: Testing full lifecycle

### Week 3: Polish & Launch
- ✅ Day 1-2: Notifications + integrations
- ✅ Day 3: Admin overrides + analytics
- ✅ Day 4-5: End-to-end testing, bug fixes, deployment

---

## Testing Strategy

### Unit Tests
- Dispute eligibility validation
- Time limit calculations
- Resolution processing
- Auto-escalation logic

### Integration Tests
- Full dispute lifecycle (create → respond → escalate → resolve)
- Refund creation from disputes
- Notification delivery
- Evidence upload/download

### E2E Tests
- Buyer creates dispute → Organizer responds → Moderator resolves
- Appeal flow
- Auto-escalation when organizer doesn't respond

---

## Success Metrics

**Pre-Launch:**
- [ ] All unit tests passing
- [ ] E2E flows tested
- [ ] Database migrations run successfully
- [ ] Frontend pages responsive and accessible

**Post-Launch:**
- Average resolution time < 48 hours
- Organizer response rate > 80%
- Buyer satisfaction with resolution process > 70%
- < 5% of disputes require appeal

---

## Risk Mitigation

1. **Data Migration:** Run migration on staging first, backup production DB
2. **Performance:** Index all query fields, implement pagination
3. **Abuse Prevention:** Rate limit dispute creation (max 3 per user per week)
4. **Moderator Capacity:** Start with admin users as moderators, scale gradually

---

**Ready to begin implementation!**
