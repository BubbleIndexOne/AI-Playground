import { AlertCircle } from 'lucide-react';
import { ApiError } from '../../api/http/errors';

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
      className="rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50/80 dark:bg-red-950/40 p-4 text-sm text-red-900 dark:text-red-200"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
          <div className="space-y-1.5">
            {title && (
              <p className="font-semibold text-red-950 dark:text-red-100">
                {title}
              </p>
            )}
            {messages.length === 1 ? (
              <p>{messages[0]}</p>
            ) : (
              <ul className="list-disc pl-4 space-y-1">
                {messages.map((msg, idx) => (
                  <li key={idx}>{msg}</li>
                ))}
              </ul>
            )}
            {reason && reason !== messages[0] && (
              <p className="text-xs text-red-800 dark:text-red-300">
                Reason: {reason}
              </p>
            )}
            {details !== undefined && details !== null && (
              <pre className="mt-2 p-2.5 rounded bg-red-100/70 dark:bg-red-950/70 text-xs font-mono overflow-x-auto">
                {typeof details === 'string'
                  ? details
                  : JSON.stringify(details, null, 2)}
              </pre>
            )}
          </div>
        </div>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="text-xs font-medium text-red-700 dark:text-red-300 hover:underline shrink-0"
          >
            Dismiss
          </button>
        )}
      </div>
    </div>
  );
}
