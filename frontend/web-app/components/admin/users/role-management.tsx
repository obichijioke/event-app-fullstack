"use client";

import React, { useEffect, useState } from "react";
import { adminApiService } from "@/services/admin-api.service";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { ConfirmModal } from "@/components/ui/confirm-modal";

interface RoleManagementProps {
  userId: string;
}

export function RoleManagement({ userId }: RoleManagementProps) {
  const [user, setUser] = useState<{
    id: string;
    email: string;
    role: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<
    "attendee" | "organizer" | "moderator" | "admin"
  >("attendee");
  const [showRevokeConfirm, setShowRevokeConfirm] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function fetchUser() {
      setLoading(true);
      try {
        const res = await adminApiService.getUser(userId);
        if (mounted) setUser(res.data);
      } catch (err) {
        console.error("Failed to load user", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchUser();
    return () => {
      mounted = false;
    };
  }, [userId]);

  const grantRole = async () => {
    if (!user) return;
    setActionLoading(true);
    try {
      await adminApiService.grantUserRole(userId, selectedRole);
      // Refresh user data
      const refreshed = await adminApiService.getUser(userId);
      setUser(refreshed.data);
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : String(err);
      alert(`Failed to grant role: ${msg}`);
    } finally {
      setActionLoading(false);
    }
  };

  const revokeRole = async () => {
    if (!user) return;
    const fallback = "attendee";
    setActionLoading(true);
    try {
      await adminApiService.revokeUserRole(userId, fallback);
      const refreshed = await adminApiService.getUser(userId);
      setUser(refreshed.data);
      setShowRevokeConfirm(false);
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : String(err);
      alert(`Failed to revoke role: ${msg}`);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <div className="text-muted-foreground">Loading user...</div>;
  }

  if (!user) {
    return <div className="text-muted-foreground">User not found.</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Role Management</h2>
        <p className="text-sm text-muted-foreground">
          Manage platform-level roles for this user. Changes are audited and
          logged.
        </p>
      </div>

      <div className="bg-card rounded-lg p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">{user.email}</p>
            <p className="text-sm text-muted-foreground">
              Current role: <span className="font-medium">{user.role}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">New Role:</label>
            <Select
              value={selectedRole}
              onChange={(e) =>
                setSelectedRole(
                  e.target.value as
                    | "attendee"
                    | "organizer"
                    | "moderator"
                    | "admin"
                )
              }
              options={[
                { value: "attendee", label: "Attendee" },
                { value: "organizer", label: "Organizer" },
                { value: "moderator", label: "Moderator" },
                { value: "admin", label: "Admin" },
              ]}
            />
          </div>

          <Button
            onClick={grantRole}
            disabled={actionLoading}
            className="bg-primary hover:bg-primary/90"
          >
            {actionLoading ? "Granting..." : "Grant Role"}
          </Button>

          <Button
            onClick={() => setShowRevokeConfirm(true)}
            disabled={actionLoading}
            variant="destructive"
          >
            {actionLoading ? "Revoking..." : "Revoke Role"}
          </Button>
        </div>

        <div className="text-xs text-muted-foreground">
          <p>
            • Granting a role will update the user's platform role immediately
          </p>
          <p>
            • Revoking will set the role to "attendee" as the default fallback
          </p>
          <p>• All role changes are recorded in the audit log for compliance</p>
        </div>
      </div>

      <ConfirmModal
        open={showRevokeConfirm}
        onCancel={() => setShowRevokeConfirm(false)}
        onConfirm={revokeRole}
        title="Revoke Role"
        message={`Are you sure you want to revoke ${user.email}'s current role and set them to "attendee"? This action will be logged in the audit trail.`}
        confirmLabel="Revoke Role"
        cancelLabel="Cancel"
      />
    </div>
  );
}
