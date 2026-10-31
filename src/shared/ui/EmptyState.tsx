import { Inbox } from 'lucide-react';
import { ReactNode } from 'react';
import { Button } from './Button';

export interface EmptyStateProps {
  readonly icon?: ReactNode;
  readonly title: string;
  readonly description: string;
  readonly actionLabel?: string;
  readonly onAction?: () => void;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="rounded-xl border border-subtle bg-card shadow-card py-14 px-6 text-center">
      <div className="max-w-sm mx-auto flex flex-col items-center space-y-3">
        <div className="h-11 w-11 rounded-full bg-raised border border-subtle flex items-center justify-center text-secondary">
          {icon ?? <Inbox size={20} strokeWidth={1.75} />}
        </div>
        <div className="space-y-1">
          <h3 className="text-[16px] font-semibold text-primary">{title}</h3>
          <p className="text-[13px] text-secondary leading-relaxed">
            {description}
          </p>
        </div>
        {actionLabel && onAction && (
          <div className="pt-2">
            <Button variant="primary" size="md" onClick={onAction}>
              {actionLabel}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
