import { ReactNode } from 'react';

interface FormFieldProps {
  readonly label: string;
  readonly htmlFor?: string;
  readonly required?: boolean;
  readonly hint?: string;
  readonly error?: string | null;
  readonly rightLabel?: ReactNode;
  readonly children: ReactNode;
  readonly className?: string;
}

export function FormField({
  label,
  htmlFor,
  required,
  hint,
  error,
  rightLabel,
  children,
  className = '',
}: FormFieldProps) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="flex items-center justify-between gap-2">
        <label
          htmlFor={htmlFor}
          className="block text-[13px] font-medium text-primary"
        >
          {label}
          {required && <span className="text-danger ml-0.5">*</span>}
        </label>
        {rightLabel && (
          <div className="text-[12px] text-muted">{rightLabel}</div>
        )}
      </div>
      {children}
      {error ? (
        <p className="text-[12px] text-danger">{error}</p>
      ) : hint ? (
        <p className="text-[12px] text-muted">{hint}</p>
      ) : null}
    </div>
  );
}
