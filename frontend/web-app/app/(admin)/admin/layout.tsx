'use client';

import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AdminSidebar, AdminHeader } from '@/components/admin';
import { useAuth } from '@/components/auth';
import { Text } from '@/components/ui';

interface AdminDashboardLayoutProps {
  children: React.ReactNode;
}

export default function AdminDashboardLayout({ children }: AdminDashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, initialized } = useAuth();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  // Handle authentication and authorization redirects
  React.useEffect(() => {
    if (initialized) {
      if (!user) {
        // Not authenticated - redirect to login with return URL
        const returnUrl = encodeURIComponent(pathname);
        router.push(`/auth/login?returnUrl=${returnUrl}`);
      } else if (user.role !== 'admin') {
        // Authenticated but not admin - redirect to homepage
        router.push('/');
      }
    }
  }, [initialized, user, pathname, router]);

  // Show loading state while checking authentication
  if (!initialized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent mb-4"></div>
          <Text className="text-muted-foreground">Loading...</Text>
        </div>
      </div>
    );
  }

  // Don't render anything if not authenticated or not admin (will redirect)
  if (!user || user.role !== 'admin') {
    return null;
  }

  // User is authenticated and has admin role
  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <AdminSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        currentPath={pathname}
      />

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Header */}
        <AdminHeader onMenuClick={() => setSidebarOpen(true)} />

        {/* Page content */}
        <main className="min-h-[calc(100vh-4rem)] p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}