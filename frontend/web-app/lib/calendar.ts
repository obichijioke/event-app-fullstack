/**
 * Calendar utility functions for generating ICS files and calendar links
 */

export interface CalendarEventData {
  title: string;
  description?: string;
  location?: string;
  startTime: string; // ISO 8601 format
  endTime?: string; // ISO 8601 format
  url?: string;
  organizerName?: string;
  organizerEmail?: string;
}

/**
 * Format a date to ICS format (YYYYMMDDTHHMMSSZ)
 */
function formatICSDate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const seconds = String(date.getUTCSeconds()).padStart(2, '0');
  
  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

/**
 * Generate a unique ID for the calendar event
 */
function generateUID(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}@eventflow.ng`;
}

/**
 * Escape special characters in ICS text fields
 */
function escapeICSText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

/**
 * Generate an ICS file content for a calendar event
 */
export function generateICS(eventData: CalendarEventData): string {
  const startDate = new Date(eventData.startTime);
  const endDate = eventData.endTime 
    ? new Date(eventData.endTime) 
    : new Date(startDate.getTime() + 3 * 60 * 60 * 1000); // Default 3 hours duration
  
  const now = new Date();
  
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//EventFlow//Event Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${generateUID()}`,
    `DTSTAMP:${formatICSDate(now)}`,
    `DTSTART:${formatICSDate(startDate)}`,
    `DTEND:${formatICSDate(endDate)}`,
    `SUMMARY:${escapeICSText(eventData.title)}`,
  ];

  if (eventData.description) {
    lines.push(`DESCRIPTION:${escapeICSText(eventData.description)}`);
  }

  if (eventData.location) {
    lines.push(`LOCATION:${escapeICSText(eventData.location)}`);
  }

  if (eventData.url) {
    lines.push(`URL:${eventData.url}`);
  }

  if (eventData.organizerName && eventData.organizerEmail) {
    lines.push(`ORGANIZER;CN=${escapeICSText(eventData.organizerName)}:mailto:${eventData.organizerEmail}`);
  }

  lines.push('STATUS:CONFIRMED');
  lines.push('SEQUENCE:0');
  lines.push('END:VEVENT');
  lines.push('END:VCALENDAR');

  return lines.join('\r\n');
}

/**
 * Download an ICS file
 */
export function downloadICS(eventData: CalendarEventData, filename?: string): void {
  const icsContent = generateICS(eventData);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `${eventData.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

/**
 * Generate Google Calendar URL
 */
export function generateGoogleCalendarURL(eventData: CalendarEventData): string {
  const startDate = new Date(eventData.startTime);
  const endDate = eventData.endTime 
    ? new Date(eventData.endTime) 
    : new Date(startDate.getTime() + 3 * 60 * 60 * 1000);

  const formatGoogleDate = (date: Date) => {
    return formatICSDate(date).replace(/[-:]/g, '');
  };

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: eventData.title,
    dates: `${formatGoogleDate(startDate)}/${formatGoogleDate(endDate)}`,
  });

  if (eventData.description) {
    params.append('details', eventData.description);
  }

  if (eventData.location) {
    params.append('location', eventData.location);
  }

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Generate Outlook Calendar URL
 */
export function generateOutlookCalendarURL(eventData: CalendarEventData): string {
  const startDate = new Date(eventData.startTime);
  const endDate = eventData.endTime 
    ? new Date(eventData.endTime) 
    : new Date(startDate.getTime() + 3 * 60 * 60 * 1000);

  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: eventData.title,
    startdt: startDate.toISOString(),
    enddt: endDate.toISOString(),
  });

  if (eventData.description) {
    params.append('body', eventData.description);
  }

  if (eventData.location) {
    params.append('location', eventData.location);
  }

  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}

/**
 * Generate Yahoo Calendar URL
 */
export function generateYahooCalendarURL(eventData: CalendarEventData): string {
  const startDate = new Date(eventData.startTime);
  const endDate = eventData.endTime 
    ? new Date(eventData.endTime) 
    : new Date(startDate.getTime() + 3 * 60 * 60 * 1000);

  const formatYahooDate = (date: Date) => {
    return formatICSDate(date);
  };

  const params = new URLSearchParams({
    v: '60',
    title: eventData.title,
    st: formatYahooDate(startDate),
    et: formatYahooDate(endDate),
  });

  if (eventData.description) {
    params.append('desc', eventData.description);
  }

  if (eventData.location) {
    params.append('in_loc', eventData.location);
  }

  return `https://calendar.yahoo.com/?${params.toString()}`;
}

