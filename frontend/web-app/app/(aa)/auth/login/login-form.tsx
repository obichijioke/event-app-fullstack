'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui';
import { useAuth } from '@/components/auth';
import { ApiError } from '@/services/auth.service';

type LoginErrors = string[];

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [errors, setErrors] = useState<LoginErrors>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = (field: 'email' | 'password') => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrors([]);
    setIsSubmitting(true);

    try {
      await login({
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      });

      // Redirect to returnUrl if provided, otherwise go to account
      const returnUrl = searchParams.get('returnUrl');
      router.push(returnUrl ? decodeURIComponent(returnUrl) : '/account');
    } catch (error) {
      if (error instanceof ApiError) {
        const details = (error.details as { message?: string | string[] })?.message;
        setErrors(Array.isArray(details) ? details : [error.message]);
      } else {
        setErrors(['Something went wrong while signing you in. Please try again.']);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen px-4 py-12">
      <div className="mx-auto w-full max-w-md">
        <div className="rounded-lg bg-card p-8 shadow-card">
          <h1 className="mb-2 text-center text-3xl font-bold">Welcome Back</h1>
          <p className="mb-8 text-center text-muted-foreground">
            Sign in to your account to continue
          </p>

          {errors.length > 0 && (
            <div className="mb-6 rounded-md border border-error/40 bg-error/10 p-4 text-sm text-error">
              <ul className="list-disc space-y-1 pl-4">
                {errors.map((errorMessage, index) => (
                  <li key={index}>{errorMessage}</li>
                ))}
              </ul>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit} noValidate>
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={updateField('email')}
                className="w-full rounded-md border border-border bg-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="you@example.com"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                autoComplete="current-password"
                required
                value={formData.password}
                onChange={updateField('password')}
                className="w-full rounded-md border border-border bg-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="••••••••"
                disabled={isSubmitting}
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={formData.rememberMe}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, rememberMe: event.target.checked }))
                  }
                  className="rounded"
                  disabled={isSubmitting}
                />
                Remember me
              </label>
              <Link href="/auth/forgot-password" className="text-sm text-primary hover:underline">
                Forgot password?
              </Link>
            </div>

            <Button type="submit" className="w-full" loading={isSubmitting} disabled={isSubmitting}>
              Sign In
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              className="flex items-center justify-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium transition hover:bg-muted"
              disabled={isSubmitting}
            >
              Google
            </button>
            <button
              type="button"
              className="flex items-center justify-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium transition hover:bg-muted"
              disabled={isSubmitting}
            >
              Facebook
            </button>
          </div>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link href="/auth/register" className="font-medium text-primary hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
