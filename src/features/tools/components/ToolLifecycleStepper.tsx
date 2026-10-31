import { CheckCircle2, Circle, XCircle } from 'lucide-react';
import { ToolStatus } from '../../../domain/enums';
import { Card, ToolStatusBadge } from '../../../shared/ui';

interface ToolLifecycleStepperProps {
  readonly status: ToolStatus;
  readonly rejectionReason?: string | null;
}

const STEPS: {
  readonly key: ToolStatus;
  readonly label: string;
  readonly summary: string;
}[] = [
  { key: ToolStatus.Draft, label: 'Draft', summary: 'Author code & schema' },
  { key: ToolStatus.Testing, label: 'Testing', summary: 'Validate in sandbox' },
  {
    key: ToolStatus.Registered,
    label: 'Awaiting review',
    summary: 'Submitted for verification',
  },
  {
    key: ToolStatus.Verified,
    label: 'Verified',
    summary: 'Approved for marketplace',
  },
];

const STEP_INDEX: Record<string, number> = {
  [ToolStatus.Draft]: 0,
  [ToolStatus.Testing]: 1,
  [ToolStatus.Registered]: 2,
  [ToolStatus.Verified]: 3,
};

export function ToolLifecycleStepper({
  status,
  rejectionReason,
}: ToolLifecycleStepperProps) {
  const currentIdx = STEP_INDEX[status] ?? -1;

  return (
    <Card padding="md" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-[13px] font-semibold text-primary">
          Lifecycle status
        </span>
        <ToolStatusBadge status={status} />
      </div>

      {/* Horizontal Stepper */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
        {STEPS.map((step, idx) => {
          const isCurrent = status === step.key;
          const isCompleted = currentIdx > idx;
          return (
            <div
              key={step.key}
              className={`flex items-start gap-2.5 rounded-lg border p-3 transition-colors ${
                isCurrent
                  ? 'border-accent bg-accent-tint'
                  : isCompleted
                    ? 'border-subtle bg-raised/60'
                    : 'border-subtle bg-app/50'
              }`}
            >
              {isCompleted ? (
                <CheckCircle2
                  size={15}
                  className="text-success shrink-0 mt-0.5"
                />
              ) : isCurrent ? (
                <Circle
                  size={15}
                  className="text-accent fill-accent/20 shrink-0 mt-0.5"
                />
              ) : (
                <Circle size={15} className="text-muted shrink-0 mt-0.5" />
              )}
              <div className="min-w-0">
                <p
                  className={`text-[13px] font-medium truncate ${
                    isCurrent ? 'text-primary' : 'text-secondary'
                  }`}
                >
                  {step.label}
                </p>
                <p className="text-[11px] text-muted truncate">
                  {step.summary}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {status === ToolStatus.Rejected && (
        <div className="flex items-start gap-2.5 rounded-lg border border-danger-border bg-danger-tint p-3.5 text-[13px]">
          <XCircle size={16} className="text-danger shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-semibold text-danger">Rejected during review</p>
            <p className="text-primary">
              {rejectionReason || 'No reason was provided by the reviewer.'}
            </p>
            <p className="text-[12px] text-secondary">
              Save a new version with a passing test to request publishing again.
            </p>
          </div>
        </div>
      )}
    </Card>
  );
}
