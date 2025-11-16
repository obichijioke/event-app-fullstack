import { Metadata } from 'next';
import Link from 'next/link';

type Props = {
  params: Promise<{ orgId: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { orgId } = await params;
  return {
    title: `Organization Details - ${orgId}`,
    description: 'View organization details',
  };
}

export default async function OrganizationDetailsPage({ params }: Props) {
  const { orgId } = await params;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Organization Details</h1>
          <p className="text-muted-foreground mt-1">ID: {orgId}</p>
        </div>
        <Link
          href="/admin"
          className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:opacity-90 transition text-sm"
        >
          ← Back to Dashboard
        </Link>
      </div>

      <div className="bg-card rounded-lg shadow-card p-6">
        <p className="text-muted-foreground">Content for Organization Details will be implemented here.</p>
        {/* TODO: Implement Organization Details functionality */}
      </div>
    </div>
  );
}
