'use client';

import { Star } from 'lucide-react';
import type { Review } from '@/lib/types/organizer';

interface ReviewsSectionProps {
  averageRating: number;
  total: number;
  reviews: Review[];
}

export function ReviewsSection({ averageRating, total, reviews }: ReviewsSectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Star className="w-8 h-8 fill-amber-400 text-amber-400" />
          <div>
            <p className="text-3xl font-bold">{averageRating.toFixed(1)}</p>
            <p className="text-sm text-muted-foreground">{total} reviews</p>
          </div>
        </div>
      </div>

      <div className="space-y-4 mt-6">
        <h4 className="font-semibold">Recent Reviews</h4>
        {reviews.length === 0 ? (
          <p className="text-muted-foreground text-sm">No reviews yet</p>
        ) : (
          <div className="space-y-3">
            {reviews.map((review) => (
              <div key={review.id} className="border border-border rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium">{review.user.name}</p>
                    <div className="flex items-center gap-1 mt-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < review.rating
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </p>
                </div>
                {review.comment && (
                  <p className="text-sm text-muted-foreground mt-2">{review.comment}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
