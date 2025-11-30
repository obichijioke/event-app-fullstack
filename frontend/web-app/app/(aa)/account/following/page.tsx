'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { authApi, type FollowingOrganization } from '@/lib/api/auth-api';
import { Loader2, Heart, Building2 } from 'lucide-react';

export default function FollowingPage() {
  const [following, setFollowing] = useState<FollowingOrganization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFollowing();
  }, []);

  const fetchFollowing = async () => {
    try {
      const data = await authApi.getFollowing();
      setFollowing(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load following list');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="overflow-hidden rounded-xl border border-border/70 bg-card">
        <div className="bg-linear-to-r from-slate-900 via-slate-800 to-slate-700 px-6 py-6 text-white">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur mb-2">
            <Heart className="h-4 w-4" />
            Following
          </div>
          <h1 className="text-3xl font-semibold">Organizers You Follow</h1>
          <p className="text-sm text-slate-200 mt-1">Stay updated with your favorite event organizers</p>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/40 rounded-xl p-4">
          <p className="text-destructive text-sm">{error}</p>
        </div>
      )}

      {/* Organizers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {following.length === 0 ? (
          <div className="col-span-full">
            <div className="bg-card rounded-xl border border-border/70 p-12 text-center">
              <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-lg font-semibold mb-2">No organizers yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                You&apos;re not following any organizers yet
              </p>
              <Link
                href="/events"
                className="inline-block px-6 py-2.5 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition text-sm font-medium"
              >
                Discover Events
              </Link>
            </div>
          </div>
        ) : (
          following.map((item) => (
            <div key={item.id} className="bg-card rounded-xl border border-border/70 overflow-hidden hover:shadow-md transition">
              <div className="p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-16 h-16 bg-muted rounded-full shrink-0 flex items-center justify-center border-2 border-border/50">
                    {item.org.logoUrl ? (
                      <img
                        src={item.org.logoUrl}
                        alt={item.org.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <Building2 className="w-8 h-8 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold mb-1 truncate">{item.org.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {item.org._count?.events || 0} {item.org._count?.events === 1 ? 'event' : 'events'}
                    </p>
                  </div>
                </div>
                {item.org.description && (
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {item.org.description}
                  </p>
                )}
              </div>
              <div className="px-6 pb-6">
                <Link
                  href={`/organizers/${item.orgId}`}
                  className="block text-center px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition text-sm font-medium"
                >
                  View Profile
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
