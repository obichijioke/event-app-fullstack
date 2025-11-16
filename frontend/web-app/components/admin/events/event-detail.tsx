"use client";

import * as React from "react";
import { Button, Text, Heading } from "@/components/ui";
import toast from "react-hot-toast";
import { adminApiService, type AdminEvent } from "@/services/admin-api.service";
import { useAuth } from "@/components/auth";
import { cn } from "@/lib/utils";
import { ConfirmModal } from "@/components/ui/confirm-modal";

interface Props {
  eventId: string;
  className?: string;
}

export function AdminEventDetail({ eventId, className }: Props) {
  const { accessToken } = useAuth();
  const [event, setEvent] = React.useState<AdminEvent | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [actionLoading, setActionLoading] = React.useState(false);

  // Debug: log incoming props and auth so we can trace undefined eventId issues
  // Remove or lower verbosity in production
  // eslint-disable-next-line no-console
  console.debug("AdminEventDetail init", { eventId, accessToken });

  React.useEffect(() => {
    if (!accessToken || !eventId) return;
    let mounted = true;
    setLoading(true);
    adminApiService
      .getEvent(accessToken, eventId)
      .then((res) => {
        if (!mounted) return;
        if (res.success) {
          setEvent(res.data);
        } else {
          toast.error(res.message || "Failed to load event");
        }
      })
      .catch((err) => {
        console.error("Failed to load event:", err);
        toast.error(
          err instanceof Error ? err.message : "Failed to load event"
        );
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [accessToken, eventId]);

  const reload = async () => {
    // eslint-disable-next-line no-console
    console.debug("AdminEventDetail.reload called", { eventId, accessToken });
    if (!accessToken || !eventId) {
      // eslint-disable-next-line no-console
      console.debug("AdminEventDetail.reload - missing dependency", {
        eventId,
        accessToken,
      });
      return;
    }
    setLoading(true);
    try {
      const res = await adminApiService.getEvent(accessToken, eventId);
      if (res.success) setEvent(res.data);
      else toast.error(res.message || "Failed to reload event");
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("AdminEventDetail.reload error", e);
      toast.error(e instanceof Error ? e.message : "Failed to reload event");
    } finally {
      setLoading(false);
    }
  };

  const performStatusChange = async (status: string) => {
    if (!accessToken) {
      toast.error("Not authenticated");
      return;
    }
    if (!eventId) {
      toast.error("Invalid event");
      return;
    }

    // Use modal confirmation instead of window.confirm
    setModalOpen(true);
    setModalPayload({ status, label: `Change status to ${status}` });
  };

  const [modalOpen, setModalOpen] = React.useState(false);
  const [modalPayload, setModalPayload] = React.useState<{
    status: string;
    label?: string;
  } | null>(null);

  const executeModalConfirm = async () => {
    if (!accessToken || !eventId || !modalPayload) {
      setModalOpen(false);
      setModalPayload(null);
      return;
    }
    setActionLoading(true);
    setModalOpen(false);
    try {
      await adminApiService.updateEventStatus(
        accessToken,
        eventId,
        modalPayload.status
      );
      toast.success("Status updated");
      await reload();
    } catch (err: unknown) {
      console.error("Status change failed", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to update status";
      toast.error(errorMessage);
    } finally {
      setActionLoading(false);
      setModalPayload(null);
    }
  };

  if (loading) return <div className={cn("p-6", className)}>Loading...</div>;

  if (!event)
    return <div className={cn("p-6", className)}>Event not found</div>;

  return (
    <div
      className={cn("space-y-6 p-6 bg-card rounded-md", className)}
      role="main"
      aria-labelledby="event-title"
    >
      <div className="flex items-start justify-between">
        <div>
          <Heading as="h1" id="event-title">
            {event.title}
          </Heading>
          <Text
            className="text-sm text-muted-foreground mt-1"
            aria-label={`Event ID: ${event.id}, Organizer: ${
              event.organizerName ?? "Not specified"
            }`}
          >
            ID: {event.id} • Organizer: {event.organizerName ?? "—"}
          </Text>
        </div>
        <div className="flex items-center gap-2">
          <Text
            className="text-sm"
            aria-label={`Current status: ${event.status}`}
          >
            Status: {event.status}
          </Text>
        </div>
      </div>

      <section aria-labelledby="event-timing">
        <Heading as="h2" className="text-lg" id="event-timing">
          When
        </Heading>
        <Text
          aria-label={`Event starts ${new Date(
            event.startAt
          ).toLocaleString()}${
            event.endAt
              ? ` and ends ${new Date(event.endAt).toLocaleString()}`
              : ", no end time specified"
          }`}
        >
          {new Date(event.startAt).toLocaleString()} —{" "}
          {event.endAt ? new Date(event.endAt).toLocaleString() : "—"}
        </Text>
      </section>

      <section aria-labelledby="event-overview">
        <Heading as="h2" className="text-lg" id="event-overview">
          Overview
        </Heading>
        <Text className="whitespace-pre-wrap" aria-label="Event description">
          {event.description ?? "No description"}
        </Text>
      </section>

      <section className="flex gap-2" aria-labelledby="event-actions">
        <h3 id="event-actions" className="sr-only">
          Event Actions
        </h3>
        {event.status === "pending" && (
          <Button
            onClick={() => performStatusChange("approved")}
            disabled={actionLoading}
            variant="primary"
            aria-label={`Approve event ${event.title}`}
          >
            Approve
          </Button>
        )}
        {event.status === "live" && (
          <Button
            onClick={() => performStatusChange("paused")}
            disabled={actionLoading}
            variant="outline"
            aria-label={`Pause event ${event.title}`}
          >
            Pause
          </Button>
        )}
        {event.status === "paused" && (
          <Button
            onClick={() => performStatusChange("live")}
            disabled={actionLoading}
            variant="primary"
            aria-label={`Unpause event ${event.title}`}
          >
            Unpause
          </Button>
        )}
        {event.status === "live" && (
          <Button
            onClick={() => performStatusChange("ended")}
            disabled={actionLoading}
            variant="secondary"
            aria-label={`End event ${event.title}`}
          >
            End
          </Button>
        )}
        {["draft", "pending", "approved", "live", "paused"].includes(
          event.status
        ) && (
          <Button
            onClick={() => performStatusChange("canceled")}
            disabled={actionLoading}
            variant="destructive"
            aria-label={`Cancel event ${event.title}`}
          >
            Cancel
          </Button>
        )}
        <Button
          onClick={reload}
          disabled={loading || actionLoading}
          aria-label="Refresh event data"
        >
          Refresh
        </Button>
      </section>
      <ConfirmModal
        open={modalOpen}
        title={modalPayload ? modalPayload.label : "Confirm"}
        message={
          modalPayload
            ? `Change status to "${modalPayload.status}"?`
            : "Are you sure?"
        }
        confirmLabel="Confirm"
        cancelLabel="Cancel"
        loading={actionLoading}
        onConfirm={executeModalConfirm}
        onCancel={() => {
          setModalOpen(false);
          setModalPayload(null);
        }}
      />
    </div>
  );
}
