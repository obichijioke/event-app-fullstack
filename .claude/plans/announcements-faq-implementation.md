# Event Announcements & FAQ Tab Implementation Plan

## Overview
Implement real Event Announcements (remove mock data) and move FAQ section to its own dedicated tab instead of being in the Overview tab.

## Current State Analysis

### Announcements (Currently Mock Data)
- **Location**: `frontend/web-app/components/event-detail/event-announcements.tsx`
- **Status**: Uses hardcoded `defaultAnnouncements` array with 2 mock items
- **Display**: Shows on all tabs in the event details page
- **Issue**: No backend support, no database model

### FAQ (Currently in Overview Tab)
- **Location**: `frontend/web-app/components/event-detail/event-faq.tsx`
- **Status**: Uses hardcoded `defaultFAQs` array with 8 generic questions
- **Display**: Rendered in `event-overview.tsx` within Overview tab
- **Issue**: Not customizable per event, should be in separate tab

### Database Schema
- ✅ No existing `Announcement` or `FAQ` models in schema
- ✅ Event model exists with comprehensive relations
- ✅ Review system implemented (good pattern to follow)

### Backend Architecture
- ✅ NestJS with modular structure
- ✅ Events module exists (`api/src/events/`)
- ✅ Reviews module exists as reference pattern (`api/src/reviews/`)
- ✅ Follows RESTful patterns with DTOs and validation

---

## Implementation Plan

## Phase 1: Database Schema Changes

### 1.1 Create EventAnnouncement Model
Add to `api/prisma/schema.prisma`:

```prisma
enum AnnouncementType {
  info
  warning
  important
  urgent
}

model EventAnnouncement {
  id        String             @id @default(cuid())
  eventId   String             @map("event_id")
  title     String
  message   String
  type      AnnouncementType   @default(info)
  isActive  Boolean            @default(true) @map("is_active")
  createdAt DateTime           @default(now()) @map("created_at")
  updatedAt DateTime           @updatedAt @map("updated_at")

  // Relations
  event     Event              @relation(fields: [eventId], references: [id], onDelete: Cascade)

  @@index([eventId, createdAt(sort: Desc)])
  @@index([eventId, isActive])
  @@map("event_announcements")
}
```

### 1.2 Create EventFAQ Model
Add to `api/prisma/schema.prisma`:

```prisma
model EventFAQ {
  id        String   @id @default(cuid())
  eventId   String   @map("event_id")
  question  String
  answer    String
  sortOrder Int      @default(0) @map("sort_order")
  isActive  Boolean  @default(true) @map("is_active")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  // Relations
  event     Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)

  @@index([eventId, sortOrder])
  @@index([eventId, isActive])
  @@map("event_faqs")
}
```

### 1.3 Update Event Model Relations
Add to Event model's relations section:

```prisma
model Event {
  // ... existing fields

  // Relations
  // ... existing relations
  announcements      EventAnnouncement[]
  faqs               EventFAQ[]

  // ... rest of model
}
```

### 1.4 Run Migration
```bash
cd api
npx prisma migrate dev --name add_event_announcements_and_faqs
npx prisma generate
```

---

## Phase 2: Backend Implementation

### 2.1 Create Announcements Module

**File**: `api/src/announcements/dto/create-announcement.dto.ts`
```typescript
import { IsString, IsEnum, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum AnnouncementType {
  info = 'info',
  warning = 'warning',
  important = 'important',
  urgent = 'urgent',
}

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

  @ApiProperty({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
```

**File**: `api/src/announcements/dto/update-announcement.dto.ts`
```typescript
import { PartialType } from '@nestjs/swagger';
import { CreateAnnouncementDto } from './create-announcement.dto';

export class UpdateAnnouncementDto extends PartialType(CreateAnnouncementDto) {}
```

