import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Security Settings',
  description: 'Manage your security settings',
};

export default function SecurityPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Security Settings</h1>

      <div className="max-w-2xl space-y-6">
        {/* Password */}
        <div className="bg-card rounded-lg shadow-card p-6">
          <h2 className="text-xl font-semibold mb-4">Password</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Change your password to keep your account secure
          </p>
          <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition text-sm">
            Change Password
          </button>
        </div>

        {/* Two-Factor Authentication */}
        <div className="bg-card rounded-lg shadow-card p-6">
          <h2 className="text-xl font-semibold mb-4">Two-Factor Authentication</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Add an extra layer of security to your account
          </p>
          <button className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:opacity-90 transition text-sm">
            Enable 2FA
          </button>
        </div>

        {/* Active Sessions */}
        <div className="bg-card rounded-lg shadow-card p-6">
          <h2 className="text-xl font-semibold mb-4">Active Sessions</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Manage devices where you&apos;re currently logged in
          </p>
          <div className="space-y-3">
            {/* TODO: Map through active sessions */}
            <div className="flex items-center justify-between p-3 border border-border rounded-md">
              <div>
                <p className="font-medium text-sm">Current Session</p>
                <p className="text-xs text-muted-foreground">Windows • Chrome • Nigeria</p>
              </div>
              <span className="text-xs text-success">Active</span>
            </div>
          </div>
        </div>

        {/* API Keys */}
        <div className="bg-card rounded-lg shadow-card p-6">
          <h2 className="text-xl font-semibold mb-4">API Keys</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Manage API keys for integrations
          </p>
          <button className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:opacity-90 transition text-sm">
            Generate API Key
          </button>
        </div>

        {/* Login History */}
        <div className="bg-card rounded-lg shadow-card p-6">
          <h2 className="text-xl font-semibold mb-4">Login History</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Recent login activity on your account
          </p>
          <div className="space-y-2">
            {/* TODO: Map through login history */}
            <p className="text-sm text-muted-foreground">No recent activity</p>
          </div>
        </div>
      </div>
    </div>
  );
}
