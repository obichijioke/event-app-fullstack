'use client';

import React from 'react';
import { useEffect, useMemo } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { debounce } from '@/lib/utils/debounce';
import { POPULAR_TIMEZONES } from '@/lib/data/timezones';
import { useEventCreatorDraft } from '@/components/creator-v2/event-creator-provider';
import type { EventCreatorDraftSection } from '@/lib/types/event-creator-v2';
import { RecurrenceBuilder, type RecurrenceConfig } from '@/components/creator-v2/sections/recurrence-builder';
import { venuesApi, type Venue } from '@/lib/api/venues-api';
import { useOrganizerStore } from '@/lib/stores/organizer-store';

const occurrenceSchema = z.object({
  startsAt: z.string().min(1, 'Start time required'),
  endsAt: z.string().optional(),
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
  useEffect(() => {
    (async () => {
      try {
        setVenuesLoading(true);
        const data = await venuesApi.getVenues();
        // If API returns all venues, filter by org if available (support orgId or organizationId)
        const filtered = currentOrganization
          ? data.filter((v: any) => (v.organizationId || v.orgId) === currentOrganization.id)
          : data;
        setVenues(filtered);
      } catch {
        setVenues([]);
      } finally {
        setVenuesLoading(false);
      }
    })();
  }, [currentOrganization]);

  // Helpers for datetime-local
  const toLocalInput = (iso?: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };
  const fromLocalInput = (val: string) => {
    if (!val) return '';
    const d = new Date(val);
    return d.toISOString();
  };

  const debouncedSave = useMemo(
    () =>
      debounce((...args: unknown[]) => {
        const values = args[0] as ScheduleValues;
        void updateSection(
          'schedule',
          {
            autosave: true,
            payload: values,
          },
          { showToast: false }
        );
      }, 600),
    [updateSection]
  );

  useEffect(() => {
    const subscription = form.watch((values) => {
      const parsed = scheduleSchema.safeParse(values);
      if (parsed.success) {
        debouncedSave(parsed.data);
      }
    });
    return () => subscription.unsubscribe();
  }, [form, debouncedSave]);

  const onSubmit = form.handleSubmit(async (values) => {
    await updateSection(
      'schedule',
      {
        payload: values,
        status: 'valid',
      },
      { showToast: true }
    );
  });

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold">Schedule & venue</h2>
        <p className="text-sm text-muted-foreground">Set date, time, and timezone. Add more occurrences as needed.</p>
      </div>

      <form className="space-y-6" onSubmit={onSubmit}>
        <div className="grid gap-5 md:grid-cols-3">
          <div className="space-y-3">
            <label className="text-sm font-medium">Mode</label>
            <p className="text-xs text-muted-foreground">
              Choose whether this event happens once, over multiple days, or on a recurring cadence.
            </p>
            <Select
              value={form.watch('mode') as any}
              onChange={(e) => form.setValue('mode', e.target.value as any)}
            >
              <option value="single">Single date</option>
              <option value="multi_day">Multi-day</option>
              <option value="recurring">Recurring</option>
            </Select>
          </div>
          <div className="space-y-3 md:col-span-2">
            <label className="text-sm font-medium">Timezone</label>
            <p className="text-xs text-muted-foreground">
              All occurrences below will use this timezone when shown to attendees.
            </p>
            <Select
              value={form.watch('timezone')}
              onChange={(e) => form.setValue('timezone', e.target.value)}
            >
              {POPULAR_TIMEZONES.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </Select>
            {form.formState.errors.timezone && (
              <p className="text-xs text-error">{form.formState.errors.timezone.message}</p>
            )}
          </div>
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
            onChange={(rrule, exceptions, preview) => {
              form.setValue('rrule', rrule as any);
              form.setValue('exceptions', exceptions as any);
            }}
          />
        )}

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Occurrences</h3>
            <Button type="button" variant="outline" onClick={() => append({ startsAt: '', endsAt: '' })}>
              Add occurrence
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            List every date and time attendees can select. You can override capacity, venue, or door time per row.
          </p>
          <div className="space-y-3">
            {fields.map((field, index) => {
              const occStart = form.watch(`occurrences.${index}.startsAt` as const) as string;
              const isCanceled = (form.watch('exceptions') || []).includes(occStart);
              return (
                <div key={field.id} className="grid gap-3 md:grid-cols-6">
                <div className="space-y-2 md:col-span-3">
                  <label className="text-xs font-medium">Start date & time</label>
                  <Input
                    type="datetime-local"
                    placeholder="Start"
                    disabled={isCanceled}
                    value={toLocalInput(form.watch(`occurrences.${index}.startsAt` as const) as string)}
                    onChange={(e) => form.setValue(`occurrences.${index}.startsAt` as const, fromLocalInput(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground">Attendees will see this time on the event page.</p>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-medium">End date & time</label>
                  <Input
                    type="datetime-local"
                    placeholder="End"
                    disabled={isCanceled}
                    value={toLocalInput(form.watch(`occurrences.${index}.endsAt` as const) as string)}
                    onChange={(e) => form.setValue(`occurrences.${index}.endsAt` as const, fromLocalInput(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground">Leave blank if the experience has no defined end.</p>
                </div>
                <div className="flex items-end">
                  <Button type="button" variant="outline" onClick={() => remove(index)}>
                    Remove
                  </Button>
                </div>
                {form.formState.errors.occurrences?.[index]?.startsAt && (
                  <p className="md:col-span-6 text-xs text-error">
                    {form.formState.errors.occurrences[index]?.startsAt?.message as string}
                  </p>
                )}
                <div className="md:col-span-6 grid gap-3 md:grid-cols-4">
                  <Input
                    type="datetime-local"
                    placeholder="Door time"
                    disabled={isCanceled}
                    value={toLocalInput(form.watch(`overrides.${index}.doorTime` as const) as string)}
                    onChange={(e) => {
                      form.setValue(`overrides.${index}.sourceStart` as const, form.getValues(`occurrences.${index}.startsAt` as const));
                      form.setValue(`overrides.${index}.doorTime` as const, fromLocalInput(e.target.value));
                    }}
                  />
                  <Input
                    type="number"
                    placeholder="Capacity override"
                    disabled={isCanceled}
                    {...form.register(`overrides.${index}.capacityOverride` as const, { valueAsNumber: true })}
                    onFocus={() => form.setValue(`overrides.${index}.sourceStart` as const, form.getValues(`occurrences.${index}.startsAt` as const))}
                  />
                  <Select
                    value={(form.watch(`overrides.${index}.venueId` as const) as any) || ''}
                    onChange={(e) => {
                      form.setValue(`overrides.${index}.sourceStart` as const, form.getValues(`occurrences.${index}.startsAt` as const));
                      form.setValue(`overrides.${index}.venueId` as const, e.target.value as any);
                    }}
                    disabled={venuesLoading || isCanceled}
                  >
                    <option value="">{venuesLoading ? 'Loading venuesâ€¦' : 'Select venue (override)'}</option>
                    {venues.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name}
                      </option>
                    ))}
                    {(!venuesLoading && venues.length === 0) && (
                      <option value="" disabled>No venues found</option>
                    )}
                  </Select>
                  <div className="flex items-center gap-2 self-center">
                    <input
                      type="checkbox"
                      checked={isCanceled}
                      onChange={(e) => {
                        const list = new Set(form.getValues('exceptions') || []);
                        if (e.target.checked && occStart) list.add(occStart);
                        if (!e.target.checked && occStart) list.delete(occStart);
                        form.setValue('exceptions', Array.from(list));
                      }}
                    />
                    <span className="text-xs text-muted-foreground">Cancel this occurrence</span>
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-sm font-medium">Notes (optional)</label>
          <Textarea rows={3} placeholder="Door time, check-in instructions, etc." {...form.register('notes')} />
        </div>

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={isSaving}>{isSaving ? 'Savingâ€¦' : 'Save schedule'}</Button>
          <span className="text-xs text-muted-foreground">Autosaves; this marks the section complete.</span>
        </div>
      </form>
    </div>
  );
}
