import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Two-Factor Authentication',
  description: 'Enter your 2FA code',
};

export default function TwoFactorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-lg shadow-card p-8">
          <h1 className="text-3xl font-bold text-center mb-2">Two-Factor Authentication</h1>
          <p className="text-center text-muted-foreground mb-8">
            Enter the 6-digit code from your authenticator app
          </p>

          <form className="space-y-4">
            {/* 2FA Code */}
            <div>
              <label htmlFor="code" className="block text-sm font-medium mb-2">
                Authentication Code
              </label>
              <input
                type="text"
                id="code"
                maxLength={6}
                className="w-full px-4 py-2 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary text-center text-2xl tracking-widest"
                placeholder="000000"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-primary text-primary-foreground py-2 rounded-md hover:opacity-90 transition font-medium"
            >
              Verify
            </button>
          </form>

          {/* Backup Code Link */}
          <div className="mt-6 text-center">
            <button className="text-sm text-primary hover:underline">
              Use backup code instead
            </button>
          </div>

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

