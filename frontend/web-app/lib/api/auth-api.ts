import { ApiClient } from './client';

const apiClient = new ApiClient();

export const authApi = {
  requestPasswordReset: (email: string) =>
    apiClient.post<{ message: string }>('/auth/password/forgot', { email }),

  resetPassword: (token: string, newPassword: string) =>
    apiClient.post<{ message: string }>('/auth/password/reset', {
      token,
      newPassword,
    }),

  requestEmailVerification: (email: string) =>
    apiClient.post<{ message: string }>('/auth/email/verify/request', { email }),

  verifyEmail: (token: string) =>
    apiClient.post<{ message: string }>('/auth/email/verify', { token }),

  requestTwoFactorCode: (purpose: 'enable' | 'disable' = 'enable') =>
    apiClient.post<{ message: string }>('/auth/2fa/request', { purpose }),

  enableTwoFactor: (code: string) =>
    apiClient.post<{ message: string }>('/auth/2fa/enable', { code }),

  disableTwoFactor: (code: string) =>
    apiClient.post<{ message: string }>('/auth/2fa/disable', { code }),
};
