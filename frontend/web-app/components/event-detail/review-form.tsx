'use client';

import { useState } from 'react';
import { StarRating } from './star-rating';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { createEventReview, updateEventReview } from '@/lib/events';
import { toast } from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

interface ReviewFormProps {
  eventId: string;
  existingReview?: {
    id: string;
    rating: number;
    comment?: string | null;
  };
  token: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ReviewForm({
  eventId,
  existingReview,
  token,
  onSuccess,
  onCancel,
}: ReviewFormProps) {
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [comment, setComment] = useState(existingReview?.comment || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    setIsSubmitting(true);

    try {
      if (existingReview) {
        // Update existing review
        await updateEventReview(
          eventId,
          existingReview.id,
          { rating, comment: comment.trim() || undefined },
          token
        );
        toast.success('Review updated successfully');
      } else {
        // Create new review
        await createEventReview(
          eventId,
          { rating, comment: comment.trim() || undefined },
          token
        );
        toast.success('Review submitted successfully');
      }

      onSuccess?.();
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Failed to submit review. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          Your Rating <span className="text-red-500">*</span>
        </label>
        <StarRating
          rating={rating}
          interactive
          onChange={setRating}
          size="lg"
          className="gap-2"
        />
        {rating > 0 && (
          <p className="text-sm text-muted-foreground">
            {rating === 1 && 'Poor'}
            {rating === 2 && 'Fair'}
            {rating === 3 && 'Good'}
            {rating === 4 && 'Very Good'}
            {rating === 5 && 'Excellent'}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="comment" className="text-sm font-medium text-foreground">
          Your Review (Optional)
        </label>
        <Textarea
          id="comment"
          placeholder="Share your experience with this event..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={5}
          maxLength={1000}
          className="resize-none"
        />
        <p className="text-xs text-muted-foreground text-right">
          {comment.length}/1000 characters
        </p>
      </div>

      <div className="flex gap-3">
        <Button
          type="submit"
          disabled={isSubmitting || rating === 0}
          className="flex-1"
        >
          {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {existingReview ? 'Update Review' : 'Submit Review'}
        </Button>

        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
