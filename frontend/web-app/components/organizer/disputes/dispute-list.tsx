"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { organizerApiService, Dispute, DisputeListParams } from "@/services/organizer-api.service";
import { Search, Filter, ChevronLeft, ChevronRight, AlertCircle, ExternalLink } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface DisputeListProps {
  orgId: string;
}

export function DisputeList({ orgId }: DisputeListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    hasMore: false,
  });

  // Filter state
  const [filters, setFilters] = useState<DisputeListParams>({
    page: 1,
    limit: 10,
    search: searchParams.get("search") || "",
    status: searchParams.get("status") || "",
    provider: searchParams.get("provider") || "",
  });

  const [searchInput, setSearchInput] = useState(filters.search || "");

  useEffect(() => {
    loadDisputes();
  }, [orgId, filters]);

  const loadDisputes = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await organizerApiService.getDisputes(orgId, filters);
      setDisputes(response.disputes);
      setPagination({
        page: response.page,
        limit: response.limit,
        total: response.total,
        hasMore: response.hasMore,
      });
    } catch (err: any) {
      setError(err.message || "Failed to load disputes");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters({ ...filters, search: searchInput, page: 1 });
  };

  const handleFilterChange = (key: keyof DisputeListParams, value: string) => {
    setFilters({ ...filters, [key]: value, page: 1 });
  };

  const handlePageChange = (newPage: number) => {
    setFilters({ ...filters, page: newPage });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      needs_response: "bg-amber-100 text-amber-800 border-amber-200",
      under_review: "bg-blue-100 text-blue-800 border-blue-200",
      won: "bg-green-100 text-green-800 border-green-200",
      lost: "bg-red-100 text-red-800 border-red-200",
      warning: "bg-yellow-100 text-yellow-800 border-yellow-200",
      charge_refunded: "bg-gray-100 text-gray-800 border-gray-200",
    };
    return badges[status as keyof typeof badges] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getProviderBadge = (provider: string) => {
    return provider === "stripe"
      ? "bg-purple-100 text-purple-800 border-purple-200"
      : "bg-blue-100 text-blue-800 border-blue-200";
  };

  const isUrgent = (dispute: Dispute) => {
    if (dispute.status !== "needs_response" || !dispute.respondByAt) return false;
    const deadline = new Date(dispute.respondByAt);
    const now = new Date();
    const hoursUntilDeadline = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursUntilDeadline < 24 && hoursUntilDeadline > 0;
  };

  if (error) {
    return (
      <div className="border border-red-200 rounded-lg p-6 bg-red-50">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-900">Error loading disputes</p>
            <p className="text-sm text-red-700 mt-1">{error}</p>
            <button
              onClick={loadDisputes}
              className="mt-3 text-sm text-red-700 underline hover:text-red-800"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="border border-gray-200 rounded-lg p-4 bg-white">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by order ID, case ID, or buyer email..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </form>

          {/* Status Filter */}
          <select
            value={filters.status || ""}
            onChange={(e) => handleFilterChange("status", e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="needs_response">Needs Response</option>
            <option value="under_review">Under Review</option>
            <option value="won">Won</option>
            <option value="lost">Lost</option>
            <option value="warning">Warning</option>
          </select>

          {/* Provider Filter */}
          <select
            value={filters.provider || ""}
            onChange={(e) => handleFilterChange("provider", e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Providers</option>
            <option value="stripe">Stripe</option>
            <option value="paystack">Paystack</option>
          </select>
        </div>

        {/* Active Filters Display */}
        {(filters.search || filters.status || filters.provider) && (
          <div className="mt-3 flex items-center gap-2 text-sm">
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-gray-600">Active filters:</span>
            {filters.search && (
              <span className="px-2 py-1 bg-gray-100 rounded border border-gray-200">
                Search: {filters.search}
              </span>
            )}
            {filters.status && (
              <span className="px-2 py-1 bg-gray-100 rounded border border-gray-200">
                Status: {filters.status.replace("_", " ")}
              </span>
            )}
            {filters.provider && (
              <span className="px-2 py-1 bg-gray-100 rounded border border-gray-200">
                Provider: {filters.provider}
              </span>
            )}
            <button
              onClick={() => {
                setFilters({ page: 1, limit: 10 });
                setSearchInput("");
              }}
              className="text-blue-600 hover:text-blue-700 underline ml-2"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Disputes List */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="border border-gray-200 rounded-lg p-4 animate-pulse">
              <div className="flex justify-between items-start mb-3">
                <div className="h-5 bg-gray-200 rounded w-1/4"></div>
                <div className="h-6 bg-gray-200 rounded w-20"></div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      ) : disputes.length === 0 ? (
        <div className="border border-gray-200 rounded-lg p-8 text-center bg-white">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">No disputes found</p>
          <p className="text-sm text-gray-500 mt-1">
            {filters.search || filters.status || filters.provider
              ? "Try adjusting your filters"
              : "You don't have any disputes yet"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {disputes.map((dispute) => (
            <div
              key={dispute.id}
              className={`border rounded-lg p-4 bg-white hover:border-blue-300 transition-colors cursor-pointer ${
                isUrgent(dispute) ? "border-amber-300 ring-1 ring-amber-200" : "border-gray-200"
              }`}
              onClick={() => router.push(`/organizer/disputes/${dispute.id}?orgId=${orgId}`)}
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-medium text-gray-900 mb-1">
                    {dispute.order.event.title}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span>Order: {dispute.order.id.slice(0, 8)}</span>
                    <span>•</span>
                    <span>Case: {dispute.caseId}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded border ${getProviderBadge(
                      dispute.provider
                    )}`}
                  >
                    {dispute.provider}
                  </span>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded border ${getStatusBadge(
                      dispute.status
                    )}`}
                  >
                    {dispute.status.replace("_", " ")}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                <div>
                  <span className="text-gray-500">Amount:</span>
                  <span className="ml-2 font-medium text-gray-900">
                    {dispute.amountCents
                      ? `${dispute.order.currency} ${(dispute.amountCents / 100).toFixed(2)}`
                      : "N/A"}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Buyer:</span>
                  <span className="ml-2 font-medium text-gray-900">
                    {dispute.order.buyer.email}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Opened:</span>
                  <span className="ml-2 font-medium text-gray-900">
                    {formatDistanceToNow(new Date(dispute.openedAt), { addSuffix: true })}
                  </span>
                </div>
              </div>

              {dispute.reason && (
                <div className="mt-3 text-sm">
                  <span className="text-gray-500">Reason:</span>
                  <span className="ml-2 text-gray-700">{dispute.reason}</span>
                </div>
              )}

              {isUrgent(dispute) && dispute.respondByAt && (
                <div className="mt-3 flex items-center gap-2 text-sm text-amber-700 bg-amber-50 px-3 py-2 rounded border border-amber-200">
                  <AlertCircle className="h-4 w-4" />
                  <span>
                    Response due{" "}
                    {formatDistanceToNow(new Date(dispute.respondByAt), { addSuffix: true })}
                  </span>
                </div>
              )}

              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>{dispute.evidence.length} evidence file{dispute.evidence.length !== 1 ? "s" : ""}</span>
                  {dispute.submittedAt && (
                    <span>Response submitted {formatDistanceToNow(new Date(dispute.submittedAt), { addSuffix: true })}</span>
                  )}
                </div>
                <ExternalLink className="h-4 w-4 text-gray-400" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.total > pagination.limit && (
        <div className="flex items-center justify-between border-t border-gray-200 pt-4">
          <div className="text-sm text-gray-600">
            Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}{" "}
            disputes
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={!pagination.hasMore}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
