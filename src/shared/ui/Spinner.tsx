import { Loader2 } from 'lucide-react';

interface SpinnerProps {
  readonly size?: number;
  readonly className?: string;
}

export function Spinner({ size = 16, className = '' }: SpinnerProps) {
  return (
    <Loader2
      size={size}
      className={`animate-spin shrink-0 ${className}`}
      aria-hidden="true"
    />
  );
}
