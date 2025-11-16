import { OrganizationDetails } from '@/components/admin/organizations/organization-details';

type Props = {
  params: Promise<{ orgId: string }>;
};

export default async function OrganizationDetailsPage({ params }: Props) {
  const { orgId } = await params;

  return (
    <div className="container mx-auto px-4 py-8">
      <OrganizationDetails orgId={orgId} />
    </div>
  );
}
