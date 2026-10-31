import { Check, ShieldAlert, Trash2, XCircle } from 'lucide-react';
import { useState } from 'react';
import { Tool } from '../../../api/types/tools.types';
import { ErrorBanner } from '../../../shared/components/ErrorBanner';
import {
  Badge,
  Button,
  CodeBlock,
  ConfirmDialog,
  Drawer,
  FormField,
  Input,
  ToolStatusBadge,
  toast,
} from '../../../shared/ui';
import { computeLineDiff } from '../../../shared/utils/diffLines';
import {
  useAdminMutations,
  useAdminToolInspectionQuery,
} from '../hooks/useAdmin';

interface AdminToolReviewCardProps {
  readonly tool: Tool | null;
  readonly onClose: () => void;
}

export function AdminToolReviewCard({
  tool,
  onClose,
}: AdminToolReviewCardProps) {
  const [confirmMode, setConfirmMode] = useState<
    'reject' | 'deprecate' | 'purge' | null
  >(null);
  const [rejectReason, setRejectReason] = useState('');

  const { data: inspection } = useAdminToolInspectionQuery(tool?.id ?? null);
  const {
    approveMutation,
    rejectMutation,
    deprecateMutation,
    purgeToolMutation,
  } = useAdminMutations();

  if (!tool) return null;

  const currentVersion =
    tool.current_version ?? inspection?.versions?.[0] ?? null;
  const previousVersion = inspection?.versions?.[1] ?? null;

  const codeDiff =
    currentVersion && previousVersion
      ? computeLineDiff(previousVersion.code ?? '', currentVersion.code ?? '')
      : [];

  const handleApprove = async () => {
    await approveMutation.mutateAsync(tool.id);
    toast.success('Tool approved', `"${tool.name}" is now verified and public.`);
    onClose();
  };

  const handleConfirmAction = async () => {
    if (!confirmMode) return;
    if (confirmMode === 'reject') {
      await rejectMutation.mutateAsync({
        toolId: tool.id,
        reason: rejectReason,
      });
      toast.info('Tool rejected', `"${tool.name}" was marked as rejected.`);
    } else if (confirmMode === 'deprecate') {
      await deprecateMutation.mutateAsync(tool.id);
      toast.info('Tool deprecated', `"${tool.name}" was marked as deprecated.`);
    } else if (confirmMode === 'purge') {
      await purgeToolMutation.mutateAsync(tool.id);
      toast.success('Tool deleted', `"${tool.name}" was permanently deleted.`);
    }
    setConfirmMode(null);
    onClose();
  };

  const actionError =
    approveMutation.error ??
    rejectMutation.error ??
    deprecateMutation.error ??
    purgeToolMutation.error;

  return (
    <>
      <Drawer
        open={Boolean(tool)}
        title={`Review: ${tool.name}`}
        description={tool.description ?? 'Inspect code, schema, test results, and version diff.'}
        width="xl"
        onClose={onClose}
        footer={
          <div className="flex flex-wrap items-center justify-between gap-2 w-full">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-danger hover:text-danger"
              onClick={() => setConfirmMode('purge')}
            >
              <Trash2 className="w-3.5 h-3.5" />
              Purge
            </Button>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setConfirmMode('deprecate')}
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                Deprecate
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={() => {
                  setRejectReason('');
                  setConfirmMode('reject');
                }}
              >
                <XCircle className="w-3.5 h-3.5" />
                Reject
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                loading={approveMutation.isPending}
                onClick={handleApprove}
              >
                <Check className="w-3.5 h-3.5" />
                Approve
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-6">
          {actionError && <ErrorBanner error={actionError} />}

          <div className="flex flex-wrap items-center gap-2">
            <ToolStatusBadge status={tool.status} />
            <Badge variant="neutral" mono>
              {tool.type}
            </Badge>
            <Badge variant="neutral" mono>
              {tool.id}
            </Badge>
            {currentVersion && (
              <Badge variant="info" mono>
                v{currentVersion.version}
              </Badge>
            )}
            {(currentVersion?.capabilities_json ?? []).map((cap) => (
              <Badge key={cap} variant="warning" mono>
                {cap}
              </Badge>
            ))}
          </div>

          {currentVersion ? (
            <div className="space-y-5">
              <div className="space-y-1.5">
                <span className="text-[12px] font-medium text-secondary">
                  Source code (v{currentVersion.version})
                </span>
                <CodeBlock
                  code={currentVersion.code ?? '// No client source code (MCP tool)'}
                  showLineNumbers
                  maxHeight="260px"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <span className="text-[12px] font-medium text-secondary">
                    Parameter schema
                  </span>
                  <CodeBlock
                    code={JSON.stringify(currentVersion.schema_json ?? {}, null, 2)}
                    maxHeight="220px"
                  />
                </div>

                <div className="space-y-1.5">
                  <span className="text-[12px] font-medium text-secondary">
                    Recorded test results
                  </span>
                  <CodeBlock
                    code={JSON.stringify(
                      currentVersion.test_results_json ?? {},
                      null,
                      2
                    )}
                    maxHeight="220px"
                  />
                </div>
              </div>

              {previousVersion && (
                <div className="space-y-1.5">
                  <span className="text-[12px] font-medium text-secondary">
                    Diff against v{previousVersion.version}
                  </span>
                  <div className="rounded-lg border border-subtle bg-app p-3 font-mono text-[12px] overflow-x-auto max-h-56">
                    {codeDiff.map((line, idx) => (
                      <div
                        key={idx}
                        className={
                          line.type === 'added'
                            ? 'bg-success-tint text-success px-1.5 py-0.5'
                            : line.type === 'removed'
                              ? 'bg-danger-tint text-danger px-1.5 py-0.5'
                              : 'text-secondary px-1.5 py-0.5'
                        }
                      >
                        {line.type === 'added'
                          ? '+ '
                          : line.type === 'removed'
                            ? '- '
                            : '  '}
                        {line.text}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-[13px] text-secondary">
              No version details available for this tool.
            </p>
          )}
        </div>
      </Drawer>

      <ConfirmDialog
        open={confirmMode !== null}
        title={
          confirmMode === 'purge'
            ? `Delete "${tool.name}" permanently?`
            : confirmMode === 'reject'
              ? `Reject "${tool.name}"?`
              : `Deprecate "${tool.name}"?`
        }
        description={
          confirmMode === 'purge'
            ? 'This permanently deletes the tool and all its versions.'
            : confirmMode === 'reject'
              ? 'Marks this tool as rejected and removes it from the review queue.'
              : 'Marks this tool as deprecated.'
        }
        confirmLabel={
          confirmMode === 'purge'
            ? 'Purge tool'
            : confirmMode === 'reject'
              ? 'Reject tool'
              : 'Deprecate tool'
        }
        isDestructive
        isPending={
          rejectMutation.isPending ||
          deprecateMutation.isPending ||
          purgeToolMutation.isPending
        }
        onConfirm={handleConfirmAction}
        onCancel={() => setConfirmMode(null)}
      >
        {confirmMode === 'reject' && (
          <FormField label="Rejection reason" htmlFor="reject-reason-input">
            <Input
              id="reject-reason-input"
              type="text"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Explain why this version was rejected…"
            />
          </FormField>
        )}
      </ConfirmDialog>
    </>
  );
}
