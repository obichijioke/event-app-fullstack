# Announcements & FAQs Feature Enhancements

## Executive Summary

This plan enhances the existing Event Announcements and FAQs system with:
1. **Organizer Dashboard UI** - Full CRUD interface for managing announcements and FAQs
2. **Scheduled Publishing** - Time-based announcement activation
3. **Rich Text Editor** - Enhanced FAQ answer formatting
4. **Analytics & Engagement** - Track views, reads, and user interactions
5. **User-submitted Questions** - Allow attendees to ask questions organizers can convert to FAQs
6. **Notification Integration** - Email/push for important announcements
7. **Persistent Dismissed State** - Save dismissed announcements per user
8. **Read Receipts** - Track which users have viewed announcements

## Current State

### ✅ Already Implemented
- Backend CRUD APIs for announcements and FAQs (`/events/:eventId/announcements`, `/events/:eventId/faqs`)
- Public viewing of announcements and FAQs on event details page
- Database models: `EventAnnouncement`, `EventFAQ`
- Permission checking (organization membership verification)
- Frontend display components with dismiss/expand functionality
- Seed data script for sample announcements and FAQs

### ❌ Gaps to Address
- No organizer dashboard UI for managing announcements/FAQs
- Dismissed state lost on page refresh
- No scheduled publishing capability
- No analytics or engagement tracking
- No notification system integration
- No user-submitted questions feature
- FAQ answers are plain text only
- No search functionality for FAQs

## Architecture Overview

### Technology Stack
- **Backend**: NestJS 11, Prisma ORM, PostgreSQL, Redis (BullMQ for queues)
- **Frontend**: Next.js 16, React 19, TailwindCSS v4, Zustand (state management)
- **Notifications**: Existing NotificationsModule with multi-channel support
- **Queue System**: Existing QueuesService with notification processor
- **Rich Text**: React Markdown (already in use) + optional textarea upgrade

### Integration Points
1. **NotificationsModule**: Already exports NotificationsService for creating notifications
2. **QueuesService**: Already has NOTIFICATION queue with processor
3. **Organizer Dashboard**: Existing patterns in `/organizer/events/[eventId]/*` pages
4. **Analytics Pattern**: Similar to existing EventAnalytics tracking

---

## Phase 1: Database Schema Enhancements

### 1.1 Update EventAnnouncement Model

**File**: `api/prisma/schema.prisma`

Add new fields to EventAnnouncement:
```prisma
model EventAnnouncement {
  id          String             @id @default(cuid())
  eventId     String             @map("event_id")
  title       String
  message     String
  type        AnnouncementType   @default(info)
  isActive    Boolean            @default(true) @map("is_active")

  // NEW: Scheduled publishing
  scheduledFor DateTime?         @map("scheduled_for")
  publishedAt  DateTime?         @map("published_at")

  // NEW: Analytics
  viewCount    Int               @default(0) @map("view_count")

  createdAt    DateTime          @default(now()) @map("created_at")
  updatedAt    DateTime          @updatedAt @map("updated_at")

  // Relations
  event        Event             @relation(fields: [eventId], references: [id], onDelete: Cascade)
  views        AnnouncementView[]
  dismissals   AnnouncementDismissal[]

  @@index([eventId, createdAt(sort: Desc)])
  @@index([eventId, isActive])
  @@index([scheduledFor]) // NEW: For scheduled job processing
  @@index([eventId, publishedAt(sort: Desc)]) // NEW: For published announcements
  @@map("event_announcements")
}
```

### 1.2 Create AnnouncementView Model (Read Receipts)

```prisma
model AnnouncementView {
  id              String            @id @default(cuid())
  announcementId  String            @map("announcement_id")
  userId          String            @map("user_id")
  viewedAt        DateTime          @default(now()) @map("viewed_at")

  // Relations
  announcement    EventAnnouncement @relation(fields: [announcementId], references: [id], onDelete: Cascade)
  user            User              @relation("UserAnnouncementViews", fields: [userId], references: [id], onDelete: Cascade)

  @@unique([announcementId, userId])
  @@index([announcementId])
  @@index([userId, viewedAt(sort: Desc)])
  @@map("announcement_views")
}
```

### 1.3 Create AnnouncementDismissal Model (Persistent Dismissed State)

```prisma
model AnnouncementDismissal {
  id              String            @id @default(cuid())
  announcementId  String            @map("announcement_id")
  userId          String            @map("user_id")
  dismissedAt     DateTime          @default(now()) @map("dismissed_at")

  // Relations
  announcement    EventAnnouncement @relation(fields: [announcementId], references: [id], onDelete: Cascade)
  user            User              @relation("UserAnnouncementDismissals", fields: [userId], references: [id], onDelete: Cascade)

  @@unique([announcementId, userId])
  @@index([announcementId])
  @@index([userId])
  @@map("announcement_dismissals")
}
```

### 1.4 Update EventFAQ Model

