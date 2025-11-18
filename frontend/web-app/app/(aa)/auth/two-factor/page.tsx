'use client';

import { useState } from 'react';
import Link from 'next/link';
import { authApi } from '@/lib/api/auth-api';

export default function TwoFactorPage() {
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string>('');

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    setMessage('');
    try {
      await authApi.enableTwoFactor(code);
      setStatus('success');
      setMessage('Two-factor authentication verified.');
    } catch (err: any) {
      setStatus('error');
      setMessage(err?.message || 'Invalid code');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-lg shadow-card p-8">
          <h1 className="text-3xl font-bold text-center mb-2">Two-Factor Authentication</h1>
          <p className="text-center text-muted-foreground mb-8">
            Enter the 6-digit code sent to your email
          </p>

          <form className="space-y-4" onSubmit={onSubmit}>
            {/* 2FA Code */}
            <div>
              <label htmlFor="code" className="block text-sm font-medium mb-2">
                Authentication Code
              </label>
              <input
                type="text"
                id="code"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full px-4 py-2 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary text-center text-2xl tracking-widest"
                placeholder="000000"
                required
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-primary text-primary-foreground py-2 rounded-md hover:opacity-90 transition font-medium"
              disabled={status === 'submitting'}
            >
              {status === 'submitting' ? 'Verifying...' : 'Verify'}
            </button>
          </form>

          {message && (
            <p
              className={`text-sm mt-4 text-center ${
                status === 'success' ? 'text-success' : 'text-error'
              }`}
            >
              {message}
            </p>
          )}

          {/* Back to Login */}
          <p className="text-center text-sm text-muted-foreground mt-6">
            <Link href="/auth/login" className="text-primary hover:underline font-medium">
              Back to sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
