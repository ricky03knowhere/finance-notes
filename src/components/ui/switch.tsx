'use client';

import * as React from 'react';

import { cn } from '@/lib/utils';

export interface SwitchProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, type, ...props }, ref) => (
    <input
      ref={ref}
      type="checkbox"
      role="switch"
      className={cn(
        'peer h-6 w-11 cursor-pointer appearance-none rounded-full border border-border bg-muted/30 transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
        'checked:border-primary checked:bg-primary',
        className,
      )}
      {...props}
    />
  ),
);

Switch.displayName = 'Switch';
