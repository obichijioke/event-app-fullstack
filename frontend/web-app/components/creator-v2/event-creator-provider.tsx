'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { toast } from 'react-hot-toast';
import { eventCreatorV2Api } from '@/lib/api/event-creator-v2-api';
import type {
  EventCreatorDraft,
  EventCreatorSectionType,
  UpdateDraftSectionRequest,
} from '@/lib/types/event-creator-v2';

interface DraftContextValue {
  draft: EventCreatorDraft | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  activeSection: EventCreatorSectionType;
  lastSavedAt: Date | null;
  refresh: () => Promise<void>;
  setActiveSection: (section: EventCreatorSectionType) => void;
  updateSection: (
    section: EventCreatorSectionType,
    payload: UpdateDraftSectionRequest,
    options?: { showToast?: boolean },
  ) => Promise<void>;
}

const EventCreatorDraftContext = createContext<DraftContextValue | undefined>(
  undefined,
);

interface ProviderProps {
  draftId: string;
  children: React.ReactNode;
}

export function EventCreatorDraftProvider({
  draftId,
  children,
}: ProviderProps) {
  const [draft, setDraft] = useState<EventCreatorDraft | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] =
    useState<EventCreatorSectionType>('basics');
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  const fetchDraft = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await eventCreatorV2Api.getDraft(draftId);
      setDraft(data);
      setActiveSection(data.activeSection);
      setLastSavedAt(
        data.lastAutosavedAt ? new Date(data.lastAutosavedAt) : null,
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to load draft data';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [draftId]);

  useEffect(() => {
    fetchDraft();
  }, [fetchDraft]);

  const refresh = useCallback(async () => {
    await fetchDraft();
  }, [fetchDraft]);

  const updateSection = useCallback(
    async (
      section: EventCreatorSectionType,
      payload: UpdateDraftSectionRequest,
      options?: { showToast?: boolean },
    ) => {
      setIsSaving(true);
      setError(null);
      try {
        const updated = await eventCreatorV2Api.updateSection(
          draftId,
          section,
          payload,
        );
        setDraft(updated);
        setActiveSection(updated.activeSection);
        setLastSavedAt(
          updated.lastAutosavedAt
            ? new Date(updated.lastAutosavedAt)
            : new Date(),
        );

        if (options?.showToast && !payload.autosave) {
          toast.success('Section saved');
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Unable to save section';
        setError(message);
        if (!payload.autosave) {
          toast.error(message);
          throw err; // only escalate non-autosave errors
        }
        // swallow autosave errors to avoid unhandled promise rejections in debounced calls
      } finally {
        setIsSaving(false);
      }
    },
    [draftId],
  );

  const value = useMemo(
    () => ({
      draft,
      isLoading,
      isSaving,
      error,
      activeSection,
      lastSavedAt,
      refresh,
      setActiveSection,
      updateSection,
    }),
    [
      activeSection,
      draft,
      error,
      isLoading,
      isSaving,
      lastSavedAt,
      refresh,
      updateSection,
    ],
  );

  return (
    <EventCreatorDraftContext.Provider value={value}>
      {children}
    </EventCreatorDraftContext.Provider>
  );
}

export function useEventCreatorDraft() {
  const context = useContext(EventCreatorDraftContext);
  if (!context) {
    throw new Error(
      'useEventCreatorDraft must be used within EventCreatorDraftProvider',
    );
  }
  return context;
}
