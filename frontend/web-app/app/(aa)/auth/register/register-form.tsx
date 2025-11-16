'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui';
import { useAuth } from '@/components/auth';
import { ApiError } from '@/services/auth.service';

export default function RegisterForm() {
  const router = useRouter();
  const { registerAndLogin } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    acceptedTerms: false,
  });
  const [errors, setErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange =
    (field: keyof typeof formData) => (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = field === 'acceptedTerms' ? event.target.checked : event.target.value;
      setFormData((prev) => ({ ...prev, [field]: value }));
    };

  const validate = () => {
    const validationErrors: string[] = [];

    if (!formData.name.trim()) {
      validationErrors.push('Full name is required.');
    }

    if (formData.password.length < 8) {
      validationErrors.push('Password must be at least 8 characters long.');
    }

    if (formData.password !== formData.confirmPassword) {
      validationErrors.push('Passwords do not match.');
    }

    if (!formData.acceptedTerms) {
      validationErrors.push('You must accept the Terms of Service and Privacy Policy.');
    }

    return validationErrors;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrors([]);

    const validationErrors = validate();
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      await registerAndLogin({
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        name: formData.name.trim(),
        phone: formData.phone.trim() || undefined,
      });

      router.push('/account');
    } catch (error) {
      if (error instanceof ApiError) {
        const details = (error.details as { message?: string | string[] })?.message;
        setErrors(Array.isArray(details) ? details : [error.message]);
      } else {
        setErrors(['Something went wrong while creating your account. Please try again.']);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen px-4 py-12">
      <div className="mx-auto w-full max-w-md">
        <div className="rounded-lg bg-card p-8 shadow-card">
          <h1 className="mb-2 text-center text-3xl font-bold">Create Account</h1>
          <p className="mb-8 text-center text-muted-foreground">
            Sign up to start booking events
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
              <label htmlFor="name" className="mb-2 block text-sm font-medium">
                Full Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                autoComplete="name"
                required
                value={formData.name}
                onChange={handleChange('name')}
                className="w-full rounded-md border border-border bg-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="John Doe"
                disabled={isSubmitting}
              />
            </div>

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
                onChange={handleChange('email')}
                className="w-full rounded-md border border-border bg-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="you@example.com"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label htmlFor="phone" className="mb-2 block text-sm font-medium">
                Phone (optional)
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                autoComplete="tel"
                value={formData.phone}
                onChange={handleChange('phone')}
                className="w-full rounded-md border border-border bg-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="+234 800 000 0000"
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
                autoComplete="new-password"
                required
                value={formData.password}
                onChange={handleChange('password')}
                className="w-full rounded-md border border-border bg-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Create a secure password"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="mb-2 block text-sm font-medium">
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                autoComplete="new-password"
                required
                value={formData.confirmPassword}
                onChange={handleChange('confirmPassword')}
                className="w-full rounded-md border border-border bg-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Re-enter your password"
                disabled={isSubmitting}
              />
            </div>

            <label className="flex items-start gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                className="mt-1 rounded"
                checked={formData.acceptedTerms}
                onChange={handleChange('acceptedTerms')}
                disabled={isSubmitting}
              />
              <span>
                I agree to the{' '}
                <Link href="/terms" className="text-primary hover:underline">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="text-primary hover:underline">
                  Privacy Policy
                </Link>
              </span>
            </label>

            <Button type="submit" className="w-full" loading={isSubmitting} disabled={isSubmitting}>
              Create Account
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
            Already have an account?{' '}
            <Link href="/auth/login" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
