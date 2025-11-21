'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { Sparkles, Layers3, Copy, Loader2 } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useOrganizerStore } from '@/lib/stores/organizer-store';
import { guessUserTimezone, POPULAR_TIMEZONES } from '@/lib/data/timezones';
import { eventCreatorV2Api } from '@/lib/api/event-creator-v2-api';
import { eventsApi, type OrganizerEventSummary } from '@/lib/api/events-api';
import type {
  CreateDraftRequest,
  EventCreatorEventType,
  EventCreatorTemplateSummary,
} from '@/lib/types/event-creator-v2';

const formSchema = z.object({
  organizationId: z.string().min(1, 'Choose an organization'),
  eventType: z.enum(['in_person', 'online', 'hybrid']),
  timezone: z.string().min(1, 'Choose a timezone'),
  title: z
    .string()
    .max(75, 'Keep your title under 75 characters')
    .optional()
    .or(z.literal('')),
});

type FormValues = z.infer<typeof formSchema>;
type CreationMode = 'start' | 'template' | 'duplicate';

interface CreateEventModalProps {
  open: boolean;
  onClose: () => void;
  onDraftCreated: (draftId: string) => void;
}

const CREATION_MODES: Array<{
  id: CreationMode;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    id: 'start',
    label: 'Start from scratch',
    description: 'Blank slate with recommended defaults',
    icon: Sparkles,
  },
  {
    id: 'template',
    label: 'Use template',
    description: 'Apply saved structure and copy',
    icon: Layers3,
  },
  {
    id: 'duplicate',
    label: 'Duplicate event',
    description: 'Clone settings from an existing event',
    icon: Copy,
  },
];

