'use client';

import React from 'react';
import { useEffect, useMemo, useCallback } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { debounce } from '@/lib/utils/debounce';
import { useEventCreatorDraft } from '@/components/creator-v2/event-creator-provider';
import type { EventCreatorDraftSection } from '@/lib/types/event-creator-v2';
import { RecurrenceBuilder, type RecurrenceConfig } from '@/components/creator-v2/sections/recurrence-builder';
import { venuesApi, type Venue } from '@/lib/api/venues-api';
import { useOrganizerStore } from '@/lib/stores/organizer-store';
import { CreateVenueModal } from '@/components/creator-v2/modals/create-venue-modal';
import { OccurrenceCard } from '@/components/creator-v2/occurrence-card';
import { VenueComboBox } from '@/components/creator-v2/venue-combobox';
import { EventModeSelector } from '@/components/creator-v2/event-mode-selector';
import { TimezoneSelector } from '@/components/creator-v2/timezone-selector';
import { Calendar, Plus } from 'lucide-react';

const occurrenceSchema = z.object({
  startsAt: z.string().min(1, 'Start time required'),
  endsAt: z.string()
    .optional()
    .transform(val => val === '' ? undefined : val),
});

const overrideSchema = z.object({
  sourceStart: z.string(),
  startsAt: z.string().optional(),
  endsAt: z.string().optional(),
  doorTime: z.string().optional(),
  capacityOverride: z.number().int().nonnegative().optional(),
  venueId: z.string().optional(),
});

const scheduleSchema = z.object({
  mode: z.enum(['single', 'multi_day', 'recurring']),
  timezone: z.string().min(1, 'Timezone required'),
  venueId: z.string().optional(),
  occurrences: z.array(occurrenceSchema).min(1, 'Add at least one occurrence'),
  notes: z.string().optional(),
  rrule: z.string().optional(),
  exceptions: z.array(z.string()).optional(),
  overrides: z.array(overrideSchema).optional(),
});

type ScheduleValues = z.infer<typeof scheduleSchema>;

