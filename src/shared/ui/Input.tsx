import { forwardRef, InputHTMLAttributes, ReactNode } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  readonly leftIcon?: ReactNode;
  readonly mono?: boolean;
  readonly hasError?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { leftIcon, mono = false, hasError = false, className = '', ...rest },
  ref
) {
  return (
    <div className="relative flex items-center w-full">
      {leftIcon && (
        <span className="absolute left-3 text-muted pointer-events-none flex items-center">
          {leftIcon}
        </span>
      )}
      <input
        ref={ref}
        className={`w-full h-8 rounded-lg bg-app border ${
          hasError
            ? 'border-danger focus-visible:outline-danger'
            : 'border-subtle hover:border-strong focus-visible:outline-accent'
        } px-3 text-[13px] text-primary placeholder:text-muted transition-colors duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-0 disabled:opacity-50 ${
          leftIcon ? 'pl-9' : ''
        } ${mono ? 'font-mono text-[12px]' : ''} ${className}`}
        {...rest}
      />
    </div>
  );
});
