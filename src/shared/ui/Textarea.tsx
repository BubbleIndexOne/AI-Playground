import {
  ChangeEvent,
  forwardRef,
  TextareaHTMLAttributes,
  useEffect,
  useRef,
} from 'react';

export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  readonly mono?: boolean;
  readonly autoGrow?: boolean;
  readonly hasError?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea(
    {
      mono = false,
      autoGrow = false,
      hasError = false,
      className = '',
      onChange,
      value,
      ...rest
    },
    externalRef
  ) {
    const internalRef = useRef<HTMLTextAreaElement | null>(null);

    const adjustHeight = () => {
      if (!autoGrow || !internalRef.current) return;
      const el = internalRef.current;
      el.style.height = 'auto';
      el.style.height = `${Math.min(Math.max(el.scrollHeight, 80), 420)}px`;
    };

    useEffect(() => {
      adjustHeight();
    }, [value, autoGrow]);

    const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
      if (autoGrow) adjustHeight();
      onChange?.(e);
    };

    return (
      <textarea
        ref={(node) => {
          internalRef.current = node;
          if (typeof externalRef === 'function') externalRef(node);
          else if (externalRef) externalRef.current = node;
        }}
        value={value}
        onChange={handleChange}
        className={`w-full rounded-lg bg-app border ${
          hasError
            ? 'border-danger focus-visible:outline-danger'
            : 'border-subtle hover:border-strong focus-visible:outline-accent'
        } px-3 py-2 text-[13px] text-primary placeholder:text-muted transition-colors duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-0 disabled:opacity-50 ${
          mono ? 'font-mono text-[12px] leading-relaxed' : 'leading-relaxed'
        } ${className}`}
        {...rest}
      />
    );
  }
);
