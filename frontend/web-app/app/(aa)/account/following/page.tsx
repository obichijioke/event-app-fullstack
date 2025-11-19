'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { authApi, type FollowingOrganization } from '@/lib/api/auth-api';
import { Loader2 } from 'lucide-react';

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
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Following</h1>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Following</h1>

      {error && (
        <div className="bg-destructive/10 border border-destructive rounded-lg p-4 mb-6">
          <p className="text-destructive text-sm">{error}</p>
        </div>
      )}

      {/* Organizers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {following.length === 0 ? (
          <p className="col-span-full text-center text-muted-foreground py-8">
            You&apos;re not following any organizers yet
          </p>
        ) : (
          following.map((item) => (
            <div key={item.id} className="bg-card rounded-lg shadow-card p-6">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-16 h-16 bg-muted rounded-full flex-shrink-0 flex items-center justify-center">
                  {item.org.logoUrl ? (
                    <img
                      src={item.org.logoUrl}
                      alt={item.org.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-xl font-bold text-muted-foreground">
                      {item.org.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">{item.org.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {item.org._count?.events || 0} events
                  </p>
                </div>
              </div>
              {item.org.description && (
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {item.org.description}
                </p>
              )}
              <div className="flex gap-2">
                <Link
                  href={`/organizers/${item.orgId}`}
                  className="flex-1 text-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition text-sm"
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
