import { useState, useEffect, useCallback } from 'react';

export interface PaginationState {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface SortingState {
  field: string;
  direction: 'asc' | 'desc';
}

export interface ListDataResponse<T> {
  data: T[];
  pagination: PaginationState;
}

export interface UseListDataOptions<T> {
  fetchFn: (
    pagination: PaginationState,
    filters: Record<string, unknown>,
    sorting: SortingState
  ) => Promise<ListDataResponse<T>>;
  initialPage?: number;
  initialLimit?: number;
  initialSortField?: string;
  initialSortDirection?: 'asc' | 'desc';
  initialFilters?: Record<string, unknown>;
  dependencies?: any[];
  onError?: (error: unknown) => void;
}

export interface UseListDataReturn<T> {
  data: T[];
  loading: boolean;
  pagination: PaginationState;
  filters: Record<string, unknown>;
  sorting: SortingState;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  setFilters: (filters: Record<string, unknown> | ((prev: Record<string, unknown>) => Record<string, unknown>)) => void;
  setSorting: (sorting: SortingState) => void;
  reload: () => Promise<void>;
  resetFilters: () => void;
}

/**
 * Custom hook for managing list/table data with pagination, filtering, and sorting
 *
 * @param options - Configuration options
 * @returns List data state and handlers
 *
 * @example
 * const { data, loading, pagination, setPage, setFilters } = useListData({
 *   fetchFn: async (pagination, filters, sorting) => {
 *     return await api.getUsers({ ...pagination, ...filters, ...sorting });
 *   },
 *   initialLimit: 20,
 * });
 */
export function useListData<T>({
  fetchFn,
  initialPage = 1,
  initialLimit = 20,
  initialSortField = 'createdAt',
  initialSortDirection = 'desc',
  initialFilters = {},
  dependencies = [],
  onError,
}: UseListDataOptions<T>): UseListDataReturn<T> {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationState>({
    page: initialPage,
    limit: initialLimit,
    total: 0,
    totalPages: 1,
  });
  const [filters, setFilters] = useState<Record<string, unknown>>(initialFilters);
  const [sorting, setSorting] = useState<SortingState>({
    field: initialSortField,
    direction: initialSortDirection,
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetchFn(pagination, filters, sorting);
      setData(response.data);
      setPagination((prev) => ({
        ...prev,
        total: response.pagination.total,
        totalPages: response.pagination.totalPages,
      }));
    } catch (error) {
      console.error('Failed to load data:', error);
      if (onError) {
        onError(error);
      }
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, filters, sorting, fetchFn, onError, ...dependencies]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const setPage = useCallback((page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  }, []);

  const setLimit = useCallback((limit: number) => {
    setPagination((prev) => ({ ...prev, limit, page: 1 }));
  }, []);

  const handleSetFilters = useCallback(
    (newFilters: Record<string, unknown> | ((prev: Record<string, unknown>) => Record<string, unknown>)) => {
      if (typeof newFilters === 'function') {
        setFilters(newFilters);
      } else {
        setFilters(newFilters);
      }
      // Reset to page 1 when filters change
      setPagination((prev) => ({ ...prev, page: 1 }));
    },
    []
  );

  const handleSetSorting = useCallback((newSorting: SortingState) => {
    setSorting(newSorting);
    // Reset to page 1 when sorting changes
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(initialFilters);
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, [initialFilters]);

  return {
    data,
    loading,
    pagination,
    filters,
    sorting,
    setPage,
    setLimit,
    setFilters: handleSetFilters,
    setSorting: handleSetSorting,
    reload: loadData,
    resetFilters,
  };
}
