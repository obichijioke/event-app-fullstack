'use client';

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token ?? null;
}

export function getAccessToken() {
  return accessToken;
}
