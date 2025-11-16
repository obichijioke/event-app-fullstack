/**
 * Data transformation utilities for consistent data handling across the application
 */

/**
 * Converts a date to ISO string format (for API requests)
 *
 * @param date - Date object, string, or null
 * @returns ISO string or undefined if date is null/undefined
 *
 * @example
 * toISODateTime(new Date()) // '2024-01-15T10:30:00.000Z'
 * toISODateTime(null) // undefined
 */
export function toISODateTime(date: Date | string | null | undefined): string | undefined {
  if (!date) return undefined;
  return new Date(date).toISOString();
}

/**
 * Converts a date to datetime-local input format (YYYY-MM-DDTHH:mm)
 *
 * @param date - Date object, string, or null
 * @returns Formatted string for datetime-local input or empty string
 *
 * @example
 * toDateTimeInput(new Date('2024-01-15T10:30:00')) // '2024-01-15T10:30'
 * toDateTimeInput(null) // ''
 */
export function toDateTimeInput(date: Date | string | null | undefined): string {
  if (!date) return '';
  return new Date(date).toISOString().slice(0, 16);
}

/**
 * Converts a date to date input format (YYYY-MM-DD)
 *
 * @param date - Date object, string, or null
 * @returns Formatted string for date input or empty string
 *
 * @example
 * toDateInput(new Date('2024-01-15')) // '2024-01-15'
 * toDateInput(null) // ''
 */
export function toDateInput(date: Date | string | null | undefined): string {
  if (!date) return '';
  return new Date(date).toISOString().slice(0, 10);
}

/**
 * Converts dollars to cents (for API requests)
 *
 * @param dollars - Dollar amount as number or string
 * @returns Amount in cents (rounded to nearest cent)
 *
 * @example
 * toCents(10.99) // 1099
 * toCents('25.50') // 2550
 * toCents(0) // 0
 */
export function toCents(dollars: number | string): number {
  return Math.round(Number(dollars) * 100);
}

/**
 * Converts cents to dollars (for display)
 *
 * @param cents - Amount in cents
 * @returns Amount in dollars
 *
 * @example
 * toDollars(1099) // 10.99
 * toDollars(2550) // 25.50
 */
export function toDollars(cents: number): number {
  return cents / 100;
}

/**
 * Converts cents to formatted dollar string
 *
 * @param cents - Amount in cents
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted dollar amount
 *
 * @example
 * toDollarString(1099) // '10.99'
 * toDollarString(2550, 2) // '25.50'
 */
export function toDollarString(cents: number, decimals: number = 2): string {
  return (cents / 100).toFixed(decimals);
}

/**
 * Safely parses a string or number to integer
 *
 * @param value - Value to parse
 * @param defaultValue - Default value if parsing fails
 * @returns Parsed integer or default value
 *
 * @example
 * toInt('42') // 42
 * toInt('invalid', 0) // 0
 * toInt(null, 10) // 10
 */
export function toInt(value: string | number | null | undefined, defaultValue: number = 0): number {
  if (value === null || value === undefined || value === '') return defaultValue;
  const parsed = typeof value === 'number' ? value : parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Safely parses a string or number to float
 *
 * @param value - Value to parse
 * @param defaultValue - Default value if parsing fails
 * @returns Parsed float or default value
 *
 * @example
 * toFloat('42.5') // 42.5
 * toFloat('invalid', 0) // 0
 * toFloat(null, 10.5) // 10.5
 */
export function toFloat(value: string | number | null | undefined, defaultValue: number = 0): number {
  if (value === null || value === undefined || value === '') return defaultValue;
  const parsed = typeof value === 'number' ? value : parseFloat(value);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Converts a value to boolean
 *
 * @param value - Value to convert
 * @returns Boolean value
 *
 * @example
 * toBoolean('true') // true
 * toBoolean('false') // false
 * toBoolean(1) // true
 * toBoolean(0) // false
 */
export function toBoolean(value: string | number | boolean | null | undefined): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') {
    const lower = value.toLowerCase().trim();
    return lower === 'true' || lower === '1' || lower === 'yes';
  }
  return false;
}

/**
 * Trims and returns undefined if empty
 *
 * @param value - String value to process
 * @returns Trimmed string or undefined
 *
 * @example
 * trimOrUndefined('  hello  ') // 'hello'
 * trimOrUndefined('   ') // undefined
 * trimOrUndefined('') // undefined
 */
export function trimOrUndefined(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
}
