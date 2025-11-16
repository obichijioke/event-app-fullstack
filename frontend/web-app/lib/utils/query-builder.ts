/**
 * Builds a URL query string from an object of parameters
 * Filters out undefined, null, and empty string values
 *
 * @param params - Object containing query parameters
 * @returns Query string (without leading '?')
 *
 * @example
 * buildQueryString({ page: 1, limit: 20, search: 'test' })
 * // Returns: 'page=1&limit=20&search=test'
 */
export function buildQueryString(params: Record<string, unknown>): string {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, String(value));
    }
  });

  return searchParams.toString();
}

/**
 * Adds query parameters to a URL
 *
 * @param baseUrl - The base URL
 * @param params - Object containing query parameters
 * @returns URL with query string appended
 *
 * @example
 * addQueryParams('/api/events', { page: 1, limit: 20 })
 * // Returns: '/api/events?page=1&limit=20'
 */
export function addQueryParams(baseUrl: string, params: Record<string, unknown>): string {
  const queryString = buildQueryString(params);
  if (!queryString) return baseUrl;

  const separator = baseUrl.includes('?') ? '&' : '?';
  return `${baseUrl}${separator}${queryString}`;
}
