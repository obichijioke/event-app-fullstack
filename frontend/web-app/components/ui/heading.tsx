import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const headingVariants = cva('font-bold text-foreground', {
  variants: {
    level: {
      h1: 'text-5xl',
      h2: 'text-4xl',
      h3: 'text-3xl font-semibold',
      h4: 'text-2xl font-semibold',
      h5: 'text-xl font-semibold',
      h6: 'text-lg font-semibold',
    },
  },
  defaultVariants: {
    level: 'h2',
  },
});

export interface HeadingProps
  extends React.HTMLAttributes<HTMLHeadingElement>,
    VariantProps<typeof headingVariants> {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

const Heading = React.forwardRef<HTMLHeadingElement, HeadingProps>(
  ({ className, level, as, children, ...props }, ref) => {
    const Component = as || level || 'h2';
    
    return (
      <Component
        ref={ref}
        className={cn(headingVariants({ level: level || as, className }))}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

Heading.displayName = 'Heading';

export { Heading, headingVariants };

