# Authentication Flow

## Step 1: User Registration

```typescript
// types/auth.ts
interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  phone?: string;
}

interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: 'attendee' | 'organizer' | 'admin';
  status: 'active' | 'suspended' | 'deleted';
  createdAt: string;
  updatedAt: string;
}

// services/auth.service.ts
export class AuthService {
  async register(data: RegisterRequest): Promise<User> {
    return apiClient.post<User>('/auth/register', data);
  }
}

// Usage in component
const handleRegister = async (formData: RegisterRequest) => {
  try {
    const user = await authService.register(formData);
    console.log('Registration successful:', user);
    // Redirect to login or auto-login
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.statusCode === 409) {
        showError('Email already exists');
      } else {
        showError(error.message);
      }
    }
  }
};
```

## Step 2: User Login

```typescript
interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  accessToken: string;
  user: User;
}

export class AuthService {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>(
      '/auth/login',
      credentials,
    );

    // Store access token
    localStorage.setItem('accessToken', response.accessToken);
    localStorage.setItem('user', JSON.stringify(response.user));

    return response;
  }
}

// Usage
const handleLogin = async (credentials: LoginRequest) => {
  try {
    const { accessToken, user } = await authService.login(credentials);

    // Update app state
    setUser(user);
    setIsAuthenticated(true);

    // Redirect to dashboard
    navigate('/dashboard');
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.statusCode === 401) {
        showError('Invalid email or password');
      } else {
        showError('Login failed. Please try again.');
      }
    }
  }
};
```

## Step 3: Token Refresh

```typescript
export class AuthService {
  async refreshToken(): Promise<{ accessToken: string }> {
    // Refresh token is sent automatically via HTTP-only cookie
    const response = await apiClient.post<{ accessToken: string }>(
      '/auth/refresh',
      { refreshToken: '' }, // Cookie handles this
    );

    localStorage.setItem('accessToken', response.accessToken);
    return response;
  }

  // Auto-refresh before token expires
  setupTokenRefresh() {
    // Refresh every 14 minutes (token expires in 15 minutes)
    setInterval(
      async () => {
        try {
          await this.refreshToken();
        } catch (error) {
          // Refresh failed, logout user
          this.logout();
        }
      },
      14 * 60 * 1000,
    );
  }
}
```

## Step 4: Logout

```typescript
export class AuthService {
  async logout(): Promise<void> {
    const token = localStorage.getItem('accessToken');

    try {
      await apiClient.post('/auth/logout', {}, token || undefined);
    } finally {
      // Clear local storage even if API call fails
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');

      // Redirect to login
      window.location.href = '/login';
    }
  }
}
```

## Step 5: Protected Routes

```typescript
// React example with React Router
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('accessToken');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Usage
<Route path="/dashboard" element={
  <ProtectedRoute>
    <Dashboard />
  </ProtectedRoute>
} />
```