export function CreateEventModal({
  open,
  onClose,
  onDraftCreated,
}: CreateEventModalProps) {
  const router = useRouter();
  const { organizations, currentOrganization } = useOrganizerStore();
  const defaultOrgId =
    currentOrganization?.id ?? organizations.at(0)?.id ?? '';
  const [mode, setMode] = useState<CreationMode>('start');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [templates, setTemplates] = useState<EventCreatorTemplateSummary[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    null,
  );
  const [duplicateEvents, setDuplicateEvents] = useState<
    OrganizerEventSummary[]
  >([]);
  const [isLoadingDuplicates, setIsLoadingDuplicates] = useState(false);
  const [duplicateSearch, setDuplicateSearch] = useState('');
  const [selectedDuplicateId, setSelectedDuplicateId] = useState<string | null>(
    null,
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      organizationId: defaultOrgId,
      eventType: 'in_person',
      timezone: guessUserTimezone(),
      title: '',
    },
  });

  const organizationId = form.watch('organizationId');

  useEffect(() => {
    if (!open) {
      return;
    }
    if (!organizationId && defaultOrgId) {
      form.setValue('organizationId', defaultOrgId);
    }
  }, [open, defaultOrgId, organizationId, form]);

  useEffect(() => {
    if (!open || mode !== 'template' || !organizationId) {
      return;
    }
    setIsLoadingTemplates(true);
    setSelectedTemplateId(null);
    eventCreatorV2Api
      .listTemplates(organizationId)
      .then((data) => setTemplates(data))
      .catch((error) => {
        const message =
          error instanceof Error ? error.message : 'Unable to load templates';
        toast.error(message);
      })
      .finally(() => setIsLoadingTemplates(false));
  }, [mode, organizationId, open]);

  useEffect(() => {
    if (!open || mode !== 'duplicate' || !organizationId) {
      return;
    }
    setIsLoadingDuplicates(true);
    setSelectedDuplicateId(null);
    eventsApi
      .getOrganizerEvents({ orgId: organizationId })
      .then((data) => setDuplicateEvents(data))
      .catch((error) => {
        const message =
          error instanceof Error ? error.message : 'Unable to load events';
        toast.error(message);
      })
      .finally(() => setIsLoadingDuplicates(false));
  }, [mode, organizationId, open]);

  useEffect(() => {
    if (!open) {
      setMode('start');
      setSelectedTemplateId(null);
      setSelectedDuplicateId(null);
      setDuplicateSearch('');
      form.reset({
        organizationId: defaultOrgId,
        eventType: 'in_person',
        timezone: guessUserTimezone(),
        title: '',
      });
    }
  }, [open, form, defaultOrgId]);

  const filteredDuplicateEvents = useMemo(() => {
    if (!duplicateSearch.trim()) {
      return duplicateEvents;
    }
    const query = duplicateSearch.toLowerCase();
    return duplicateEvents.filter((event) =>
      event.title.toLowerCase().includes(query),
    );
  }, [duplicateEvents, duplicateSearch]);

  const handleSubmit = form.handleSubmit(async (values) => {
    if (!values.organizationId) {
      toast.error('Choose an organization to continue');
      return;
    }

    const payload: CreateDraftRequest = {
      organizationId: values.organizationId,
      eventType: values.eventType as EventCreatorEventType,
      timezone: values.timezone,
      title: values.title?.trim() ? values.title.trim() : undefined,
    };

    if (mode === 'template') {
      if (!selectedTemplateId) {
        toast.error('Select a template to continue');
        return;
      }
      payload.templateId = selectedTemplateId;
    }

    if (mode === 'duplicate') {
      if (!selectedDuplicateId) {
        toast.error('Select an event to duplicate');
        return;
      }
      payload.sourceEventId = selectedDuplicateId;
    }

    setIsSubmitting(true);
    try {
      const draft = await eventCreatorV2Api.createDraft(payload);
      toast.success('Draft created');
      onDraftCreated(draft.id);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to create draft';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  });

  const disablePrimary = useMemo(() => {
    if (!form.watch('organizationId') || !form.watch('timezone')) {
      return true;
    }
    if (mode === 'template') {
      return !selectedTemplateId;
    }
    if (mode === 'duplicate') {
      return !selectedDuplicateId;
    }
    return false;
  }, [form, mode, selectedTemplateId, selectedDuplicateId]);

  const hasOrganizations = organizations.length > 0;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create event"
      maxWidth="4xl"
      footer={
        <Modal.Footer>
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={disablePrimary || isSubmitting || !hasOrganizations}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating...
              </span>
            ) : (
              'Start building'
            )}
          </Button>
        </Modal.Footer>
      }
    >
      {!hasOrganizations ? (
        <div className="flex flex-col items-center gap-4 py-8 text-center">
          <p className="text-muted-foreground">
            You need an organizer profile before creating events.
          </p>
          <Button onClick={() => router.push('/organizer/onboarding')}>
            Set up organizer profile
          </Button>
        </div>
      ) : (
        <div className="space-y-8">
          <section>
            <p className="text-sm font-medium text-muted-foreground mb-3">
              How would you like to start?
            </p>
            <div className="grid gap-3 md:grid-cols-3">
              {CREATION_MODES.map((option) => {
                const Icon = option.icon;
                const isSelected = mode === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setMode(option.id)}
                    className={`rounded-2xl border p-4 text-left transition hover:border-primary/60 ${
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : 'border-border bg-card'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full p-2 ${
                          isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="text-sm font-semibold">
                        {option.label}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground leading-snug">
                      {option.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="grid gap-5 md:grid-cols-2">
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">
                Organization
              </label>
              <Select
                value={organizationId}
                onChange={(event) => {
                  setSelectedTemplateId(null);
                  setSelectedDuplicateId(null);
                  form.setValue('organizationId', event.target.value);
                }}
              >
                <option value="" disabled>
                  Select organization
                </option>
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">
                Event type
              </label>
              <div className="flex items-center gap-2">
                {(['in_person', 'online', 'hybrid'] as EventCreatorEventType[]).map(
                  (type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => form.setValue('eventType', type)}
                      className={`flex-1 rounded-xl border px-4 py-2 text-sm capitalize ${
                        form.watch('eventType') === type
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-border bg-card'
                      }`}
                    >
                      {type.replace('_', ' ')}
                    </button>
                  ),
                )}
              </div>
            </div>
          </section>

          <section className="grid gap-5 md:grid-cols-2">
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">
                Timezone
              </label>
              <Select
                value={form.watch('timezone')}
                onChange={(event) =>
                  form.setValue('timezone', event.target.value)
                }
              >
                <option value="" disabled>
                  Select timezone
                </option>
                {POPULAR_TIMEZONES.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">
                Internal name (optional)
              </label>
              <Input
                placeholder="e.g. Spring Product Launch"
                maxLength={75}
                {...form.register('title')}
              />
              <p className="text-xs text-muted-foreground">
                Only shown to you and collaborators.
              </p>
            </div>
          </section>

          {mode === 'template' && (
            <TemplatePicker
              isLoading={isLoadingTemplates}
              templates={templates}
              selectedTemplateId={selectedTemplateId}
              onSelect={setSelectedTemplateId}
            />
          )}

          {mode === 'duplicate' && (
            <DuplicatePicker
              isLoading={isLoadingDuplicates}
              events={filteredDuplicateEvents}
              search={duplicateSearch}
              onSearch={setDuplicateSearch}
              selectedId={selectedDuplicateId}
              onSelect={setSelectedDuplicateId}
            />
          )}
        </div>
      )}
    </Modal>
  );
}

interface TemplatePickerProps {
  isLoading: boolean;
  templates: EventCreatorTemplateSummary[];
  selectedTemplateId: string | null;
  onSelect: (id: string) => void;
}

function TemplatePicker({
  isLoading,
  templates,
  selectedTemplateId,
  onSelect,
}: TemplatePickerProps) {
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading templates...
      </div>
    );
  }

  if (!templates.length) {
    return (
      <div className="rounded-2xl border border-dashed border-border p-6 text-center text-muted-foreground">
        No templates yet. Save a draft as a template to reuse it here.
      </div>
    );
  }

  return (
    <section className="space-y-3">
      <div>
        <p className="text-sm font-medium text-foreground">Templates</p>
        <p className="text-xs text-muted-foreground">
          Apply saved structure, copy, and ticket settings.
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {templates.map((template) => {
          const isSelected = template.id === selectedTemplateId;
          return (
            <button
              key={template.id}
              type="button"
              onClick={() => onSelect(template.id)}
              className={`rounded-2xl border p-4 text-left transition hover:border-primary/60 ${
                isSelected
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-card'
              }`}
            >
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold">{template.name}</h4>
                {template.isDefault && (
                  <Badge variant="outline" className="text-xs">
                    Default
                  </Badge>
                )}
              </div>
              <p className="mt-2 text-xs text-muted-foreground line-clamp-2">
                {template.description ?? 'No description provided.'}
              </p>
            </button>
          );
        })}
      </div>
    </section>
  );
}

interface DuplicatePickerProps {
  isLoading: boolean;
  events: OrganizerEventSummary[];
  search: string;
  onSearch: (value: string) => void;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

function DuplicatePicker({
  isLoading,
  events,
  search,
  onSearch,
  selectedId,
  onSelect,
}: DuplicatePickerProps) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-foreground">
            Duplicate an event
          </p>
          <p className="text-xs text-muted-foreground">
            Copy schedule, tickets, pricing, and imagery from an existing event.
          </p>
        </div>
        <Input
          value={search}
          onChange={(event) => onSearch(event.target.value)}
          placeholder="Search events"
          className="max-w-xs"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading events...
        </div>
      ) : events.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-6 text-center text-muted-foreground">
          No events found for this organization.
        </div>
      ) : (
        <div className="space-y-2">
          {events.slice(0, 6).map((event) => {
            const isSelected = event.id === selectedId;
            return (
              <button
                key={event.id}
                type="button"
                onClick={() => onSelect(event.id)}
                className={`w-full rounded-2xl border px-4 py-3 text-left transition hover:border-primary/60 ${
                  isSelected
                    ? 'border-primary bg-primary/5'
                    : 'border-border bg-card'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">{event.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(event.startAt), 'MMM d, yyyy • h:mm a')}
                    </p>
                  </div>
                  <Badge variant="outline" className="capitalize">
                    {event.status.toLowerCase()}
                  </Badge>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
