import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { DashboardOrganization } from '../types/organizer';

interface OrganizerState {
  // Current selected organization
  currentOrganization: DashboardOrganization | null;

  // All organizations the user is a member of
  organizations: DashboardOrganization[];

  // Loading states
  isLoading: boolean;

  // Actions
  setCurrentOrganization: (org: DashboardOrganization | null) => void;
  setOrganizations: (orgs: DashboardOrganization[]) => void;
  setLoading: (loading: boolean) => void;

  // Clear all state (for logout)
  clearState: () => void;
}

const initialState = {
  currentOrganization: null,
  organizations: [],
  isLoading: false,
};

export const useOrganizerStore = create<OrganizerState>()(
  persist(
    (set) => ({
      ...initialState,

      setCurrentOrganization: (org) => set({ currentOrganization: org }),

      setOrganizations: (orgs) => {
        set({ organizations: orgs });
        // If no current organization is set, set the first one
        set((state) => {
          if (!state.currentOrganization && orgs.length > 0) {
            return { currentOrganization: orgs[0] };
          }
          return {};
        });
      },

      setLoading: (loading) => set({ isLoading: loading }),

      clearState: () => set(initialState),
    }),
    {
      name: 'organizer-storage',
      partialize: (state) => ({
        currentOrganization: state.currentOrganization,
        organizations: state.organizations,
      }),
    }
  )
);
