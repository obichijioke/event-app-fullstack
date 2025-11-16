# Error Handling

## Common Error Scenarios

```typescript
// error-handler.ts
export const handleApiError = (error: unknown): string => {
  if (error instanceof ApiError) {
    switch (error.statusCode) {
      case 400:
        // Validation error
        if (Array.isArray(error.details?.message)) {
          return error.details.message.join(', ');
        }
        return error.message || 'Invalid request';

      case 401:
        // Unauthorized - redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return 'Session expired. Please login again.';

      case 403:
        // Forbidden
        return 'You do not have permission to perform this action.';

      case 404:
        return 'Resource not found.';

      case 409:
        // Conflict (e.g., email already exists)
        return error.message || 'Resource already exists.';

      case 422:
        // Unprocessable entity
        return error.message || 'Validation failed.';

      case 429:
        // Rate limit exceeded
        return 'Too many requests. Please try again later.';

      case 500:
        return 'Server error. Please try again later.';

      default:
        return error.message || 'An unexpected error occurred.';
    }
  }

  return 'An unexpected error occurred.';
};

// Usage in components
try {
  await someApiCall();
} catch (error) {
  const errorMessage = handleApiError(error);
  toast.error(errorMessage);
}
```

## Global Error Boundary (React)

```typescript
// ErrorBoundary.tsx
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    // Log to error tracking service (e.g., Sentry)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-page">
          <h1>Something went wrong</h1>
          <p>{this.state.error?.message}</p>
          <button onClick={() => window.location.reload()}>
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

## Axios Interceptor for Error Handling

```typescript
// axios-config.ts
import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 - try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, {
          refreshToken: '', // Cookie handles this
        });

        localStorage.setItem('accessToken', data.accessToken);
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;

        return axiosInstance(originalRequest);
      } catch (refreshError) {
        // Refresh failed, logout user
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default axiosInstance;
```

