'use client';

import { useState } from 'react';
import { UserPlus, Mail, Shield } from 'lucide-react';
import type { AddMemberDto, OrganizerRole } from '@/lib/types/organizer';

interface AddMemberFormProps {
  onSubmit: (data: AddMemberDto) => Promise<void>;
}

export function AddMemberForm({ onSubmit }: AddMemberFormProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<OrganizerRole>('staff');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      setLoading(true);
      await onSubmit({ email: email.trim(), role });
      setSuccess(true);
      setEmail('');
      setRole('staff');

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error('Failed to add member:', err);
      setError(err.message || 'Failed to add member. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-card rounded-lg border border-border p-6">
      <div className="flex items-center gap-2 mb-4">
        <UserPlus className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">Add Team Member</h3>
      </div>

      <div className="space-y-4">
        {/* Email Input */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-2">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email Address
            </div>
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="member@example.com"
            className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            disabled={loading}
            required
          />
          <p className="text-xs text-muted-foreground mt-1">
            The user must already have an account on the platform
          </p>
        </div>

        {/* Role Selection */}
        <div>
          <label htmlFor="role" className="block text-sm font-medium mb-2">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Role
            </div>
          </label>
          <select
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value as OrganizerRole)}
            className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            disabled={loading}
          >
            <option value="staff">Staff - Basic event management access</option>
            <option value="finance">Finance - Access to financials and payouts</option>
            <option value="manager">Manager - Manage events, tickets, and team</option>
            <option value="owner">Owner - Full access to all features</option>
          </select>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-900">{error}</p>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-900">Team member added successfully!</p>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition disabled:opacity-50 font-medium"
          disabled={loading}
        >
          {loading ? 'Adding Member...' : 'Add Team Member'}
        </button>
      </div>
    </form>
  );
}
