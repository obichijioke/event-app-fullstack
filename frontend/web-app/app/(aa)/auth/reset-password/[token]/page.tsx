import { Metadata } from 'next';
import Link from 'next/link';

type Props = {
  params: Promise<{ token: string }>;
};

export const metadata: Metadata = {
  title: 'Reset Password',
  description: 'Set a new password for your account',
};

export default async function ResetPasswordPage({ params }: Props) {
  const { token } = await params;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-lg shadow-card p-8">
          <h1 className="text-3xl font-bold text-center mb-2">Reset Password</h1>
          <p className="text-center text-muted-foreground mb-8">
            Enter your new password below
          </p>

          <form className="space-y-4">
            <input type="hidden" value={token} />

            {/* New Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2">
                New Password
              </label>
              <input
                type="password"
                id="password"
                className="w-full px-4 py-2 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="••••••••"
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
                className="w-full px-4 py-2 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="••••••••"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-primary text-primary-foreground py-2 rounded-md hover:opacity-90 transition font-medium"
            >
              Reset Password
            </button>
          </form>

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

