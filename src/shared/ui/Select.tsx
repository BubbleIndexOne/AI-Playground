import { ChevronDown } from 'lucide-react';
import { forwardRef, SelectHTMLAttributes } from 'react';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  readonly mono?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  function Select({ mono = false, className = '', children, ...rest }, ref) {
    return (
      <div className="relative inline-flex items-center w-full">
        <select
          ref={ref}
          className={`w-full h-8 appearance-none rounded-lg bg-app border border-subtle hover:border-strong px-3 pr-8 text-[13px] text-primary transition-colors duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-accent disabled:opacity-50 cursor-pointer ${
            mono ? 'font-mono text-[12px]' : ''
          } ${className}`}
          {...rest}
        >
          {children}
        </select>
        <ChevronDown
          size={14}
          className="absolute right-2.5 text-muted pointer-events-none"
          aria-hidden="true"
        />
      </div>
    );
  }
);
