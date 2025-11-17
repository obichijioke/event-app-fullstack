import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  EventCreatorCollaboratorRole,
  EventCreatorDraftStatus,
  EventCreatorEventType,
  EventCreatorSectionStatus,
  EventCreatorSectionType,
  Prisma,
  Visibility,
} from '@prisma/client';
import { randomBytes } from 'crypto';
import { PrismaService } from '../common/prisma/prisma.service';
import { StorageService } from '../common/storage.service';
import { RRule, RRuleSet } from 'rrule';
import { CreateDraftDto } from './dto/create-draft.dto';
import { UpdateDraftSectionDto } from './dto/update-draft-section.dto';
import { PublishDraftDto } from './dto/publish-draft.dto';

type PrismaClientLike = Prisma.TransactionClient | PrismaService;

type SectionPayloadMap = Partial<
  Record<EventCreatorSectionType, Record<string, any>>
>;

const SECTION_ORDER: EventCreatorSectionType[] = [
  EventCreatorSectionType.basics,
  EventCreatorSectionType.story,
  EventCreatorSectionType.tickets,
  EventCreatorSectionType.schedule,
  EventCreatorSectionType.checkout,
];

type DraftWithSections = Prisma.EventCreatorDraftGetPayload<{
  include: {
    sections: true;
    organization: { select: { id: true; name: true } };
    collaborators: { select: { userId: true; role: true } };
  };
}>;

@Injectable()
export class EventCreatorV2Service {
  private readonly previewBaseUrl =
    process.env.FRONTEND_BASE_URL ?? 'http://localhost:4200';

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async createDraft(userId: string, dto: CreateDraftDto) {
    if (dto.templateId && dto.sourceEventId) {
      throw new BadRequestException(
        'Choose a template or a source event, not both.',
      );
    }

    const org = await this.ensureOrgAccess(userId, dto.organizationId);
    const template = dto.templateId
      ? await this.prisma.eventCreatorTemplate.findFirst({
          where: {
            id: dto.templateId,
            organizationId: dto.organizationId,
            isActive: true,
          },
        })
      : null;

    if (dto.templateId && !template) {
      throw new NotFoundException('Template not found or not accessible.');
    }

    const sourceEvent = dto.sourceEventId
      ? await this.prisma.event.findFirst({
          where: { id: dto.sourceEventId, orgId: dto.organizationId },
          include: {
            occurrences: true,
            ticketTypes: true,
            promoCodes: true,
            venue: { select: { timezone: true } },
          },
        })
      : null;

    if (dto.sourceEventId && !sourceEvent) {
      throw new NotFoundException('Source event not found.');
    }

    const templateSections = this.coerceSectionPayloadMap(template?.sections);
    const eventPrefill = sourceEvent
      ? this.buildPrefillFromEvent(sourceEvent)
      : undefined;

    const sectionPayloads = this.mergeSectionPayloads(
      templateSections,
      eventPrefill,
    );

    const draftTitle =
      dto.title ??
      sourceEvent?.title ??
      (template ? `${template.name} draft` : 'Untitled event');

    const visibility = sourceEvent?.visibility ?? Visibility.public;

    return this.prisma.$transaction(async (tx) => {
      const draft = await tx.eventCreatorDraft.create({
        data: {
          organizationId: dto.organizationId,
          ownerUserId: userId,
          eventType: dto.eventType,
          timezone: dto.timezone,
          title: draftTitle,
          visibility,
          status: EventCreatorDraftStatus.draft,
          shortDescription: sourceEvent?.descriptionMd?.slice(0, 160) ?? null,
          coverImageUrl: sourceEvent?.coverImageUrl ?? null,
          activeSection: SECTION_ORDER[0],
        },
      });

      await tx.eventCreatorDraftSection.createMany({
        data: SECTION_ORDER.map((section) => ({
          draftId: draft.id,
          section,
          payload: (sectionPayloads[section] ?? {}) as Prisma.InputJsonValue,
          status: EventCreatorSectionStatus.incomplete,
          errors: [],
        })),
      });

      await tx.eventCreatorDraftCollaborator.create({
        data: {
          draftId: draft.id,
          userId,
          role: EventCreatorCollaboratorRole.owner,
          permissions: ['all'],
        },
      });

      await this.recomputeCompletion(tx, draft.id);

      return this.hydrateDraftById(tx, draft.id);
    });
  }