```prisma
model EventFAQ {
  id          String    @id @default(cuid())
  eventId     String    @map("event_id")
  question    String
  answer      String    @db.Text // Allow longer rich text content
  sortOrder   Int       @default(0) @map("sort_order")
  isActive    Boolean   @default(true) @map("is_active")

  // NEW: Analytics
  viewCount   Int       @default(0) @map("view_count")
  helpfulCount Int      @default(0) @map("helpful_count")

  // NEW: Source tracking
  source      String    @default("organizer") // "organizer" or "user_question"
  sourceQuestionId String? @map("source_question_id")

  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")

  // Relations
  event       Event     @relation(fields: [eventId], references: [id], onDelete: Cascade)
  sourceQuestion EventQuestion? @relation(fields: [sourceQuestionId], references: [id], onDelete: SetNull)

  @@index([eventId, sortOrder])
  @@index([eventId, isActive])
  @@map("event_faqs")
}
```

### 1.5 Create EventQuestion Model (User-submitted Questions)

```prisma
enum QuestionStatus {
  pending
  answered
  converted_to_faq
  dismissed
}

model EventQuestion {
  id           String          @id @default(cuid())
  eventId      String          @map("event_id")
  userId       String          @map("user_id")
  question     String          @db.Text
  status       QuestionStatus  @default(pending)
  moderatorNote String?        @map("moderator_note") @db.Text

  // Analytics
  upvotes      Int             @default(0)

  createdAt    DateTime        @default(now()) @map("created_at")
  updatedAt    DateTime        @updatedAt @map("updated_at")

  // Relations
  event        Event           @relation(fields: [eventId], references: [id], onDelete: Cascade)
  user         User            @relation("UserEventQuestions", fields: [userId], references: [id], onDelete: Cascade)
  convertedFaq EventFAQ[]
  upvoters     QuestionUpvote[]

  @@index([eventId, status, createdAt(sort: Desc)])
  @@index([userId])
  @@map("event_questions")
}

model QuestionUpvote {
  id          String        @id @default(cuid())
  questionId  String        @map("question_id")
  userId      String        @map("user_id")
  createdAt   DateTime      @default(now()) @map("created_at")

  question    EventQuestion @relation(fields: [questionId], references: [id], onDelete: Cascade)
  user        User          @relation("UserQuestionUpvotes", fields: [userId], references: [id], onDelete: Cascade)

  @@unique([questionId, userId])
  @@index([questionId])
  @@map("question_upvotes")
}
```

### 1.6 Update User Model Relations

Add to User model:
```prisma
model User {
  // ... existing fields

  // NEW relations
  announcementViews      AnnouncementView[]        @relation("UserAnnouncementViews")
  announcementDismissals AnnouncementDismissal[]   @relation("UserAnnouncementDismissals")
  eventQuestions         EventQuestion[]           @relation("UserEventQuestions")
  questionUpvotes        QuestionUpvote[]          @relation("UserQuestionUpvotes")

  // ... rest of model
}
```

### 1.7 Update Event Model Relations

Add to Event model:
```prisma
model Event {
  // ... existing fields

  // Update existing relations to include new models
  announcements EventAnnouncement[]
  faqs          EventFAQ[]
  questions     EventQuestion[] // NEW

  // ... rest of model
}
```

---

## Phase 2: Backend API Enhancements

### 2.1 Update Announcements Service

**File**: `api/src/announcements/announcements.service.ts`

**New Methods**:
```typescript
// Scheduled publishing
async scheduleAnnouncement(eventId: string, announcementId: string, scheduledFor: Date): Promise<EventAnnouncement>

// Analytics
async trackView(announcementId: string, userId: string): Promise<void>
async getAnalytics(eventId: string, userId: string): Promise<AnnouncementAnalytics>

// Dismissal management
async dismissAnnouncement(announcementId: string, userId: string): Promise<void>
async getDismissed(eventId: string, userId: string): Promise<string[]>
async undismissAnnouncement(announcementId: string, userId: string): Promise<void>

// Integration with notifications
async sendAnnouncementNotification(announcement: EventAnnouncement): Promise<void>
```

**Implementation Details**:
```typescript
async trackView(announcementId: string, userId: string): Promise<void> {
  // Upsert view record (no duplicates)
  await this.prisma.announcementView.upsert({
    where: {
      announcementId_userId: { announcementId, userId },
    },
    create: { announcementId, userId },
    update: { viewedAt: new Date() }, // Update timestamp if already viewed
  });

  // Increment view count
  await this.prisma.eventAnnouncement.update({
    where: { id: announcementId },
    data: { viewCount: { increment: 1 } },
  });
}

async dismissAnnouncement(announcementId: string, userId: string): Promise<void> {
  await this.prisma.announcementDismissal.create({
    data: { announcementId, userId },
  });
}

async getDismissed(eventId: string, userId: string): Promise<string[]> {
  const dismissals = await this.prisma.announcementDismissal.findMany({
    where: {
      userId,
      announcement: { eventId },
    },
    select: { announcementId: true },
  });

  return dismissals.map(d => d.announcementId);
}

async sendAnnouncementNotification(announcement: EventAnnouncement): Promise<void> {
  // Get all event ticket holders
  const tickets = await this.prisma.ticket.findMany({
    where: {
      eventId: announcement.eventId,
      status: 'issued',
    },
    select: { ownerId: true },
    distinct: ['ownerId'],
  });

  // Queue notification for each user
  for (const ticket of tickets) {
    await this.queuesService.addJob(
      QueueName.NOTIFICATION,
      'send-notification',
      {
        userId: ticket.ownerId,
        type: this.mapAnnouncementTypeToNotificationType(announcement.type),
        title: `Event Update: ${announcement.title}`,
        message: announcement.message,
        channels: announcement.type === 'urgent' || announcement.type === 'important'
          ? ['in_app', 'email', 'push']
          : ['in_app'],
        category: NotificationCategory.event,
        actionUrl: `/events/${announcement.eventId}`,
        actionText: 'View Event',
      },
    );
  }
}
```

