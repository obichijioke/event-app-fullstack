'use client';

import * as React from 'react';
import Link from 'next/link';
import { Avatar, IconButton, Badge } from '@/components/ui';
import { useAuth } from '@/components/auth';

interface AdminHeaderProps {
  onMenuClick: () => void;
}

export function AdminHeader({ onMenuClick }: AdminHeaderProps) {
  const [userMenuOpen, setUserMenuOpen] = React.useState(false);
  const [notificationsOpen, setNotificationsOpen] = React.useState(false);
  const { user, logout } = useAuth();

  const handleLogout = React.useCallback(async () => {
    try {
      await logout();
      setUserMenuOpen(false);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }, [logout]);

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-4 lg:px-6">
        {/* Left side - Mobile menu button and breadcrumb */}
        <div className="flex items-center gap-4">
          <IconButton
            variant="ghost"
            size="md"
            aria-label="Open menu"
            className="lg:hidden"
            onClick={onMenuClick}
          >
            <MenuIcon className="h-6 w-6" />
          </IconButton>

          {/* Breadcrumb could go here */}
          <div className="hidden lg:block">
            <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Link href="/admin" className="hover:text-foreground">
                Admin
              </Link>
            </nav>
          </div>
        </div>

        {/* Right side - Notifications and user menu */}
        <div className="flex items-center gap-3">
          {/* Notifications */}
          <div className="relative">
            <IconButton
              variant="ghost"
              size="md"
              aria-label="Notifications"
              onClick={() => setNotificationsOpen(!notificationsOpen)}
            >
              <BellIcon className="h-5 w-5" />
              <Badge 
                variant="error"
                size="sm" 
                className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs"
              >
                3
              </Badge>
            </IconButton>

            {/* Notifications dropdown */}
            {notificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 rounded-lg border border-border bg-card shadow-lg">
                <div className="border-b border-border p-4">
                  <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  <div className="p-4">
                    <p className="text-sm text-muted-foreground">No new notifications</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 transition-colors hover:bg-muted"
              aria-expanded={userMenuOpen}
              aria-haspopup="true"
            >
              <Avatar name={user?.name ?? user?.email ?? 'Admin'} size="sm" />
              <span className="hidden text-sm font-medium text-foreground md:inline">
                {user?.name ?? user?.email ?? 'Admin'}
              </span>
              <ChevronDownIcon className="h-4 w-4 text-muted-foreground" />
            </button>

            {/* User dropdown menu */}
            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-lg border border-border bg-card shadow-lg">
                <div className="border-b border-border p-4">
                  <p className="text-sm font-semibold text-foreground">
                    {user?.name ?? 'Admin User'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {user?.email ?? 'admin@eventhub.com'}
                  </p>
                  <div className="mt-1">
                    <Badge variant="secondary" size="sm">
                      {user?.role ?? 'admin'}
                    </Badge>
                  </div>
                </div>
                <div className="p-2">
                  <UserMenuItem href="/account/profile">Profile Settings</UserMenuItem>
                  <UserMenuItem href="/admin/settings">Admin Settings</UserMenuItem>
                  <div className="my-2 border-t border-border" />
                  <UserMenuItem href="/help">Help Center</UserMenuItem>
                  <UserMenuItem href="/docs">Documentation</UserMenuItem>
                  <div className="my-2 border-t border-border" />
                  <button
                    onClick={handleLogout}
                    className="w-full rounded-md px-3 py-2 text-left text-sm font-medium text-error transition-colors hover:bg-muted"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Click outside to close dropdowns */}
      {(notificationsOpen || userMenuOpen) && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => {
            setNotificationsOpen(false);
            setUserMenuOpen(false);
          }}
        />
      )}
    </header>
  );
}

// Helper component for user menu items
function UserMenuItem({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="block rounded-md px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
    >
      {children}
    </Link>
  );
}

// Icon Components
function MenuIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function BellIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
      />
    </svg>
  );
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}