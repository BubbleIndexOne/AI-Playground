import { X } from 'lucide-react';
import { ReactNode, useEffect } from 'react';
import { IconButton } from './IconButton';

interface DrawerProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly title: string;
  readonly description?: string;
  readonly width?: 'md' | 'lg' | 'xl';
  readonly children: ReactNode;
  readonly footer?: ReactNode;
}

const WIDTH_MAP = {
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-3xl',
};

export function Drawer({
  open,
  onClose,
  title,
  description,
  width = 'lg',
  children,
  footer,
}: DrawerProps) {
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/60"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`w-full ${WIDTH_MAP[width]} h-full bg-card border-l border-subtle shadow-raised flex flex-col`}
      >
        <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-subtle shrink-0">
          <div className="space-y-0.5 min-w-0">
            <h2 className="text-[16px] font-semibold text-primary truncate">
              {title}
            </h2>
            {description && (
              <p className="text-[13px] text-secondary">{description}</p>
            )}
          </div>
          <IconButton
            aria-label="Close drawer"
            icon={<X size={16} />}
            size="sm"
            onClick={onClose}
          />
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">{children}</div>

        {footer && (
          <div className="px-6 py-4 border-t border-subtle bg-raised/60 flex items-center justify-end gap-2.5 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
