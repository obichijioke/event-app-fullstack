import * as React from 'react';
import { cn } from '@/lib/utils';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
  options?: Array<{ value: string; label: string; disabled?: boolean }>;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, options, children, ...props }, ref) => {
    return (
      <select
        className={cn(
          'w-full px-3 py-2 bg-input rounded-md text-foreground transition-colors duration-200 focus:outline-none disabled:bg-muted disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer',
          error
            ? 'border-2 border-error focus:ring-2 focus:ring-error focus:border-transparent'
            : 'border border-border focus:ring-2 focus:ring-primary focus:border-transparent',
          className
        )}
        ref={ref}
        aria-invalid={error ? 'true' : undefined}
        {...props}
      >
        {options
          ? options.map((option) => (
              <option key={option.value} value={option.value} disabled={option.disabled}>
                {option.label}
              </option>
            ))
          : children}
      </select>
    );
  }
);

Select.displayName = 'Select';

export { Select };

