# Best Practices: Security

## Token Storage

```typescript
// �?O DON'T: Store tokens in localStorage for sensitive apps
// localStorage is vulnerable to XSS attacks

// �o. DO: Use httpOnly cookies for refresh tokens (handled by API)
// �o. DO: Store access tokens in memory or sessionStorage for short-lived sessions

// For maximum security, use a state management solution
class TokenManager {
  private accessToken: string | null = null;

  setToken(token: string) {
    this.accessToken = token;
  }

  getToken(): string | null {
    return this.accessToken;
  }

  clearToken() {
    this.accessToken = null;
  }
}

export const tokenManager = new TokenManager();
```

## HTTPS Only

```typescript
// Always use HTTPS in production
const API_URL =
  process.env.NODE_ENV === 'production'
    ? 'https://api.yourdomain.com'
    : 'http://localhost:3000';

// Enforce HTTPS
if (
  process.env.NODE_ENV === 'production' &&
  window.location.protocol !== 'https:'
) {
  window.location.href = window.location.href.replace('http:', 'https:');
}
```

## Input Validation

```typescript
// Validate user input before sending to API
import { z } from 'zod';

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().optional(),
});

const handleRegister = (formData: unknown) => {
  try {
    const validData = registerSchema.parse(formData);
    // Proceed with API call
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Display validation errors
      error.errors.forEach((err) => {
        toast.error(err.message);
      });
    }
  }
};
```

