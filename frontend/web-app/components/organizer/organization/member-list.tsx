'use client';

import React, { useState } from 'react';
import { Trash2, Edit2, Crown, Shield, DollarSign, User } from 'lucide-react';
import type { OrganizationMember, OrganizerRole } from '@/lib/types/organizer';

interface MemberListProps {
  members: OrganizationMember[];
  currentUserRole: OrganizerRole;
  onUpdateRole: (memberId: string, role: OrganizerRole) => Promise<void>;
  onRemove: (memberId: string) => Promise<void>;
}

const ROLE_CONFIG = {
  owner: {
    label: 'Owner',
    icon: Crown,
    color: 'text-purple-600 bg-purple-100',
    description: 'Full access to all features and settings',
  },
  manager: {
    label: 'Manager',
    icon: Shield,
    color: 'text-blue-600 bg-blue-100',
    description: 'Manage events, tickets, and team members',
  },
  finance: {
    label: 'Finance',
    icon: DollarSign,
    color: 'text-green-600 bg-green-100',
    description: 'Access to financials and payouts',
  },
  staff: {
    label: 'Staff',
    icon: User,
    color: 'text-gray-600 bg-gray-100',
    description: 'Basic event management access',
  },
};

export function MemberList({ members, currentUserRole, onUpdateRole, onRemove }: MemberListProps) {
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<Record<string, OrganizerRole>>({});
  const [loading, setLoading] = useState<string | null>(null);

  const canManageMembers = currentUserRole === 'owner' || currentUserRole === 'manager';

  const handleUpdateRole = async (memberId: string) => {
    try {
      setLoading(memberId);
      const roleToUpdate = selectedRoles[memberId];
      if (!roleToUpdate) {
        console.error('No role selected for member:', memberId);
        return;
      }
      await onUpdateRole(memberId, roleToUpdate);
      setEditingMemberId(null);
      // Clean up the selected role for this member
      setSelectedRoles((prev) => {
        const updated = { ...prev };
        delete updated[memberId];
        return updated;
      });
    } catch (error) {
      console.error('Failed to update role:', error);
    } finally {
      setLoading(null);
    }
  };

  const handleRemove = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this team member?')) return;

    try {
      setLoading(memberId);
      await onRemove(memberId);
    } catch (error) {
      console.error('Failed to remove member:', error);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-4">
      {members.map((member) => {
        const roleConfig = ROLE_CONFIG[member.role];
        const Icon = roleConfig.icon;
        const isEditing = editingMemberId === member.userId;
        const isLoading = loading === member.userId;

        return (
          <div
            key={member.userId}
            className="flex items-center justify-between p-4 bg-card border border-border rounded-lg"
          >
            <div className="flex items-center gap-4 flex-1">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-primary font-semibold text-sm">
                  {member.user.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">{member.user.name}</p>
                <p className="text-sm text-muted-foreground">{member.user.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <select
                    value={selectedRoles[member.userId] || member.role}
                    onChange={(e) => setSelectedRoles((prev) => ({
                      ...prev,
                      [member.userId]: e.target.value as OrganizerRole
                    }))}
                    className="px-3 py-1.5 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    disabled={isLoading}
                  >
                    {Object.entries(ROLE_CONFIG).map(([role, config]) => (
                      <option key={role} value={role}>
                        {config.label}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => handleUpdateRole(member.userId)}
                    className="px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-sm hover:opacity-90 disabled:opacity-50"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={() => setEditingMemberId(null)}
                    className="px-3 py-1.5 bg-secondary text-secondary-foreground rounded-md text-sm hover:opacity-90"
                    disabled={isLoading}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <>
                  <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${roleConfig.color}`}>
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{roleConfig.label}</span>
                  </div>

                  {canManageMembers && member.role !== 'owner' && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setEditingMemberId(member.userId);
                          setSelectedRoles((prev) => ({
                            ...prev,
                            [member.userId]: member.role
                          }));
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition"
                        title="Edit role"
                        disabled={isLoading}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleRemove(member.userId)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-md transition"
                        title="Remove member"
                        disabled={isLoading}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
