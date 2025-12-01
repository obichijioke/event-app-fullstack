export interface TimezoneOption {
  label: string;
  value: string;
}

export const POPULAR_TIMEZONES: TimezoneOption[] = [
  { label: 'Coordinated Universal Time (UTC, UTC+00:00)', value: 'UTC' },
  { label: 'Pacific Time (PT, UTC-08:00)', value: 'America/Los_Angeles' },
  { label: 'Mountain Time (MT, UTC-07:00)', value: 'America/Denver' },
  { label: 'Central Time (CT, UTC-06:00)', value: 'America/Chicago' },
  { label: 'Eastern Time (ET, UTC-05:00)', value: 'America/New_York' },
  { label: 'Atlantic Time (AT, UTC-04:00)', value: 'America/Halifax' },
  { label: 'Mexico City Time (UTC-06:00)', value: 'America/Mexico_City' },
  { label: 'Brasília Time (BRT, UTC-03:00)', value: 'America/Sao_Paulo' },
  { label: 'West Africa Time (WAT, UTC+01:00) – Lagos', value: 'Africa/Lagos' },
  { label: 'South Africa Standard Time (SAST, UTC+02:00)', value: 'Africa/Johannesburg' },
  { label: 'Greenwich Mean Time (GMT, UTC+00:00)', value: 'Etc/Greenwich' },
  { label: 'Central European Time (CET, UTC+01:00)', value: 'Europe/Berlin' },
  { label: 'British Summer Time (BST, UTC+01:00)', value: 'Europe/London' },
  { label: 'Eastern European Time (EET, UTC+02:00)', value: 'Europe/Athens' },
  { label: 'India Standard Time (IST, UTC+05:30)', value: 'Asia/Kolkata' },
  { label: 'Gulf Standard Time (GST, UTC+04:00)', value: 'Asia/Dubai' },
  { label: 'China Standard Time (CST, UTC+08:00)', value: 'Asia/Shanghai' },
  { label: 'Singapore Time (SGT, UTC+08:00)', value: 'Asia/Singapore' },
  { label: 'Japan Standard Time (JST, UTC+09:00)', value: 'Asia/Tokyo' },
  { label: 'Australian Eastern Time (AET, UTC+10:00)', value: 'Australia/Sydney' },
  { label: 'New Zealand Time (NZT, UTC+12:00)', value: 'Pacific/Auckland' },
];

export function guessUserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'UTC';
  }
}
