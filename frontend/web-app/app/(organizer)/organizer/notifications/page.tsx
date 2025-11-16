'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { NotificationList } from '@/components/organizer/notifications/notification-list';
import { NotificationStats } from '@/components/organizer/notifications/notification-stats';
import { NotificationCategory } from '@/lib/types/organizer';

export default function NotificationsPage() {
  const [selectedCategory, setSelectedCategory] = useState<NotificationCategory | 'all'>('all');

  const handleCategoryClick = (category: NotificationCategory) => {
    setSelectedCategory(category);
    // Scroll to notifications list
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link
            href="/organizer"
            className="p-2 hover:bg-secondary rounded-md transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Notifications</h1>
            <p className="text-muted-foreground mt-1">
              Stay updated with your latest notifications
            </p>
          </div>
        </div>
      </div>

      {/* Category Stats Widget */}
      <div className="mb-8">
        <NotificationStats onCategoryClick={handleCategoryClick} />
      </div>

      {/* Notification List */}
      <NotificationList />
    </div>
  );
}
