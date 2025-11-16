'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button, IconButton, Avatar } from '@/components/ui';
import { cn } from '@/lib/utils';
import { useAuth } from '@/components/auth';
import type { User as AuthUser } from '@/services/auth.service';

interface HeaderProps {
  className?: string;
}

export function Header({ className }: HeaderProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [userMenuOpen, setUserMenuOpen] = React.useState(false);
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);
  const { user, logout, initialized } = useAuth();
  const isAuthenticated = Boolean(user);

  const handleLogout = React.useCallback(async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } finally {
      setIsLoggingOut(false);
      setUserMenuOpen(false);
    }
  }, [logout]);

  const navigation = [
    { name: 'Browse Events', href: '/events' },
    { name: 'Categories', href: '/categories' },
    { name: 'Organizers', href: '/organizers' },
    { name: 'Venues', href: '/venues' },
  ];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <header className={cn('sticky top-0 z-50 w-full border-b border-border bg-background', className)}>
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <span className="text-lg font-bold">E</span>
              </div>
              <span className="text-xl font-bold text-foreground">EventHub</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden items-center gap-1 md:flex">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    isActive(item.href)
                      ? 'bg-muted text-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-3">
            {/* Search Button - Desktop */}
            <IconButton
              variant="ghost"
              size="md"
              aria-label="Search events"
              className="hidden md:inline-flex"
              onClick={() => {
                // TODO: Open search modal
                window.location.href = '/search';
              }}
            >
              <SearchIcon className="h-5 w-5" />
            </IconButton>

            {/* Create Event Button */}
            <Link
              href="/organizer/onboarding"
              className="hidden rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted md:inline-flex"
            >
              Create Event
            </Link>

            {/* Authentication */}
            {isAuthenticated && user ? (
              <UserMenu
                user={user}
                userMenuOpen={userMenuOpen}
                setUserMenuOpen={setUserMenuOpen}
                onLogout={handleLogout}
                loggingOut={isLoggingOut}
              />
            ) : (
              <div className="hidden items-center gap-2 md:flex">
                {!initialized ? (
                  <div className="flex h-10 w-44 items-center gap-2">
                    <div className="h-full flex-1 animate-pulse rounded-md bg-muted" />
                    <div className="h-full flex-1 animate-pulse rounded-md bg-muted" />
                  </div>
                ) : (
                  <>
                    <Link
                      href="/auth/login"
                      className="rounded-md px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/auth/register"
                      className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                    >
                      Sign Up
                    </Link>
                  </>
                )}
              </div>
            )}

            {/* Mobile Menu Button */}
            <IconButton
              variant="ghost"
              size="md"
              aria-label="Open menu"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <CloseIcon className="h-6 w-6" />
              ) : (
                <MenuIcon className="h-6 w-6" />
              )}
            </IconButton>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="border-t border-border py-4 md:hidden">
            {/* Mobile Navigation */}
            <nav className="space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'block rounded-md px-3 py-2 text-base font-medium transition-colors',
                    isActive(item.href)
                      ? 'bg-muted text-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
            </nav>

            {/* Mobile Actions */}
            <div className="mt-4 space-y-2 border-t border-border pt-4">
              <Link
                href="/search"
                className="flex items-center gap-2 rounded-md px-3 py-2 text-base font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                onClick={() => setMobileMenuOpen(false)}
              >
                <SearchIcon className="h-5 w-5" />
                Search Events
              </Link>
              <Link
                href="/organizer/onboarding"
                className="block rounded-md border border-border bg-background px-3 py-2 text-center text-base font-medium text-foreground transition-colors hover:bg-muted"
                onClick={() => setMobileMenuOpen(false)}
              >
                Create Event
              </Link>
            </div>

            {/* Mobile Auth */}
            {isAuthenticated && user ? (
              <div className="mt-4 space-y-3 border-t border-border pt-4">
                <div className="rounded-md border border-border bg-card px-3 py-2">
                  <p className="text-sm font-semibold text-foreground">
                    Signed in as {user.name ?? user.email}
                  </p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
                <Button
                  variant="secondary"
                  className="w-full"
                  loading={isLoggingOut}
                  onClick={async () => {
                    await handleLogout();
                    setMobileMenuOpen(false);
                  }}
                >
                  {isLoggingOut ? 'Signing out…' : 'Sign Out'}
                </Button>
              </div>
            ) : (
              <div className="mt-4 space-y-2 border-t border-border pt-4">
                {!initialized ? (
                  <div className="h-10 animate-pulse rounded-md bg-muted" />
                ) : (
                  <>
                    <Link
                      href="/auth/login"
                      className="block rounded-md px-3 py-2 text-center text-base font-medium text-foreground transition-colors hover:bg-muted"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/auth/register"
                      className="block rounded-md bg-primary px-3 py-2 text-center text-base font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Sign Up
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}

// User Menu Component
function UserMenu({
  user,
  userMenuOpen,
  setUserMenuOpen,
  onLogout,
  loggingOut,
}: {
  user: AuthUser;
  userMenuOpen: boolean;
  setUserMenuOpen: (open: boolean) => void;
  onLogout: () => Promise<void> | void;
  loggingOut: boolean;
}) {
  return (
    <div className="relative">
      <button
        onClick={() => setUserMenuOpen(!userMenuOpen)}
        className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 transition-colors hover:bg-muted"
        aria-expanded={userMenuOpen}
        aria-haspopup="true"
      >
        <Avatar name={user.name ?? user.email} size="sm" />
        <span className="hidden text-sm font-medium text-foreground md:inline">
          {user.name ?? user.email}
        </span>
        <ChevronDownIcon className="h-4 w-4 text-muted-foreground" />
      </button>

      {/* User Dropdown Menu */}
      {userMenuOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-lg border border-border bg-card shadow-lg">
          <div className="border-b border-border p-4">
            <p className="text-sm font-semibold text-foreground">
              {user.name ?? user.email}
            </p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
          <div className="p-2">
            <UserMenuItem href="/account">My Account</UserMenuItem>
            <UserMenuItem href="/orders">My Orders</UserMenuItem>
            <UserMenuItem href="/tickets">My Tickets</UserMenuItem>
            <UserMenuItem href="/account/following">Following</UserMenuItem>
            <div className="my-2 border-t border-border" />
            <UserMenuItem href="/organizer">Organizer Dashboard</UserMenuItem>
            <div className="my-2 border-t border-border" />
            <UserMenuItem href="/help">Help Center</UserMenuItem>
            <UserMenuItem href="/account/settings">Settings</UserMenuItem>
            <div className="my-2 border-t border-border" />
            <button
              onClick={onLogout}
              className="w-full rounded-md px-3 py-2 text-left text-sm font-medium text-error transition-colors hover:bg-muted"
              disabled={loggingOut}
            >
              {loggingOut ? 'Signing out…' : 'Sign Out'}
            </button>
          </div>
        </div>
      )}
    </div>
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

// Icon Components (Simple SVG icons)
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

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
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
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
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
