import { Metadata } from 'next';
import Link from 'next/link';

type Props = {
  params: Promise<{ token: string }>;
};

export const metadata: Metadata = {
  title: 'Verify Email',
  description: 'Verify your email address',
};

export default async function VerifyEmailPage({ params }: Props) {
  const { token } = await params;

  // TODO: Verify token with API
  const isValid = true; // Placeholder

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-lg shadow-card p-8 text-center">
          {isValid ? (
            <>
              <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-success"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h1 className="text-3xl font-bold mb-2">Email Verified!</h1>
              <p className="text-muted-foreground mb-8">
                Your email has been successfully verified. You can now sign in to your account.
              </p>
              <Link
                href="/auth/login"
                className="inline-block bg-primary text-primary-foreground px-6 py-2 rounded-md hover:opacity-90 transition font-medium"
              >
                Sign In
              </Link>
            </>
          ) : (
            <>
              <div className="w-16 h-16 bg-error/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-error"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <h1 className="text-3xl font-bold mb-2">Verification Failed</h1>
              <p className="text-muted-foreground mb-8">
                This verification link is invalid or has expired. Please request a new one.
              </p>
              <Link
                href="/auth/login"
                className="inline-block bg-primary text-primary-foreground px-6 py-2 rounded-md hover:opacity-90 transition font-medium"
              >
                Back to Sign In
              </Link>
            </>
          )}
          <p className="text-xs text-muted-foreground mt-4">Token: {token}</p>
        </div>
      </div>
    </div>
  );
}

