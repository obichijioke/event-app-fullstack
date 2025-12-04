"use client";

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { organizerApiService, DisputeStats } from '@/services/organizer-api.service';
import { DisputeStatsComponent } from '@/components/organizer/disputes/dispute-stats';
import { DisputeList } from '@/components/organizer/disputes/dispute-list';
import { AlertCircle } from 'lucide-react';

export default function DisputesPage() {
  const searchParams = useSearchParams();
  const orgId = searchParams.get('orgId') || '';

  const [stats, setStats] = useState<DisputeStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orgId) {
      setError('Organization ID is required');
      setIsLoadingStats(false);
      return;
    }
    loadStats();
  }, [orgId]);

  const loadStats = async () => {
    try {
      setIsLoadingStats(true);
      setError(null);
      const statsData = await organizerApiService.getDisputeStats(orgId);
      setStats(statsData);
    } catch (err: any) {
      setError(err.message || 'Failed to load dispute statistics');
    } finally {
      setIsLoadingStats(false);
    }
  };

  if (!orgId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="border border-red-200 rounded-lg p-6 bg-red-50">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-900">Organization ID Required</p>
              <p className="text-sm text-red-700 mt-1">
                Please select an organization from the dashboard to view disputes.
              </p>
              <Link
                href="/organizer"
                className="mt-3 inline-block text-sm text-red-700 underline hover:text-red-800"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payment Disputes</h1>
          <p className="text-gray-600 mt-1">
            View and respond to payment disputes from buyers
          </p>
        </div>
        <Link
          href={`/organizer?orgId=${orgId}`}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm font-medium"
        >
          ← Back to Dashboard
        </Link>
      </div>

      {/* Statistics */}
      {stats && <DisputeStatsComponent stats={stats} isLoading={isLoadingStats} />}

      {/* Information Banner */}
      <div className="border border-blue-200 rounded-lg p-4 bg-blue-50 mb-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-blue-900">About Payment Disputes</p>
            <p className="text-sm text-blue-700 mt-1">
              Disputes occur when a buyer contests a charge with their bank. Respond promptly with
              evidence to increase your chances of winning. Check response deadlines carefully.
            </p>
          </div>
        </div>
      </div>

      {/* Disputes List */}
      {error && !stats ? (
        <div className="border border-red-200 rounded-lg p-6 bg-red-50">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-900">Error loading disputes</p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
              <button
                onClick={loadStats}
                className="mt-3 text-sm text-red-700 underline hover:text-red-800"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      ) : (
        <DisputeList orgId={orgId} />
      )}
    </div>
  );
}
