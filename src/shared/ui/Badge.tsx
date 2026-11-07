import { ReactNode } from 'react';
import { ToolStatus } from '../../domain/enums';
import { SemanticVariant, TOOL_STATUS_META } from './theme/tokens';

interface BadgeProps {
  readonly variant?: SemanticVariant;
  readonly mono?: boolean;
  readonly children: ReactNode;
  readonly className?: string;
  readonly onClick?: () => void;
}

const VARIANT_CLASSES: Record<SemanticVariant, string> = {
  neutral: 'bg-raised text-secondary border-subtle',
  info: 'bg-info-tint text-info border-info-border',
  success: 'bg-success-tint text-success border-success-border',
  warning: 'bg-warning-tint text-warning border-warning-border',
  danger: 'bg-danger-tint text-danger border-danger-border',
  muted: 'bg-app text-muted border-subtle',
};

export function Badge({
  variant = 'neutral',
  mono = false,
  children,
  className = '',
  onClick,
}: BadgeProps) {
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[12px] font-medium leading-4 whitespace-nowrap shrink-0 transition-opacity hover:opacity-80 focus:outline-none cursor-pointer ${
          VARIANT_CLASSES[variant]
        } ${mono ? 'font-mono' : ''} ${className}`}
      >
        {children}
      </button>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[12px] font-medium leading-4 whitespace-nowrap shrink-0 ${
        VARIANT_CLASSES[variant]
      } ${mono ? 'font-mono' : ''} ${className}`}
    >
      {children}
    </span>
  );
}

export function ToolStatusBadge({ status }: { readonly status: ToolStatus }) {
  const meta = TOOL_STATUS_META[status] ?? {
    label: status,
    variant: 'neutral' as const,
  };
  return <Badge variant={meta.variant}>{meta.label}</Badge>;
}
