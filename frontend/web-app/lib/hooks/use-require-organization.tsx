import React from 'react';
import { useOrganizerStore } from '../stores/organizer-store';
import type { DashboardOrganization } from '../types/organizer';

export interface UseRequireOrganizationReturn {
  currentOrganization: DashboardOrganization | null;
  ensureOrganization: () => DashboardOrganization | null;
  isAvailable: boolean;
  renderEmpty: (() => React.JSX.Element) | null;
}

/**
 * Custom hook for components that require an organization to be selected
 *
 * @returns Organization state and helper functions
 *
 * @example
 * // Basic usage
 * const { currentOrganization, ensureOrganization } = useRequireOrganization();
 *
 * // Use in event handler
 * const handleSubmit = async () => {
 *   const org = ensureOrganization();
 *   if (!org) return; // Will show error toast automatically
 *   await api.createEvent({ orgId: org.id, ...data });
 * };
 *
 * // Use for conditional rendering
 * const { renderEmpty, isAvailable } = useRequireOrganization();
 * if (renderEmpty) return renderEmpty();
 */
export function useRequireOrganization(): UseRequireOrganizationReturn {
  const { currentOrganization } = useOrganizerStore();

  const ensureOrganization = (): DashboardOrganization | null => {
    if (!currentOrganization) {
      // The error toast will be shown by the component using this hook
      // This keeps the hook pure and allows components to decide how to handle the error
      return null;
    }
    return currentOrganization;
  };

  if (!currentOrganization) {
    return {
      currentOrganization: null,
      ensureOrganization,
      isAvailable: false,
      renderEmpty: () => (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No Organization Selected
            </h3>
            <p className="text-muted-foreground">
              Please select an organization from the dropdown above to continue.
            </p>
          </div>
        </div>
      ),
    };
  }

  return {
    currentOrganization,
    ensureOrganization: () => currentOrganization,
    isAvailable: true,
    renderEmpty: null,
  };
}
