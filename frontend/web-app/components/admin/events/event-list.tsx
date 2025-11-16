"use client";

import * as React from "react";
import { DataTable, FiltersPanel, StatusBadge } from "@/components/admin";
import { Button, Text } from "@/components/ui";
import toast from "react-hot-toast";
import { adminApiService, type AdminEvent } from "@/services/admin-api.service";
import { useAuth } from "@/components/auth";
import { cn } from "@/lib/utils";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import {
  Eye,
  CheckCircle2,
  Pause,
  Play,
  Ban,
  Flag,
} from "lucide-react";

interface EventListProps {
  className?: string;
}

export function EventList({ className }: EventListProps) {
  const { accessToken } = useAuth();
  const [events, setEvents] = React.useState<AdminEvent[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [pagination, setPagination] = React.useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });
  const [filters, setFilters] = React.useState<Record<string, unknown>>({});
  const [sorting, setSorting] = React.useState({
    field: "createdAt" as string,
    direction: "desc" as "asc" | "desc",
  });
  const [actionLoadingMap, setActionLoadingMap] = React.useState<
    Record<string, boolean>
  >({});
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [confirmPayload, setConfirmPayload] = React.useState<{
    eventId: string;
    status: string;
    label?: string;
  } | null>(null);

  const executeConfirmedChange = async () => {
    if (!confirmPayload || !accessToken) {
      setConfirmOpen(false);
      setConfirmPayload(null);
      return;
    }
    const { eventId, status } = confirmPayload;
    setConfirmOpen(false);
    setActionLoadingMap((prev) => ({ ...prev, [eventId]: true }));
    try {
      const res = await adminApiService.updateEventStatus(
        accessToken,
        eventId,
        status
      );
      toast.success("Event status updated");
      await loadEvents();
    } catch (error: unknown) {
      console.error("Failed to update event status:", error);
      let message = "Failed to update event status";
      if (error instanceof Error) message = error.message;
      else if (typeof error === "object" && error !== null) {
        try {
          const e = error as { response?: { data?: { message?: string } } };
          if (e.response?.data?.message) message = e.response.data.message;
        } catch {
          /* ignore */
        }
      }
      toast.error(message);
    } finally {
      setActionLoadingMap((prev) => ({ ...prev, [eventId]: false }));
      setConfirmPayload(null);
    }
  };

  // Load events on mount and when filters/sorting change
  React.useEffect(() => {
    if (!accessToken) return;

    loadEvents();
  }, [accessToken, filters, sorting, pagination.page]);

  const loadEvents = async () => {
    if (!accessToken) return;

    setLoading(true);
    try {
      const response = await adminApiService.getEvents(accessToken, {
        page: pagination.page,
        limit: pagination.limit,
        search: filters.search as string,
        status: filters.status as string,
        sortBy: sorting.field as string,
        sortOrder: sorting.direction,
      });

      if (response.success && response.data) {
        setEvents(response.data.data);
        setPagination((prev) => ({
          ...prev,
          total: response.data.pagination.total,
          totalPages: response.data.pagination.totalPages,
        }));
      }
    } catch (error) {
      console.error("Failed to load events:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters: Record<string, unknown>) => {
    setFilters(newFilters);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleSort = (field: string) => {
    setSorting((prev) => ({
      field,
      direction:
        prev.field === field && prev.direction === "asc" ? "desc" : "asc",
    }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  };

  const handleEventStatusChange = (
    eventId: string,
    status: string,
    label?: string
  ) => {
    if (!accessToken) {
      toast.error("Not authenticated");
      return;
    }
    // Open confirm modal instead of window.confirm
    setConfirmPayload({ eventId, status, label });
    setConfirmOpen(true);
  };

  const columns = [
    {
      key: "title",
      title: "Event",
      sortable: true,
      render: (value: unknown, event: AdminEvent) => (
        <div className="flex flex-col gap-1">
          <Text className="font-medium" role="heading" aria-level={3}>
            {event.title}
          </Text>
          <Text
            className="text-xs text-muted-foreground"
            aria-label="Event date"
          >
            {new Date(event.startAt).toLocaleDateString()}
          </Text>
        </div>
      ),
    },
    {
      key: "organizerName",
      title: "Organizer",
      sortable: true,
      render: (value: unknown, event: AdminEvent) => (
        <Text aria-label={`Organizer: ${event.organizerName}`}>
          {event.organizerName}
        </Text>
      ),
    },
    {
      key: "status",
      title: "Status",
      sortable: true,
      render: (value: unknown, event: AdminEvent) => (
        <StatusBadge
          status={event.status}
          aria-label={`Event status: ${event.status}`}
        />
      ),
    },
    {
      key: "visibility",
      title: "Visibility",
      sortable: true,
      render: (value: unknown, event: AdminEvent) => (
        <StatusBadge
          status={event.visibility}
          aria-label={`Event visibility: ${event.visibility}`}
        />
      ),
    },
    {
      key: "ticketCount",
      title: "Tickets",
      sortable: true,
      render: (value: unknown, event: AdminEvent) => (
        <Text aria-label={`${event.ticketCount} tickets sold`}>
          {event.ticketCount}
        </Text>
      ),
    },
    {
      key: "orderCount",
      title: "Orders",
      sortable: true,
      render: (value: unknown, event: AdminEvent) => (
        <Text aria-label={`${event.orderCount} orders placed`}>
          {event.orderCount}
        </Text>
      ),
    },
    {
      key: "venueName",
      title: "Venue",
      sortable: false,
      render: (value: unknown, event: AdminEvent) => (
        <Text aria-label={`Venue: ${event.venueName || "Not specified"}`}>
          {event.venueName || "N/A"}
        </Text>
      ),
    },
  ];

  const filterFields = [
    {
      key: "search",
      label: "Search",
      type: "text" as const,
      placeholder: "Search by title...",
    },
    {
      key: "status",
      label: "Status",
      type: "select" as const,
      options: [
        { value: "", label: "All Status" },
        { value: "draft", label: "Draft" },
        { value: "pending", label: "Pending" },
        { value: "approved", label: "Approved" },
        { value: "live", label: "Live" },
        { value: "paused", label: "Paused" },
        { value: "ended", label: "Ended" },
        { value: "canceled", label: "Canceled" },
      ],
    },
  ];

  const actions = [
    {
      label: "View Details",
      onClick: (event: AdminEvent) => {
        window.location.href = `/admin/events/${event.id}`;
      },
      icon: Eye,
      variant: "outline" as const,
      ariaLabel: (event: AdminEvent) => `View details for event ${event.title}`,
    },
    {
      label: "Approve",
      onClick: (event: AdminEvent) =>
        handleEventStatusChange(event.id, "approved", "Approve"),
      icon: CheckCircle2,
      variant: "success" as const,
      condition: (event: AdminEvent) => event.status === "pending",
      ariaLabel: (event: AdminEvent) => `Approve event ${event.title}`,
    },
    {
      label: "Go Live",
      onClick: (event: AdminEvent) =>
        handleEventStatusChange(event.id, "live", "Go Live"),
      icon: Play,
      variant: "primary" as const,
      condition: (event: AdminEvent) => event.status === "approved",
      ariaLabel: (event: AdminEvent) => `Make event ${event.title} live`,
    },
    {
      label: "Pause",
      onClick: (event: AdminEvent) =>
        handleEventStatusChange(event.id, "paused", "Pause"),
      icon: Pause,
      variant: "warning" as const,
      condition: (event: AdminEvent) => event.status === "live",
      ariaLabel: (event: AdminEvent) => `Pause event ${event.title}`,
    },
    {
      label: "Resume",
      onClick: (event: AdminEvent) =>
        handleEventStatusChange(event.id, "live", "Resume"),
      icon: Play,
      variant: "primary" as const,
      condition: (event: AdminEvent) => event.status === "paused",
      ariaLabel: (event: AdminEvent) => `Resume event ${event.title}`,
    },
    {
      label: "End Event",
      onClick: (event: AdminEvent) =>
        handleEventStatusChange(event.id, "ended", "End Event"),
      icon: Flag,
      variant: "secondary" as const,
      condition: (event: AdminEvent) => event.status === "live" || event.status === "paused",
      ariaLabel: (event: AdminEvent) => `End event ${event.title}`,
    },
    {
      label: "Cancel",
      onClick: (event: AdminEvent) =>
        handleEventStatusChange(event.id, "canceled", "Cancel"),
      icon: Ban,
      variant: "destructive" as const,
      condition: (event: AdminEvent) =>
        ["draft", "pending", "approved", "live", "paused"].includes(
          event.status
        ),
      ariaLabel: (event: AdminEvent) => `Cancel event ${event.title}`,
    },
  ];

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-3xl font-bold text-foreground"
            role="heading"
            aria-level={1}
          >
            Event Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage all platform events
          </p>
        </div>
      </div>

      {/* Filters */}
      <FiltersPanel
        fields={filterFields}
        values={filters}
        onChange={handleFilterChange}
        onReset={() => setFilters({})}
      />

      {/* Events Table */}
      <DataTable
        data={events}
        columns={columns}
        loading={loading}
        pagination={{
          ...pagination,
          onPageChange: handlePageChange,
        }}
        sorting={{
          ...sorting,
          onSort: handleSort,
        }}
        actions={actions}
      />
      <ConfirmModal
        open={confirmOpen}
        title={
          confirmPayload
            ? `Confirm ${confirmPayload.label || "Action"}`
            : "Confirm"
        }
        message={
          confirmPayload
            ? `Change event ${confirmPayload.eventId} status to "${confirmPayload.status}"?`
            : "Are you sure?"
        }
        confirmLabel="Confirm"
        cancelLabel="Cancel"
        loading={
          confirmPayload ? !!actionLoadingMap[confirmPayload.eventId] : false
        }
        onConfirm={executeConfirmedChange}
        onCancel={() => {
          setConfirmOpen(false);
          setConfirmPayload(null);
        }}
      />
    </div>
  );
}
