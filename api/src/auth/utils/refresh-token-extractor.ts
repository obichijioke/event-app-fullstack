import type { Request } from 'express';

export function extractRefreshTokenFromRequest(req?: Request): string | null {
  if (!req?.headers?.cookie) {
    return null;
  }

  const cookies = req.headers.cookie.split(';');
  for (const rawCookie of cookies) {
    const [rawName, ...rest] = rawCookie.trim().split('=');
    if (!rawName) {
      continue;
    }

    if (rawName === 'refreshToken') {
      const value = rest.join('=');
      return value ? decodeURIComponent(value) : '';
    }
  }

  return null;
}
