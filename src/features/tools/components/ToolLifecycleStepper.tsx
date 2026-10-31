import { ToolStatus } from '../../../domain/enums';

interface ToolLifecycleStepperProps {
  readonly status: ToolStatus;
  readonly rejectionReason?: string | null;
}

const LIFECYCLE_STEPS: { readonly key: ToolStatus; readonly label: string; readonly desc: string }[] = [
  { key: ToolStatus.Draft, label: '01. Draft', desc: 'Author code & schema' },
  { key: ToolStatus.Testing, label: '02. Testing', desc: 'Validate in sandbox' },
  { key: ToolStatus.Registered, label: '03. Registered', desc: 'Waiting for admin review' },
  { key: ToolStatus.Verified, label: '04. Verified', desc: 'Approved for publication' },
];

export function ToolLifecycleStepper({
  status,
  rejectionReason,
}: ToolLifecycleStepperProps) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          Publishing Lifecycle
        </h2>
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span>Current state:</span>
          <span className="font-semibold text-slate-900 dark:text-slate-100 capitalize">
            {status}
          </span>
          {status === ToolStatus.Registered && (
            <>
              <span aria-hidden="true">·</span>
              <span>Waiting for admin review</span>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        {LIFECYCLE_STEPS.map((step) => {
          const isCurrent = status === step.key;
          return (
            <div
              key={step.key}
              className={`rounded-lg border p-3 transition-colors ${
                isCurrent
                  ? 'border-slate-900 dark:border-slate-100 bg-slate-50 dark:bg-slate-800/60'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                {step.label}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {step.desc}
              </p>
            </div>
          );
        })}
      </div>

      {status === ToolStatus.Rejected && (
        <div className="rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50/70 dark:bg-red-950/40 p-3.5 text-xs text-red-900 dark:text-red-200 space-y-1">
          <p className="font-semibold">Tool Rejected by Admin Review</p>
          <p>
            {rejectionReason
              ? `Reason: ${rejectionReason}`
              : 'No rejection reason was provided by the reviewer.'}
          </p>
          <p className="text-red-700 dark:text-red-300">
            Ship a new version with a passing sandbox test to request publication again.
          </p>
        </div>
      )}

      {status === ToolStatus.Deprecated && (
        <div className="rounded-lg border border-amber-200 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/40 p-3.5 text-xs text-amber-900 dark:text-amber-200">
          This tool is currently marked as deprecated.
        </div>
      )}
    </div>
  );
}
