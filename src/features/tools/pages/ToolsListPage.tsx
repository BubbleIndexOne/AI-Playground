import { Edit3, ExternalLink, Plus, Trash2, Wrench } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Tool } from '../../../api/types/tools.types';
import { ToolStatus, ToolType } from '../../../domain/enums';
import { ErrorBanner } from '../../../shared/components/ErrorBanner';
import {
  Badge,
  Button,
  Checkbox,
  ConfirmDialog,
  EmptyState,
  IconButton,
  PageHeader,
  Select,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeaderCell,
  TableRow,
  TableSkeleton,
  toast,
  Tooltip,
  ToolStatusBadge,
} from '../../../shared/ui';
import {
  formatDateTime,
  formatRelativeTime,
} from '../../../shared/utils/formatters';
import { ToolMetadataModal } from '../components/ToolMetadataModal';
import { useToolMutations, useToolsListQuery } from '../hooks/useTools';

export function ToolsListPage() {
  const navigate = useNavigate();

  const [typeFilter, setTypeFilter] = useState<ToolType | ''>('');
  const [statusFilter, setStatusFilter] = useState<ToolStatus | ''>('');
  const [includePublic, setIncludePublic] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTool, setEditingTool] = useState<Tool | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Tool | null>(null);

  const { data: tools, isLoading, error } = useToolsListQuery({
    type: typeFilter || undefined,
    status: statusFilter || undefined,
    include_public: includePublic,
  });

  const { deleteToolMutation } = useToolMutations();

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    await deleteToolMutation.mutateAsync(deleteTarget.id);
    toast.success(`Deleted "${deleteTarget.name}"`);
    setDeleteTarget(null);
  };

  const hasTools = Boolean(tools && tools.length > 0);
  const hasActiveFilters = Boolean(typeFilter || statusFilter || includePublic);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Tools"
        description="Author client-side or MCP tools, test them in an isolated worker sandbox, and request publication."
        actions={
          (hasTools || hasActiveFilters) && (
            <Button
              variant="primary"
              size="md"
              icon={<Plus size={16} />}
              onClick={() => {
                setEditingTool(null);
                setModalOpen(true);
              }}
            >
              Create tool
            </Button>
          )
        }
      />

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="w-36">
            <Select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as ToolType | '')}
            >
              <option value="">All types</option>
              <option value={ToolType.Client}>Client</option>
              <option value={ToolType.Mcp}>MCP</option>
            </Select>
          </div>

          <div className="w-44">
            <Select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as ToolStatus | '')
              }
            >
              <option value="">All statuses</option>
              {Object.values(ToolStatus).map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </Select>
          </div>

          <div className="pl-2">
            <Checkbox
              checked={includePublic}
              onChange={setIncludePublic}
              label="Include public tools"
            />
          </div>
        </div>
      </div>

      {error && <ErrorBanner error={error} title="Could not load tools" />}

      {isLoading ? (
        <TableSkeleton rows={5} columns={5} />
      ) : !hasTools ? (
        <EmptyState
          icon={<Wrench size={20} />}
          title={hasActiveFilters ? 'No matching tools' : 'No tools yet'}
          description="Create a tool to author versions, test inputs in the sandbox, and submit for verification."
          actionLabel="Create tool"
          onAction={() => {
            setEditingTool(null);
            setModalOpen(true);
          }}
        />
      ) : (
        <TableContainer>
          <TableHead>
            <tr>
              <TableHeaderCell>Name</TableHeaderCell>
              <TableHeaderCell>Type</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>Version</TableHeaderCell>
              <TableHeaderCell>Updated</TableHeaderCell>
              <TableHeaderCell className="text-right">Actions</TableHeaderCell>
            </tr>
          </TableHead>
          <TableBody>
            {tools!.map((tool) => (
              <TableRow key={tool.id}>
                <TableCell className="max-w-xs">
                  <Link
                    to={`/tools/${tool.id}`}
                    className="font-medium text-primary hover:text-accent transition-colors block truncate"
                  >
                    {tool.name}
                  </Link>
                  {tool.description && (
                    <p className="text-[12px] text-secondary truncate mt-0.5">
                      {tool.description}
                    </p>
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
                <TableCell>
                  <span className="font-mono text-[12px] text-secondary">
                    {tool.current_version
                      ? `v${tool.current_version.version}`
                      : '—'}
                  </span>
                </TableCell>
                <TableCell>
                  <Tooltip content={formatDateTime(tool.updated_at)}>
                    <span className="text-[12px] text-secondary tabular-nums">
                      {formatRelativeTime(tool.updated_at)}
                    </span>
                  </Tooltip>
                </TableCell>
                <TableCell className="text-right">
                  <div className="inline-flex items-center justify-end gap-1">
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={<ExternalLink size={13} />}
                      onClick={() => navigate(`/tools/${tool.id}`)}
                    >
                      Open
                    </Button>
                    <IconButton
                      aria-label={`Edit ${tool.name}`}
                      icon={<Edit3 size={14} />}
                      size="sm"
                      onClick={() => {
                        setEditingTool(tool);
                        setModalOpen(true);
                      }}
                    />
                    <IconButton
                      aria-label={`Delete ${tool.name}`}
                      icon={<Trash2 size={14} />}
                      variant="danger"
                      size="sm"
                      onClick={() => setDeleteTarget(tool)}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </TableContainer>
      )}

      <ToolMetadataModal
        open={modalOpen}
        initialTool={editingTool}
        onClose={() => setModalOpen(false)}
        onCreated={(created) => navigate(`/tools/${created.id}`)}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        title={`Delete "${deleteTarget?.name ?? ''}"?`}
        description="This tool will be soft-deleted and hidden from your active workspace."
        confirmLabel="Delete tool"
        isDestructive
        isPending={deleteToolMutation.isPending}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
