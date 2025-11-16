import * as React from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'w-full px-3 py-2 bg-input rounded-md text-foreground placeholder:text-muted-foreground transition-colors duration-200 focus:outline-none resize-none disabled:bg-muted disabled:cursor-not-allowed disabled:opacity-60',
          error
            ? 'border-2 border-error focus:ring-2 focus:ring-error focus:border-transparent'
            : 'border border-border focus:ring-2 focus:ring-primary focus:border-transparent',
          className
        )}
        ref={ref}
        aria-invalid={error ? 'true' : undefined}
        {...props}
      />
    );
  }
);

Textarea.displayName = 'Textarea';

export { Textarea };

