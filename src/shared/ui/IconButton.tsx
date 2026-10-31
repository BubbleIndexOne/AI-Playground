import { ButtonHTMLAttributes, forwardRef, ReactNode } from 'react';
import { ButtonSize, ButtonVariant } from './Button';
import { Spinner } from './Spinner';

export interface IconButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly 'aria-label': string;
  readonly icon: ReactNode;
  readonly variant?: ButtonVariant;
  readonly size?: ButtonSize;
  readonly loading?: boolean;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-accent-fg hover:bg-accent-hover',
  secondary:
    'bg-card text-secondary hover:text-primary border border-subtle hover:bg-hover',
  ghost:
    'bg-transparent text-secondary hover:text-primary hover:bg-hover',
  danger:
    'bg-transparent text-danger hover:bg-danger-tint',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'h-7 w-7 rounded-lg',
  md: 'h-8 w-8 rounded-lg',
  lg: 'h-9 w-9 rounded-lg',
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  function IconButton(
    {
      icon,
      variant = 'ghost',
      size = 'md',
      loading = false,
      disabled,
      className = '',
      type = 'button',
      ...rest
    },
    ref
  ) {
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        className={`inline-flex items-center justify-center shrink-0 transition-colors duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-45 disabled:pointer-events-none cursor-pointer ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`}
        {...rest}
      >
        {loading ? <Spinner size={15} /> : icon}
      </button>
    );
  }
);
