import { Notification, NotificationType, NotificationCategory } from '@/lib/types/organizer';
import { Info, CheckCircle, AlertTriangle, XCircle, X, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  selected?: boolean;
  onToggleSelect?: (id: string) => void;
}

const iconMap: Record<NotificationType, React.ReactNode> = {
  info: <Info className="w-5 h-5 text-blue-600" />,
  success: <CheckCircle className="w-5 h-5 text-green-600" />,
  warning: <AlertTriangle className="w-5 h-5 text-yellow-600" />,
  error: <XCircle className="w-5 h-5 text-red-600" />,
};

const bgColorMap: Record<NotificationType, string> = {
  info: 'bg-blue-50 hover:bg-blue-100',
  success: 'bg-green-50 hover:bg-green-100',
  warning: 'bg-yellow-50 hover:bg-yellow-100',
  error: 'bg-red-50 hover:bg-red-100',
};

const borderColorMap: Record<NotificationType, string> = {
  info: 'border-blue-200',
  success: 'border-green-200',
  warning: 'border-yellow-200',
  error: 'border-red-200',
};

const CATEGORY_LABELS: Record<NotificationCategory, string> = {
  order: 'Order',
  event: 'Event',
  payout: 'Payout',
  moderation: 'Moderation',
  ticket: 'Ticket',
  system: 'System',
  marketing: 'Marketing',
};

const CATEGORY_COLORS: Record<NotificationCategory, string> = {
  order: 'bg-green-100 text-green-800 border-green-300',
  event: 'bg-purple-100 text-purple-800 border-purple-300',
  payout: 'bg-blue-100 text-blue-800 border-blue-300',
  moderation: 'bg-amber-100 text-amber-800 border-amber-300',
  ticket: 'bg-pink-100 text-pink-800 border-pink-300',
  system: 'bg-gray-100 text-gray-800 border-gray-300',
  marketing: 'bg-cyan-100 text-cyan-800 border-cyan-300',
};

export function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
  selected = false,
  onToggleSelect,
}: NotificationItemProps) {
  const isUnread = !notification.readAt;

  const handleClick = () => {
    if (isUnread) {
      onMarkAsRead(notification.id);
    }
  };

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleSelect) {
      onToggleSelect(notification.id);
    }
  };

  return (
    <div
      className={`relative p-4 rounded-lg border transition-all ${
        selected ? 'ring-2 ring-primary' : ''
      } ${
        isUnread
          ? `${bgColorMap[notification.type]} ${borderColorMap[notification.type]}`
          : 'bg-card border-border hover:bg-muted/50'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox for bulk selection */}
        {onToggleSelect && (
          <div className="flex-shrink-0 mt-1" onClick={handleCheckboxClick}>
            <input
              type="checkbox"
              checked={selected}
              onChange={() => {}}
              className="w-4 h-4 rounded border-border cursor-pointer"
            />
          </div>
        )}

        {/* Unread indicator dot */}
        {isUnread && (
          <div className="flex-shrink-0 w-2 h-2 bg-primary rounded-full mt-2" />
        )}

        {/* Icon */}
        <div className="flex-shrink-0 mt-0.5">{iconMap[notification.type]}</div>

        {/* Thumbnail Image */}
        {notification.imageUrl && (
          <div className="flex-shrink-0">
            <img
              src={notification.imageUrl}
              alt=""
              className="w-12 h-12 object-cover rounded border border-border"
            />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              {/* Category Badge */}
              <div className="mb-1">
                <span
                  className={`inline-block px-2 py-0.5 text-xs font-medium rounded border ${
                    CATEGORY_COLORS[notification.category]
                  }`}
                >
                  {CATEGORY_LABELS[notification.category]}
                </span>
              </div>

              {/* Title */}
              <h4
                className={`text-sm font-semibold ${
                  isUnread ? 'text-foreground' : 'text-muted-foreground'
                }`}
              >
                {notification.title}
              </h4>
            </div>

            {/* Delete Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(notification.id);
              }}
              className="text-muted-foreground hover:text-destructive transition p-1 flex-shrink-0"
              title="Delete notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Message */}
          <p
            className={`text-sm mt-1 ${
              isUnread ? 'text-foreground' : 'text-muted-foreground'
            }`}
          >
            {notification.message}
          </p>

          {/* Action Button */}
          {notification.actionUrl && notification.actionText && (
            <div className="mt-3">
              <Link
                href={notification.actionUrl}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-primary border border-primary rounded hover:bg-primary hover:text-primary-foreground transition"
                onClick={(e) => {
                  e.stopPropagation();
                  if (isUnread) {
                    onMarkAsRead(notification.id);
                  }
                }}
              >
                {notification.actionText}
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          )}

          {/* Footer: Timestamp + Read Status */}
          <div className="flex items-center gap-4 mt-2">
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(notification.createdAt), {
                addSuffix: true,
              })}
            </span>
            {!isUnread && <span className="text-xs text-muted-foreground">Read</span>}
            {isUnread && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onMarkAsRead(notification.id);
                }}
                className="text-xs text-primary hover:underline"
              >
                Mark as read
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
