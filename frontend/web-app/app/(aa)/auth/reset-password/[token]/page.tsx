'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authApi } from '@/lib/api/auth-api';

type Props = {
  params: Promise<{ token: string }>;
};

export default function ResetPasswordPage({ params }: Props) {
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string>('');
  const router = useRouter();

  useEffect(() => {
    params.then(({ token }) => setToken(token));
  }, [params]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setStatus('error');
      setMessage('Passwords do not match');
      return;
    }
    setStatus('submitting');
    setMessage('');
    try {
      await authApi.resetPassword(token, password);
      setStatus('success');
      setMessage('Password reset successfully. Redirecting to login...');
      setTimeout(() => router.push('/auth/login'), 1500);
    } catch (err: any) {
      setStatus('error');
      setMessage(err?.message || 'Failed to reset password');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-lg shadow-card p-8">
          <h1 className="text-3xl font-bold text-center mb-2">Reset Password</h1>
          <p className="text-center text-muted-foreground mb-8">
            Enter your new password below
          </p>

          <form className="space-y-4" onSubmit={onSubmit}>
            <input type="hidden" value={token} />

            {/* New Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2">
                New Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="••••••••"
                required
              />
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="••••••••"
                required
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-primary text-primary-foreground py-2 rounded-md hover:opacity-90 transition font-medium"
              disabled={status === 'submitting'}
            >
              {status === 'submitting' ? 'Resetting...' : 'Reset Password'}
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
