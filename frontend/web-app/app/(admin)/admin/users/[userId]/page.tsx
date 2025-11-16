"use server";

import Link from "next/link";

type Props = {
  params: Promise<{ userId: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { userId } = await params;
  return {
    title: `User Details - ${userId}`,
    description: `Admin view for user ${userId}`,
  };
}

export default async function UserDetailsPage({ params }: Props) {
  const { userId } = await params;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">User Details</h1>
          <p className="text-muted-foreground mt-1">ID: {userId}</p>
        </div>
        <Link
          href="/admin"
          className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:opacity-90 transition text-sm"
        >
          ← Back to Dashboard
        </Link>
      </div>

      <div className="bg-card rounded-lg shadow-card p-6">
        <p className="text-muted-foreground">
          Client-side role management UI is rendered separately. Use the "Manage
          roles" button below to open the client experience.
        </p>

        <div className="mt-4">
          <Link
            href={`/admin/users/${userId}/manage`}
            className="px-3 py-2 bg-primary text-white rounded"
          >
            Manage roles
          </Link>
        </div>
      </div>
    </div>
  );
}
