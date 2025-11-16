import * as React from 'react';
import { cn } from '@/lib/utils';

export interface RadioProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

const Radio = React.forwardRef<HTMLInputElement, RadioProps>(
  ({ className, label, id, ...props }, ref) => {
    const autoId = React.useId();
    const radioId = id ?? `radio-${autoId}`;
    
    if (label) {
      return (
        <div className="flex items-center space-x-2">
          <input
            type="radio"
            id={radioId}
            ref={ref}
            className={cn(
              'w-4 h-4 border-border text-primary focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50',
              className
            )}
            {...props}
          />
          <label
            htmlFor={radioId}
            className="text-sm font-medium text-foreground cursor-pointer select-none"
          >
            {label}
          </label>
        </div>
      );
    }
    
    return (
      <input
        type="radio"
        id={radioId}
        ref={ref}
        className={cn(
          'w-4 h-4 border-border text-primary focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        {...props}
      />
    );
  }
);

Radio.displayName = 'Radio';

export { Radio };
