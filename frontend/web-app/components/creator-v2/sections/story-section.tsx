'use client';

import React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Switch } from '@/components/ui';
import { debounce } from '@/lib/utils/debounce';
import { useEventCreatorDraft } from '@/components/creator-v2/event-creator-provider';
import type { EventCreatorDraftSection } from '@/lib/types/event-creator-v2';

const speakerSchema = z.object({
  name: z.string().min(1, 'Name required'),
  role: z.string().optional(),
  photoUrl: z.string().url('Enter a valid URL').optional().or(z.literal('')),
  bio: z.string().optional(),
});

const agendaItemSchema = z.object({
  time: z.string().optional(),
  title: z.string().min(1, 'Title required'),
});

const storySchema = z.object({
  description: z.string().min(1, 'Add a description'),
  agenda: z.array(agendaItemSchema),
  speakers: z.array(speakerSchema),
  refundPolicy: z.string().optional(),
  // New structured policy fields
  transferEnabled: z.boolean().default(false),
  transferCutoff: z
    .enum(['at_start', '24h', '48h', '72h', '7d', '2h'])
    .optional(),
  resaleEnabled: z.boolean().default(false),
  accessibilityNotes: z.string().optional(),
});

type StoryValues = z.infer<typeof storySchema>;

export function StorySection() {
  const { draft, updateSection, isSaving } = useEventCreatorDraft();
  const story: EventCreatorDraftSection | undefined = draft?.sections.find(
    (s) => s.section === 'story'
  );

  // Back-compat helpers for previously stored values
  const legacyTransferRules = (story?.payload as any)?.transferRules as string | undefined;
  const defaultValues: StoryValues = {
    description: (story?.payload?.description as string) || '',
    agenda: Array.isArray(story?.payload?.agenda)
      ? (story?.payload?.agenda as any[])
      : [],
    speakers: Array.isArray(story?.payload?.speakers)
      ? (story?.payload?.speakers as any[])
      : [],
    refundPolicy: (story?.payload?.refundPolicy as string) || '',
    transferEnabled: (story?.payload as any)?.transferEnabled ?? (!!legacyTransferRules && legacyTransferRules.length > 0),
    transferCutoff: (story?.payload as any)?.transferCutoff ?? (legacyTransferRules?.includes('24')
      ? '24h'
      : legacyTransferRules?.includes('48')
      ? '48h'
      : legacyTransferRules?.includes('72')
      ? '72h'
      : legacyTransferRules?.includes('7')
      ? '7d'
      : legacyTransferRules?.includes('2')
      ? '2h'
      : undefined),
    resaleEnabled: (story?.payload as any)?.resaleEnabled ?? false,
    accessibilityNotes: (story?.payload?.accessibilityNotes as string) || '',
  };

  const form = useForm<StoryValues>({
    resolver: zodResolver(storySchema) as any,
    defaultValues,
  });

  const {
    fields: agendaFields,
    append: agendaAppend,
    remove: agendaRemove,
  } = useFieldArray({ control: form.control, name: 'agenda' });

  const {
    fields: speakerFields,
    append: speakerAppend,
    remove: speakerRemove,
  } = useFieldArray({ control: form.control, name: 'speakers' });

  const debouncedSave = useMemo(
    () =>
      debounce(async (values: StoryValues) => {
        await updateSection(
          'story',
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
      const parsed = storySchema.safeParse(values);
      if (parsed.success) {
        debouncedSave(parsed.data);
      }
    });
    return () => subscription.unsubscribe();
  }, [form, debouncedSave]);

  const onSubmit = form.handleSubmit(async (values) => {
    await updateSection(
      'story',
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
        <h2 className="text-2xl font-bold">Details & story</h2>
        <p className="text-sm text-muted-foreground">
          Tell attendees what to expect. Add agenda, speakers and policies.
        </p>
      </div>

      <form className="space-y-8" onSubmit={onSubmit}>
        <div className="space-y-3">
          <label className="text-sm font-medium">Long description</label>
          <Textarea rows={8} placeholder="Use headings, lists, and links" {...form.register('description')} />
          {form.formState.errors.description && (
            <p className="text-xs text-error">{form.formState.errors.description.message}</p>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Agenda</h3>
            <Button type="button" variant="outline" onClick={() => agendaAppend({ time: '', title: '' })}>
              Add item
            </Button>
          </div>
          <div className="space-y-3">
            {agendaFields.map((field, index) => (
              <div key={field.id} className="grid gap-3 md:grid-cols-6">
                <Input
                  placeholder="10:00 AM"
                  className="md:col-span-2"
                  {...form.register(`agenda.${index}.time` as const)}
                />
                <Input
                  placeholder="Registration opens"
                  className="md:col-span-3"
                  {...form.register(`agenda.${index}.title` as const)}
                />
                <Button type="button" variant="outline" onClick={() => agendaRemove(index)}>
                  Remove
                </Button>
                {form.formState.errors.agenda?.[index]?.title && (
                  <p className="md:col-span-6 text-xs text-error">
                    {form.formState.errors.agenda[index]?.title?.message as string}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Speakers</h3>
            <Button type="button" variant="outline" onClick={() => speakerAppend({ name: '', role: '', photoUrl: '', bio: '' })}>
              Add speaker
            </Button>
          </div>
          <div className="space-y-4">
            {speakerFields.map((field, index) => (
              <div key={field.id} className="rounded-xl border border-border p-4 space-y-3">
                <div className="grid gap-3 md:grid-cols-2">
                  <Input placeholder="Name" {...form.register(`speakers.${index}.name` as const)} />
                  <Input placeholder="Role / Title" {...form.register(`speakers.${index}.role` as const)} />
                </div>
                <Input placeholder="Photo URL" {...form.register(`speakers.${index}.photoUrl` as const)} />
                <Textarea rows={3} placeholder="Short bio" {...form.register(`speakers.${index}.bio` as const)} />
                <div className="flex justify-end">
                  <Button type="button" variant="outline" onClick={() => speakerRemove(index)}>
                    Remove
                  </Button>
                </div>
                {form.formState.errors.speakers?.[index]?.name && (
                  <p className="text-xs text-error">{form.formState.errors.speakers[index]?.name?.message as string}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Policies & Accessibility */}
        <div className="grid gap-5 md:grid-cols-3">
          {/* Refund policy with templates */}
          <div className="space-y-3 md:col-span-1 rounded-xl border border-border p-4 bg-card">
            <label className="text-sm font-medium">Refund policy</label>
            <Select
              onChange={(e) => {
                const v = e.target.value;
                const map: Record<string, string> = {
                  no_refunds: 'All sales are final. No refunds.',
                  '24h': 'Full refund available up to 24 hours before the event.',
                  '48h': 'Full refund available up to 48 hours before the event.',
                  '7d': 'Full refund available up to 7 days before the event.',
                  flexible:
                    'Refunds subject to approval. Requests must include order number and reason.',
                };
                const text = map[v] ?? '';
                form.setValue('refundPolicy', text, { shouldDirty: true, shouldValidate: true });
              }}
            >
              <option value="">Select a template…</option>
              <option value="no_refunds">No refunds</option>
              <option value="24h">Full refund up to 24 hours before</option>
              <option value="48h">Full refund up to 48 hours before</option>
              <option value="7d">Full refund up to 7 days before</option>
              <option value="flexible">Flexible (subject to approval)</option>
            </Select>
            <Textarea
              rows={3}
              placeholder="e.g., Full refund up to 7 days before"
              {...form.register('refundPolicy')}
            />
          </div>

          {/* Transfer policy: toggle + cutoff select when enabled */}
          <div className="space-y-3 md:col-span-1 rounded-xl border border-border p-4 bg-card">
            <label className="text-sm font-medium">Transfer policy</label>
            <div className="flex items-center justify-between">
              <Switch
                checked={!!form.watch('transferEnabled')}
                onCheckedChange={(checked) => {
                  form.setValue('transferEnabled', checked, { shouldDirty: true });
                  if (!checked) form.setValue('transferCutoff', undefined, { shouldDirty: true });
                }}
                label={form.watch('transferEnabled') ? 'Transfers enabled' : 'Transfers disabled'}
              />
            </div>
            {form.watch('transferEnabled') && (
              <div className="space-y-2">
                <Select
                  value={form.watch('transferCutoff') ?? ''}
                  onChange={(e) => form.setValue('transferCutoff', e.target.value as any, { shouldDirty: true })}
                >
                  <option value="">Select cutoff…</option>
                  <option value="2h">Up to 2 hours before start</option>
                  <option value="24h">Up to 24 hours before start</option>
                  <option value="48h">Up to 48 hours before start</option>
                  <option value="72h">Up to 72 hours before start</option>
                  <option value="7d">Up to 7 days before start</option>
                  <option value="at_start">Until the event starts</option>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Attendees can transfer tickets to another person until the cutoff.
                </p>
              </div>
            )}
          </div>

          {/* Accessibility notes and resale toggle */}
          <div className="space-y-3 md:col-span-1 rounded-xl border border-border p-4 bg-card">
            <label className="text-sm font-medium">Accessibility notes</label>
            <Textarea
              rows={3}
              placeholder="Parking, wheelchair access, ASL, etc."
              {...form.register('accessibilityNotes')}
            />
            <div className="pt-2 border-t border-border">
              <div className="flex items-center justify-between">
                <Switch
                  checked={!!form.watch('resaleEnabled')}
                  onCheckedChange={(checked) => form.setValue('resaleEnabled', checked, { shouldDirty: true })}
                  label={form.watch('resaleEnabled') ? 'Ticket resale enabled' : 'Ticket resale disabled'}
                />
              </div>
              {form.watch('resaleEnabled') && (
                <p className="mt-2 text-xs text-muted-foreground">
                  When enabled, attendees may list tickets for resale through your platform rules.
                  Organizer fees and payout timelines apply.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={isSaving}>{isSaving ? 'Saving…' : 'Save details'}</Button>
          <span className="text-xs text-muted-foreground">Autosaves as you edit; this marks the section complete.</span>
        </div>
      </form>
    </div>
  );
}
