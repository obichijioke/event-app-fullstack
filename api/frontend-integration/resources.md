# Additional Resources

## Recommended Libraries

- HTTP Client: `axios` or native `fetch`
- State Management: `@tanstack/react-query`, `zustand`, `redux-toolkit`
- Form Handling: `react-hook-form`, `formik`
- Validation: `zod`, `yup`
- Date Handling: `date-fns`, `dayjs`
- QR Code: `react-qr-code`, `qrcode.react`
- QR Scanner: `react-qr-reader`, `html5-qrcode`
- Notifications: `react-hot-toast`, `react-toastify`
- Payment: `@stripe/stripe-js`, `@paystack/inline-js`

## Testing API Integration

```typescript
// __tests__/auth.service.test.ts
import { authService } from '../services/auth.service';
import { apiClient } from '../api-client';

jest.mock('../api-client');

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('should login successfully', async () => {
    const mockResponse = {
      accessToken: 'token123',
      user: { id: '1', email: 'test@example.com', name: 'Test User' },
    };

    (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

    const result = await authService.login({
      email: 'test@example.com',
      password: 'password123',
    });

    expect(result).toEqual(mockResponse);
    expect(localStorage.getItem('accessToken')).toBe('token123');
  });

  it('should handle login error', async () => {
    (apiClient.post as jest.Mock).mockRejectedValue(
      new ApiError('Invalid credentials', 401),
    );

    await expect(
      authService.login({
        email: 'test@example.com',
        password: 'wrong',
      }),
    ).rejects.toThrow('Invalid credentials');
  });
});
```

## References

- API Documentation: ../API.md
- Architecture Guide: ../ARCHITECTURE.md
- Swagger UI (local): http://localhost:3000/api