### 2.2 Update Announcements Controller

**File**: `api/src/announcements/announcements.controller.ts`

**New Endpoints**:
```typescript
// Analytics & tracking
@Post(':announcementId/view')
@UseGuards(JwtAuthGuard)
trackView(@Param('announcementId') id: string, @CurrentUser() user: any)

@Get('analytics')
@UseGuards(JwtAuthGuard)
getAnalytics(@Param('eventId') eventId: string, @CurrentUser() user: any)

// Dismissal management
@Post(':announcementId/dismiss')
@UseGuards(JwtAuthGuard)
dismiss(@Param('announcementId') id: string, @CurrentUser() user: any)

@Delete(':announcementId/dismiss')
@UseGuards(JwtAuthGuard)
undismiss(@Param('announcementId') id: string, @CurrentUser() user: any)

@Get('dismissed')
@UseGuards(JwtAuthGuard)
getDismissed(@Param('eventId') eventId: string, @CurrentUser() user: any)

// Organizer: Send notification
@Post(':announcementId/notify')
@UseGuards(JwtAuthGuard)
sendNotification(
  @Param('eventId') eventId: string,
  @Param('announcementId') id: string,
  @CurrentUser() user: any
)
```

### 2.3 Create DTO Updates

**File**: `api/src/announcements/dto/create-announcement.dto.ts`

```typescript
export class CreateAnnouncementDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsString()
  message: string;

  @ApiProperty({ enum: AnnouncementType, default: 'info' })
  @IsEnum(AnnouncementType)
  @IsOptional()
  type?: AnnouncementType;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  // NEW: Scheduled publishing
  @ApiProperty({ required: false, description: 'Schedule announcement for future publication' })
  @IsDateString()
  @IsOptional()
  scheduledFor?: string;

  // NEW: Auto-send notification
  @ApiProperty({ required: false, default: false })
  @IsBoolean()
  @IsOptional()
  sendNotification?: boolean;
}
```

### 2.4 Create Event Questions Module

**New Module**: `api/src/event-questions/`

**Structure**:
- `event-questions.module.ts`
- `event-questions.controller.ts`
- `event-questions.service.ts`
- `dto/create-question.dto.ts`
- `dto/update-question.dto.ts`

**Key Endpoints**:
```typescript
// Public (attendees)
POST   /events/:eventId/questions              - Submit question
POST   /events/:eventId/questions/:id/upvote   - Upvote question
GET    /events/:eventId/questions              - List questions (pending only)

// Organizer only
GET    /organizer/events/:eventId/questions    - List all questions with filters
PATCH  /organizer/events/:eventId/questions/:id - Update status/moderator note
POST   /organizer/events/:eventId/questions/:id/convert-to-faq - Convert to FAQ
DELETE /organizer/events/:eventId/questions/:id - Delete question
```

**Service Implementation**:
```typescript
@Injectable()
export class EventQuestionsService {
  constructor(
    private prisma: PrismaService,
    private faqsService: FaqsService,
  ) {}

  async create(eventId: string, userId: string, dto: CreateQuestionDto) {
    // Verify user has a ticket to this event or is a member
    const hasAccess = await this.verifyEventAccess(eventId, userId);
    if (!hasAccess) {
      throw new ForbiddenException('You must have a ticket to ask questions');
    }

    return this.prisma.eventQuestion.create({
      data: {
        eventId,
        userId,
        question: dto.question,
      },
    });
  }

  async convertToFAQ(
    eventId: string,
    questionId: string,
    userId: string,
    answer: string,
  ) {
    // Verify organizer access
    await this.verifyOrganizerAccess(eventId, userId);

    const question = await this.prisma.eventQuestion.findFirst({
      where: { id: questionId, eventId },
    });

    if (!question) {
      throw new NotFoundException('Question not found');
    }

    // Create FAQ and update question in transaction
    return this.prisma.$transaction(async (tx) => {
      const faq = await tx.eventFAQ.create({
        data: {
          eventId,
          question: question.question,
          answer,
          source: 'user_question',
          sourceQuestionId: questionId,
        },
      });

      await tx.eventQuestion.update({
        where: { id: questionId },
        data: { status: 'converted_to_faq' },
      });

      return faq;
    });
  }

  async upvote(questionId: string, userId: string) {
    // Upsert upvote
    await this.prisma.questionUpvote.upsert({
      where: {
        questionId_userId: { questionId, userId },
      },
      create: { questionId, userId },
      update: {}, // No-op if already upvoted
    });

    // Increment upvote count
    await this.prisma.eventQuestion.update({
      where: { id: questionId },
      data: { upvotes: { increment: 1 } },
    });
  }
}
```

