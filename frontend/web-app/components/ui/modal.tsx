"use client";

import * as React from "react";
import { X } from "lucide-react";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';
  className?: string;
  showCloseButton?: boolean;
  closeOnBackdropClick?: boolean;
  footer?: React.ReactNode;
}

const maxWidthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
  '5xl': 'max-w-5xl',
};

/**
 * Reusable Modal component with backdrop and header
 *
 * @example
 * <Modal open={isOpen} onClose={handleClose} title="Edit Profile" maxWidth="lg">
 *   <form>...</form>
 * </Modal>
 */
export function Modal({
  open,
  onClose,
  title,
  children,
  maxWidth = '2xl',
  className = '',
  showCloseButton = true,
  closeOnBackdropClick = true,
  footer,
}: ModalProps) {
  // Prevent rendering in DOM when closed
  if (!open) return null;

  const handleBackdropClick = () => {
    if (closeOnBackdropClick) {
      onClose();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div
        className={`bg-card rounded-lg shadow-lg ${maxWidthClasses[maxWidth]} w-full max-h-[90vh] overflow-y-auto ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-card z-10">
          <h2 id="modal-title" className="text-xl font-bold text-foreground">
            {title}
          </h2>
          {showCloseButton && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-secondary rounded-md transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6">{children}</div>

        {/* Footer (optional) */}
        {footer && (
          <div className="flex items-center justify-end gap-2 p-6 border-t border-border">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Modal.Footer component for consistent footer styling
 */
Modal.Footer = function ModalFooter({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-end gap-2">
      {children}
    </div>
  );
};
