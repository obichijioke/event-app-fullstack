'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Loader2, Users, UserPlus } from 'lucide-react';
import { useOrganizerStore } from '@/lib/stores/organizer-store';
import { organizerApi } from '@/lib/api/organizer-api';
import { MemberList } from '@/components/organizer/organization/member-list';
import { AddMemberForm } from '@/components/organizer/organization/add-member-form';
import { EmptyState } from '@/components/organizer/empty-state';
import type { OrganizationMember, AddMemberDto, OrganizerRole } from '@/lib/types/organizer';

export default function TeamMembersPage() {
  const { currentOrganization } = useOrganizerStore();
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const canManageMembers = currentOrganization?.role === 'owner' || currentOrganization?.role === 'manager';

  useEffect(() => {
    async function loadMembers() {
      if (!currentOrganization) return;

      try {
        setLoading(true);
        setError(null);

        const data = await organizerApi.organization.members.list(currentOrganization.id);
        setMembers(data);
      } catch (err) {
        console.error('Failed to load members:', err);
        setError(err instanceof Error ? err.message : 'Failed to load team members');
      } finally {
        setLoading(false);
      }
    }

    loadMembers();
  }, [currentOrganization]);

  const handleAddMember = async (data: AddMemberDto) => {
    if (!currentOrganization) return;

    const newMember = await organizerApi.organization.members.add(currentOrganization.id, data);
    setMembers([...members, newMember]);
    setShowAddForm(false);
  };

  const handleUpdateRole = async (memberId: string, role: OrganizerRole) => {
    if (!currentOrganization) return;

    const updated = await organizerApi.organization.members.updateRole(
      currentOrganization.id,
      memberId,
      { role }
    );

    setMembers(members.map((m) => (m.userId === memberId ? updated : m)));
  };

  const handleRemove = async (memberId: string) => {
    if (!currentOrganization) return;

    await organizerApi.organization.members.remove(currentOrganization.id, memberId);
    setMembers(members.filter((m) => m.userId !== memberId));
  };

  if (!currentOrganization) {
    return (
      <div className="container mx-auto px-4 py-8">
        <EmptyState
          title="No Organization Selected"
          description="Please select an organization to manage team members"
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <EmptyState
          title="Failed to Load Team Members"
          description={error}
          action={
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90"
            >
              Retry
            </button>
          }
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Team Members</h1>
          <p className="text-muted-foreground mt-1">
            Manage your organization team members and their roles
          </p>
        </div>
        <Link
          href="/organizer/organization"
          className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:opacity-90 transition text-sm"
        >
          ← Back to Settings
        </Link>
      </div>

      {/* Stats Card */}
      <div className="bg-card border border-border rounded-lg p-6 mb-8">
        <div className="flex items-center gap-3">
          <Users className="w-8 h-8 text-blue-600" />
          <div>
            <p className="text-2xl font-bold">{members.length}</p>
            <p className="text-sm text-muted-foreground">Total Members</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Members List */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Current Members</h2>
            {canManageMembers && !showAddForm && (
              <button
                onClick={() => setShowAddForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition text-sm"
              >
                <UserPlus className="w-4 h-4" />
                Add Member
              </button>
            )}
          </div>

          {members.length === 0 ? (
            <EmptyState
              icon={<Users className="w-12 h-12" />}
              title="No Team Members"
              description="Add team members to collaborate on events and manage your organization"
            />
          ) : (
            <MemberList
              members={members}
              currentUserRole={currentOrganization.role}
              onUpdateRole={handleUpdateRole}
              onRemove={handleRemove}
            />
          )}
        </div>

        {/* Add Member Form */}
        <div className="lg:col-span-1">
          {canManageMembers && showAddForm && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Add New Member</h2>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
              </div>
              <AddMemberForm onSubmit={handleAddMember} />
            </div>
          )}

          {!canManageMembers && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm text-amber-900">
                You need owner or manager permissions to add or manage team members.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
