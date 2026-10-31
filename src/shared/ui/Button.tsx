import { ButtonHTMLAttributes, forwardRef, ReactNode } from 'react';
import { Spinner } from './Spinner';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly variant?: ButtonVariant;
  readonly size?: ButtonSize;
  readonly loading?: boolean;
  readonly icon?: ReactNode;
  readonly iconOnly?: boolean;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'bg-accent text-accent-fg hover:bg-accent-hover active:opacity-95 border border-transparent',
  secondary:
    'bg-card text-primary border border-subtle hover:bg-hover hover:border-strong active:bg-raised shadow-card',
  ghost:
    'bg-transparent text-secondary hover:text-primary hover:bg-hover active:bg-raised border border-transparent',
  danger:
    'bg-danger-tint text-danger border border-danger-border hover:bg-danger hover:text-white active:opacity-95',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'h-7 px-2.5 text-[12px] gap-1.5 rounded-lg',
  md: 'h-8 px-3.5 text-[13px] gap-2 rounded-lg',
  lg: 'h-9 px-4 text-[14px] gap-2 rounded-lg',
};

const ICON_ONLY_SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'h-7 w-7 rounded-lg',
  md: 'h-8 w-8 rounded-lg',
  lg: 'h-9 w-9 rounded-lg',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      icon,
      iconOnly = false,
      disabled,
      className = '',
      children,
      type = 'button',
      ...rest
    },
    ref
  ) {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        className={`inline-flex items-center justify-center font-medium whitespace-nowrap shrink-0 transition-all duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-45 disabled:pointer-events-none cursor-pointer ${
          VARIANT_CLASSES[variant]
        } ${
          iconOnly ? ICON_ONLY_SIZE_CLASSES[size] : SIZE_CLASSES[size]
        } ${className}`}
        {...rest}
      >
        {loading ? <Spinner size={15} /> : icon}
        {!iconOnly && children}
      </button>
    );
  }
);
