import { format, formatDistance, isToday, isTomorrow, isThisWeek } from 'date-fns';
import { useCurrencyStore, getCurrencySymbol } from '../stores/currency-store';

/**
 * Format a date for display
 */
export function formatEventDate(date: string | Date): string {
  const d = new Date(date);
  if (isToday(d)) {
    return `Today at ${format(d, 'h:mm a')}`;
  }
  if (isTomorrow(d)) {
    return `Tomorrow at ${format(d, 'h:mm a')}`;
  }
  if (isThisWeek(d)) {
    return format(d, 'EEEE, h:mm a');
  }
  return format(d, 'EEE, MMM d · h:mm a');
}

/**
 * Format a date range
 */
export function formatDateRange(start: string | Date, end: string | Date): string {
  const startDate = new Date(start);
  const endDate = new Date(end);

  const startFormat = format(startDate, 'EEE, MMM d');
  const startTime = format(startDate, 'h:mm a');
  const endTime = format(endDate, 'h:mm a');

  return `${startFormat} · ${startTime} - ${endTime}`;
}

/**
 * Format relative time (e.g., "2 days ago")
 */
export function formatRelativeTime(date: string | Date): string {
  return formatDistance(new Date(date), new Date(), { addSuffix: true });
}

/**
 * Format currency
 */
export function formatCurrency(amount: number, currency?: string): string {
  const { config } = useCurrencyStore.getState();
  const currencyCode = currency || config?.defaultCurrency || 'USD';
  const symbol = getCurrencySymbol(currencyCode, config?.currencySymbol || '$');
  const decimalPlaces = config?.decimalPlaces ?? 2;
  const formatted = (amount || 0).toLocaleString(undefined, {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  });
  const position = config?.currencyPosition || 'before';
  return position === 'before' ? `${symbol}${formatted}` : `${formatted}${symbol}`;
}

/**
 * Format price range
 */
export function formatPriceRange(
  minPrice: number | null | undefined,
  maxPrice: number | null | undefined,
  isFree: boolean,
  currency = 'USD'
): string {
  if (isFree) return 'Free';
  if (minPrice === null || minPrice === undefined) return 'Price TBA';
  if (minPrice === maxPrice || maxPrice === null || maxPrice === undefined) {
    return formatCurrency(minPrice, currency);
  }
  return `From ${formatCurrency(minPrice, currency)}`;
}

/**
 * Format number with compact notation (e.g., 1.2K, 3.5M)
 */
export function formatCompactNumber(num: number): string {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(num);
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Get initials from name
 */
export function getInitials(name: string): string {
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

/**
 * Format ticket status for display
 */
export function formatTicketStatus(status: string): string {
  const statusMap: Record<string, string> = {
    issued: 'Active',
    transferred: 'Transferred',
    refunded: 'Refunded',
    checked_in: 'Checked In',
    void: 'Void',
  };
  return statusMap[status] || status;
}

/**
 * Format order status for display
 */
export function formatOrderStatus(status: string): string {
  const statusMap: Record<string, string> = {
    pending: 'Pending',
    paid: 'Paid',
    canceled: 'Canceled',
    refunded: 'Refunded',
    chargeback: 'Chargeback',
  };
  return statusMap[status] || status;
}
