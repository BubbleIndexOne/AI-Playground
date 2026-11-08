/**
 * @fileoverview Dialog component for submitting moderation and abuse reports
 * against tools in the Community Marketplace.
 */

import { AlertTriangle } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { ApiError } from '../../../api/http/errors';
import { ToolReportReason } from '../../../api/types/marketplace.types';
import { ErrorBanner } from '../../../shared/components/ErrorBanner';
import { Button, Dialog, FormField, Select, toast } from '../../../shared/ui';
import { useMarketplaceMutations } from '../hooks/useMarketplace';

interface ToolReportDialogProps {
  readonly open: boolean;
  readonly toolId: string | null;
  readonly toolName: string;
  readonly onClose: () => void;
}

const REPORT_REASONS: ReadonlyArray<{ value: ToolReportReason; label: string }> = [
  { value: 'malicious', label: 'Malicious behavior or security hazard' },
  { value: 'broken', label: 'Broken execution or non-functional tool' },
  { value: 'spam', label: 'Spam, misleading, or duplicate listing' },
  { value: 'other', label: 'Other community guideline violations' },
];

/**
 * Modal dialog for filing moderation reports.
 */
export function ToolReportDialog({
  open,
  toolId,
  toolName,
  onClose,
}: ToolReportDialogProps) {
  const { reportMutation } = useMarketplaceMutations();
  const [reason, setReason] = useState<ToolReportReason>('broken');
  const [details, setDetails] = useState('');
  const [submitError, setSubmitError] = useState<unknown>(null);

  if (!open || !toolId) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    try {
      const response = await reportMutation.mutateAsync({
        id: toolId,
        input: {
          reason,
          details: details.trim() || undefined,
        },
      });

      toast.success(
        'Report submitted',
        response.message || 'Thank you for keeping the marketplace safe.'
      );
      onClose();
      setDetails('');
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        toast.info(
          'Report already submitted',
          'You already have an open report pending review for this tool.'
        );
        onClose();
        return;
      }
      setSubmitError(err);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Report Tool"
      description={`Submit a moderation report for "${toolName}". Reports are reviewed by administrators.`}
      maxWidth="md"
      footer={
        <>
          <Button
            type="button"
            variant="secondary"
            disabled={reportMutation.isPending}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="tool-report-form"
            variant="danger"
            icon={<AlertTriangle size={14} />}
            loading={reportMutation.isPending}
          >
            Submit Report
          </Button>
        </>
      }
    >
      <form id="tool-report-form" onSubmit={handleSubmit} className="space-y-4">
        {Boolean(submitError) && <ErrorBanner error={submitError} />}

        <FormField label="Reason" htmlFor="report-reason" required>
          <Select
            id="report-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value as ToolReportReason)}
          >
            {REPORT_REASONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField
          label="Details (optional)"
          htmlFor="report-details"
          hint={`${details.length}/1000 characters`}
        >
          <textarea
            id="report-details"
            rows={4}
            maxLength={1000}
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="Describe the issue, unexpected behavior, or security concern…"
            className="w-full rounded-lg border border-subtle bg-card px-3 py-2 text-[13px] text-primary placeholder:text-muted focus:border-accent focus:outline-none transition-colors"
          />
        </FormField>
      </form>
    </Dialog>
  );
}
