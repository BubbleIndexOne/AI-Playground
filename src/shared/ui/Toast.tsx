import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { useEffect, useState } from 'react';

export type ToastKind = 'success' | 'error' | 'info';

export interface ToastItem {
  readonly id: string;
  readonly kind: ToastKind;
  readonly title: string;
  readonly detail?: string;
}

let toastItems: ToastItem[] = [];
const listeners = new Set<(items: readonly ToastItem[]) => void>();

function notify() {
  const snapshot = [...toastItems];
  for (const listener of listeners) {
    listener(snapshot);
  }
}

export const toast = {
  show(item: Omit<ToastItem, 'id'>): string {
    const id = crypto.randomUUID();
    const next: ToastItem = { ...item, id };
    toastItems = [...toastItems, next];
    notify();

    // Auto-dismiss at 4s for success/info; errors persist until closed
    if (item.kind !== 'error') {
      window.setTimeout(() => {
        toast.dismiss(id);
      }, 4000);
    }
    return id;
  },

  success(title: string, detail?: string): string {
    return this.show({ kind: 'success', title, detail });
  },

  error(title: string, detail?: string): string {
    return this.show({ kind: 'error', title, detail });
  },

  info(title: string, detail?: string): string {
    return this.show({ kind: 'info', title, detail });
  },

  dismiss(id: string): void {
    toastItems = toastItems.filter((t) => t.id !== id);
    notify();
  },
};

export function ToastViewport() {
  const [items, setItems] = useState<readonly ToastItem[]>(toastItems);

  useEffect(() => {
    const handler = (next: readonly ToastItem[]) => setItems(next);
    listeners.add(handler);
    return () => {
      listeners.delete(handler);
    };
  }, []);

  if (items.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
    >
      {items.map((item) => (
        <div
          key={item.id}
          role={item.kind === 'error' ? 'alert' : 'status'}
          className={`pointer-events-auto flex items-start justify-between gap-3 rounded-xl border p-3.5 shadow-raised bg-raised ${
            item.kind === 'error'
              ? 'border-danger-border'
              : item.kind === 'success'
                ? 'border-success-border'
                : 'border-subtle'
          }`}
        >
          <div className="flex items-start gap-2.5 min-w-0">
            {item.kind === 'error' ? (
              <AlertCircle size={16} className="text-danger shrink-0 mt-0.5" />
            ) : item.kind === 'success' ? (
              <CheckCircle2
                size={16}
                className="text-success shrink-0 mt-0.5"
              />
            ) : (
              <Info size={16} className="text-info shrink-0 mt-0.5" />
            )}
            <div className="space-y-0.5 min-w-0">
              <p className="text-[13px] font-medium text-primary">
                {item.title}
              </p>
              {item.detail && (
                <p className="text-[12px] text-secondary break-words">
                  {item.detail}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            aria-label="Dismiss notification"
            onClick={() => toast.dismiss(item.id)}
            className="text-muted hover:text-primary p-0.5 rounded transition-colors cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
