import * as React from 'react';
import NextLink, { LinkProps as NextLinkProps } from 'next/link';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const linkVariants = cva('transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-sm', {
  variants: {
    variant: {
      default: 'text-primary hover:underline',
      muted: 'text-muted-foreground hover:text-foreground',
      foreground: 'text-foreground hover:text-primary',
      underline: 'text-primary underline hover:no-underline',
    },
    size: {
      sm: 'text-sm',
      base: 'text-base',
      lg: 'text-lg',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'base',
  },
});

export interface LinkProps
  extends Omit<NextLinkProps, 'as'>,
    Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>,
    VariantProps<typeof linkVariants> {
  external?: boolean;
}

const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(
  ({ className, variant, size, external, children, href, ...props }, ref) => {
    if (external) {
      return (
        <a
          ref={ref}
          href={href as string}
          className={cn(linkVariants({ variant, size, className }))}
          target="_blank"
          rel="noopener noreferrer"
          {...props}
        >
          {children}
        </a>
      );
    }
    
    return (
      <NextLink
        ref={ref}
        href={href}
        className={cn(linkVariants({ variant, size, className }))}
        {...props}
      >
        {children}
      </NextLink>
    );
  }
);

Link.displayName = 'Link';

export { Link, linkVariants };

