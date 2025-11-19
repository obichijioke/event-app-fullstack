'use client';

import * as React from 'react';
import { DataTable, FiltersPanel } from '@/components/admin';
import { Text, Button } from '@/components/ui';
import { adminApiService, type AdminEventReview, type AdminOrganizerReview } from '@/services/admin-api.service';
import { useAuth } from '@/components/auth';
import { cn } from '@/lib/utils';

interface ReviewListProps {
  className?: string;
}

type ReviewType = 'event' | 'organizer';

export function ReviewList({ className }: ReviewListProps) {
  const { accessToken } = useAuth();
  const [reviewType, setReviewType] = React.useState<ReviewType>('event');
  const [eventReviews, setEventReviews] = React.useState<AdminEventReview[]>([]);
  const [organizerReviews, setOrganizerReviews] = React.useState<AdminOrganizerReview[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [pagination, setPagination] = React.useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });
  const [filters, setFilters] = React.useState<Record<string, unknown>>({});
  const [sorting, setSorting] = React.useState({
    field: 'createdAt' as string,
    direction: 'desc' as 'asc' | 'desc',
  });

  React.useEffect(() => {
    if (!accessToken) return;
    loadReviews();
  }, [accessToken, filters, sorting, pagination.page, reviewType]);

  const loadReviews = async () => {
    if (!accessToken) return;

    setLoading(true);
    try {
      if (reviewType === 'event') {
        const response = await adminApiService.getEventReviews(accessToken, {
          page: pagination.page,
          limit: pagination.limit,
          search: filters.search as string,
          sortBy: sorting.field as string,
          sortOrder: sorting.direction,
        });

        if (response.success && response.data) {
          setEventReviews(response.data.data);
          setPagination(prev => ({
            ...prev,
            total: response.data.pagination.total,
            totalPages: response.data.pagination.totalPages,
          }));
        }
      } else {
        const response = await adminApiService.getOrganizerReviews(accessToken, {
          page: pagination.page,
          limit: pagination.limit,
          search: filters.search as string,
          sortBy: sorting.field as string,
          sortOrder: sorting.direction,
        });

        if (response.success && response.data) {
          setOrganizerReviews(response.data.data);
          setPagination(prev => ({
            ...prev,
            total: response.data.pagination.total,
            totalPages: response.data.pagination.totalPages,
          }));
        }
      }
    } catch (error) {
      console.error('Failed to load reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEventReview = async (review: AdminEventReview) => {
    if (!accessToken) return;
    if (!confirm('Are you sure you want to delete this review?')) return;

    try {
      await adminApiService.deleteEventReview(review.id, accessToken);
      alert('Review deleted successfully');
      loadReviews();
    } catch (error) {
      console.error('Failed to delete review:', error);
      alert('Failed to delete review');
    }
  };

  const handleDeleteOrganizerReview = async (review: AdminOrganizerReview) => {
    if (!accessToken) return;
    if (!confirm('Are you sure you want to delete this review?')) return;

    try {
      await adminApiService.deleteOrganizerReview(review.id, accessToken);
      alert('Review deleted successfully');
      loadReviews();
    } catch (error) {
      console.error('Failed to delete review:', error);
      alert('Failed to delete review');
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <span key={i} className={i < rating ? 'text-yellow-500' : 'text-gray-300'}>
            ★
          </span>
        ))}
      </div>
    );
  };

  const eventColumns = [
    {
      key: 'eventTitle',
      title: 'Event',
      sortable: true,
      render: (value: unknown, review: AdminEventReview) => (
        <Text className="font-medium">{review.eventTitle}</Text>
      ),
    },
    {
      key: 'userName',
      title: 'Reviewer',
      sortable: true,
      render: (value: unknown, review: AdminEventReview) => (
        <div className="flex flex-col gap-1">
          <Text className="font-medium">{review.userName}</Text>
          <Text className="text-xs text-muted-foreground">{review.userEmail}</Text>
        </div>
      ),
    },
    {
      key: 'rating',
      title: 'Rating',
      sortable: true,
      render: (value: unknown, review: AdminEventReview) => renderStars(review.rating),
    },
    {
      key: 'comment',
      title: 'Comment',
      render: (value: unknown, review: AdminEventReview) => (
        <Text className="line-clamp-2">{review.comment || '—'}</Text>
      ),
    },
    {
      key: 'createdAt',
      title: 'Date',
      sortable: true,
      render: (value: unknown, review: AdminEventReview) => (
        <Text>{new Date(review.createdAt).toLocaleDateString()}</Text>
      ),
    },
  ];

  const organizerColumns = [
    {
      key: 'orgName',
      title: 'Organizer',
      sortable: true,
      render: (value: unknown, review: AdminOrganizerReview) => (
        <Text className="font-medium">{review.orgName}</Text>
      ),
    },
    {
      key: 'userName',
      title: 'Reviewer',
      sortable: true,
      render: (value: unknown, review: AdminOrganizerReview) => (
        <div className="flex flex-col gap-1">
          <Text className="font-medium">{review.userName}</Text>
          <Text className="text-xs text-muted-foreground">{review.userEmail}</Text>
        </div>
      ),
    },
    {
      key: 'rating',
      title: 'Rating',
      sortable: true,
      render: (value: unknown, review: AdminOrganizerReview) => renderStars(review.rating),
    },
    {
      key: 'comment',
      title: 'Comment',
      render: (value: unknown, review: AdminOrganizerReview) => (
        <Text className="line-clamp-2">{review.comment || '—'}</Text>
      ),
    },
    {
      key: 'createdAt',
      title: 'Date',
      sortable: true,
      render: (value: unknown, review: AdminOrganizerReview) => (
        <Text>{new Date(review.createdAt).toLocaleDateString()}</Text>
      ),
    },
  ];

  return (
    <div className={cn('space-y-6', className)}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Review Management</h1>
          <p className="text-muted-foreground mt-1">Monitor and moderate event and organizer reviews</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={reviewType === 'event' ? 'primary' : 'secondary'}
            onClick={() => setReviewType('event')}
          >
            Event Reviews
          </Button>
          <Button
            variant={reviewType === 'organizer' ? 'primary' : 'secondary'}
            onClick={() => setReviewType('organizer')}
          >
            Organizer Reviews
          </Button>
        </div>
      </div>

      {reviewType === 'event' ? (
        <DataTable<AdminEventReview>
          data={eventReviews}
          columns={eventColumns}
          loading={loading}
          pagination={{
            ...pagination,
            onPageChange: (page) => setPagination(prev => ({ ...prev, page })),
          }}
          sorting={{
            ...sorting,
            onSort: (field) => {
              setSorting(prev => ({
                field,
                direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc',
              }));
            },
          }}
          actions={[
            {
              label: 'Delete',
              variant: 'destructive' as const,
              onClick: handleDeleteEventReview,
            },
          ]}
        />
      ) : (
        <DataTable<AdminOrganizerReview>
          data={organizerReviews}
          columns={organizerColumns}
          loading={loading}
          pagination={{
            ...pagination,
            onPageChange: (page) => setPagination(prev => ({ ...prev, page })),
          }}
          sorting={{
            ...sorting,
            onSort: (field) => {
              setSorting(prev => ({
                field,
                direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc',
              }));
            },
          }}
          actions={[
            {
              label: 'Delete',
              variant: 'destructive' as const,
              onClick: handleDeleteOrganizerReview,
            },
          ]}
        />
      )}
    </div>
  );
}
