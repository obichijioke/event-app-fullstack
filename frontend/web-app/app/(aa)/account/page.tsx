'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { accountApi } from '@/lib/api/account-api';
import { ticketsApi, type Ticket } from '@/lib/api/tickets-api';
import { ordersApi } from '@/lib/api/orders-api';
import { CurrencyDisplay } from '@/components/common/currency-display';
import {
  Loader2,
  Ticket as TicketIcon,
  ShoppingBag,
  Heart,
  TrendingUp,
  Shield,
  User,
  RefreshCw,
  AlertCircle,
  RotateCcw,
  LayoutDashboard,
} from 'lucide-react';

export default function AccountDashboardPage() {
  const [stats, setStats] = useState({ totalOrders: 0, totalSpentCents: 0, activeTickets: 0, following: 0 });
  const [upcomingTickets, setUpcomingTickets] = useState<Ticket[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setError(null);
        const [statsData, ticketsData, ordersData] = await Promise.all([
          accountApi.getStats(),
          ticketsApi.getUserTickets({ upcoming: true }),
          ordersApi.getMyOrders({ page: 1, limit: 3 }),
        ]);

        setStats(statsData);
        setUpcomingTickets(ticketsData.slice(0, 3));
        setRecentOrders(ordersData.items || []);
      } catch (err: any) {
        console.error('Failed to load account data:', err);
        setError(err?.message || 'Failed to load account data');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="overflow-hidden rounded-xl border border-border/70 bg-card">
        <div className="bg-linear-to-r from-slate-900 via-slate-800 to-slate-700 px-6 py-6 text-white">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur mb-2">
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </div>
          <h1 className="text-3xl font-semibold">Account Overview</h1>
          <p className="text-sm text-slate-200 mt-1">Track your tickets, orders, and account activity</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl border border-border/70 p-6">
          <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Total Orders</p>
          <p className="text-3xl font-bold">{loading ? '...' : stats.totalOrders}</p>
        </div>
        <div className="bg-card rounded-xl border border-border/70 p-6">
          <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Active Tickets</p>
          <p className="text-3xl font-bold">{loading ? '...' : stats.activeTickets}</p>
        </div>
        <div className="bg-card rounded-xl border border-border/70 p-6">
          <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Following</p>
          <p className="text-3xl font-bold">{loading ? '...' : stats.following}</p>
        </div>
        <div className="bg-card rounded-xl border border-border/70 p-6">
          <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Total Spent</p>
          <p className="text-3xl font-bold">
            {loading ? '...' : <CurrencyDisplay amountCents={stats.totalSpentCents} currency="NGN" />}
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Upcoming Events */}
          <section className="bg-card rounded-xl border border-border/70 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 bg-muted/30 border-b border-border/50">
              <h2 className="text-lg font-semibold">Upcoming Events</h2>
              <Link href="/account/tickets" className="text-sm font-medium text-primary hover:underline">
                View All
              </Link>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
                  </div>
                ) : upcomingTickets.length === 0 ? (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    <TicketIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No upcoming events</p>
                  </div>
                ) : (
                  upcomingTickets.map((ticket) => (
                    <div key={ticket.id} className="border border-border/70 rounded-lg p-4 hover:bg-muted/20 transition">
                      <h3 className="font-semibold mb-2">{ticket.event?.title || 'Event'}</h3>
                      <p className="text-sm text-muted-foreground mb-1">
                        {ticket.event?.startAt ? formatDate(ticket.event.startAt) : 'Date TBA'}
                      </p>
                      {ticket.event?.venue && (
                        <p className="text-sm text-muted-foreground mb-3">
                          {ticket.event.venue.name}
                          {ticket.event.venue.address && `, ${ticket.event.venue.address.city}`}
                        </p>
                      )}
                      <Link
                        href={`/account/tickets/${ticket.id}`}
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        View Ticket
                      </Link>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>

          {/* Recent Orders */}
          <section className="bg-card rounded-xl border border-border/70 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 bg-muted/30 border-b border-border/50">
              <h2 className="text-lg font-semibold">Recent Orders</h2>
              <Link href="/account/orders" className="text-sm font-medium text-primary hover:underline">
                View All
              </Link>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
                  </div>
                ) : recentOrders.length === 0 ? (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    <ShoppingBag className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No recent orders</p>
                  </div>
                ) : (
                  recentOrders.map((order) => (
                    <div key={order.id} className="border border-border/70 rounded-lg p-4 hover:bg-muted/20 transition">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="font-semibold mb-1">{order.event?.title || 'Event'}</h3>
                          <p className="text-xs text-muted-foreground">
                            Order #{order.id.slice(0, 8)} • {formatDate(order.createdAt)}
                          </p>
                        </div>
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                            order.status === 'paid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : order.status === 'pending'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
                          {order.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
                        <p className="text-base font-bold">
                          <CurrencyDisplay amountCents={Number(order.totalCents)} currency={order.currency} />
                        </p>
                        <Link href={`/orders/${order.id}`} className="text-sm font-medium text-primary hover:underline">
                          View Details
                        </Link>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>
        </div>

        {/* Sidebar - Quick Actions */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-card rounded-xl border border-border/70 overflow-hidden">
            <div className="px-6 py-4 bg-muted/30 border-b border-border/50">
              <h2 className="text-lg font-semibold">Quick Actions</h2>
            </div>
            <div className="p-2">
              <Link
                href="/account/profile"
                className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-muted transition text-sm font-medium"
              >
                <User className="h-4 w-4" />
                Edit Profile
              </Link>
              <Link
                href="/account/orders"
                className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-muted transition text-sm font-medium"
              >
                <ShoppingBag className="h-4 w-4" />
                View Orders
              </Link>
              <Link
                href="/account/tickets"
                className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-muted transition text-sm font-medium"
              >
                <TicketIcon className="h-4 w-4" />
                My Tickets
              </Link>
              <Link
                href="/account/security"
                className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-muted transition text-sm font-medium"
              >
                <Shield className="h-4 w-4" />
                Security Settings
              </Link>
            </div>
          </div>

          {/* Following */}
          <div className="bg-card rounded-xl border border-border/70 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 bg-muted/30 border-b border-border/50">
              <h2 className="text-lg font-semibold">Following</h2>
              <Link href="/account/following" className="text-sm font-medium text-primary hover:underline">
                View All
              </Link>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-3">
                <Heart className="h-8 w-8 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  {loading ? 'Loading...' : stats.following > 0 ? `Following ${stats.following} organizers` : 'Not following any organizers yet'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
