import { Eye, KeyRound, ShieldCheck, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Tool } from '../../../api/types/tools.types';
import { ErrorBanner } from '../../../shared/components/ErrorBanner';
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  Input,
  PageHeader,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeaderCell,
  TableRow,
  TableSkeleton,
  ToolStatusBadge,
  Tooltip,
  toast,
} from '../../../shared/ui';
import {
  formatDateTime,
  formatRelativeTime,
} from '../../../shared/utils/formatters';
import { AdminToolReviewCard } from '../components/AdminToolReviewCard';
import {
  useAdminKeySession,
  useAdminMutations,
  useAdminQueueQuery,
} from '../hooks/useAdmin';

export function AdminPage() {
  const { hasAdminKey, adminAuthError, setAdminKey } = useAdminKeySession();
  const {
    data: registeredTools,
    isLoading,
    error,
  } = useAdminQueueQuery(hasAdminKey);
  const { deleteUserMutation } = useAdminMutations();

  const [reviewingTool, setReviewingTool] = useState<Tool | null>(null);
  const [userIdToDelete, setUserIdToDelete] = useState('');
  const [confirmUserOpen, setConfirmUserOpen] = useState(false);

  const handleConfirmDeleteUser = async () => {
    const trimmed = userIdToDelete.trim();
    if (!trimmed) return;
    await deleteUserMutation.mutateAsync(trimmed);
    setConfirmUserOpen(false);
    toast.success('User deleted', `Removed user ${trimmed}.`);
    setUserIdToDelete('');
  };

  if (!hasAdminKey) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Review Queue"
          description="Verify and publish tools submitted for review."
        />
        {adminAuthError && (
          <ErrorBanner error={new Error(adminAuthError)} title="Access denied" />
        )}
        <EmptyState
          icon={<KeyRound className="w-5 h-5" />}
          title="Admin key required"
          description="Set an admin key in the sidebar footer to access the review queue and user management."
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Review Queue"
        description="Inspect tools awaiting review, verify sandbox test results, and approve for the marketplace."
        actions={
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setAdminKey(null)}
          >
            Clear admin key
          </Button>
        }
      />

      {error && <ErrorBanner error={error} title="Failed to load review queue" />}

      <section className="space-y-3">
        <h2 className="text-[14px] font-semibold text-primary">
          Tools awaiting review
        </h2>

        {isLoading ? (
          <TableSkeleton rows={4} />
        ) : !registeredTools || registeredTools.length === 0 ? (
          <EmptyState
            icon={<ShieldCheck className="w-5 h-5" />}
            title="Review queue is empty"
            description="No tools are currently awaiting review."
          />
        ) : (
          <TableContainer>
            <TableHead>
              <tr>
                <TableHeaderCell>Name</TableHeaderCell>
                <TableHeaderCell>Type</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell>Version</TableHeaderCell>
                <TableHeaderCell>Test results</TableHeaderCell>
                <TableHeaderCell>Updated</TableHeaderCell>
                <TableHeaderCell className="text-right">Action</TableHeaderCell>
              </tr>
            </TableHead>
            <TableBody>
              {registeredTools.map((tool) => {
                const ver = tool.current_version;
                const hasTests =
                  ver?.test_results_json &&
                  Object.keys(ver.test_results_json).length > 0;

                return (
                  <TableRow
                    key={tool.id}
                    interactive
                    onClick={() => setReviewingTool(tool)}
                  >
                    <TableCell>
                      <div className="font-medium text-primary">{tool.name}</div>
                      {tool.description && (
                        <div className="text-[12px] text-secondary truncate max-w-xs">
                          {tool.description}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="neutral" mono>
                        {tool.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <ToolStatusBadge status={tool.status} />
                    </TableCell>
                    <TableCell className="font-mono text-[12px]">
                      {ver ? `v${ver.version}` : '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={hasTests ? 'success' : 'neutral'}>
                        {hasTests ? 'Recorded' : 'None'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-[12px] text-secondary">
                      {tool.updated_at ? (
                        <Tooltip content={formatDateTime(tool.updated_at)}>
                          <span className="underline decoration-dotted cursor-default">
                            {formatRelativeTime(tool.updated_at)}
                          </span>
                        </Tooltip>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setReviewingTool(tool);
                        }}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Review
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </TableContainer>
        )}
      </section>

      <Card padding="lg" className="border-danger/30 space-y-4">
        <div className="space-y-0.5">
          <h2 className="text-[15px] font-semibold text-danger">
            Delete user account
          </h2>
          <p className="text-[12px] text-secondary">
            Permanently remove a user account by its unique identifier.
          </p>
        </div>

        {deleteUserMutation.error && (
          <ErrorBanner error={deleteUserMutation.error} />
        )}

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[240px] max-w-md">
            <Input
              type="text"
              value={userIdToDelete}
              onChange={(e) => setUserIdToDelete(e.target.value)}
              placeholder="Enter user ID…"
              mono
            />
          </div>
          <Button
            type="button"
            variant="danger"
            size="md"
            disabled={!userIdToDelete.trim()}
            onClick={() => setConfirmUserOpen(true)}
          >
            <Trash2 className="w-4 h-4" />
            Delete user
          </Button>
        </div>
      </Card>

      <AdminToolReviewCard
        tool={reviewingTool}
        onClose={() => setReviewingTool(null)}
      />

      <ConfirmDialog
        open={confirmUserOpen}
        title={`Delete user "${userIdToDelete.trim()}"?`}
        description="This permanently removes the user account and cannot be undone."
        confirmLabel="Delete user"
        isDestructive
        isPending={deleteUserMutation.isPending}
        onConfirm={handleConfirmDeleteUser}
        onCancel={() => setConfirmUserOpen(false)}
      />
    </div>
  );
}
