import { X } from 'lucide-react';
import { ReactNode, useEffect } from 'react';
import { IconButton } from './IconButton';

interface DialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly title: string;
  readonly description?: string;
  readonly maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  readonly children: ReactNode;
  readonly footer?: ReactNode;
}

const WIDTH_CLASSES = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
};

export function Dialog({
  open,
  onClose,
  title,
  description,
  maxWidth = 'md',
  children,
  footer,
}: DialogProps) {
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`w-full ${WIDTH_CLASSES[maxWidth]} rounded-xl border border-subtle bg-card shadow-raised my-8 overflow-hidden`}
      >
        <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-subtle">
          <div className="space-y-0.5">
            <h2 className="text-[16px] font-semibold text-primary">{title}</h2>
            {description && (
              <p className="text-[13px] text-secondary">{description}</p>
            )}
          </div>
          <IconButton
            aria-label="Close dialog"
            icon={<X size={16} />}
            size="sm"
            onClick={onClose}
          />
        </div>

        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {children}
        </div>

        {footer && (
          <div className="flex items-center justify-end gap-2 px-6 py-3.5 border-t border-subtle bg-raised/50">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
