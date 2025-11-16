import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical';
}

const ButtonGroup = React.forwardRef<HTMLDivElement, ButtonGroupProps>(
  ({ className, orientation = 'horizontal', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex',
          orientation === 'horizontal' ? 'flex-row' : 'flex-col',
          '[&>button]:rounded-none',
          '[&>button:first-child]:rounded-l-md',
          '[&>button:last-child]:rounded-r-md',
          orientation === 'vertical' && '[&>button:first-child]:rounded-t-md [&>button:first-child]:rounded-l-none',
          orientation === 'vertical' && '[&>button:last-child]:rounded-b-md [&>button:last-child]:rounded-r-none',
          '[&>button:not(:last-child)]:-mr-px',
          orientation === 'vertical' && '[&>button:not(:last-child)]:-mb-px [&>button:not(:last-child)]:mr-0',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

ButtonGroup.displayName = 'ButtonGroup';

export { ButtonGroup };

