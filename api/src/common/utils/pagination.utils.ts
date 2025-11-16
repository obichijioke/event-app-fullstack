/**
 * Pagination configuration
 */
export interface PaginationParams {
  page: number;
  limit: number;
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Paginated response structure
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

/**
 * Clamps pagination parameters to safe values
 * - Page must be at least 1
 * - Limit must be between 1 and 100
 *
 * @param page The requested page number
 * @param limit The requested items per page
 * @returns Clamped pagination parameters
 */
export function clampPagination(
  page: number = 1,
  limit: number = 20,
): PaginationParams {
  const safePage = page < 1 ? 1 : page;
  const safeLimit = Math.min(Math.max(limit, 1), 100);

  return {
    page: safePage,
    limit: safeLimit,
  };
}

/**
 * Calculates the skip value for Prisma queries
 *
 * @param page The page number
 * @param limit The items per page
 * @returns The number of items to skip
 */
export function calculateSkip(page: number, limit: number): number {
  return (page - 1) * limit;
}

/**
 * Builds a paginated response object
 *
 * @param data The data array
 * @param page The current page
 * @param limit The items per page
 * @param total The total number of items
 * @returns Paginated response object
 */
export function buildPaginatedResponse<T>(
  data: T[],
  page: number,
  limit: number,
  total: number,
): PaginatedResponse<T> {
  const totalPages = Math.max(Math.ceil(total / limit), 1);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  };
}
