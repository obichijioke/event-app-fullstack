'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  organizerDisputesApi,
  type OrganizerDispute,
} from '@/services/organizer-disputes-api.service';
import { DISPUTE_CATEGORIES } from '@/services/buyer-disputes-api.service';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import {
  AlertCircle,
  AlertTriangle,
  Clock,
  CheckCircle2,
  MessageSquare,
  Search,
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

const STATUS_LABELS: Record<string, string> = {
  open: 'Open - Awaiting Response',
  organizer_responded: 'Responded',
  escalated: 'Escalated',
  moderator_review: 'Under Review',
  resolved: 'Resolved',
  appealed: 'Appealed',
  closed: 'Closed',
};

const STATUS_COLORS: Record<string, string> = {
  open: 'bg-amber-100 text-amber-800 border-amber-300',
  organizer_responded: 'bg-blue-100 text-blue-800 border-blue-300',
  escalated: 'bg-orange-100 text-orange-800 border-orange-300',
  moderator_review: 'bg-purple-100 text-purple-800 border-purple-300',
  resolved: 'bg-green-100 text-green-800 border-green-300',
  appealed: 'bg-red-100 text-red-800 border-red-300',
  closed: 'bg-gray-100 text-gray-800 border-gray-300',
};

interface PlatformDisputeListProps {
  orgId: string;
}

export function PlatformDisputeList({ orgId }: PlatformDisputeListProps) {
  const router = useRouter();
  const [disputes, setDisputes] = useState<OrganizerDispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [urgentOnly, setUrgentOnly] = useState(false);

  const loadDisputes = async () => {
    setLoading(true);
    try {
      const response = await organizerDisputesApi.getPlatformDisputes(orgId, {
        page,
        limit: 10,
        search: search || undefined,
        status: statusFilter || undefined,
        category: categoryFilter || undefined,
        urgentOnly,
      });

      setDisputes(response.disputes);
      setTotalPages(response.totalPages);
      setHasMore(response.hasMore);
    } catch (error) {
      toast.error('Failed to load platform disputes');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDisputes();
  }, [page, statusFilter, categoryFilter, urgentOnly]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadDisputes();
  };

  const formatAmount = (cents: number, currency: string) => {
    return `${currency} ${(Number(cents) / 100).toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const isUrgent = (dispute: OrganizerDispute) => {
    if (!dispute.respondByAt || dispute.status !== 'open') return false;
    const deadline = new Date(dispute.respondByAt);
    const now = new Date();
    const hoursLeft = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursLeft < 48 && hoursLeft > 0;
  };

  return (
    <>
      {/* Filters */}
      <Card className="p-4 mb-6">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by order ID or dispute ID..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full md:w-48"
            >
              <option value="">All statuses</option>
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>

            <Select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              className="w-full md:w-48"
            >
              <option value="">All categories</option>
              {Object.entries(DISPUTE_CATEGORIES).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>

            <Button type="submit">Search</Button>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="urgent-only"
              checked={urgentOnly}
              onChange={(e) => setUrgentOnly(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="urgent-only" className="ml-2 text-sm text-gray-700">
              Show only urgent disputes (deadline &lt; 48 hours)
            </label>
          </div>
        </form>
      </Card>

      {/* Disputes list */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4">Loading disputes...</p>
        </div>
      ) : disputes.length === 0 ? (
        <Card className="p-12 text-center">
          <CheckCircle2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No platform disputes</h3>
          <p className="text-gray-600">
            {search || statusFilter || categoryFilter || urgentOnly
              ? 'Try adjusting your filters'
              : "You don't have any platform disputes at the moment"}
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {disputes.map((dispute) => {
            const urgent = isUrgent(dispute);
            const statusColor = STATUS_COLORS[dispute.status] || STATUS_COLORS.open;

            return (
              <Link
                key={dispute.id}
                href={`/organizer/disputes/platform/${dispute.id}?orgId=${orgId}`}
              >
                <Card
                  className={`p-6 hover:shadow-md transition-shadow cursor-pointer ${
                    urgent ? 'border-2 border-red-500' : ''
                  }`}
                >
                  {urgent && (
                    <div className="flex items-center gap-2 mb-3 text-red-600 text-sm font-medium">
                      <AlertTriangle className="h-4 w-4" />
                      URGENT: Response needed within 48 hours
                    </div>
                  )}

                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-medium">{dispute.order.event.title}</h3>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusColor}`}
                        >
                          {STATUS_LABELS[dispute.status] || dispute.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-sm text-gray-600 mb-3">
                        <p>
                          <strong>Dispute ID:</strong> {dispute.id.slice(0, 12)}...
                        </p>
                        <p>
                          <strong>Category:</strong>{' '}
                          {dispute.category && DISPUTE_CATEGORIES[dispute.category as keyof typeof DISPUTE_CATEGORIES]}
                        </p>
                        <p>
                          <strong>Amount:</strong>{' '}
                          {formatAmount(dispute.amountCents, dispute.order.currency)}
                        </p>
                        {dispute.initiator && (
                          <p>
                            <strong>Buyer:</strong> {dispute.initiator.name}
                          </p>
                        )}
                        {dispute.respondByAt && dispute.status === 'open' && (
                          <p className={urgent ? 'text-red-600 font-medium' : ''}>
                            <strong>Deadline:</strong> {formatDate(dispute.respondByAt)}
                          </p>
                        )}
                      </div>

                      {dispute.description && (
                        <p className="text-sm text-gray-700 line-clamp-2">
                          {dispute.description}
                        </p>
                      )}

                      <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                        <span>
                          <Clock className="inline h-3 w-3 mr-1" />
                          Created {formatDate(dispute.createdAt)}
                        </span>
                        {dispute._count && dispute._count.messages > 0 && (
                          <span>
                            <MessageSquare className="inline h-3 w-3 mr-1" />
                            {dispute._count.messages} message
                            {dispute._count.messages !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="text-sm text-gray-600">
            Page {page} of {totalPages}
          </span>
          <Button variant="outline" onClick={() => setPage((p) => p + 1)} disabled={!hasMore}>
            Next
          </Button>
        </div>
      )}
    </>
  );
}