**File**: `api/src/announcements/announcements.service.ts`
```typescript
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';

@Injectable()
export class AnnouncementsService {
  constructor(private prisma: PrismaService) {}

  async create(eventId: string, userId: string, dto: CreateAnnouncementDto) {
    // Verify user has permission for this event
    await this.verifyEventAccess(eventId, userId);

    return this.prisma.eventAnnouncement.create({
      data: {
        eventId,
        title: dto.title,
        message: dto.message,
        type: dto.type || 'info',
        isActive: dto.isActive ?? true,
      },
    });
  }

  async findByEvent(eventId: string, includeInactive = false) {
    const where: any = { eventId };
    if (!includeInactive) {
      where.isActive = true;
    }

    return this.prisma.eventAnnouncement.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(eventId: string, announcementId: string, userId: string, dto: UpdateAnnouncementDto) {
    await this.verifyEventAccess(eventId, userId);

    const announcement = await this.prisma.eventAnnouncement.findFirst({
      where: { id: announcementId, eventId },
    });

    if (!announcement) {
      throw new NotFoundException('Announcement not found');
    }

    return this.prisma.eventAnnouncement.update({
      where: { id: announcementId },
      data: dto,
    });
  }

  async remove(eventId: string, announcementId: string, userId: string) {
    await this.verifyEventAccess(eventId, userId);

    const announcement = await this.prisma.eventAnnouncement.findFirst({
      where: { id: announcementId, eventId },
    });

    if (!announcement) {
      throw new NotFoundException('Announcement not found');
    }

    return this.prisma.eventAnnouncement.delete({
      where: { id: announcementId },
    });
  }

  private async verifyEventAccess(eventId: string, userId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: {
        org: {
          include: {
            members: {
              where: { userId },
            },
          },
        },
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (event.org.members.length === 0) {
      throw new ForbiddenException('You do not have permission to manage this event');
    }
  }
}
```

**File**: `api/src/announcements/announcements.controller.ts`
```typescript
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AnnouncementsService } from './announcements.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Event Announcements')
@Controller('events/:eventId/announcements')
export class AnnouncementsController {
  constructor(private readonly announcementsService: AnnouncementsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create announcement for event (organizer only)' })
  create(
    @CurrentUser() user: any,
    @Param('eventId') eventId: string,
    @Body() dto: CreateAnnouncementDto,
  ) {
    return this.announcementsService.create(eventId, user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all announcements for an event (public)' })
  findAll(
    @Param('eventId') eventId: string,
    @Query('includeInactive') includeInactive?: string,
  ) {
    return this.announcementsService.findByEvent(
      eventId,
      includeInactive === 'true',
    );
  }

  @Patch(':announcementId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update announcement (organizer only)' })
  update(
    @CurrentUser() user: any,
    @Param('eventId') eventId: string,
    @Param('announcementId') announcementId: string,
    @Body() dto: UpdateAnnouncementDto,
  ) {
    return this.announcementsService.update(eventId, announcementId, user.id, dto);
  }

  @Delete(':announcementId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete announcement (organizer only)' })
  remove(
    @CurrentUser() user: any,
    @Param('eventId') eventId: string,
    @Param('announcementId') announcementId: string,
  ) {
    return this.announcementsService.remove(eventId, announcementId, user.id);
  }
}
```

**File**: `api/src/announcements/announcements.module.ts`
```typescript
import { Module } from '@nestjs/common';
import { AnnouncementsController } from './announcements.controller';
import { AnnouncementsService } from './announcements.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AnnouncementsController],
  providers: [AnnouncementsService],
  exports: [AnnouncementsService],
})
export class AnnouncementsModule {}
```

### 2.2 Create FAQs Module

**File**: `api/src/faqs/dto/create-faq.dto.ts`
```typescript
import { IsString, IsInt, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFaqDto {
  @ApiProperty()
  @IsString()
  question: string;

  @ApiProperty()
  @IsString()
  answer: string;

  @ApiProperty({ required: false })
  @IsInt()
  @IsOptional()
  sortOrder?: number;

  @ApiProperty({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
```

