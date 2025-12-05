import { useEffect } from 'react';
import { savedEventsService } from '@/services/saved-events.service';
import { ApiError } from '@/lib/api/client';
import { getAccessToken } from '@/lib/auth/token-store';
import { create } from 'zustand';
import toast from 'react-hot-toast';

interface SavedEventsStore {
  savedIds: Set<string>;
  isLoading: boolean;
  isLoaded: boolean;
  fetchSavedIds: () => Promise<void>;
  toggleSave: (eventId: string) => Promise<void>;
  isSaved: (eventId: string) => boolean;
}

export const useSavedEventsStore = create<SavedEventsStore>((set, get) => ({
  savedIds: new Set(),
  isLoading: false,
  isLoaded: false,
  fetchSavedIds: async () => {
    const { isLoaded, isLoading } = get();
    if (isLoaded || isLoading) return;

    const token = getAccessToken();
    if (!token) {
      return;
    }

    set({ isLoading: true });
    try {
      const ids = await savedEventsService.getSavedEventIds();
      set({ savedIds: new Set(ids), isLoading: false, isLoaded: true });
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        set({ isLoading: false, isLoaded: false, savedIds: new Set() });
        return;
      }
      console.error('Failed to fetch saved events', error);
      set({ isLoading: false });
    }
  },
  toggleSave: async (eventId: string) => {
    const { savedIds } = get();
    const isSaved = savedIds.has(eventId);
    
    // Optimistic update
    const newSavedIds = new Set(savedIds);
    if (isSaved) {
      newSavedIds.delete(eventId);
    } else {
      newSavedIds.add(eventId);
    }
    set({ savedIds: newSavedIds });

    try {
      const result = await savedEventsService.toggleSave(eventId);
      
      // Revert if server response doesn't match (though unlikely with toggle)
      if (result.saved !== !isSaved) {
         // Sync with server truth
         const syncedIds = new Set(savedIds);
         if (result.saved) syncedIds.add(eventId);
         else syncedIds.delete(eventId);
         set({ savedIds: syncedIds });
      }
      
      toast.success(result.saved ? 'Event saved to favorites' : 'Event removed from favorites');
    } catch (error) {
      console.error('Failed to toggle save', error);
      // Revert on error
      set({ savedIds });
      toast.error('Failed to update favorite status');
    }
  },
  isSaved: (eventId: string) => get().savedIds.has(eventId),
}));

export const useSavedEvents = () => {
  const store = useSavedEventsStore();
  
  useEffect(() => {
    // Initial fetch if empty (or could be smarter about when to fetch)
    // For now, we fetch on mount if we haven't fetched yet? 
    // Or just let the component trigger it?
    // Let's trigger it once on mount of the app or layout?
    // For simplicity, we'll let the hook trigger it if it's the first time being used?
    // Actually, handling this in a component might be better to avoid multiple fetches.
    // But store is global, so we can check if we should fetch.
    // We'll leave it to the consumer to call fetchSavedIds if needed, 
    // OR we can just fetch if size is 0 and not loading?
    // But what if user really has 0 saved events?
    // We need a 'fetched' flag.
  }, []);

  return store;
};
