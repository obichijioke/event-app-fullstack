'use client';

import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: 'sm' | 'md' | 'lg';
  showNumber?: boolean;
  interactive?: boolean;
  onChange?: (rating: number) => void;
  className?: string;
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
};

export function StarRating({
  rating,
  maxRating = 5,
  size = 'md',
  showNumber = false,
  interactive = false,
  onChange,
  className,
}: StarRatingProps) {
  const handleClick = (value: number) => {
    if (interactive && onChange) {
      onChange(value);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, value: number) => {
    if (interactive && onChange && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onChange(value);
    }
  };

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <div className="flex items-center gap-0.5">
        {Array.from({ length: maxRating }, (_, i) => {
          const starValue = i + 1;
          const isFilled = starValue <= Math.round(rating);
          const isPartial = starValue === Math.ceil(rating) && rating % 1 !== 0;

          return (
            <div
              key={i}
              className={cn(
                'relative',
                interactive && 'cursor-pointer transition-transform hover:scale-110'
              )}
              onClick={() => handleClick(starValue)}
              onKeyDown={(e) => handleKeyDown(e, starValue)}
              role={interactive ? 'button' : undefined}
              tabIndex={interactive ? 0 : undefined}
              aria-label={`${starValue} star${starValue > 1 ? 's' : ''}`}
            >
              {/* Background star (empty) */}
              <Star
                className={cn(
                  sizeClasses[size],
                  'text-muted-foreground',
                  interactive && 'transition-colors'
                )}
                strokeWidth={1.5}
              />

              {/* Filled star overlay */}
              {(isFilled || isPartial) && (
                <Star
                  className={cn(
                    sizeClasses[size],
                    'absolute left-0 top-0 text-amber-500 fill-amber-500',
                    interactive && 'transition-colors'
                  )}
                  strokeWidth={1.5}
                  style={{
                    clipPath: isPartial
                      ? `inset(0 ${100 - (rating % 1) * 100}% 0 0)`
                      : undefined,
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      {showNumber && (
        <span className="text-sm font-medium text-foreground">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
}

interface RatingDistributionProps {
  distribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  total: number;
  className?: string;
}

export function RatingDistribution({
  distribution,
  total,
  className,
}: RatingDistributionProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {[5, 4, 3, 2, 1].map((stars) => {
        const count = distribution[stars as keyof typeof distribution];
        const percentage = total > 0 ? (count / total) * 100 : 0;

        return (
          <div key={stars} className="flex items-center gap-3">
            <div className="flex items-center gap-1 w-12">
              <span className="text-sm font-medium">{stars}</span>
              <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
            </div>

            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 transition-all"
                style={{ width: `${percentage}%` }}
              />
            </div>

            <span className="text-sm text-muted-foreground w-12 text-right">
              {count}
            </span>
          </div>
        );
      })}
    </div>
  );
}
