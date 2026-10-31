import { AlertCircle, X } from 'lucide-react';
import { ApiError } from '../../api/http/errors';
import { CodeBlock } from '../ui/CodeBlock';
import { IconButton } from '../ui/IconButton';

interface ErrorBannerProps {
  readonly error: unknown;
  readonly title?: string;
  readonly onDismiss?: () => void;
}

export function ErrorBanner({ error, title, onDismiss }: ErrorBannerProps) {
  if (!error) return null;

  const isApi = error instanceof ApiError;
  const messages: readonly string[] = isApi
    ? error.messages
    : error instanceof Error
      ? [error.message]
      : [String(error)];

  const reason = isApi ? error.reason : undefined;
  const details = isApi ? error.details : undefined;

  return (
    <div
      role="alert"
      className="rounded-xl border border-danger-border bg-danger-tint p-4 text-[13px] text-primary"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5 min-w-0 flex-1">
          <AlertCircle size={16} className="text-danger shrink-0 mt-0.5" />
          <div className="space-y-1.5 min-w-0 flex-1">
            <p className="font-semibold text-danger">
              {title ?? 'Request could not be completed'}
            </p>
            {messages.length === 1 ? (
              <p className="text-primary leading-relaxed">{messages[0]}</p>
            ) : (
              <ul className="list-disc pl-4 space-y-1 text-primary">
                {messages.map((msg, idx) => (
                  <li key={idx}>{msg}</li>
                ))}
              </ul>
            )}
            {reason && reason !== messages[0] && (
              <p className="text-[12px] text-secondary">Reason: {reason}</p>
            )}
            {details !== undefined && details !== null && (
              <div className="pt-1">
                <CodeBlock
                  code={
                    typeof details === 'string'
                      ? details
                      : JSON.stringify(details, null, 2)
                  }
                  showLineNumbers={false}
                  maxHeight="max-h-40"
                />
              </div>
            )}
          </div>
        </div>
        {onDismiss && (
          <IconButton
            aria-label="Dismiss error"
            icon={<X size={14} />}
            size="sm"
            onClick={onDismiss}
          />
        )}
      </div>
    </div>
  );
}
