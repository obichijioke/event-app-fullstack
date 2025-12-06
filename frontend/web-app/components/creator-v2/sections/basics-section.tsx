'use client';

import React, { useCallback, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/input';
import { eventCreatorV2Api } from '@/lib/api/event-creator-v2-api';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { categoriesApi, type Category } from '@/lib/api/categories-api';
import { resolveImageUrl } from '@/lib/utils/image';
import { useEventCreatorDraft } from '@/components/creator-v2/event-creator-provider';
import type { EventCreatorDraftSection } from '@/lib/types/event-creator-v2';
import { debounce } from '@/lib/utils/debounce';
import { toast } from 'react-hot-toast';
import { VisibilitySelector } from '@/components/creator-v2/visibility-selector';
import { TagInput } from '@/components/creator-v2/tag-input';
import { CoverImageUpload } from '@/components/creator-v2/cover-image-upload';
import { cn } from '@/lib/utils';

const schema = z.object({
  title: z.string().min(1, 'Title is required').max(75, 'Keep it under 75'),
  categoryId: z.string().min(1, 'Choose a category'),
  tags: z.array(z.string()).max(10, 'Maximum 10 tags').optional(),
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

  const handleImageUpload = async (file: File) => {
    if (!draft) return;
    
    // Basic validation
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    try {
      // Optimistic preview could be done here with FileReader
      const res = await eventCreatorV2Api.uploadCover(draft.id, file);
      setCoverUrl(res.coverImageUrl);
      await updateSection(
        'basics',
        { autosave: true, payload: { coverImageUrl: res.coverImageUrl } },
        { showToast: false }
      );
      toast.success('Cover image uploaded');
    } catch (error) {
      toast.error('Failed to upload image');
      console.error(error);
    }
  };

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
        ? (basics?.payload?.tags as string[])
        : [],
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
      debounce((...args: unknown[]) => {
        const values = args[0] as z.infer<typeof schema>;
        void updateSection(
          'basics',
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
      debounce((...args: unknown[]) => {
        const issues = args[0] as z.ZodIssue[];
        void updateSection(
          'basics',
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
    (values: z.infer<typeof schema>) => {
      const parsed = schema.safeParse(values);
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
      handleAutosave(values as z.infer<typeof schema>);
    });
    return () => subscription.unsubscribe();
  }, [form, handleAutosave]);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold">Basics</h2>
        <p className="text-sm text-muted-foreground">
          Set the essentials for your event and we'll autosave as you type.
        </p>
      </div>

      <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
        {/* Title with character counter */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Event Title *</label>
          <Input
            placeholder="Give your event a clear, descriptive name"
            {...form.register('title')}
            className={cn(
              form.formState.errors.title && 'border-red-600 dark:border-red-400'
            )}
            maxLength={75}
          />
          <div className="flex items-center justify-between text-xs">
            {form.formState.errors.title ? (
              <p className="text-red-600 dark:text-red-400">
                {form.formState.errors.title.message}
              </p>
            ) : (
              <p className="text-muted-foreground">
                Choose a title that clearly describes your event
              </p>
            )}
            <span
              className={cn(
                'font-medium',
                form.watch('title').length > 70
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-muted-foreground'
              )}
            >
              {form.watch('title').length} / 75
            </span>
          </div>
        </div>

        {/* Visibility Selector */}
        <VisibilitySelector
          value={form.watch('visibility')}
          onChange={(value) => form.setValue('visibility', value)}
          disabled={isSaving}
        />

        {/* Category */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Category *</label>
          <Select
            value={form.watch('categoryId')}
            onChange={(e) => form.setValue('categoryId', e.target.value)}
            disabled={isLoadingCategories}
            className={cn(
              'text-sm',
              form.formState.errors.categoryId && 'border-red-600 dark:border-red-400'
            )}
          >
            <option value="" disabled>
              {isLoadingCategories ? 'Loading categories...' : 'Select a category'}
            </option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </Select>
          {form.formState.errors.categoryId ? (
            <p className="text-xs text-red-600 dark:text-red-400">
              {form.formState.errors.categoryId.message}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Help people discover your event in the right category
            </p>
          )}
        </div>

        {/* Tags */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Tags</label>
          <TagInput
            value={form.watch('tags') || []}
            onChange={(tags) => form.setValue('tags', tags)}
            maxTags={10}
            disabled={isSaving}
          />
          {form.formState.errors.tags && (
            <p className="text-xs text-red-600 dark:text-red-400">
              {form.formState.errors.tags.message}
            </p>
          )}
        </div>

        {/* Cover Image */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Cover Image</label>
          <CoverImageUpload
            value={coverUrl ? resolveImageUrl(coverUrl) : null}
            onUpload={handleImageUpload}
            onRemove={() => {
              setCoverUrl(null);
              void updateSection(
                'basics',
                { autosave: true, payload: { coverImageUrl: null } },
                { showToast: false }
              );
            }}
            maxSize={5}
            disabled={isSaving}
          />
        </div>

        {/* Short Description with character counter */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Short Description</label>
          <Textarea
            placeholder="One-line summary for event cards and search engine previews"
            rows={3}
            maxLength={160}
            {...form.register('shortDescription')}
            className={cn(
              form.formState.errors.shortDescription && 'border-red-600 dark:border-red-400'
            )}
          />
          <div className="flex items-center justify-between text-xs">
            {form.formState.errors.shortDescription ? (
              <p className="text-red-600 dark:text-red-400">
                {form.formState.errors.shortDescription.message}
              </p>
            ) : (
              <p className="text-muted-foreground">
                Brief summary that appears in listings and search results
              </p>
            )}
            <span
              className={cn(
                'font-medium',
                (form.watch('shortDescription')?.length || 0) > 150
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-muted-foreground'
              )}
            >
              {form.watch('shortDescription')?.length || 0} / 160
            </span>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Autosaves as you type and marks this step complete once required fields are valid.
        </p>
      </form>
    </div>
  );
}