export function ScheduleSection() {
  const { draft, updateSection, isSaving } = useEventCreatorDraft();
  const schedule: EventCreatorDraftSection | undefined = draft?.sections.find(
    (s) => s.section === 'schedule'
  );

  const defaultValues: ScheduleValues = {
    mode: ((schedule?.payload?.mode as any) ?? 'single') as any,
    timezone: (schedule?.payload?.timezone as string) || draft?.timezone || 'UTC',
    venueId: (schedule?.payload?.venueId as string) || '',
    occurrences: Array.isArray(schedule?.payload?.occurrences) && (schedule?.payload?.occurrences as any[]).length > 0
      ? ((schedule?.payload?.occurrences as any[]).map((o) => ({
          startsAt: o.startsAt ?? '',
          endsAt: o.endsAt ?? '',
        })) as any)
      : [{ startsAt: '', endsAt: '' }],
    notes: (schedule?.payload?.notes as string) || '',
    rrule: (schedule?.payload?.rrule as string) || '',
    exceptions: Array.isArray(schedule?.payload?.exceptions) ? (schedule?.payload?.exceptions as string[]) : [],
    overrides: [],
  } as ScheduleValues;

  const form = useForm<ScheduleValues>({
    resolver: zodResolver(scheduleSchema),
    defaultValues,
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'occurrences' });

  // Load venues for dropdown
  const { currentOrganization } = useOrganizerStore();
  const [venues, setVenues] = React.useState<Venue[]>([]);
  const [venuesLoading, setVenuesLoading] = React.useState(false);
  const [isCreateVenueOpen, setIsCreateVenueOpen] = React.useState(false);
  const [venueSearchQuery, setVenueSearchQuery] = React.useState('');

  const loadVenues = React.useCallback(async () => {
    try {
      setVenuesLoading(true);
      const data = await venuesApi.getVenues();
      const filtered = currentOrganization
        ? data.filter((v: any) => (v.organizationId || v.orgId) === currentOrganization.id)
        : data;
      setVenues(filtered);
    } catch {
      setVenues([]);
    } finally {
      setVenuesLoading(false);
    }
  }, [currentOrganization]);

  useEffect(() => {
    loadVenues();
  }, [loadVenues]);

  // Get default venue name for display
  const defaultVenue = venues.find(v => v.id === form.watch('venueId'));
  const defaultVenueName = defaultVenue?.name;

  const debouncedSave = useMemo(
    () =>
      debounce((...args: unknown[]) => {
        const values = args[0] as ScheduleValues;
        void updateSection(
          'schedule',
          {
            autosave: true,
            payload: values,
            status: 'valid',
          },
          { showToast: false }
        );
      }, 600),
    [updateSection]
  );

  const debouncedMarkIncomplete = useMemo(
    () =>
      debounce((issues: z.ZodIssue[]) => {
        void updateSection(
          'schedule',
          {
            autosave: true,
            status: 'incomplete',
            errors: issues.map((issue) => ({
              path: issue.path,
              message: issue.message,
            })),
          },
          { showToast: false }
        );
      }, 600),
    [updateSection]
  );

  const handleAutosave = useCallback(
    (values: ScheduleValues) => {
      const parsed = scheduleSchema.safeParse(values);
      if (parsed.success) {
        debouncedSave(parsed.data);
      } else {
        debouncedMarkIncomplete(parsed.error.issues);
      }
    },
    [debouncedMarkIncomplete, debouncedSave]
  );

  useEffect(() => {
    const subscription = form.watch((values) => {
      handleAutosave(values);
    });
    return () => subscription.unsubscribe();
  }, [form, handleAutosave]);

  const handleRecurrenceChange = useCallback(
    (rrule: string, exceptions: string[], preview: { start: string; end?: string }[]) => {
      form.setValue('rrule', rrule as any);
      form.setValue('exceptions', exceptions as any);
    },
    [form]
  );

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold">Schedule & Venue</h2>
        <p className="text-sm text-muted-foreground">
          Set up when and where your event happens
        </p>
      </div>

      <form className="space-y-8" onSubmit={(e) => e.preventDefault()}>
        {/* Event Mode Selector */}
        <EventModeSelector
          value={form.watch('mode') as any}
          onChange={(mode) => form.setValue('mode', mode)}
        />

        {/* Timezone Selector */}
        <TimezoneSelector
          value={form.watch('timezone')}
          onChange={(tz) => form.setValue('timezone', tz)}
          autoDetect
        />

        {/* Venue Selection */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Default Venue</label>
          <VenueComboBox
            venues={venues}
            selectedVenueId={form.watch('venueId')}
            loading={venuesLoading}
            onSelect={(venueId) => form.setValue('venueId', venueId)}
            onCreateNew={() => setIsCreateVenueOpen(true)}
          />
          <p className="text-xs text-muted-foreground">
            This venue will be used for all occurrences unless overridden
          </p>
        </div>

        {form.watch('mode') === 'recurring' && (
          <RecurrenceBuilder
            config={{
              start: form.watch('occurrences.0.startsAt') || new Date().toISOString(),
              end: form.watch('occurrences.0.endsAt') || undefined,
              freq: 'WEEKLY',
              interval: 1,
              byWeekday: ['MO'],
              ends: { kind: 'never' },
              exceptions: form.watch('exceptions') || [],
            } as RecurrenceConfig}
            timezone={form.watch('timezone')}
            onChange={handleRecurrenceChange}
          />
        )}

        {/* Occurrences */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Event Dates
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                {fields.length === 1 ? '1 occurrence' : `${fields.length} occurrences`}
                {form.watch('mode') !== 'single' && ' scheduled'}
              </p>
            </div>
            {(form.watch('mode') !== 'single' || fields.length === 0) && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ startsAt: '', endsAt: '' })}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Add occurrence
              </Button>
            )}
          </div>

          <div className="space-y-4">
            {fields.map((field, index) => {
              const occStart = form.watch(`occurrences.${index}.startsAt` as const) as string;
              const isCanceled = (form.watch('exceptions') || []).includes(occStart);

              return (
                <OccurrenceCard
                  key={field.id}
                  index={index}
                  startsAt={occStart}
                  endsAt={form.watch(`occurrences.${index}.endsAt` as const) as string}
                  doorTime={form.watch(`overrides.${index}.doorTime` as const) as string}
                  capacityOverride={form.watch(`overrides.${index}.capacityOverride` as const) as number}
                  venueId={form.watch(`overrides.${index}.venueId` as const) as string}
                  isCanceled={isCanceled}
                  venues={venues}
                  venuesLoading={venuesLoading}
                  defaultVenueName={defaultVenueName}
                  onStartChange={(value) => form.setValue(`occurrences.${index}.startsAt` as const, value)}
                  onEndChange={(value) => form.setValue(`occurrences.${index}.endsAt` as const, value)}
                  onDoorTimeChange={(value) => {
                    form.setValue(`overrides.${index}.sourceStart` as const, form.getValues(`occurrences.${index}.startsAt` as const));
                    form.setValue(`overrides.${index}.doorTime` as const, value);
                  }}
                  onCapacityChange={(value) => {
                    form.setValue(`overrides.${index}.sourceStart` as const, form.getValues(`occurrences.${index}.startsAt` as const));
                    form.setValue(`overrides.${index}.capacityOverride` as const, value as any);
                  }}
                  onVenueChange={(value) => {
                    form.setValue(`overrides.${index}.sourceStart` as const, form.getValues(`occurrences.${index}.startsAt` as const));
                    form.setValue(`overrides.${index}.venueId` as const, value);
                  }}
                  onCancelToggle={(canceled) => {
                    const list = new Set(form.getValues('exceptions') || []);
                    if (canceled && occStart) list.add(occStart);
                    if (!canceled && occStart) list.delete(occStart);
                    form.setValue('exceptions', Array.from(list));
                  }}
                  onRemove={() => remove(index)}
                  canRemove={fields.length > 1 || form.watch('mode') !== 'single'}
                />
              );
            })}
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-sm font-medium">Notes (optional)</label>
          <Textarea rows={3} placeholder="Door time, check-in instructions, etc." {...form.register('notes')} />
        </div>
      </form>

      <CreateVenueModal
        isOpen={isCreateVenueOpen}
        onClose={() => setIsCreateVenueOpen(false)}
        onSuccess={(newVenue) => {
          setVenues((prev) => [...prev, newVenue]);
          form.setValue('venueId', newVenue.id);
        }}
      />
    </div>
  );
}