**File**: `api/src/faqs/dto/update-faq.dto.ts`
```typescript
import { PartialType } from '@nestjs/swagger';
import { CreateFaqDto } from './create-faq.dto';

export class UpdateFaqDto extends PartialType(CreateFaqDto) {}
```

**File**: `api/src/faqs/faqs.service.ts`
```typescript
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFaqDto } from './dto/create-faq.dto';
import { UpdateFaqDto } from './dto/update-faq.dto';

@Injectable()
export class FaqsService {
  constructor(private prisma: PrismaService) {}

  async create(eventId: string, userId: string, dto: CreateFaqDto) {
    await this.verifyEventAccess(eventId, userId);

    // Get the highest sort order and add 1
    const highestOrder = await this.prisma.eventFAQ.findFirst({
      where: { eventId },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    });

    return this.prisma.eventFAQ.create({
      data: {
        eventId,
        question: dto.question,
        answer: dto.answer,
        sortOrder: dto.sortOrder ?? (highestOrder?.sortOrder ?? 0) + 1,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async findByEvent(eventId: string, includeInactive = false) {
    const where: any = { eventId };
    if (!includeInactive) {
      where.isActive = true;
    }

    return this.prisma.eventFAQ.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
    });
  }

  async update(eventId: string, faqId: string, userId: string, dto: UpdateFaqDto) {
    await this.verifyEventAccess(eventId, userId);

    const faq = await this.prisma.eventFAQ.findFirst({
      where: { id: faqId, eventId },
    });

    if (!faq) {
      throw new NotFoundException('FAQ not found');
    }

    return this.prisma.eventFAQ.update({
      where: { id: faqId },
      data: dto,
    });
  }

  async remove(eventId: string, faqId: string, userId: string) {
    await this.verifyEventAccess(eventId, userId);

    const faq = await this.prisma.eventFAQ.findFirst({
      where: { id: faqId, eventId },
    });

    if (!faq) {
      throw new NotFoundException('FAQ not found');
    }

    return this.prisma.eventFAQ.delete({
      where: { id: faqId },
    });
  }

  private async verifyEventAccess(eventId: string, userId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: {
        org: {
          include: {
            members: {
              where: { userId },
            },
          },
        },
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (event.org.members.length === 0) {
      throw new ForbiddenException('You do not have permission to manage this event');
    }
  }
}
```

**File**: `api/src/faqs/faqs.controller.ts`
```typescript
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FaqsService } from './faqs.service';
import { CreateFaqDto } from './dto/create-faq.dto';
import { UpdateFaqDto } from './dto/update-faq.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Event FAQs')
@Controller('events/:eventId/faqs')
export class FaqsController {
  constructor(private readonly faqsService: FaqsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create FAQ for event (organizer only)' })
  create(
    @CurrentUser() user: any,
    @Param('eventId') eventId: string,
    @Body() dto: CreateFaqDto,
  ) {
    return this.faqsService.create(eventId, user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all FAQs for an event (public)' })
  findAll(
    @Param('eventId') eventId: string,
    @Query('includeInactive') includeInactive?: string,
  ) {
    return this.faqsService.findByEvent(eventId, includeInactive === 'true');
  }

  @Patch(':faqId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update FAQ (organizer only)' })
  update(
    @CurrentUser() user: any,
    @Param('eventId') eventId: string,
    @Param('faqId') faqId: string,
    @Body() dto: UpdateFaqDto,
  ) {
    return this.faqsService.update(eventId, faqId, user.id, dto);
  }

  @Delete(':faqId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete FAQ (organizer only)' })
  remove(
    @CurrentUser() user: any,
    @Param('eventId') eventId: string,
    @Param('faqId') faqId: string,
  ) {
    return this.faqsService.remove(eventId, faqId, user.id);
  }
}
```

