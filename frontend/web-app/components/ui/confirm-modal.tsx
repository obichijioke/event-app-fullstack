"use client";

import * as React from "react";
import { Button } from "@/components/ui";

/**
 * Lightweight confirm modal used by admin UI.
 * Props:
 * - open: controlled visibility
 * - title: modal title
 * - message: modal message/body
 * - confirmLabel / cancelLabel: button labels
 * - loading: disables confirm while async action runs
 * - onConfirm / onCancel: callbacks
 *
 * This is intentionally minimal and self-contained so it can be used
 * immediately without pulling in heavier dialog libraries.
 */
export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  loading = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title?: string;
  message?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  // Prevent rendering in DOM when closed
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      aria-describedby="confirm-modal-message"
      className="fixed inset-0 z-50 flex items-center justify-center"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onCancel}
        aria-hidden="true"
      />
      {/* Modal panel */}
      <div className="relative z-10 w-full max-w-lg mx-4 bg-white rounded-md shadow-lg">
        <div className="p-4 border-b">
          <h3 id="confirm-modal-title" className="text-lg font-medium">
            {title || "Confirm"}
          </h3>
        </div>
        <div className="p-4">
          <div
            id="confirm-modal-message"
            className="text-sm text-muted-foreground"
          >
            {message}
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 p-4 border-t">
          <Button
            variant="secondary"
            onClick={onCancel}
            disabled={loading}
            aria-label={cancelLabel}
          >
            {cancelLabel}
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={loading}
            aria-label={loading ? "Processing action" : confirmLabel}
          >
            {loading ? "Processing..." : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
