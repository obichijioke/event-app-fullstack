'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { buyerDisputesApi, type Dispute, DISPUTE_CATEGORIES } from '@/services/buyer-disputes-api.service';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import {
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  MessageSquare,
  FileText,
  Plus,
  Search,
  Scale,
} from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_LABELS: Record<string, string> = {
  open: 'Open',
  organizer_responded: 'Organizer Responded',
  escalated: 'Escalated',
  moderator_review: 'Under Review',
  resolved: 'Resolved',
  appealed: 'Appealed',
  closed: 'Closed',
};

const STATUS_ICONS: Record<string, any> = {
  open: Clock,
  organizer_responded: MessageSquare,
  escalated: AlertCircle,
  moderator_review: FileText,
  resolved: CheckCircle2,
  appealed: AlertCircle,
  closed: XCircle,
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

export default function DisputesPage() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const loadDisputes = async () => {
    setLoading(true);
    try {
      const response = await buyerDisputesApi.getDisputes({
        page,
        limit: 10,
        search: search || undefined,
        status: statusFilter || undefined,
        category: (categoryFilter as any) || undefined,
      });

      setDisputes(response.disputes);
      setTotalPages(response.totalPages);
      setHasMore(response.hasMore);
    } catch (error) {
      toast.error('Failed to load disputes');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDisputes();
  }, [page, statusFilter, categoryFilter]);

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

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-xl border border-border/70 bg-card">
        <div className="bg-linear-to-r from-slate-900 via-slate-800 to-slate-700 px-6 py-6 text-white flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur mb-2">
              <Scale className="h-4 w-4" />
              Disputes
            </div>
            <h1 className="text-3xl font-semibold">My Disputes</h1>
            <p className="text-sm text-slate-200 mt-1">
              Track and manage disputes you have opened on your orders.
            </p>
          </div>
          <Link href="/account/disputes/create">
            <Button className="bg-white text-slate-900 hover:bg-white/90">
              <Plus className="h-4 w-4 mr-2" />
              Create Dispute
            </Button>
          </Link>
        </div>
      </div>

      <Card className="p-4">
        <form onSubmit={handleSearch} className="flex flex-col lg:flex-row gap-4">
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
            className="w-full lg:w-48"
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
            className="w-full lg:w-48"
          >
            <option value="">All categories</option>
            {Object.entries(DISPUTE_CATEGORIES).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>

          <Button type="submit">Search</Button>
        </form>
      </Card>

      {loading ? (
        <Card className="p-10 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
            <p className="text-muted-foreground">Loading disputes...</p>
          </div>
        </Card>
      ) : disputes.length === 0 ? (
        <Card className="p-12 text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No disputes found</h3>
          <p className="text-gray-600 mb-6">
            {search || statusFilter || categoryFilter
              ? 'Try adjusting your filters'
              : "You haven't filed any disputes yet"}
          </p>
          {!search && !statusFilter && !categoryFilter && (
            <Link href="/account/disputes/create">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Dispute
              </Button>
            </Link>
          )}
        </Card>
      ) : (
        <div className="space-y-4">
          {disputes.map((dispute) => {
            const StatusIcon = STATUS_ICONS[dispute.status] || AlertCircle;
            const statusColor = STATUS_COLORS[dispute.status] || STATUS_COLORS.open;

            return (
              <Link key={dispute.id} href={`/account/disputes/${dispute.id}`}>
                <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{dispute.order.event.title}</h3>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusColor}`}
                        >
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {STATUS_LABELS[dispute.status] || dispute.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600 mb-3">
                        <p>
                          <span className="font-medium text-gray-900">Order:</span>{' '}
                          #{dispute.orderId.slice(0, 8)} • {formatAmount(dispute.amountCents, dispute.order.currency)}
                        </p>
                        <p>
                          <span className="font-medium text-gray-900">Category:</span>{' '}
                          {DISPUTE_CATEGORIES[dispute.category] || dispute.category}
                        </p>
                        <p>
                          <span className="font-medium text-gray-900">Opened:</span>{' '}
                          {formatDate(dispute.openedAt || dispute.createdAt)}
                        </p>
                        {dispute.respondByAt && (
                          <p className="text-amber-700 font-medium">
                            Respond by {formatDate(dispute.respondByAt)}
                          </p>
                        )}
                      </div>

                      {dispute.description && (
                        <p className="text-sm text-gray-700 line-clamp-2">
                          {dispute.description}
                        </p>
                      )}
                    </div>

                    <div className="text-right">
                      <div className="text-xs uppercase text-gray-500">Messages</div>
                      <div className="text-lg font-semibold">{dispute._count?.messages || 0}</div>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
