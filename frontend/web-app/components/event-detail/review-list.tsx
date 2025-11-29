'use client';

import { useState, useEffect, useCallback } from 'react';
import { StarRating, RatingDistribution } from './star-rating';
import { ReviewForm } from './review-form';
import { Button } from '@/components/ui/button';
import {
  EventReview,
  ReviewsSummary,
  fetchEventReviews,
  fetchEventReviewsSummary,
  deleteEventReview,
} from '@/lib/events';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'react-hot-toast';
import { Pencil, Trash2, User, ChevronDown, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReviewListProps {
  eventId: string;
  currentUserId?: string;
  token?: string;
  className?: string;
}

export function ReviewList({
  eventId,
  currentUserId,
  token,
  className,
}: ReviewListProps) {
  const [reviews, setReviews] = useState<EventReview[]>([]);
  const [summary, setSummary] = useState<ReviewsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [editingReview, setEditingReview] = useState<EventReview | null>(null);
  const limit = 10;

  const userReview = reviews.find((r) => r.userId === currentUserId);
  const canWriteReview = token && currentUserId && !userReview && !showReviewForm;

  const loadReviews = useCallback(async () => {
    setLoading(true);
    const result = await fetchEventReviews(eventId, {
      page,
      limit,
      token,
    });

    setReviews((prev) => {
      const merged = page === 1 ? result.data : [...prev, ...result.data];
      const totalCount = merged.length;
      setHasMore(
        result.data.length === limit && totalCount < result.total,
      );
      return merged;
    });

    setTotal(result.total);
    setLoading(false);
  }, [eventId, page, token]);

  const loadSummary = useCallback(async () => {
    const summaryData = await fetchEventReviewsSummary(eventId);
    setSummary(summaryData);
  }, [eventId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadReviews();
      void loadSummary();
    }, 0);
    return () => clearTimeout(timer);
  }, [eventId, page, loadReviews, loadSummary]);

  const handleReviewSuccess = () => {
    setShowReviewForm(false);
    setEditingReview(null);
    setPage(1);
    loadReviews();
    loadSummary();
  };

  const handleEditReview = (review: EventReview) => {
    setEditingReview(review);
    setShowReviewForm(true);
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!token) return;

    if (!confirm('Are you sure you want to delete this review?')) {
      return;
    }

    try {
      await deleteEventReview(eventId, reviewId, token);
      toast.success('Review deleted successfully');
      setPage(1);
      loadReviews();
      loadSummary();
    } catch (error) {
      toast.error('Failed to delete review');
    }
  };

  const handleLoadMore = () => {
    setPage((prev) => prev + 1);
  };

  if (loading && page === 1) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className={cn('space-y-8', className)}>
      {/* Summary Section */}
      {summary && summary.totalReviews > 0 && (
        <div className="grid md:grid-cols-2 gap-8 pb-8 border-b">
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-end gap-3">
                <span className="text-5xl font-bold">{summary.averageRating.toFixed(1)}</span>
                <span className="text-muted-foreground text-lg mb-1">out of 5</span>
              </div>
              <StarRating rating={summary.averageRating} size="lg" />
              <p className="text-sm text-muted-foreground">
                Based on {summary.totalReviews} review{summary.totalReviews !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          <div>
            <RatingDistribution
              distribution={summary.ratingDistribution}
              total={summary.totalReviews}
            />
          </div>
        </div>
      )}

      {/* Write Review Section */}
      {canWriteReview && (
        <div className="pb-8 border-b">
          <Button
            onClick={() => setShowReviewForm(true)}
            variant="primary"
            className="w-full md:w-auto"
          >
            Write a Review
          </Button>
        </div>
      )}

      {/* Review Form */}
      {showReviewForm && token && (
        <div className="pb-8 border-b">
          <h3 className="text-lg font-semibold mb-4">
            {editingReview ? 'Edit Your Review' : 'Write a Review'}
          </h3>
          <ReviewForm
            eventId={eventId}
            existingReview={editingReview || undefined}
            token={token}
            onSuccess={handleReviewSuccess}
            onCancel={() => {
              setShowReviewForm(false);
              setEditingReview(null);
            }}
          />
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-6">
        {reviews.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No reviews yet</p>
            {!token && (
              <p className="text-sm text-muted-foreground mt-2">
                Reviews will be available after the event has taken place.
              </p>
            )}
          </div>
        ) : (
          <>
            {reviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                canEdit={currentUserId === review.userId}
                onEdit={() => handleEditReview(review)}
                onDelete={() => handleDeleteReview(review.id)}
              />
            ))}

            {hasMore && (
              <div className="flex justify-center pt-4">
                <Button
                  variant="outline"
                  onClick={handleLoadMore}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4 mr-2" />
                      Load More Reviews
                    </>
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

interface ReviewCardProps {
  review: EventReview;
  canEdit: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

function ReviewCard({ review, canEdit, onEdit, onDelete }: ReviewCardProps) {
  const timeAgo = formatDistanceToNow(new Date(review.createdAt), { addSuffix: true });
  const wasEdited = review.updatedAt !== review.createdAt;

  return (
    <div className="border rounded-lg p-6 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <User className="h-5 w-5 text-primary" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-medium text-foreground">{review.user.name}</p>
              <span className="text-sm text-muted-foreground">•</span>
              <p className="text-sm text-muted-foreground">
                {timeAgo}
                {wasEdited && ' (edited)'}
              </p>
            </div>
            <StarRating rating={review.rating} size="sm" className="mt-1" />
          </div>
        </div>

        {canEdit && (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onEdit}
              className="h-8 w-8 p-0"
            >
              <Pencil className="h-4 w-4" />
              <span className="sr-only">Edit review</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Delete review</span>
            </Button>
          </div>
        )}
      </div>

      {review.comment && (
        <p className="text-foreground leading-relaxed whitespace-pre-wrap">
          {review.comment}
        </p>
      )}
    </div>
  );
}