**File**: `api/src/faqs/faqs.module.ts`
```typescript
import { Module } from '@nestjs/common';
import { FaqsController } from './faqs.controller';
import { FaqsService } from './faqs.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [FaqsController],
  providers: [FaqsService],
  exports: [FaqsService],
})
export class FaqsModule {}
```

### 2.3 Register Modules in AppModule

**File**: `api/src/app.module.ts`
Add imports:
```typescript
import { AnnouncementsModule } from './announcements/announcements.module';
import { FaqsModule } from './faqs/faqs.module';

@Module({
  imports: [
    // ... existing imports
    AnnouncementsModule,
    FaqsModule,
  ],
  // ... rest
})
```

---

## Phase 3: Frontend Implementation

### 3.1 Update Tab Navigation

**File**: `frontend/web-app/components/event-detail/tab-navigation.tsx`
```typescript
const tabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'tickets', label: 'Tickets' },
  { id: 'venue', label: 'Venue' },
  { id: 'faqs', label: 'FAQs' }, // NEW: Add FAQ tab
  { id: 'reviews', label: 'Reviews' },
];
```

### 3.2 Remove FAQ from Overview

**File**: `frontend/web-app/components/event-detail/event-overview.tsx`
Remove lines 60-61:
```typescript
// DELETE THESE LINES:
{/* FAQ Section */}
<EventFAQ />
```

### 3.3 Update EventContentTabs to Include FAQ Tab

**File**: `frontend/web-app/components/event-detail/event-content-tabs.tsx`
Add after Reviews tab section (around line 133):
```typescript
{/* FAQs Tab */}
{activeTab === 'faqs' && (
  <div className="rounded border border-border bg-card p-6">
    <h2 className="text-xl font-semibold mb-6">Frequently Asked Questions</h2>
    <EventFAQ eventId={summary.id} />
  </div>
)}
```

### 3.4 Create API Client Functions

**File**: `frontend/web-app/lib/events.ts`
Add at the end of the file:
```typescript
// ============================
// Announcements API Functions
// ============================

export interface EventAnnouncement {
  id: string;
  eventId: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'important' | 'urgent';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export async function fetchEventAnnouncements(
  eventId: string
): Promise<EventAnnouncement[]> {
  try {
    const url = new URL(`/api/events/${eventId}/announcements`, API_BASE_URL);

    const response = await fetch(url.toString(), {
      headers: {
        'Content-Type': 'application/json',
      },
      next: { revalidate: 30 },
    });

    if (!response.ok) {
      throw new Error(`Announcements API failed with status ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('[announcements] Failed to fetch announcements', error);
    return [];
  }
}

// ============================
// FAQs API Functions
// ============================

