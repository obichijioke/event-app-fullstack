'use client';

import React, { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/input';
import { eventCreatorV2Api } from '@/lib/api/event-creator-v2-api';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { categoriesApi, type Category } from '@/lib/api/categories-api';
import { resolveImageUrl } from '@/lib/utils/image';
import { useEventCreatorDraft } from '@/components/creator-v2/event-creator-provider';
import type { EventCreatorDraftSection } from '@/lib/types/event-creator-v2';
import { debounce } from '@/lib/utils/debounce';

const schema = z.object({
  title: z.string().min(1, 'Title is required').max(75, 'Keep it under 75'),
  categoryId: z.string().min(1, 'Choose a category'),
  tags: z.string().optional(),
  shortDescription: z.string().max(160, 'Max 160 characters').optional(),
  visibility: z.enum(['public', 'unlisted', 'private']),
});

export function BasicsSection() {
  const { draft, updateSection, isSaving } = useEventCreatorDraft();
  const basics: EventCreatorDraftSection | undefined = draft?.sections.find(
    (s) => s.section === 'basics'
  );

  const [coverUrl, setCoverUrl] = React.useState<string | null>(
    (basics?.payload?.coverImageUrl as string) || null,
  );

  // Categories (client-side fetch once)
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = React.useState(false);

  // Form
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: (basics?.payload?.title as string) || draft?.title || '',
      categoryId: (basics?.payload?.categoryId as string) || '',
      tags: Array.isArray(basics?.payload?.tags)
        ? (basics?.payload?.tags as string[]).join(', ')
        : '',
      shortDescription: (basics?.payload?.shortDescription as string) || '',
      visibility: ((basics?.payload?.visibility as any) || draft?.visibility || 'public') as any,
    },
  });

  useEffect(() => {
    setIsLoadingCategories(true);
    categoriesApi
      .getCategories()
      .then(setCategories)
      .finally(() => setIsLoadingCategories(false));
  }, []);

  // Debounced autosave on any change
  const debouncedSave = useMemo(
    () =>
      debounce(async (values: z.infer<typeof schema>) => {
        await updateSection(
          'basics',
          {
            autosave: true,
            payload: {
              ...values,
              tags: values.tags
                ? values.tags
                    .split(',')
                    .map((t) => t.trim())
                    .filter(Boolean)
                : [],
            },
          },
          { showToast: false }
        );
      }, 600),
    [updateSection]
  );

  useEffect(() => {
    const subscription = form.watch((values) => {
      const parsed = schema.safeParse(values);
      if (parsed.success) {
        debouncedSave(parsed.data);
      }
    });
    return () => subscription.unsubscribe();
  }, [form, debouncedSave]);

  const onSubmit = form.handleSubmit(async (values) => {
    await updateSection(
      'basics',
      {
        payload: {
          ...values,
          tags: values.tags
            ? values.tags
                .split(',')
                .map((t) => t.trim())
                .filter(Boolean)
            : [],
        },
        status: 'valid',
      },
      { showToast: true }
    );
  });

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold">Basics</h2>
        <p className="text-sm text-muted-foreground">
          Set the essentials for your event and we'll autosave as you type.
        </p>
      </div>

      <form className="space-y-6" onSubmit={onSubmit}>
        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-3">
            <label className="text-sm font-medium">Title</label>
            <Input
              placeholder="Give your event a clear name"
              {...form.register('title')}
            />
            {form.formState.errors.title && (
              <p className="text-xs text-error">
                {form.formState.errors.title.message}
              </p>
            )}
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium">Visibility</label>
            <Select
              value={form.watch('visibility')}
              onChange={(e) => form.setValue('visibility', e.target.value as any)}
            >
              <option value="public">Public</option>
              <option value="unlisted">Unlisted</option>
              <option value="private">Private</option>
            </Select>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-3">
            <label className="text-sm font-medium">Category</label>
            <Select
              value={form.watch('categoryId')}
              onChange={(e) => form.setValue('categoryId', e.target.value)}
              disabled={isLoadingCategories}
            >
              <option value="" disabled>
                {isLoadingCategories ? 'Loading...' : 'Select a category'}
              </option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </Select>
            {form.formState.errors.categoryId && (
              <p className="text-xs text-error">
                {form.formState.errors.categoryId.message}
              </p>
            )}
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium">Tags</label>
            <Input
              placeholder="marketing, vip, workshop"
              {...form.register('tags')}
            />
            <p className="text-xs text-muted-foreground">
              Separate tags with commas. Up to 10.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-sm font-medium">Cover image</label>
          <div className="flex items-center gap-4">
            {coverUrl ? (
              <img src={resolveImageUrl(coverUrl) || undefined} alt="Cover" className="h-20 w-36 rounded-md object-cover border" />
            ) : (
              <div className="h-20 w-36 rounded-md border border-dashed flex items-center justify-center text-xs text-muted-foreground">No image</div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file || !draft) return;
                if (file.size < 10 * 1024) return; // basic sanity
                const res = await eventCreatorV2Api.uploadCover(draft.id, file);
                setCoverUrl(res.coverImageUrl);
                await updateSection('basics', { autosave: true, payload: { coverImageUrl: res.coverImageUrl } }, { showToast: false });
              }}
            />
          </div>
          <p className="text-xs text-muted-foreground">16:9 recommended, minimum 1440×810.</p>
        </div>

        <div className="space-y-3">
          <label className="text-sm font-medium">Short description</label>
          <Textarea
            placeholder="One-line summary for cards and SEO (max 160 chars)"
            rows={3}
            maxLength={160}
            {...form.register('shortDescription')}
          />
          {form.formState.errors.shortDescription && (
            <p className="text-xs text-error">
              {form.formState.errors.shortDescription.message}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={isSaving}>
            {isSaving ? 'Saving…' : 'Save basics'}
          </Button>
          <span className="text-xs text-muted-foreground">
            Autosaves on change; this button also marks the section complete.
          </span>
        </div>
      </form>
    </div>
  );
}