  async listDrafts(userId: string) {
    const drafts = await this.prisma.eventCreatorDraft.findMany({
      where: {
        OR: [{ ownerUserId: userId }, { collaborators: { some: { userId } } }],
      },
      include: {
        sections: {
          select: { section: true, status: true, updatedAt: true },
        },
        organization: { select: { id: true, name: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return drafts.map((draft) => ({
      id: draft.id,
      organization: draft.organization,
      status: draft.status,
      title: draft.title ?? 'Untitled event',
      completionPercent: draft.completionPercent,
      updatedAt: draft.updatedAt,
      sections: SECTION_ORDER.map((section) => {
        const summary = draft.sections.find(
          (candidate) => candidate.section === section,
        );
        return {
          section,
          status: summary?.status ?? EventCreatorSectionStatus.incomplete,
          updatedAt: summary?.updatedAt ?? draft.updatedAt,
        };
      }),
    }));
  }

  async getDraft(userId: string, draftId: string) {
    await this.ensureDraftAccess(userId, draftId);
    return this.hydrateDraftById(this.prisma, draftId);
  }

  async updateSection(
    userId: string,
    draftId: string,
    section: EventCreatorSectionType,
    dto: UpdateDraftSectionDto,
  ) {
    if (!SECTION_ORDER.includes(section)) {
      throw new BadRequestException(`Unknown section: ${section}`);
    }

    return this.prisma.$transaction(async (tx) => {
      await this.ensureDraftAccess(userId, draftId, tx);

      const data: Prisma.EventCreatorDraftSectionUpdateInput = {
        payload: dto.payload as Prisma.InputJsonValue,
      };

      if (dto.status) {
        data.status = dto.status;
        data.completedAt =
          dto.status === EventCreatorSectionStatus.valid ? new Date() : null;
      }

      if (dto.errors) {
        data.errors = dto.errors as Prisma.InputJsonValue;
      }

      await tx.eventCreatorDraftSection.update({
        where: {
          draftId_section: {
            draftId,
            section,
          },
        },
        data,
      });

      const derivedDraftData: Prisma.EventCreatorDraftUpdateInput = {
        activeSection: section,
        lastAutosavedAt: new Date(),
      };

      if (section === EventCreatorSectionType.basics) {
        const basics = dto.payload ?? {};
        if (typeof basics.title === 'string') {
          derivedDraftData.title = basics.title.slice(0, 180);
        }
        // Auto-generate slug from title if draft has no slug
        if (typeof basics.title === 'string') {
          const title = basics.title;
          const current = await tx.eventCreatorDraft.findUnique({
            where: { id: draftId },
            select: { slug: true, organizationId: true },
          });
          if (current && (!current.slug || current.slug.trim() === '')) {
            const base = this.slugify(title);
            const unique = await this.ensureUniqueSlug(
              tx,
              current.organizationId,
              base,
            );
            derivedDraftData.slug = unique;
          }
        }
        if (typeof basics.shortDescription === 'string') {
          derivedDraftData.shortDescription = basics.shortDescription.slice(
            0,
            280,
          );
        }
        if (typeof basics.visibility === 'string') {
          derivedDraftData.visibility = basics.visibility as Visibility;
        }
        if (typeof basics.coverImageUrl === 'string') {
          derivedDraftData.coverImageUrl = basics.coverImageUrl;
        }
      }
      if (section === EventCreatorSectionType.schedule) {
        const schedulePayload = (dto.payload ?? {}) as any;
        const mode = schedulePayload.mode as string | undefined;
        const timezone = schedulePayload.timezone as string | undefined;
        const rruleStr = schedulePayload.rrule as string | undefined;
        const exceptions =
          (schedulePayload.exceptions as string[] | undefined) || [];
        const occurrences =
          (schedulePayload.occurrences as
            | Array<{ startsAt?: string; endsAt?: string }>
            | undefined) || [];
        const overrides =
          (schedulePayload.overrides as
            | Array<{
                sourceStart?: string;
                startsAt?: string;
                endsAt?: string;
                doorTime?: string;
                capacityOverride?: number;
                venueId?: string;
              }>
            | undefined) || [];

        // Upsert schedule rule
        let rule = await tx.eventCreatorDraftScheduleRule.findFirst({
          where: { draftId },
        });
        if (!rule) {
          rule = await tx.eventCreatorDraftScheduleRule.create({
            data: {
              draftId,
              ruleType: rruleStr
                ? 'recurring'
                : mode === 'multi_day'
                  ? 'multi_day'
                  : 'single',
              timezone: timezone || 'UTC',
              startsAt: occurrences[0]?.startsAt
                ? new Date(occurrences[0].startsAt)
                : new Date(),
              endsAt: occurrences[0]?.endsAt
                ? new Date(occurrences[0].endsAt)
                : null,
              rrule: rruleStr || null,
              exceptions: exceptions as any,
            },
          });
        } else {
          rule = await tx.eventCreatorDraftScheduleRule.update({
            where: { id: rule.id },
            data: {
              ruleType: rruleStr
                ? 'recurring'
                : mode === 'multi_day'
                  ? 'multi_day'
                  : 'single',
              timezone: timezone || rule.timezone,
              startsAt: occurrences[0]?.startsAt
                ? new Date(occurrences[0].startsAt)
                : rule.startsAt,
              endsAt: occurrences[0]?.endsAt
                ? new Date(occurrences[0].endsAt)
                : rule.endsAt,
              rrule: rruleStr || null,
              exceptions: exceptions as any,
            },
          });
        }

        // Clear existing occurrences for this rule
        await tx.eventCreatorDraftScheduleOccurrence.deleteMany({
          where: { scheduleRuleId: rule.id },
        });

        // Materialize occurrences
        let toCreate: Array<{
          startsAt: Date;
          endsAt: Date | null;
          doorTime?: Date | null;
          capacityOverride?: number | null;
          venueId?: string | null;
        }> = [];
        if (rruleStr) {
          try {
            const set = new RRuleSet();
            set.rrule(RRule.fromString(rruleStr));
            for (const ex of exceptions) {
              try {
                set.exdate(new Date(ex));
              } catch {}
            }
            const dtstart = rule.startsAt || new Date();
            const horizon = new Date(
              dtstart.getTime() + 1000 * 60 * 60 * 24 * 365,
            ); // 1 year
            const dates = set.between(dtstart, horizon, true);
            const durationMs =
              rule.endsAt && rule.startsAt
                ? rule.endsAt.getTime() - rule.startsAt.getTime()
                : 0;
            toCreate = dates.slice(0, 500).map((d) => ({
              startsAt: d,
              endsAt:
                durationMs > 0 ? new Date(d.getTime() + durationMs) : null,
              doorTime: null,
              capacityOverride: null,
              venueId: null,
            }));
          } catch {}
        } else if (occurrences.length) {
          toCreate = occurrences
            .filter((o) => o.startsAt)
            .map((o) => ({
              startsAt: new Date(o.startsAt as string),
              endsAt: o.endsAt ? new Date(o.endsAt) : null,
              doorTime: null,
              capacityOverride: null,
              venueId: null,
            }));
        }

        // Apply overrides if provided (match by sourceStart or original startsAt)
        if (overrides.length && toCreate.length) {
          const byKey = new Map<string, (typeof overrides)[number]>();
          for (const o of overrides) {
            if (o.sourceStart)
              byKey.set(new Date(o.sourceStart).toISOString(), o);
          }
          toCreate = toCreate.map((occ) => {
            const key = occ.startsAt.toISOString();
            const ov = byKey.get(key);
            if (!ov) return occ;
            const startsAt = ov.startsAt ? new Date(ov.startsAt) : occ.startsAt;
            const endsAt = ov.endsAt ? new Date(ov.endsAt) : occ.endsAt;
            const doorTime = ov.doorTime
              ? new Date(ov.doorTime)
              : (occ.doorTime ?? null);
            const capacityOverride =
              typeof ov.capacityOverride === 'number'
                ? ov.capacityOverride
                : (occ.capacityOverride ?? null);
            // Persisting venue override directly would require a draft venue mapping.
            // For now do not set a FK to avoid constraint issues.
            return {
              startsAt,
              endsAt,
              doorTime,
              capacityOverride,
              venueId: null,
            };
          });
        }

        if (toCreate.length) {
          await tx.eventCreatorDraftScheduleOccurrence.createMany({
            data: toCreate.map((o) => ({
              scheduleRuleId: rule.id,
              startsAt: o.startsAt,
              endsAt: o.endsAt,
              doorTime: o.doorTime ?? null,
              capacityOverride: o.capacityOverride ?? null,
              venueId: null,
            })),
            skipDuplicates: true,
          });
        }
      }

      await tx.eventCreatorDraft.update({
        where: { id: draftId },
        data: derivedDraftData,
      });

      await this.recomputeCompletion(tx, draftId);

      return this.hydrateDraftById(tx, draftId);
    });
  }

  private slugify(input: string): string {
    return input
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .slice(0, 60);
  }

  private async ensureUniqueSlug(
    tx: PrismaClientLike,
    organizationId: string,
    base: string,
  ): Promise<string> {
    let candidate = base || 'event';
    let suffix = 0;
    // Check drafts for same org
    // Note: No unique constraint at DB level; we enforce best-effort uniqueness here.
    // Also check templates to avoid confusion, although routes may differ.
    while (true) {
      const exists = await (tx as any).eventCreatorDraft.findFirst({
        where: { organizationId, slug: candidate },
        select: { id: true },
      });
      if (!exists) return candidate;
      suffix += 1;
      candidate = `${base}-${suffix + 1}`; // produces -2, -3, ...
    }
  }

  private normalizeTags(input: unknown): string[] {
    const list = Array.isArray(input)
      ? input
      : typeof input === 'string'
        ? input.split(',')
        : [];
    const normalized = new Set<string>();
    for (const raw of list) {
      if (typeof raw !== 'string') continue;
      const tag = raw.trim();
      if (!tag) continue;
      normalized.add(tag.slice(0, 40));
      if (normalized.size >= 10) break;
    }
    return Array.from(normalized);
  }

  async uploadCover(userId: string, draftId: string, file: any) {
    await this.ensureDraftAccess(userId, draftId);
    if (!file || !file.buffer) {
      throw new BadRequestException('No file uploaded');
    }

    const result = await this.storage.uploadFile(
      file.buffer,
      file.originalname,
      file.mimetype,
      `drafts/${draftId}/covers`,
    );

    const updated = await this.prisma.eventCreatorDraft.update({
      where: { id: draftId },
      data: { coverImageUrl: result.url },
      select: { id: true, coverImageUrl: true },
    });

    return { ...updated };
  }

  async checkSlugAvailability(organizationId: string, slug: string) {
    if (!organizationId || !slug) {
      throw new BadRequestException('orgId and slug are required');
    }
    const normalized = slug.trim().toLowerCase();
    const conflictDraft = await this.prisma.eventCreatorDraft.findFirst({
      where: { organizationId, slug: normalized },
      select: { id: true },
    });
    const available = !conflictDraft;
    const suggestions: string[] = [];
    if (!available) {
      for (let i = 1; i <= 3; i++) suggestions.push(`${normalized}-${i}`);
    }
    return { available, suggestions };
  }

  async listVersions(userId: string, draftId: string) {
    await this.ensureDraftAccess(userId, draftId);
    const items = await this.prisma.eventCreatorDraftVersion.findMany({
      where: { draftId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        section: true,
        reason: true,
        createdAt: true,
        createdBy: true,
      },
    });
    return items;
  }

  async snapshot(
    userId: string,
    draftId: string,
    section?: EventCreatorSectionType,
    reason?: string,
  ) {
    await this.ensureDraftAccess(userId, draftId);
    const payload = section
      ? await this.prisma.eventCreatorDraftSection.findUnique({
          where: { draftId_section: { draftId, section } },
          select: { payload: true },
        })
      : { payload: await this.hydrateDraftById(this.prisma, draftId) };
    const created = await this.prisma.eventCreatorDraftVersion.create({
      data: {
        draftId,
        section: section ?? null,
        payload: payload?.payload ?? {},
        createdBy: userId,
        reason: reason ?? 'manual',
      },
      select: { id: true, createdAt: true },
    });
    return created;
  }

  async restore(userId: string, draftId: string, versionId: string) {
    await this.ensureDraftAccess(userId, draftId);
    const version = await this.prisma.eventCreatorDraftVersion.findFirst({
      where: { id: versionId, draftId },
    });
    if (!version) throw new NotFoundException('Version not found');
    if (version.section) {
      await this.prisma.eventCreatorDraftSection.update({
        where: { draftId_section: { draftId, section: version.section } },
        data: { payload: version.payload as unknown as Prisma.InputJsonValue },
      });
    } else {
      // If full snapshot, do not overwrite structure; client may handle full restore later
    }
    return this.hydrateDraftById(this.prisma, draftId);
  }

  async generatePreview(userId: string, draftId: string) {
    await this.ensureDraftAccess(userId, draftId);
    const previewToken = randomBytes(16).toString('hex');
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 2); // 2 hours

    const draft = await this.prisma.eventCreatorDraft.update({
      where: { id: draftId },
      data: {
        previewToken,
        previewTokenExpiresAt: expiresAt,
      },
      select: {
        id: true,
        previewToken: true,
        previewTokenExpiresAt: true,
      },
    });

    return {
      ...draft,
      previewUrl: `${this.previewBaseUrl}/events/preview/${draft.id}?token=${previewToken}`,
    };
  }

  async publishDraft(userId: string, draftId: string, dto: PublishDraftDto) {
    await this.ensureDraftAccess(userId, draftId);

    const draft = await this.prisma.eventCreatorDraft.findUnique({
      where: { id: draftId },
      include: { sections: true },
    });
    if (!draft) throw new NotFoundException('Draft not found');

    // Prevent duplicate publishing: check if already published/scheduled
    if (
      draft.status === EventCreatorDraftStatus.published ||
      draft.status === EventCreatorDraftStatus.scheduled
    ) {
      // Idempotent response: return existing event info
      if (draft.eventId) {
        const existingEvent = await this.prisma.event.findUnique({
          where: { id: draft.eventId },
          select: { id: true, status: true, publishAt: true },
        });

        if (existingEvent) {
          return {
            id: draft.id,
            eventId: existingEvent.id,
            status: draft.status,
            targetPublishAt: draft.targetPublishAt,
            message: 'Event already published',
          };
        }
      }

      throw new BadRequestException({
        message: 'Draft has already been published',
        status: draft.status,
      });
    }

    const sections = draft.sections;
    const incomplete = sections.filter(
      (section) => section.status !== EventCreatorSectionStatus.valid,
    );

    if (incomplete.length) {
      throw new BadRequestException({
        message: 'Complete all sections before publishing.',
        blockingSections: incomplete.map((section) => section.section),
      });
    }

    // Gather payloads
    const basics = sections.find((s) => s.section === 'basics')?.payload as any;
    const story = sections.find((s) => s.section === 'story')?.payload as any;
    const tickets = sections.find((s) => s.section === 'tickets')
      ?.payload as any;

    // Find occurrences from materialized table or fall back to payload
    const rule = await this.prisma.eventCreatorDraftScheduleRule.findFirst({
      where: { draftId },
    });
    const occs = rule
      ? await this.prisma.eventCreatorDraftScheduleOccurrence.findMany({
          where: { scheduleRuleId: rule.id },
          orderBy: { startsAt: 'asc' },
        })
      : [];
    let occurrences = occs;
    if (!occurrences.length) {
      const schedulePayload = sections.find((s) => s.section === 'schedule')
        ?.payload as any;
      const fromPayload =
        (schedulePayload?.occurrences as
          | Array<{ startsAt?: string; endsAt?: string }>
          | undefined) || [];
      occurrences = fromPayload
        .filter((o) => o.startsAt)
        .map((o) => ({
          startsAt: new Date(o.startsAt as string),
          endsAt: o.endsAt ? new Date(o.endsAt) : null,
        })) as any;
    }
    if (!occurrences.length) {
      throw new BadRequestException('No schedule occurrences found');
    }

    const first = occurrences[0];
    const startAt = first.startsAt;
    const endAt = first.endsAt;

    const targetPublishAt = dto.publishAt ? new Date(dto.publishAt) : null;
    const liveNow = !targetPublishAt || targetPublishAt <= new Date();

    // Create Event and associated data
    // Note: Database unique constraint on eventId prevents duplicate events
    let created;
    try {
      created = await this.prisma.$transaction(async (tx) => {
        const event = await tx.event.create({
          data: {
            orgId: draft.organizationId,
            title: draft.title || basics?.title || 'Untitled event',
            descriptionMd: story?.description || null,
            status: liveNow ? 'live' : 'pending',
            visibility: dto.visibility || basics?.visibility || draft.visibility,
            categoryId: basics?.categoryId || null,
            startAt,
            endAt: endAt || new Date(startAt.getTime() + 2 * 60 * 60 * 1000),
            coverImageUrl: draft.coverImageUrl || basics?.coverImageUrl || null,
            publishAt: targetPublishAt,
            language: basics?.language || null,
            tags: this.normalizeTags(basics?.tags),
          },
        });

      // Policies (from story payload)
      const refundPolicy: string | null =
        (story?.refundPolicy as string) || null;
      const transferEnabled: boolean =
        (story?.transferEnabled as boolean) ?? true;
      const cutoffKey: string | undefined = story?.transferCutoff as
        | string
        | undefined;
      // Map UI cutoff values to hours string expected by TicketsService (parseInt)
      const cutoffHours: string | undefined = (() => {
        switch (cutoffKey) {
          case '2h':
            return '2';
          case '24h':
            return '24';
          case '48h':
            return '48';
          case '72h':
            return '72';
          case '7d':
            return '168';
          case 'at_start':
            return '0';
          default:
            return undefined;
        }
      })();
      const resaleAllowed: boolean | undefined = story?.resaleEnabled as
        | boolean
        | undefined;

      await tx.eventPolicies.upsert({
        where: { eventId: event.id },
        update: {
          refundPolicy: refundPolicy ?? undefined,
          transferAllowed: transferEnabled,
          transferCutoff: cutoffHours,
          resaleAllowed: resaleAllowed ?? undefined,
        },
        create: {
          eventId: event.id,
          refundPolicy: refundPolicy ?? undefined,
          transferAllowed: transferEnabled,
          transferCutoff: cutoffHours,
          resaleAllowed: resaleAllowed ?? false,
        },
      });

      // Occurrences
      for (const o of occurrences) {
        await tx.eventOccurrence.create({
          data: {
            eventId: event.id,
            startsAt: o.startsAt,
            endsAt: (o as any).endsAt || null,
            gateOpenAt: (o as any).doorTime || null,
          },
        });
      }

      // Tickets
      const ticketTypes = (tickets?.ticketTypes as any[]) || [];
      for (const t of ticketTypes) {
        const priceCents =
          typeof t.priceCents === 'number'
            ? t.priceCents
            : t.kind === 'free'
              ? 0
              : 0;
        const capacity = typeof t.quantity === 'number' ? t.quantity : null;
        const perOrder = t.perOrderMax || t.perOrderLimit || null;
        await tx.ticketType.create({
          data: {
            eventId: event.id,
            name: t.name || 'General Admission',
            kind: 'GA',
            currency: t.currency || 'USD',
            priceCents: BigInt(priceCents || 0),
            feeCents: BigInt(0),
            capacity: capacity,
            perOrderLimit: perOrder,
            salesStart: t.salesStart ? new Date(t.salesStart) : null,
            salesEnd: t.salesEnd ? new Date(t.salesEnd) : null,
          },
        });
      }

      // Promo codes (optional)
      const promos = (tickets?.promoCodes as any[]) || [];
      for (const p of promos) {
        const promoData = {
          orgId: draft.organizationId,
          eventId: event.id,
          code: p.code,
          kind: p.discountType || 'percent',
          percentOff:
            p.percentOff != null ? new Prisma.Decimal(p.percentOff) : null,
          amountOffCents:
            p.amountOffCents != null ? BigInt(p.amountOffCents) : null,
          currency: p.currency || 'USD',
          maxRedemptions: p.usageLimit || null,
        };

        // Ensure org/code uniqueness by updating existing promo when it already exists
        await tx.promoCode.upsert({
          where: {
            orgId_code: { orgId: draft.organizationId, code: p.code },
          },
          create: promoData,
          update: promoData,
        });
      }

      // Update draft status
      await tx.eventCreatorDraft.update({
        where: { id: draftId },
        data: {
          status: liveNow
            ? EventCreatorDraftStatus.published
            : EventCreatorDraftStatus.scheduled,
          targetPublishAt: targetPublishAt,
          eventId: event.id,
        },
      });

        return event;
      });
    } catch (error: any) {
      // Handle unique constraint violation on eventId
      if (error.code === 'P2002' && error.meta?.target?.includes('eventId')) {
        // Another request already published this draft
        const existing = await this.prisma.eventCreatorDraft.findUnique({
          where: { id: draftId },
          select: { eventId: true, status: true, targetPublishAt: true },
        });

        if (existing?.eventId) {
          return {
            id: draftId,
            eventId: existing.eventId,
            status: existing.status,
            targetPublishAt: existing.targetPublishAt,
            message: 'Event already published',
          };
        }
      }
      throw error;
    }

    return {
      id: draft.id,
      eventId: created.id,
      status: liveNow
        ? EventCreatorDraftStatus.published
        : EventCreatorDraftStatus.scheduled,
      targetPublishAt,
      message: liveNow ? 'Event published' : 'Event scheduled for publish',
    };
  }

  async duplicateDraft(userId: string, draftId: string) {
    await this.ensureDraftAccess(userId, draftId);
    const source = await this.prisma.eventCreatorDraft.findUnique({
      where: { id: draftId },
      include: { sections: true },
    });

    if (!source) {
      throw new NotFoundException('Draft not found.');
    }

    await this.ensureOrgAccess(userId, source.organizationId);

    return this.prisma.$transaction(async (tx) => {
      const duplicate = await tx.eventCreatorDraft.create({
        data: {
          organizationId: source.organizationId,
          ownerUserId: userId,
          eventType: source.eventType,
          timezone: source.timezone,
          title: `${source.title ?? 'Untitled event'} (Copy)`,
          visibility: source.visibility,
          status: EventCreatorDraftStatus.draft,
        },
      });

      await tx.eventCreatorDraftSection.createMany({
        data: source.sections.map((section) => ({
          draftId: duplicate.id,
          section: section.section,
          payload: section.payload as Prisma.InputJsonValue,
          status: EventCreatorSectionStatus.incomplete,
          errors: [],
        })),
      });

      await tx.eventCreatorDraftCollaborator.create({
        data: {
          draftId: duplicate.id,
          userId,
          role: EventCreatorCollaboratorRole.owner,
          permissions: ['all'],
        },
      });

      await this.recomputeCompletion(tx, duplicate.id);

      return this.hydrateDraftById(tx, duplicate.id);
    });
  }

  async listTemplates(userId: string, organizationId: string) {
    if (!organizationId) {
      throw new BadRequestException('organizationId is required');
    }

    await this.ensureOrgAccess(userId, organizationId);

    return this.prisma.eventCreatorTemplate.findMany({
      where: { organizationId, isActive: true },
      orderBy: [{ isDefault: 'desc' }, { updatedAt: 'desc' }],
      select: {
        id: true,
        name: true,
        description: true,
        coverImageUrl: true,
        isDefault: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  private async hydrateDraftById(
    client: PrismaClientLike,
    draftId: string,
  ): Promise<any> {
    const draft = await client.eventCreatorDraft.findUnique({
      where: { id: draftId },
      include: {
        sections: true,
        organization: { select: { id: true, name: true } },
        collaborators: { select: { userId: true, role: true } },
      },
    });

    if (!draft) {
      throw new NotFoundException('Draft not found.');
    }

    return this.toDraftResponse(draft);
  }

  private toDraftResponse(draft: DraftWithSections) {
    return {
      id: draft.id,
      organization: draft.organization,
      status: draft.status,
      title: draft.title,
      completionPercent: draft.completionPercent,
      visibility: draft.visibility,
      timezone: draft.timezone,
      eventType: draft.eventType,
      activeSection: draft.activeSection ?? SECTION_ORDER[0],
      lastAutosavedAt: draft.lastAutosavedAt,
      previewToken: draft.previewToken,
      previewTokenExpiresAt: draft.previewTokenExpiresAt,
      targetPublishAt: draft.targetPublishAt,
      collaborators: draft.collaborators,
      sections: SECTION_ORDER.map((section) => {
        const match = draft.sections.find(
          (candidate) => candidate.section === section,
        );
        return {
          section,
          payload: match?.payload ?? {},
          status: match?.status ?? EventCreatorSectionStatus.incomplete,
          errors: match?.errors ?? [],
          updatedAt: match?.updatedAt ?? draft.updatedAt,
          completedAt: match?.completedAt ?? null,
        };
      }),
    };
  }

  private defaultSectionPayloads(): SectionPayloadMap {
    return {
      [EventCreatorSectionType.basics]: {
        title: '',
        categoryId: null,
        tags: [],
        visibility: Visibility.public,
      },
      [EventCreatorSectionType.story]: {
        description: '',
        agenda: [],
        speakers: [],
        // Policy-related defaults used by the creator UI
        refundPolicy: '',
        transferEnabled: false,
        transferCutoff: null,
        resaleEnabled: false,
        accessibilityNotes: '',
      },
      [EventCreatorSectionType.tickets]: {
        ticketTypes: [],
        promoCodes: [],
        taxes: [],
      },
      [EventCreatorSectionType.schedule]: {
        mode: 'single',
        timezone: null,
        occurrences: [],
        venues: [],
      },
      [EventCreatorSectionType.checkout]: {
        formFields: [],
        consents: [],
        teamRoles: [],
      },
    };
  }

  private coerceSectionPayloadMap(
    input?: Prisma.JsonValue | null,
  ): SectionPayloadMap | undefined {
    if (!input || typeof input !== 'object' || Array.isArray(input)) {
      return undefined;
    }

    const map: SectionPayloadMap = {};
    for (const section of SECTION_ORDER) {
      if ((input as Record<string, any>)[section]) {
        map[section] = (input as Record<string, any>)[section];
      }
    }
    return map;
  }

  private mergeSectionPayloads(
    templateSections?: SectionPayloadMap,
    eventPrefill?: SectionPayloadMap,
  ): SectionPayloadMap {
    const defaults = this.defaultSectionPayloads();
    const merged: SectionPayloadMap = {};

    for (const section of SECTION_ORDER) {
      merged[section] = {
        ...(defaults[section] ?? {}),
        ...(templateSections?.[section] ?? {}),
        ...(eventPrefill?.[section] ?? {}),
      };
    }

    return merged;
  }

  private buildPrefillFromEvent(
    event: Prisma.EventGetPayload<{
      include: {
        occurrences: true;
        ticketTypes: true;
        promoCodes: true;
        venue: { select: { timezone: true } };
      };
    }>,
  ): SectionPayloadMap {
    return {
      [EventCreatorSectionType.basics]: {
        title: event.title,
        visibility: event.visibility,
        categoryId: event.categoryId,
        coverImageUrl: event.coverImageUrl,
      },
      [EventCreatorSectionType.story]: {
        description: event.descriptionMd,
      },
      [EventCreatorSectionType.tickets]: {
        ticketTypes: event.ticketTypes?.map((ticket) => ({
          id: ticket.id,
          name: ticket.name,
          priceCents: ticket.priceCents ? Number(ticket.priceCents) : null,
          currency: ticket.currency,
          capacity: ticket.capacity,
          salesStart: ticket.salesStart,
          salesEnd: ticket.salesEnd,
        })),
        promoCodes: event.promoCodes?.map((code) => ({
          id: code.id,
          code: code.code,
          percentOff: code.percentOff ? Number(code.percentOff) : null,
          amountOffCents: code.amountOffCents
            ? Number(code.amountOffCents)
            : null,
        })),
      },
      [EventCreatorSectionType.schedule]: {
        occurrences: event.occurrences?.map((occurrence) => ({
          id: occurrence.id,
          startsAt: occurrence.startsAt,
          endsAt: occurrence.endsAt,
        })),
        timezone: event.venue?.timezone ?? null,
      },
    };
  }

  private async ensureDraftAccess(
    userId: string,
    draftId: string,
    client: PrismaClientLike = this.prisma,
  ) {
    const draft = await client.eventCreatorDraft.findUnique({
      where: { id: draftId },
      include: { collaborators: { select: { userId: true } } },
    });

    if (!draft) {
      throw new NotFoundException('Draft not found.');
    }

    const hasAccess =
      draft.ownerUserId === userId ||
      draft.collaborators.some(
        (collaborator) => collaborator.userId === userId,
      );

    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this draft.');
    }

    return draft;
  }

  private async ensureOrgAccess(userId: string, organizationId: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: { id: true, ownerId: true },
    });

    if (!org) {
      throw new NotFoundException('Organization not found.');
    }

    if (org.ownerId === userId) {
      return org;
    }

    const membership = await this.prisma.orgMember.findFirst({
      where: { orgId: organizationId, userId },
    });

    if (!membership) {
      throw new ForbiddenException(
        'You do not have access to this organization.',
      );
    }

    return org;
  }

  private async recomputeCompletion(
    client: Prisma.TransactionClient,
    draftId: string,
  ) {
    const sections = await client.eventCreatorDraftSection.findMany({
      where: { draftId },
      select: { status: true },
    });

    if (!sections.length) {
      await client.eventCreatorDraft.update({
        where: { id: draftId },
        data: { completionPercent: 0 },
      });
      return;
    }

    const completed = sections.filter(
      (section) => section.status === EventCreatorSectionStatus.valid,
    ).length;
    const percent = Math.round((completed / sections.length) * 100);

    await client.eventCreatorDraft.update({
      where: { id: draftId },
      data: { completionPercent: percent },
    });
  }
}
