"use client";

import { RoleManagement } from "@/components/admin/users/role-management";
import Link from "next/link";

interface ManageUserPageProps {
  params: Promise<{ userId: string }>;
}

export default async function ManageUserPage({ params }: ManageUserPageProps) {
  const { userId } = await params;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Manage User Roles</h1>
          <p className="text-muted-foreground mt-1">User ID: {userId}</p>
        </div>
        <Link
          href={`/admin/users/${userId}`}
          className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:opacity-90 transition text-sm"
        >
          ← Back to User Details
        </Link>
      </div>

      <RoleManagement userId={userId} />
    </div>
  );
}