export interface EventFAQItem {
  id: string;
  eventId: string;
  question: string;
  answer: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export async function fetchEventFAQs(eventId: string): Promise<EventFAQItem[]> {
  try {
    const url = new URL(`/api/events/${eventId}/faqs`, API_BASE_URL);

    const response = await fetch(url.toString(), {
      headers: {
        'Content-Type': 'application/json',
      },
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      throw new Error(`FAQs API failed with status ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('[faqs] Failed to fetch FAQs', error);
    return [];
  }
}
```

### 3.5 Update EventAnnouncements Component

**File**: `frontend/web-app/components/event-detail/event-announcements.tsx`
Replace the mock data implementation:
```typescript
'use client';

import { useState, useEffect } from 'react';
import { AlertCircle, Megaphone, X, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { fetchEventAnnouncements, EventAnnouncement } from '@/lib/events';

interface EventAnnouncementsProps {
  eventId: string;
  className?: string;
}

export function EventAnnouncements({ eventId, className }: EventAnnouncementsProps) {
  const [announcements, setAnnouncements] = useState<EventAnnouncement[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAnnouncements() {
      setLoading(true);
      const data = await fetchEventAnnouncements(eventId);
      setAnnouncements(data);
      setLoading(false);
    }
    loadAnnouncements();
  }, [eventId]);

  if (loading) {
    return null; // Or a loading skeleton
  }

  if (announcements.length === 0) {
    return null;
  }

  const visibleAnnouncements = announcements.filter((a) => !dismissed.has(a.id));

  if (visibleAnnouncements.length === 0) {
    return null;
  }

  // ... rest of component remains the same with AnnouncementCard
}
```

### 3.6 Update EventFAQ Component

**File**: `frontend/web-app/components/event-detail/event-faq.tsx`
Replace the mock data implementation:
```typescript
'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Heading } from '@/components/ui';
import { cn } from '@/lib/utils';
import { fetchEventFAQs, EventFAQItem } from '@/lib/events';

interface EventFAQProps {
  eventId: string;
  className?: string;
}

export function EventFAQ({ eventId, className }: EventFAQProps) {
  const [faqs, setFaqs] = useState<EventFAQItem[]>([]);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadFAQs() {
      setLoading(true);
      const data = await fetchEventFAQs(eventId);
      setFaqs(data);
      setLoading(false);
    }
    loadFAQs();
  }, [eventId]);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  if (loading) {
    return (
      <section className={cn('rounded border border-border bg-card p-6', className)}>
        <Heading as="h2" className="text-xl font-semibold mb-6">
          Frequently Asked Questions
        </Heading>
        <p className="text-sm text-muted-foreground">Loading FAQs...</p>
      </section>
    );
  }

  if (faqs.length === 0) {
    return (
      <section className={cn('rounded border border-border bg-card p-6', className)}>
        <Heading as="h2" className="text-xl font-semibold mb-6">
          Frequently Asked Questions
        </Heading>
        <p className="text-sm text-muted-foreground">No FAQs available for this event yet.</p>
      </section>
    );
  }

  return (
    <section className={cn('rounded border border-border bg-card p-6', className)}>
      <Heading as="h2" className="text-xl font-semibold mb-6">
        Frequently Asked Questions
      </Heading>

      <div className="space-y-3">
        {faqs.map((faq, index) => (
          <FAQAccordionItem
            key={faq.id}
            question={faq.question}
            answer={faq.answer}
            isOpen={openIndex === index}
            onToggle={() => toggleFAQ(index)}
          />
        ))}
      </div>

      <div className="mt-6 pt-6 border-t border-border">
        <p className="text-sm text-muted-foreground">
          Have more questions?{' '}
          <button className="text-primary hover:underline font-medium">
            Contact the organizer
          </button>
        </p>
      </div>
    </section>
  );
}

// FAQAccordionItem component remains the same
```

### 3.7 Update EventContentTabs to Pass eventId

**File**: `frontend/web-app/components/event-detail/event-content-tabs.tsx`
Update the component to accept and pass eventId:
```typescript
interface EventContentTabsProps {
  eventId: string; // NEW: Add this
  description: string;
  assets: EventDetailSummary['assets'];
  // ... rest
}

export function EventContentTabs({
  eventId, // NEW: Add this
  description,
  // ... rest
}: EventContentTabsProps) {
  // ...

  {/* Event Announcements - Shown on all tabs */}
  <EventAnnouncements eventId={eventId} /> {/* NEW: Pass eventId */}

  // ... rest of component
}
```

### 3.8 Update Event Details Page

**File**: `frontend/web-app/app/(aa)/events/[id]/page.tsx`
Pass eventId to EventContentTabs:
```typescript
<EventContentTabs
  eventId={summary.id} // NEW: Add this
  description={description}
  assets={assets}
  summary={summary}
  occurrences={occurrences}
  policies={policies}
  tickets={tickets}
  sidebar={/* ... */}
/>
```

---

## Phase 4: Seed Data (Optional but Recommended)

**File**: `api/prisma/seed-announcements-faqs.ts`
```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedAnnouncementsAndFAQs() {
  // Get first event for demo
  const event = await prisma.event.findFirst();

  if (!event) {
    console.log('No events found. Skipping announcements and FAQs seed.');
    return;
  }

  // Seed announcements
  await prisma.eventAnnouncement.createMany({
    data: [
      {
        eventId: event.id,
        title: 'Updated Gate Opening Time',
        message: 'Gates will now open at 5:00 PM instead of 6:00 PM. Please plan your arrival accordingly to avoid crowds.',
        type: 'important',
      },
      {
        eventId: event.id,
        title: 'Parking Information',
        message: 'Additional parking is available at the nearby shopping complex. A free shuttle service will run every 15 minutes.',
        type: 'info',
      },
    ],
  });

  // Seed FAQs
  await prisma.eventFAQ.createMany({
    data: [
      {
        eventId: event.id,
        question: 'What should I bring to the event?',
        answer: 'Please bring your ticket (printed or on your mobile device), a valid ID, and any personal items you may need. Bags may be subject to search upon entry.',
        sortOrder: 1,
      },
      {
        eventId: event.id,
        question: 'Is parking available at the venue?',
        answer: 'Yes, parking is available at the venue. Please arrive early as spaces are limited. Additional parking information will be sent to ticket holders closer to the event date.',
        sortOrder: 2,
      },
      {
        eventId: event.id,
        question: 'What is the refund policy?',
        answer: 'Refund policies vary by event. Please check the "Policies" section for specific refund terms. Generally, tickets are non-refundable unless the event is canceled or rescheduled.',
        sortOrder: 3,
      },
    ],
  });

  console.log('✅ Seeded announcements and FAQs');
}

seedAnnouncementsAndFAQs()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

---

## Testing Checklist

### Backend Tests
- [ ] Create announcement (POST /events/:eventId/announcements)
- [ ] Get announcements (GET /events/:eventId/announcements)
- [ ] Update announcement (PATCH /events/:eventId/announcements/:announcementId)
- [ ] Delete announcement (DELETE /events/:eventId/announcements/:announcementId)
- [ ] Create FAQ (POST /events/:eventId/faqs)
- [ ] Get FAQs (GET /events/:eventId/faqs)
- [ ] Update FAQ (PATCH /events/:eventId/faqs/:faqId)
- [ ] Delete FAQ (DELETE /events/:eventId/faqs/:faqId)
- [ ] Verify organizer-only access for create/update/delete

### Frontend Tests
- [ ] FAQ tab appears in navigation
- [ ] FAQ tab displays event-specific FAQs
- [ ] FAQ accordion expand/collapse works
- [ ] Announcements display on all tabs
- [ ] Announcements can be dismissed
- [ ] Announcements expand/collapse for long messages
- [ ] Empty state shows when no FAQs exist
- [ ] Empty state shows when no announcements exist
- [ ] FAQ removed from Overview tab

---

## Migration Path

1. **Database Migration**: Run Prisma migration
2. **Backend Deploy**: Deploy new announcements and FAQs modules
3. **Seed Data**: Run seed script to populate demo data
4. **Frontend Deploy**: Deploy updated frontend with FAQ tab and real API calls
5. **Verification**: Test on staging environment
6. **Production**: Deploy to production

---

## Future Enhancements (Out of Scope)

- [ ] Organizer dashboard UI for managing announcements/FAQs
- [ ] Schedule announcements for future publication
- [ ] Rich text editor for FAQ answers
- [ ] FAQ categories/grouping
- [ ] FAQ search functionality
- [ ] Analytics: Track which FAQs are most viewed
- [ ] User-submitted questions that organizers can convert to FAQs
- [ ] Email notifications for important announcements
- [ ] Multi-language support for FAQs

---

## Summary

This plan implements:
1. ✅ Real Event Announcements with backend API (removes mock data)
2. ✅ Dedicated FAQ tab (removes from Overview)
3. ✅ Database models for both features
4. ✅ Full CRUD operations with organizer permissions
5. ✅ Public read access for attendees
6. ✅ Clean separation of concerns
7. ✅ Follows existing codebase patterns (Reviews module)
8. ✅ Proper error handling and empty states