### 2.5 Create Scheduled Job Processor

**File**: `api/src/announcements/announcements-scheduler.service.ts`

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../common/prisma/prisma.service';
import { AnnouncementsService } from './announcements.service';

@Injectable()
export class AnnouncementsSchedulerService {
  private readonly logger = new Logger(AnnouncementsSchedulerService.name);

  constructor(
    private prisma: PrismaService,
    private announcementsService: AnnouncementsService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async publishScheduledAnnouncements() {
    const now = new Date();

    // Find announcements scheduled for publication
    const scheduledAnnouncements = await this.prisma.eventAnnouncement.findMany({
      where: {
        scheduledFor: { lte: now },
        publishedAt: null,
        isActive: false, // Draft state
      },
    });

    this.logger.log(`Found ${scheduledAnnouncements.length} announcements to publish`);

    for (const announcement of scheduledAnnouncements) {
      try {
        // Publish announcement
        await this.prisma.eventAnnouncement.update({
          where: { id: announcement.id },
          data: {
            isActive: true,
            publishedAt: now,
          },
        });

        // Send notification if it's important/urgent
        if (announcement.type === 'important' || announcement.type === 'urgent') {
          await this.announcementsService.sendAnnouncementNotification(announcement);
        }

        this.logger.log(`Published announcement ${announcement.id}`);
      } catch (error) {
        this.logger.error(`Failed to publish announcement ${announcement.id}:`, error);
      }
    }
  }
}
```

**Update announcements.module.ts**:
```typescript
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AnnouncementsController } from './announcements.controller';
import { AnnouncementsService } from './announcements.service';
import { AnnouncementsSchedulerService } from './announcements-scheduler.service';
import { CommonModule } from '../common/common.module';
import { QueuesModule } from '../queues/queues.module';

@Module({
  imports: [CommonModule, QueuesModule, ScheduleModule.forRoot()],
  controllers: [AnnouncementsController],
  providers: [AnnouncementsService, AnnouncementsSchedulerService],
  exports: [AnnouncementsService],
})
export class AnnouncementsModule {}
```

### 2.6 Update FAQs Service

**File**: `api/src/faqs/faqs.service.ts`

**New Methods**:
```typescript
async trackView(faqId: string): Promise<void> {
  await this.prisma.eventFAQ.update({
    where: { id: faqId },
    data: { viewCount: { increment: 1 } },
  });
}

async markHelpful(faqId: string): Promise<void> {
  await this.prisma.eventFAQ.update({
    where: { id: faqId },
    data: { helpfulCount: { increment: 1 } },
  });
}

async reorderFAQs(eventId: string, userId: string, faqIds: string[]): Promise<void> {
  await this.verifyEventAccess(eventId, userId);

  // Update sort order for each FAQ
  await this.prisma.$transaction(
    faqIds.map((faqId, index) =>
      this.prisma.eventFAQ.update({
        where: { id: faqId },
        data: { sortOrder: index + 1 },
      }),
    ),
  );
}

async search(eventId: string, query: string): Promise<EventFAQ[]> {
  return this.prisma.eventFAQ.findMany({
    where: {
      eventId,
      isActive: true,
      OR: [
        { question: { contains: query, mode: 'insensitive' } },
        { answer: { contains: query, mode: 'insensitive' } },
      ],
    },
    orderBy: { sortOrder: 'asc' },
  });
}
```

---

## Phase 3: Frontend - Organizer Dashboard UI

### 3.1 Create Announcements Management Page

**File**: `frontend/web-app/app/(organizer)/organizer/events/[eventId]/announcements/page.tsx`

**Features**:
- List all announcements with status badges (active, scheduled, draft)
- Create/Edit/Delete announcements
- Schedule announcements for future publication
- Send immediate notifications
- View analytics (views, dismissals)

**Implementation**:
```typescript
'use client';

import { useState, useEffect } from 'react';
import { Plus, Send, Clock, Eye, XCircle } from 'lucide-react';
import { useOrganizerStore } from '@/lib/stores/organizer-store';
import { organizerApi } from '@/lib/api/organizer-api';
import { Button } from '@/components/ui';
import { EmptyState } from '@/components/organizer/empty-state';
import { AnnouncementForm } from '@/components/organizer/announcements/announcement-form';
import { AnnouncementCard } from '@/components/organizer/announcements/announcement-card';

