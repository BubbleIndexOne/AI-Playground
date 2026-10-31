import { ReactNode } from 'react';

interface TooltipProps {
  readonly content: string;
  readonly children: ReactNode;
  readonly side?: 'top' | 'right';
  readonly className?: string;
}

export function Tooltip({
  content,
  children,
  side = 'top',
  className = '',
}: TooltipProps) {
  const positionClasses =
    side === 'right'
      ? 'left-full top-1/2 -translate-y-1/2 ml-2'
      : 'bottom-full left-1/2 -translate-x-1/2 mb-1.5';

  return (
    <span className={`group relative inline-flex items-center justify-center ${className}`}>
      {children}
      <span
        role="tooltip"
        className={`pointer-events-none absolute ${positionClasses} hidden group-hover:block group-focus-within:block z-50 rounded-md border border-subtle bg-raised px-2 py-1 text-[11px] font-medium text-primary whitespace-nowrap shadow-raised`}
      >
        {content}
      </span>
    </span>
  );
}
