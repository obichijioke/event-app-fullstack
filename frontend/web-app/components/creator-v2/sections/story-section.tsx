'use client';

import React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { debounce } from '@/lib/utils/debounce';
import { useEventCreatorDraft } from '@/components/creator-v2/event-creator-provider';
import type { EventCreatorDraftSection } from '@/lib/types/event-creator-v2';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { AgendaItemCard } from '@/components/creator-v2/agenda-item-card';
import { SpeakerCard } from '@/components/creator-v2/speaker-card';
import { PolicySection } from '@/components/creator-v2/policy-section';
import { EmptyState } from '@/components/creator-v2/empty-state';
import { Calendar, Users, Plus } from 'lucide-react';

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
      debounce((...args: unknown[]) => {
        const values = args[0] as StoryValues;
        void updateSection(
          'story',
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

  useEffect(() => {
    const subscription = form.watch((values) => {
      const parsed = storySchema.safeParse(values);
      if (parsed.success) {
        debouncedSave(parsed.data);
      }
    });
    return () => subscription.unsubscribe();
  }, [form, debouncedSave]);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold">Details & story</h2>
        <p className="text-sm text-muted-foreground">
          Tell attendees what to expect. Add agenda, speakers and policies.
        </p>
      </div>

      <form className="space-y-8" onSubmit={(e) => e.preventDefault()}>
        <div className="space-y-3">
          <label className="text-sm font-medium">Long description</label>
          <p className="text-xs text-muted-foreground">
            Describe what attendees can expect. Use the toolbar to format your text.
          </p>
          <Controller
            control={form.control}
            name="description"
            render={({ field }) => (
              <RichTextEditor
                value={field.value}
                onChange={(value) => {
                  field.onChange(value);
                  // Trigger debounced save manually since we're not using register's onChange
                  debouncedSave({ ...form.getValues(), description: value });
                }}
                placeholder="Tell attendees what to expect..."
                maxLength={5000}
                showCharCount={true}
              />
            )}
          />
          {form.formState.errors.description && (
            <p className="text-xs text-error">{form.formState.errors.description.message}</p>
          )}
        </div>

        {/* Agenda Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Agenda
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                {agendaFields.length === 0
                  ? 'Add a schedule for your event'
                  : `${agendaFields.length} ${agendaFields.length === 1 ? 'item' : 'items'}`}
              </p>
            </div>
            <Button
              type="button"
              onClick={() => agendaAppend({ time: '', title: '' })}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Add item
            </Button>
          </div>

          {agendaFields.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="No agenda items yet"
              description="Add a schedule to help attendees know what to expect"
              actionLabel="Add first item"
              onAction={() => agendaAppend({ time: '', title: '' })}
            />
          ) : (
            <div className="space-y-3">
              {agendaFields.map((field, index) => (
                <AgendaItemCard
                  key={field.id}
                  index={index}
                  time={form.watch(`agenda.${index}.time` as const) as string}
                  title={form.watch(`agenda.${index}.title` as const) as string}
                  onTimeChange={(value) => form.setValue(`agenda.${index}.time` as const, value)}
                  onTitleChange={(value) => form.setValue(`agenda.${index}.title` as const, value)}
                  onRemove={() => agendaRemove(index)}
                  error={form.formState.errors.agenda?.[index]?.title?.message as string}
                />
              ))}
            </div>
          )}
        </div>

        {/* Speakers Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Users className="h-5 w-5" />
                Speakers
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                {speakerFields.length === 0
                  ? 'Optional: Showcase speakers or performers'
                  : `${speakerFields.length} ${speakerFields.length === 1 ? 'speaker' : 'speakers'}`}
              </p>
            </div>
            <Button
              type="button"
              onClick={() => speakerAppend({ name: '', role: '', photoUrl: '', bio: '' })}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Add speaker
            </Button>
          </div>

          {speakerFields.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No speakers added"
              description="Highlight speakers, performers, or key people at your event"
              actionLabel="Add first speaker"
              onAction={() => speakerAppend({ name: '', role: '', photoUrl: '', bio: '' })}
            />
          ) : (
            <div className="space-y-4">
              {speakerFields.map((field, index) => (
                <SpeakerCard
                  key={field.id}
                  index={index}
                  name={form.watch(`speakers.${index}.name` as const) as string}
                  role={form.watch(`speakers.${index}.role` as const) as string}
                  photoUrl={form.watch(`speakers.${index}.photoUrl` as const) as string}
                  bio={form.watch(`speakers.${index}.bio` as const) as string}
                  onNameChange={(value) => form.setValue(`speakers.${index}.name` as const, value)}
                  onRoleChange={(value) => form.setValue(`speakers.${index}.role` as const, value)}
                  onPhotoUrlChange={(value) => form.setValue(`speakers.${index}.photoUrl` as const, value)}
                  onBioChange={(value) => form.setValue(`speakers.${index}.bio` as const, value)}
                  onRemove={() => speakerRemove(index)}
                  nameError={form.formState.errors.speakers?.[index]?.name?.message as string}
                  photoError={form.formState.errors.speakers?.[index]?.photoUrl?.message as string}
                />
              ))}
            </div>
          )}
        </div>

        {/* Policies Section */}
        <PolicySection
          refundPolicy={form.watch('refundPolicy') || ''}
          onRefundPolicyChange={(value) => form.setValue('refundPolicy', value, { shouldDirty: true })}
          transferEnabled={form.watch('transferEnabled') || false}
          transferCutoff={form.watch('transferCutoff')}
          onTransferEnabledChange={(enabled) => {
            form.setValue('transferEnabled', enabled, { shouldDirty: true });
            if (!enabled) form.setValue('transferCutoff', undefined, { shouldDirty: true });
          }}
          onTransferCutoffChange={(cutoff) => form.setValue('transferCutoff', cutoff as any, { shouldDirty: true })}
          resaleEnabled={form.watch('resaleEnabled') || false}
          onResaleEnabledChange={(enabled) => form.setValue('resaleEnabled', enabled, { shouldDirty: true })}
          accessibilityNotes={form.watch('accessibilityNotes') || ''}
          onAccessibilityNotesChange={(value) => form.setValue('accessibilityNotes', value, { shouldDirty: true })}
        />

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={isSaving}>{isSaving ? 'Saving…' : 'Save details'}</Button>
          <span className="text-xs text-muted-foreground">Autosaves as you edit; this marks the section complete.</span>
        </div>
      </form>
    </div>
  );
}
