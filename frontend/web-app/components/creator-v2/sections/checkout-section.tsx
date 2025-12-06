'use client';

import React from 'react';
import { useCallback, useMemo } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { debounce } from '@/lib/utils/debounce';
import { useEventCreatorDraft } from '@/components/creator-v2/event-creator-provider';

const questionSchema = z.object({
  fieldKey: z.string().min(1, 'Key required'),
  label: z.string().min(1, 'Label required'),
  fieldType: z.enum(['text', 'textarea', 'select', 'checkbox']),
  required: z.boolean(),
  options: z.string().optional(), // comma separated for select
});

const checkoutSchema = z.object({
  questions: z.array(questionSchema),
  consentMarketing: z.boolean(),
});

type CheckoutValues = z.infer<typeof checkoutSchema>;

export function CheckoutSection() {
  const { draft, updateSection, isSaving } = useEventCreatorDraft();
  const checkout = draft?.sections.find((s) => s.section === 'checkout');

  const defaultValues: CheckoutValues = {
    questions: Array.isArray(checkout?.payload?.formFields)
      ? (checkout?.payload?.formFields as any[]).map((f) => ({
          fieldKey: f.fieldKey ?? '',
          label: f.label ?? '',
          fieldType: (f.fieldType as any) ?? 'text',
          required: !!f.required,
          options: Array.isArray(f.options) ? (f.options as any[]).join(', ') : '',
        }))
      : [],
    consentMarketing: !!(checkout?.payload as any)?.consentMarketing,
  };

  const form = useForm<CheckoutValues>({ resolver: zodResolver(checkoutSchema), defaultValues });
  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'questions' });

  const debouncedSave = useMemo(
    () =>
      debounce((...args: unknown[]) => {
        const values = args[0] as CheckoutValues;
        void updateSection(
          'checkout',
          {
            autosave: true,
            payload: {
              formFields: values.questions.map((q) => ({
                fieldKey: q.fieldKey,
                label: q.label,
                fieldType: q.fieldType,
                required: q.required,
                options: q.options
                  ? q.options.split(',').map((o) => o.trim()).filter(Boolean)
                  : [],
              })),
              consentMarketing: values.consentMarketing,
            },
            status: 'valid',
          },
          { showToast: false }
        );
      }, 600),
    [updateSection]
  );

  const debouncedMarkIncomplete = useMemo(
    () =>
      debounce((...args: unknown[]) => {
        const issues = args[0] as z.ZodIssue[];
        void updateSection(
          'checkout',
          {
            payload: {},
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
    (values: CheckoutValues) => {
      const parsed = checkoutSchema.safeParse(values);
      if (parsed.success) {
        debouncedSave(parsed.data);
      } else {
        debouncedMarkIncomplete(parsed.error.issues);
      }
    },
    [debouncedMarkIncomplete, debouncedSave]
  );

  React.useEffect(() => {
    const subscription = form.watch((values) => {
      handleAutosave(values as CheckoutValues);
    });
    return () => subscription.unsubscribe();
  }, [form, handleAutosave]);

  // Kick off an initial validation/autosave so an empty (but valid) state marks as complete without requiring edits.
  React.useEffect(() => {
    handleAutosave(form.getValues());
  }, [form, handleAutosave]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Checkout & audience</h2>
          <p className="text-sm text-muted-foreground">Collect the information you need from attendees.</p>
        </div>
        <Button type="button" variant="outline" onClick={() => append({ fieldKey: '', label: '', fieldType: 'text', required: false, options: '' })}>
          Add question
        </Button>
      </div>

      <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
        {fields.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-6 text-center text-muted-foreground">
            No questions yet. Add your first question.
          </div>
        ) : (
          <div className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="rounded-xl border border-border p-4 space-y-4">
                <div className="grid gap-3 md:grid-cols-6">
                  <div className="space-y-2">
                    <label className="text-xs font-medium">Internal key</label>
                    <Input placeholder="e.g., company" {...form.register(`questions.${index}.fieldKey` as const)} />
                    <p className="text-xs text-muted-foreground">Used in exports and integrations. Letters, numbers, underscores only.</p>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-xs font-medium">Question label</label>
                    <Input placeholder="Company name" {...form.register(`questions.${index}.label` as const)} />
                    <p className="text-xs text-muted-foreground">Shown to attendees on the checkout form.</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium">Field type</label>
                    <Select
                      value={form.watch(`questions.${index}.fieldType` as const) as any}
                      onChange={(e) => form.setValue(`questions.${index}.fieldType` as const, e.target.value as any)}
                    >
                      <option value="text">Text</option>
                      <option value="textarea">Textarea</option>
                      <option value="select">Select</option>
                      <option value="checkbox">Checkbox</option>
                    </Select>
                    <p className="text-xs text-muted-foreground">Select requires options; checkbox creates a single consent box.</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium">Required?</label>
                    <Select
                      value={String(form.watch(`questions.${index}.required` as const))}
                      onChange={(e) => form.setValue(`questions.${index}.required` as const, e.target.value === 'true')}
                    >
                      <option value="false">Optional</option>
                      <option value="true">Required</option>
                    </Select>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-xs font-medium">Options</label>
                    <Input placeholder="Option A, Option B" {...form.register(`questions.${index}.options` as const)} />
                    <p className="text-xs text-muted-foreground">Only used for select lists (comma separated).</p>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button type="button" variant="outline" onClick={() => remove(index)}>Remove</Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          Autosaves as you configure checkout. The step is marked complete when required fields are valid.
        </p>
      </form>
    </div>
  );
}
