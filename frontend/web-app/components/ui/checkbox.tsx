import * as React from 'react';
import { cn } from '@/lib/utils';

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, id, ...props }, ref) => {
    const autoId = React.useId();
    const checkboxId = id ?? `checkbox-${autoId}`;
    
    if (label) {
      return (
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id={checkboxId}
            ref={ref}
            className={cn(
              'w-4 h-4 border-border rounded text-primary focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50',
              className
            )}
            {...props}
          />
          <label
            htmlFor={checkboxId}
            className="text-sm font-medium text-foreground cursor-pointer select-none"
          >
            {label}
          </label>
        </div>
      );
    }
    
    return (
      <input
        type="checkbox"
        id={checkboxId}
        ref={ref}
        className={cn(
          'w-4 h-4 border-border rounded text-primary focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        {...props}
      />
    );
  }
);

Checkbox.displayName = 'Checkbox';

export { Checkbox };
