import * as React from 'react';
import { cn } from '@/lib/utils';

export interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  onCheckedChange?: (checked: boolean) => void;
}

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, label, id, checked, onCheckedChange, onChange, ...props }, ref) => {
    const autoId = React.useId();
    const switchId = id ?? `switch-${autoId}`;
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange?.(e);
      onCheckedChange?.(e.target.checked);
    };
    
    const switchElement = (
      <label
        htmlFor={switchId}
        className={cn(
          'relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer',
          checked ? 'bg-primary' : 'bg-muted',
          props.disabled && 'opacity-50 cursor-not-allowed',
          className
        )}
      >
        <input
          type="checkbox"
          id={switchId}
          ref={ref}
          className="sr-only"
          checked={checked}
          onChange={handleChange}
          {...props}
        />
        <span
          className={cn(
            'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
            checked ? 'translate-x-6' : 'translate-x-1'
          )}
        />
      </label>
    );
    
    if (label) {
      return (
        <div className="flex items-center space-x-3">
          {switchElement}
          <label
            htmlFor={switchId}
            className="text-sm font-medium text-foreground cursor-pointer select-none"
          >
            {label}
          </label>
        </div>
      );
    }
    
    return switchElement;
  }
);

Switch.displayName = 'Switch';

export { Switch };
