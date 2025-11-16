'use client';

import { useEffect, useState } from 'react';
import { useOrganizerStore } from '@/lib/stores/organizer-store';
import { organizerApi } from '@/lib/api/organizer-api';
import { Loader2 } from 'lucide-react';
import { EmptyState } from './empty-state';
import { useAuth } from '@/components/auth';

export function OrganizationProvider({ children }: { children: React.ReactNode }) {
  const { organizations, setOrganizations, setLoading, isLoading } = useOrganizerStore();
  const { initialized: authInitialized, accessToken } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    async function loadOrganizations() {
      if (!authInitialized || !accessToken) {
        return;
      }

      if (organizations.length > 0 || initialized) {
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const orgs = await organizerApi.getMyOrganizations();
        setOrganizations(orgs);
        setInitialized(true);
      } catch (err) {
        console.error('Failed to load organizations:', err);

        // Clear potentially stale organization data from localStorage on error
        try {
          localStorage.removeItem('organizer-storage');
        } catch (storageErr) {
          console.error('Failed to clear localStorage:', storageErr);
        }

        setError(err instanceof Error ? err.message : 'Failed to load organizations');
        setInitialized(true);
      } finally {
        setLoading(false);
      }
    }

    loadOrganizations();
  }, [authInitialized, accessToken, organizations.length, initialized, setLoading, setOrganizations]);

  useEffect(() => {
    if (authInitialized && !accessToken) {
      setError('You must be signed in to view organizer data.');
      setInitialized(true);
    }
  }, [authInitialized, accessToken]);

  if (!authInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Checking your session...</p>
        </div>
      </div>
    );
  }

  if (isLoading && !initialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your organizations...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="max-w-md text-center">
          <EmptyState
            title="Unable to Load Organizations"
            description={
              <div className="space-y-2">
                <p className="text-muted-foreground">{error}</p>
                <p className="text-sm text-muted-foreground">
                  Please ensure you are logged in and have the necessary permissions.
                  If the problem persists, try logging out and back in.
                </p>
              </div>
            }
            action={
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 border border-primary text-primary rounded-lg hover:bg-primary/10 transition"
                >
                  Retry
                </button>
                <a
                  href="/auth/login"
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition"
                >
                  Go to Login
                </a>
              </div>
            }
          />
        </div>
      </div>
    );
  }

  if (organizations.length === 0 && initialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="max-w-lg text-center">
          <EmptyState
            title="No Organizations Found"
            description={
              <div className="space-y-2">
                <p className="text-muted-foreground">
                  You need to be a member of an organization to access the organizer dashboard.
                </p>
                <p className="text-sm text-muted-foreground">
                  Create a new organization or ask an existing organization owner to add you as a member.
                </p>
              </div>
            }
            action={
              <div className="flex gap-3 justify-center">
                <a
                  href="/organizations/create"
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition"
                >
                  Create Organization
                </a>
                <a
                  href="/"
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Back to Home
                </a>
              </div>
            }
          />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