export default function AnnouncementsPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const { currentOrganization } = useOrganizerStore();
  const [announcements, setAnnouncements] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    loadAnnouncements();
  }, [currentOrganization, eventId]);

  const loadAnnouncements = async () => {
    const data = await organizerApi.announcements.list(eventId, currentOrganization.id, {
      includeInactive: true,
      includeScheduled: true,
    });
    setAnnouncements(data);
  };

  const handleCreate = async (data: CreateAnnouncementDto) => {
    await organizerApi.announcements.create(eventId, currentOrganization.id, data);
    await loadAnnouncements();
    setShowForm(false);
  };

  const handleSendNotification = async (announcementId: string) => {
    await organizerApi.announcements.sendNotification(eventId, announcementId, currentOrganization.id);
    toast.success('Notifications sent to all ticket holders');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Event Announcements</h1>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Announcement
        </Button>
      </div>

      {showForm && (
        <AnnouncementForm
          onSubmit={handleCreate}
          onCancel={() => setShowForm(false)}
        />
      )}

      {announcements.length === 0 ? (
        <EmptyState
          title="No announcements yet"
          description="Create your first announcement to keep attendees informed"
        />
      ) : (
        <div className="space-y-4">
          {announcements.map((announcement) => (
            <AnnouncementCard
              key={announcement.id}
              announcement={announcement}
              onEdit={() => setEditingId(announcement.id)}
              onDelete={() => handleDelete(announcement.id)}
              onSendNotification={() => handleSendNotification(announcement.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
```

### 3.2 Create Announcement Form Component

**File**: `frontend/web-app/components/organizer/announcements/announcement-form.tsx`

**Features**:
- Title and message inputs
- Type selection (info, warning, important, urgent)
- Scheduled publishing with date/time picker
- Auto-send notification checkbox
- Preview before publishing

### 3.3 Create FAQs Management Page

**File**: `frontend/web-app/app/(organizer)/organizer/events/[eventId]/faqs/page.tsx`

**Features**:
- Drag-and-drop reordering
- Create/Edit/Delete FAQs
- Rich text editor for answers (using React Markdown or simple textarea)
- Toggle active/inactive
- View analytics (views, helpful count)
- Search bar

**Implementation**:
```typescript
'use client';

import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Plus, GripVertical, Eye, ThumbsUp } from 'lucide-react';
import { useOrganizerStore } from '@/lib/stores/organizer-store';
import { organizerApi } from '@/lib/api/organizer-api';
import { Button } from '@/components/ui';
import { FAQForm } from '@/components/organizer/faqs/faq-form';
import { FAQCard } from '@/components/organizer/faqs/faq-card';

export default function FAQsPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const { currentOrganization } = useOrganizerStore();
  const [faqs, setFaqs] = useState([]);
  const [showForm, setShowForm] = useState(false);

  const handleDragEnd = async (result: any) => {
    if (!result.destination) return;

    const items = Array.from(faqs);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setFaqs(items);

    // Update order on backend
    await organizerApi.faqs.reorder(
      eventId,
      currentOrganization.id,
      items.map(faq => faq.id)
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Event FAQs</h1>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add FAQ
        </Button>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="faqs">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
              {faqs.map((faq, index) => (
                <Draggable key={faq.id} draggableId={faq.id} index={index}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className="relative"
                    >
                      <div {...provided.dragHandleProps} className="absolute left-2 top-1/2 -translate-y-1/2">
                        <GripVertical className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <FAQCard faq={faq} onEdit={() => {}} onDelete={() => {}} />
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}
```

### 3.4 Create User Questions Management Page

**File**: `frontend/web-app/app/(organizer)/organizer/events/[eventId]/questions/page.tsx`

**Features**:
- List all user-submitted questions
- Filter by status (pending, answered, converted, dismissed)
- Sort by upvotes, date
- Quick actions: Convert to FAQ, Dismiss, Mark as answered
- Moderator notes

### 3.5 Update Event Detail Navigation

**File**: `frontend/web-app/components/organizer/events/event-detail-content.tsx`

Add quick links:
```typescript
const quickLinks = [
  // ... existing links
  { href: `/organizer/events/${eventId}/announcements`, icon: Megaphone, label: 'Announcements' },
  { href: `/organizer/events/${eventId}/faqs`, icon: HelpCircle, label: 'FAQs' },
  { href: `/organizer/events/${eventId}/questions`, icon: MessageSquare, label: 'Questions' },
];
```

### 3.6 Update API Client

**File**: `frontend/web-app/lib/api/organizer-api.ts`

Add new API methods:
```typescript
export const organizerApi = {
  // ... existing methods

  announcements: {
    list: (eventId: string, orgId: string, params?: { includeInactive?: boolean; includeScheduled?: boolean }) =>
      apiClient.get(`/organizer/events/${eventId}/announcements?orgId=${orgId}`, { params }),
    get: (eventId: string, announcementId: string, orgId: string) =>
      apiClient.get(`/organizer/events/${eventId}/announcements/${announcementId}?orgId=${orgId}`),
    create: (eventId: string, orgId: string, data: CreateAnnouncementDto) =>
      apiClient.post(`/organizer/events/${eventId}/announcements?orgId=${orgId}`, data),
    update: (eventId: string, announcementId: string, orgId: string, data: UpdateAnnouncementDto) =>
      apiClient.patch(`/organizer/events/${eventId}/announcements/${announcementId}?orgId=${orgId}`, data),
    delete: (eventId: string, announcementId: string, orgId: string) =>
      apiClient.delete(`/organizer/events/${eventId}/announcements/${announcementId}?orgId=${orgId}`),
    sendNotification: (eventId: string, announcementId: string, orgId: string) =>
      apiClient.post(`/organizer/events/${eventId}/announcements/${announcementId}/notify?orgId=${orgId}`),
    getAnalytics: (eventId: string, orgId: string) =>
      apiClient.get(`/organizer/events/${eventId}/announcements/analytics?orgId=${orgId}`),
  },

  faqs: {
    list: (eventId: string, orgId: string, includeInactive = false) =>
      apiClient.get(`/organizer/events/${eventId}/faqs?orgId=${orgId}&includeInactive=${includeInactive}`),
    create: (eventId: string, orgId: string, data: CreateFaqDto) =>
      apiClient.post(`/organizer/events/${eventId}/faqs?orgId=${orgId}`, data),
    update: (eventId: string, faqId: string, orgId: string, data: UpdateFaqDto) =>
      apiClient.patch(`/organizer/events/${eventId}/faqs/${faqId}?orgId=${orgId}`, data),
    delete: (eventId: string, faqId: string, orgId: string) =>
      apiClient.delete(`/organizer/events/${eventId}/faqs/${faqId}?orgId=${orgId}`),
    reorder: (eventId: string, orgId: string, faqIds: string[]) =>
      apiClient.post(`/organizer/events/${eventId}/faqs/reorder?orgId=${orgId}`, { faqIds }),
  },

  questions: {
    list: (eventId: string, orgId: string, status?: string) =>
      apiClient.get(`/organizer/events/${eventId}/questions?orgId=${orgId}${status ? `&status=${status}` : ''}`),
    update: (eventId: string, questionId: string, orgId: string, data: UpdateQuestionDto) =>
      apiClient.patch(`/organizer/events/${eventId}/questions/${questionId}?orgId=${orgId}`, data),
    convertToFAQ: (eventId: string, questionId: string, orgId: string, answer: string) =>
      apiClient.post(`/organizer/events/${eventId}/questions/${questionId}/convert-to-faq?orgId=${orgId}`, { answer }),
    delete: (eventId: string, questionId: string, orgId: string) =>
      apiClient.delete(`/organizer/events/${eventId}/questions/${questionId}?orgId=${orgId}`),
  },
};
```

---

## Phase 4: Frontend - Public Attendee Features

### 4.1 Update Event Announcements Component

**File**: `frontend/web-app/components/event-detail/event-announcements.tsx`

**Enhancements**:
1. Track views when component mounts
2. Persist dismissed state to backend
3. Load dismissed announcements on mount
4. Show read receipts indicator

```typescript
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/use-auth';
import { fetchEventAnnouncements, trackAnnouncementView, dismissAnnouncement, getDismissedAnnouncements } from '@/lib/events';

export function EventAnnouncements({ eventId, className }: EventAnnouncementsProps) {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<EventAnnouncement[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const [announcementsData, dismissedIds] = await Promise.all([
        fetchEventAnnouncements(eventId),
        user ? getDismissedAnnouncements(eventId, user.id) : Promise.resolve([]),
      ]);

      setAnnouncements(announcementsData);
      setDismissed(new Set(dismissedIds));

      // Track views for all visible announcements
      if (user) {
        for (const announcement of announcementsData) {
          if (!dismissedIds.includes(announcement.id)) {
            await trackAnnouncementView(announcement.id, user.id);
          }
        }
      }

      setLoading(false);
    }
    loadData();
  }, [eventId, user]);

  const handleDismiss = async (announcementId: string) => {
    if (!user) {
      // Guest users: client-side only
      setDismissed(prev => new Set(prev).add(announcementId));
      return;
    }

    // Logged-in users: persist to backend
    await dismissAnnouncement(announcementId, user.id);
    setDismissed(prev => new Set(prev).add(announcementId));
  };

  const visibleAnnouncements = announcements.filter(a => !dismissed.has(a.id));

  // ... rest of component
}
```

### 4.2 Update Event FAQ Component

**File**: `frontend/web-app/components/event-detail/event-faq.tsx`

**Enhancements**:
1. Add search bar at top
2. Track view count when FAQ is expanded
3. Add "Was this helpful?" button
4. Show view count and helpful count

```typescript
'use client';

import { useState, useEffect } from 'react';
import { Search, ThumbsUp } from 'lucide-react';
import { fetchEventFAQs, trackFAQView, markFAQHelpful, searchFAQs } from '@/lib/events';

export function EventFAQ({ eventId, className }: EventFAQProps) {
  const [faqs, setFaqs] = useState<EventFAQItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [markedHelpful, setMarkedHelpful] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadFAQs();
  }, [eventId, searchQuery]);

  const loadFAQs = async () => {
    if (searchQuery.trim()) {
      const results = await searchFAQs(eventId, searchQuery);
      setFaqs(results);
    } else {
      const data = await fetchEventFAQs(eventId);
      setFaqs(data);
    }
  };

  const handleToggle = async (index: number, faqId: string) => {
    if (openIndex !== index) {
      // Track view when expanding
      await trackFAQView(faqId);
      setOpenIndex(index);
    } else {
      setOpenIndex(null);
    }
  };

  const handleMarkHelpful = async (faqId: string) => {
    await markFAQHelpful(faqId);
    setMarkedHelpful(prev => new Set(prev).add(faqId));
  };

  return (
    <div className={className}>
      {/* Search Bar */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search FAQs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded"
          />
        </div>
      </div>

      {/* FAQ List */}
      <div className="space-y-3">
        {faqs.map((faq, index) => (
          <div key={faq.id} className="border rounded">
            <button
              onClick={() => handleToggle(index, faq.id)}
              className="w-full text-left p-4 flex justify-between items-center hover:bg-muted/50"
            >
              <span className="font-medium">{faq.question}</span>
              <ChevronDown className={`w-5 h-5 transition-transform ${openIndex === index ? 'rotate-180' : ''}`} />
            </button>

            {openIndex === index && (
              <div className="p-4 border-t bg-muted/20">
                <div className="prose prose-sm max-w-none mb-4">
                  {faq.answer}
                </div>

                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{faq.viewCount} views • {faq.helpfulCount} found helpful</span>

                  {!markedHelpful.has(faq.id) && (
                    <button
                      onClick={() => handleMarkHelpful(faq.id)}
                      className="flex items-center gap-1 text-primary hover:underline"
                    >
                      <ThumbsUp className="w-4 h-4" />
                      Helpful
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 4.3 Create Ask Question Component

**File**: `frontend/web-app/components/event-detail/ask-question.tsx`

**Features**:
- Text area for question
- Submit button
- Show list of existing questions with upvote functionality
- "Your question has been submitted" confirmation

```typescript
'use client';

import { useState } from 'react';
import { MessageSquare, ThumbsUp, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui';
import { useAuth } from '@/lib/hooks/use-auth';
import { submitEventQuestion, upvoteQuestion } from '@/lib/events';
import toast from 'react-hot-toast';

export function AskQuestion({ eventId }: { eventId: string }) {
  const { user, isAuthenticated } = useAuth();
  const [question, setQuestion] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [upvoted, setUpvoted] = useState<Set<string>>(new Set());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error('Please log in to submit a question');
      return;
    }

    setSubmitting(true);
    try {
      await submitEventQuestion(eventId, user.id, question);
      toast.success('Question submitted! The organizer will review it.');
      setQuestion('');
    } catch (error) {
      toast.error('Failed to submit question');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpvote = async (questionId: string) => {
    if (!isAuthenticated) {
      toast.error('Please log in to upvote');
      return;
    }

    await upvoteQuestion(questionId, user.id);
    setUpvoted(prev => new Set(prev).add(questionId));
  };

  return (
    <div className="rounded border bg-card p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <MessageSquare className="w-5 h-5" />
        Have a Question?
      </h3>

      <form onSubmit={handleSubmit} className="mb-6">
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask the organizer..."
          className="w-full border rounded p-3 mb-3"
          rows={3}
          disabled={!isAuthenticated}
        />
        <Button type="submit" disabled={submitting || !question.trim()}>
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Question'}
        </Button>
        {!isAuthenticated && (
          <p className="text-sm text-muted-foreground mt-2">
            Please log in to ask questions
          </p>
        )}
      </form>

      {/* Existing questions could be shown here */}
    </div>
  );
}
```

### 4.4 Update Event Content Tabs

**File**: `frontend/web-app/components/event-detail/event-content-tabs.tsx`

Add "Ask a Question" section in FAQs tab:
```typescript
{/* FAQs Tab */}
{activeTab === 'faqs' && (
  <div className="space-y-8">
    <EventFAQ eventId={summary.id} />
    <AskQuestion eventId={summary.id} />
  </div>
)}
```

---

## Phase 5: Analytics Dashboard

### 5.1 Create Analytics Types

**File**: `frontend/web-app/lib/types/organizer.ts`

```typescript
export interface AnnouncementAnalytics {
  totalAnnouncements: number;
  activeAnnouncements: number;
  scheduledAnnouncements: number;

  totalViews: number;
  uniqueViewers: number;
  totalDismissals: number;

  byType: {
    type: string;
    count: number;
    views: number;
  }[];

  topAnnouncements: {
    id: string;
    title: string;
    views: number;
    dismissals: number;
    engagementRate: number; // (views / ticket holders) * 100
  }[];
}

export interface FAQAnalytics {
  totalFAQs: number;
  activeFAQs: number;

  totalViews: number;
  totalHelpful: number;
  avgHelpfulRate: number;

  topFAQs: {
    id: string;
    question: string;
    views: number;
    helpfulCount: number;
    helpfulRate: number;
  }[];
}

export interface QuestionAnalytics {
  totalQuestions: number;
  pendingQuestions: number;
  convertedToFAQs: number;

  topQuestions: {
    id: string;
    question: string;
    upvotes: number;
    status: string;
  }[];
}
```

### 5.2 Create Analytics Page

**File**: `frontend/web-app/app/(organizer)/organizer/events/[eventId]/analytics/communications/page.tsx`

Display:
- Announcements overview (total, active, scheduled)
- Top announcements by engagement
- FAQs overview (total, views, helpful rate)
- Top FAQs by views
- User questions overview (pending, converted)
- Charts showing engagement over time

---

## Phase 6: Testing & Seed Data

### 6.1 Update Seed Script

**File**: `api/prisma/seed-announcements-faqs.ts`

Add:
- Scheduled announcements
- User questions
- Announcement views/dismissals
- FAQ view counts

### 6.2 Create E2E Tests

**Files**:
- `api/test/announcements.e2e-spec.ts`
- `api/test/faqs.e2e-spec.ts`
- `api/test/event-questions.e2e-spec.ts`

Test scenarios:
- CRUD operations
- Scheduled publishing
- Permission checks
- Analytics tracking
- Notification sending

---

## Migration Strategy

### Step 1: Database Migration
```bash
npx prisma db push
npx prisma generate
```

### Step 2: Backend Implementation Order
1. Update schema models
2. Create scheduler service
3. Update announcements service & controller
4. Update FAQs service & controller
5. Create event-questions module
6. Add organizer endpoints
7. Test with Postman/curl

### Step 3: Frontend Implementation Order
1. Update API client
2. Create organizer management pages
3. Update public components
4. Add analytics dashboard
5. Test end-to-end

### Step 4: Data Migration (if needed)
If existing announcements/FAQs need migration:
```sql
-- Set default values for new fields
UPDATE event_announcements SET view_count = 0, published_at = created_at WHERE published_at IS NULL;
UPDATE event_faqs SET view_count = 0, helpful_count = 0, source = 'organizer' WHERE source IS NULL;
```

---

## Dependencies to Install

### Backend
```bash
cd api
npm install @nestjs/schedule  # Already installed
# No new dependencies needed, all features use existing packages
```

### Frontend
```bash
cd frontend/web-app
npm install @hello-pangea/dnd  # For drag-and-drop FAQ reordering
npm install react-markdown     # For rich text display (may already be installed)
```

---

## Performance Considerations

1. **Indexing**: All new tables have proper indexes for query performance
2. **Caching**: Consider caching FAQ list with Redis (30s TTL)
3. **Pagination**: Add pagination to questions list (use existing pattern)
4. **Batch Notifications**: Queue notifications in batches of 100 users
5. **Analytics**: Consider pre-computing analytics daily for large events

---

## Security Considerations

1. **Permission Checks**: All organizer endpoints verify organization membership
2. **Rate Limiting**: Limit user question submissions (5 per hour per user)
3. **Input Validation**: All DTOs use class-validator
4. **SQL Injection**: Prisma ORM prevents SQL injection
5. **XSS Protection**: React auto-escapes content, markdown renderer sanitizes HTML

---

## Estimated Implementation Timeline

- **Phase 1** (Database): 2-3 hours
- **Phase 2** (Backend API): 8-10 hours
- **Phase 3** (Organizer Dashboard): 12-15 hours
- **Phase 4** (Public Features): 6-8 hours
- **Phase 5** (Analytics): 4-6 hours
- **Phase 6** (Testing): 4-6 hours

**Total**: ~36-48 hours of development time

---

## Success Metrics

After implementation, track:
- Organizer adoption rate (% of events using announcements/FAQs)
- Average announcements per event
- Average FAQs per event
- User question submission rate
- Conversion rate (questions → FAQs)
- Notification open rate
- FAQ search usage
- Engagement rates (views, helpful clicks)

---

## Future Enhancements (Post-MVP)

1. **Rich Text Editor**: Integrate TipTap or similar WYSIWYG editor
2. **A/B Testing**: Test different announcement messages
3. **Multi-language FAQs**: Support translations
4. **AI-powered**: Auto-suggest FAQ answers based on past events
5. **Announcement Templates**: Pre-built announcement templates
6. **FAQ Categories**: Group FAQs by topic
7. **Live Chat**: Escalate questions to live support
8. **Mobile Push**: Native push notifications for mobile apps

---

## Rollback Plan

If issues arise:
1. Disable scheduler: Comment out `@Cron` decorator in announcements-scheduler
2. Hide UI: Remove quick links from organizer dashboard
3. Rollback migration: Run `npx prisma migrate reset` (development only)
4. Restore backup: Restore database from backup (production)
