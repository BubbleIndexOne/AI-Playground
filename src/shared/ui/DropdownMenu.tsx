import { ReactNode, useEffect, useRef, useState } from 'react';

export interface DropdownMenuItem {
  readonly label: string;
  readonly icon?: ReactNode;
  readonly danger?: boolean;
  readonly disabled?: boolean;
  readonly onClick: () => void;
}

interface DropdownMenuProps {
  readonly trigger: ReactNode;
  readonly items: readonly DropdownMenuItem[];
  readonly align?: 'left' | 'right';
  readonly side?: 'bottom' | 'top';
  readonly className?: string;
}

export function DropdownMenu({
  trigger,
  items,
  align = 'right',
  side = 'bottom',
  className = '',
}: DropdownMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const handleOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    window.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      window.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  const verticalClasses =
    side === 'top' ? 'bottom-full mb-2' : 'top-full mt-1.5';
  const horizontalClasses = align === 'right' ? 'right-0' : 'left-0';

  return (
    <div ref={containerRef} className={`relative ${className || 'inline-block'}`}>
      <div onClick={() => setOpen((prev) => !prev)}>{trigger}</div>
      {open && (
        <div
          role="menu"
          className={`absolute z-50 ${verticalClasses} ${horizontalClasses} min-w-[180px] rounded-xl border border-subtle bg-raised p-1 shadow-raised`}
        >
          {items.map((item, idx) => (
            <button
              key={idx}
              type="button"
              role="menuitem"
              disabled={item.disabled}
              onClick={() => {
                setOpen(false);
                item.onClick();
              }}
              className={`w-full flex items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[13px] font-medium transition-colors duration-120 ease-out cursor-pointer disabled:opacity-45 ${
                item.danger
                  ? 'text-danger hover:bg-danger-tint'
                  : 'text-primary hover:bg-hover'
              }`}
            >
              {item.icon && <span className="shrink-0">{item.icon}</span>}
              <span className="truncate">{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
