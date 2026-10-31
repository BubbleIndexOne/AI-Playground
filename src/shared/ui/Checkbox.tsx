import { Check } from 'lucide-react';
import { ReactNode } from 'react';

interface CheckboxProps {
  readonly checked: boolean;
  readonly onChange: (checked: boolean) => void;
  readonly label?: ReactNode;
  readonly description?: string;
  readonly disabled?: boolean;
  readonly className?: string;
}

export function Checkbox({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  className = '',
}: CheckboxProps) {
  return (
    <label
      className={`inline-flex items-start gap-2.5 select-none ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
      } ${className}`}
    >
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
          checked
            ? 'bg-accent border-accent text-accent-fg'
            : 'bg-app border-subtle hover:border-strong'
        }`}
      >
        {checked && <Check size={11} strokeWidth={3} />}
      </button>
      {(label || description) && (
        <span className="flex flex-col">
          {label && (
            <span className="text-[13px] font-medium text-primary leading-4">
              {label}
            </span>
          )}
          {description && (
            <span className="text-[12px] text-secondary mt-0.5">
              {description}
            </span>
          )}
        </span>
      )}
    </label>
  );
}
