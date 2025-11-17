"use client";

import * as React from "react";
import { Button, Text, Heading } from "@/components/ui";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import toast from "react-hot-toast";
import { adminApiService, type AdminEvent } from "@/services/admin-api.service";
import { useAuth } from "@/components/auth";
import { cn } from "@/lib/utils";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import {
  Edit2,
  Calendar,
  MapPin,
  Users,
  DollarSign,
  Eye,
  Ticket,
  ShoppingCart,
} from "lucide-react";

interface Props {
  eventId: string;
  className?: string;
}

export function AdminEventDetail({ eventId, className }: Props) {
  const { accessToken } = useAuth();
  const [event, setEvent] = React.useState<AdminEvent | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [actionLoading, setActionLoading] = React.useState(false);
  const [editModalOpen, setEditModalOpen] = React.useState(false);
  const [editFormData, setEditFormData] = React.useState({
    title: '',
    visibility: 'public' as 'public' | 'unlisted' | 'private',
  });
  const [saving, setSaving] = React.useState(false);

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

  const handleOpenEditModal = () => {
    if (!event) return;
    setEditFormData({
      title: event.title,
      visibility: event.visibility,
    });
    setEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setEditModalOpen(false);
    setEditFormData({
      title: '',
      visibility: 'public',
    });
  };

  const handleSaveEdit = async () => {
    if (!accessToken || !eventId) return;

    setSaving(true);
    try {
      await adminApiService.updateEvent(accessToken, eventId, {
        title: editFormData.title,
        visibility: editFormData.visibility,
      });
      toast.success('Event updated successfully');
      await reload();
      handleCloseEditModal();
    } catch (error) {
      console.error('Failed to update event:', error);
      toast.error('Failed to update event');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className={cn("p-6", className)}>Loading...</div>;

  if (!event)
    return <div className={cn("p-6", className)}>Event not found</div>;

  return (
    <div
      className={cn("space-y-6", className)}
      role="main"
      aria-labelledby="event-title"
    >
      {/* Header Section */}
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <Heading as="h1" id="event-title" className="text-2xl">
                {event.title}
              </Heading>
              <div className={cn(
                "px-3 py-1 rounded-full text-xs font-medium",
                event.status === 'live' && "bg-green-100 text-green-800",
                event.status === 'pending' && "bg-yellow-100 text-yellow-800",
                event.status === 'approved' && "bg-blue-100 text-blue-800",
                event.status === 'paused' && "bg-orange-100 text-orange-800",
                event.status === 'ended' && "bg-gray-100 text-gray-800",
                event.status === 'canceled' && "bg-red-100 text-red-800",
              )}>
                {event.status}
              </div>
            </div>
            <Text className="text-sm text-muted-foreground mt-2">
              Organizer: {event.organizerName ?? "—"} • ID: {event.id}
            </Text>
          </div>
          <Button variant="outline" size="sm" onClick={handleOpenEditModal}>
            <Edit2 className="w-4 h-4 mr-2" />
            Edit
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-md">
            <div className="p-2 bg-blue-100 rounded-md">
              <Ticket className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <Text className="text-xs text-muted-foreground">Tickets</Text>
              <Text className="text-lg font-semibold">{event.ticketCount || 0}</Text>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-md">
            <div className="p-2 bg-green-100 rounded-md">
              <ShoppingCart className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <Text className="text-xs text-muted-foreground">Orders</Text>
              <Text className="text-lg font-semibold">{event.orderCount || 0}</Text>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-md">
            <div className="p-2 bg-purple-100 rounded-md">
              <Eye className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <Text className="text-xs text-muted-foreground">Visibility</Text>
              <Text className="text-lg font-semibold capitalize">{event.visibility}</Text>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-md">
            <div className="p-2 bg-amber-100 rounded-md">
              <Calendar className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <Text className="text-xs text-muted-foreground">Status</Text>
              <Text className="text-lg font-semibold capitalize">{event.status}</Text>
            </div>
          </div>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Event Details Card */}
        <div className="bg-card rounded-lg border border-border p-6">
          <Heading as="h2" className="text-lg mb-4">
            Event Details
          </Heading>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <Text className="text-sm font-medium">Event Time</Text>
                <Text className="text-sm text-muted-foreground">
                  {new Date(event.startAt).toLocaleString()}
                  {event.endAt && (
                    <> — {new Date(event.endAt).toLocaleString()}</>
                  )}
                </Text>
              </div>
            </div>

            {event.venueName && (
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <Text className="text-sm font-medium">Venue</Text>
                  <Text className="text-sm text-muted-foreground">{event.venueName}</Text>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3">
              <Eye className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <Text className="text-sm font-medium">Visibility</Text>
                <Text className="text-sm text-muted-foreground capitalize">{event.visibility}</Text>
              </div>
            </div>
          </div>
        </div>

        {/* Description Card */}
        <div className="bg-card rounded-lg border border-border p-6">
          <Heading as="h2" className="text-lg mb-4">
            Description
          </Heading>
          <Text className="text-sm text-muted-foreground whitespace-pre-wrap">
            {event.description ?? "No description provided"}
          </Text>
        </div>
      </div>

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
      {/* Edit Event Modal */}
      <Modal
        open={editModalOpen}
        onClose={handleCloseEditModal}
        title="Edit Event"
        maxWidth="2xl"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Event Title *
            </label>
            <Input
              type="text"
              value={editFormData.title}
              onChange={(e) =>
                setEditFormData((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder="Event Title"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Visibility *
            </label>
            <Select
              value={editFormData.visibility}
              onChange={(e) =>
                setEditFormData((prev) => ({
                  ...prev,
                  visibility: e.target.value as 'public' | 'unlisted' | 'private',
                }))
              }
            >
              <option value="public">Public</option>
              <option value="unlisted">Unlisted</option>
              <option value="private">Private</option>
            </Select>
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border">
            <Button
              variant="outline"
              onClick={handleCloseEditModal}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={saving || !editFormData.title}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </Modal>

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
