import { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  readonly children: ReactNode;
  readonly interactive?: boolean;
  readonly padding?: 'none' | 'sm' | 'md' | 'lg';
}

const PADDING_MAP = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
};

export function Card({
  children,
  interactive = false,
  padding = 'md',
  className = '',
  ...rest
}: CardProps) {
  return (
    <div
      className={`rounded-xl border border-subtle bg-card shadow-card transition-colors duration-150 ease-out ${
        interactive ? 'hover:border-accent-border' : ''
      } ${PADDING_MAP[padding]} ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}
