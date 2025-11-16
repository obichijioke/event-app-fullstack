import * as React from 'react';
import Image from 'next/image';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { getInitials } from '@/lib/utils';

const avatarVariants = cva(
  'relative inline-flex items-center justify-center overflow-hidden rounded-full bg-muted text-muted-foreground font-medium select-none',
  {
    variants: {
      size: {
        sm: 'w-8 h-8 text-xs',
        md: 'w-10 h-10 text-sm',
        lg: 'w-12 h-12 text-base',
        xl: 'w-16 h-16 text-lg',
        '2xl': 'w-24 h-24 text-2xl',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
);

export interface AvatarProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof avatarVariants> {
  src?: string;
  alt?: string;
  name?: string;
  fallback?: string;
}

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, size, src, alt, name, fallback, ...props }, ref) => {
    const displayFallback = fallback || (name ? getInitials(name) : '?');

    return (
      <div
        ref={ref}
        className={cn(avatarVariants({ size, className }))}
        {...props}
      >
        {src ? (
          <Image
            src={src}
            alt={alt || name || 'Avatar'}
            fill
            sizes="100%"
            className="object-cover"
          />
        ) : (
          <span>{displayFallback}</span>
        )}
      </div>
    );
  },
);

Avatar.displayName = 'Avatar';

export { Avatar, avatarVariants };
