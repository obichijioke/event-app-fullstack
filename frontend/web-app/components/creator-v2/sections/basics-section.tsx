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
import { ImagePlus, X } from 'lucide-react';
import { toast } from 'react-hot-toast';

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
  const [isDragging, setIsDragging] = React.useState(false);

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
      debounce((...args: unknown[]) => {
        const values = args[0] as z.infer<typeof schema>;
        void updateSection(
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
            status: 'valid',
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

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold">Basics</h2>
        <p className="text-sm text-muted-foreground">
          Set the essentials for your event and we'll autosave as you type.
        </p>
      </div>

      <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
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
          <div
            className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-colors ${
              isDragging ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={async (e) => {
              e.preventDefault();
              setIsDragging(false);
              const file = e.dataTransfer.files?.[0];
              if (file) await handleImageUpload(file);
            }}
          >
            {coverUrl ? (
              <div className="relative aspect-video w-full max-w-md overflow-hidden rounded-lg border bg-muted">
                <img
                  src={resolveImageUrl(coverUrl) || undefined}
                  alt="Cover"
                  className="h-full w-full object-cover"
                />
                <div className="absolute right-2 top-2 flex gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => {
                      setCoverUrl(null);
                      void updateSection(
                        'basics',
                        { autosave: true, payload: { coverImageUrl: null } },
                        { showToast: false }
                      );
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="rounded-full bg-muted p-4">
                  <ImagePlus className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    <span className="text-primary cursor-pointer hover:underline">
                      Click to upload
                    </span>{' '}
                    or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground">
                    SVG, PNG, JPG or GIF (max. 800x400px)
                  </p>
                </div>
              </div>
            )}
            <input
              type="file"
              className="absolute inset-0 cursor-pointer opacity-0 disabled:cursor-not-allowed"
              accept="image/*"
              disabled={!!coverUrl}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file) await handleImageUpload(file);
                // Reset input so same file can be selected again if needed
                e.target.value = '';
              }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Recommended size: 2160 x 1080px (2:1 ratio)
          </p>
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
            {isSaving ? 'Saving...' : 'Save basics'}
          </Button>
          <span className="text-xs text-muted-foreground">
            Autosaves on change; this button also marks the section complete.
          </span>
        </div>
      </form>
    </div>
  );
}
