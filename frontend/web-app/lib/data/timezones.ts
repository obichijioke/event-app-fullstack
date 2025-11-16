export interface TimezoneOption {
  label: string;
  value: string;
}

export const POPULAR_TIMEZONES: TimezoneOption[] = [
  { label: 'Pacific Time (PT)', value: 'America/Los_Angeles' },
  { label: 'Mountain Time (MT)', value: 'America/Denver' },
  { label: 'Central Time (CT)', value: 'America/Chicago' },
  { label: 'Eastern Time (ET)', value: 'America/New_York' },
  { label: 'Greenwich Mean Time (GMT)', value: 'Etc/Greenwich' },
  { label: 'Central European Time (CET)', value: 'Europe/Berlin' },
  { label: 'British Summer Time (BST)', value: 'Europe/London' },
  { label: 'India Standard Time (IST)', value: 'Asia/Kolkata' },
  { label: 'Japan Standard Time (JST)', value: 'Asia/Tokyo' },
  { label: 'Australian Eastern Time (AET)', value: 'Australia/Sydney' },
];

export function guessUserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'UTC';
  }
}
