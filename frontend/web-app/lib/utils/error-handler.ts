/**
 * ApiError class for structured API errors
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Handles API errors and returns a user-friendly message
 *
 * @param error - The error object
 * @param defaultMessage - Default message to use if error message cannot be extracted
 * @returns User-friendly error message
 *
 * @example
 * try {
 *   await apiCall();
 * } catch (error) {
 *   const message = handleApiError(error, 'Failed to load data');
 *   toast.error(message);
 * }
 */
export function handleApiError(error: unknown, defaultMessage: string): string {
  let message = defaultMessage;

  if (error instanceof ApiError) {
    message = error.message;
  } else if (error instanceof Error) {
    message = error.message;
  } else if (typeof error === 'object' && error !== null) {
    // Handle axios-style errors
    const err = error as any;
    if (err.response?.data?.message) {
      message = err.response.data.message;
    } else if (err.message) {
      message = err.message;
    }
  }

  console.error(message, error);
  return message;
}

/**
 * Handles API errors and logs them, optionally calling a callback
 *
 * @param error - The error object
 * @param defaultMessage - Default message to use if error message cannot be extracted
 * @param onError - Optional callback to handle the error (e.g., show toast)
 * @returns User-friendly error message
 *
 * @example
 * try {
 *   await apiCall();
 * } catch (error) {
 *   handleApiErrorWithCallback(error, 'Failed to save', (msg) => toast.error(msg));
 * }
 */
export function handleApiErrorWithCallback(
  error: unknown,
  defaultMessage: string,
  onError?: (message: string) => void
): string {
  const message = handleApiError(error, defaultMessage);
  if (onError) {
    onError(message);
  }
  return message;
}

/**
 * Type guard to check if an error is an ApiError
 */
export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}
