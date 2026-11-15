/**
 * @fileoverview Modal/Drawer displaying comprehensive details of a community
 * marketplace tool, supporting version inspection, installation/pinning,
 * client forking, moderation reporting, and agent attachment.
 */

import {
  AlertTriangle,
  ArrowUpCircle,
  CheckCircle,
  Copy,
  Download,
  GitFork,
  Plug,
  Plus,
  ShieldAlert,
  Trash2,
  User,
} from 'lucide-react';
import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiError } from '../../../api/http/errors';
import { ErrorBanner } from '../../../shared/components/ErrorBanner';
import {
  Badge,
  Button,
  CodeBlock,
  Drawer,
  FormField,
  Select,
  Skeleton,
  toast,
  Tooltip,
} from '../../../shared/ui';
import { formatDateTime } from '../../../shared/utils/formatters';
import { useAgentMutations, useAgentsQuery } from '../../agents/hooks/useAgents';
import {
  useMarketplaceMutations,
  useMarketplaceToolDetailQuery,
} from '../hooks/useMarketplace';
import { ToolReportDialog } from './ToolReportDialog';

interface MarketplaceToolDetailModalProps {
  readonly toolIdOrSlug: string | null;
  readonly onClose: () => void;
}

/**
 * Drawer presenting rich details and lifecycle operations for a marketplace tool.
 */
export function MarketplaceToolDetailModal({
  toolIdOrSlug,
  onClose,
}: MarketplaceToolDetailModalProps) {
  const navigate = useNavigate();
  const { data: detailData, isLoading, error } =
    useMarketplaceToolDetailQuery(toolIdOrSlug);
  const { data: agents } = useAgentsQuery();
  const { attachToolMutation } = useAgentMutations();
  const { installMutation, uninstallMutation, forkMutation } =
    useMarketplaceMutations();

  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [pinnedVersionToAttach, setPinnedVersionToAttach] = useState<string>('');
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [selectedInstallVersionId, setSelectedInstallVersionId] = useState<string>('');

  if (!toolIdOrSlug) return null;

  const tool = detailData?.tool;
  const currentVersion = tool?.current_version;
  const allVersions = tool?.versions ?? [];

  const isUpdateAvailable =
    Boolean(tool?.is_installed) &&
    typeof tool?.pinned_version_number === 'number' &&
    typeof currentVersion?.version_number === 'number' &&
    tool.pinned_version_number < currentVersion.version_number;

  const canFork = Boolean(tool?.allow_client_execution && !tool?.is_mcp_hosted);

  const handleInstall = async (versionId?: string) => {
    if (!tool) return;
    try {
      await installMutation.mutateAsync({
        id: tool.id,
        input: versionId ? { version_id: versionId } : undefined,
      });
      toast.success(
        'Tool installed',
        `Pinned ${tool.name} to your active tool pool.`
      );
    } catch (err) {
      toast.error('Failed to install tool', err instanceof Error ? err.message : String(err));
    }
  };

  const handleUninstall = async () => {
    if (!tool) return;
    try {
      await uninstallMutation.mutateAsync(tool.id);
      toast.info('Tool uninstalled', `Removed ${tool.name} from your pool.`);
    } catch (err) {
      toast.error('Failed to uninstall tool', err instanceof Error ? err.message : String(err));
    }
  };

  const handleFork = async () => {
    if (!tool) return;
    if (!canFork) {
      toast.info('Forking prohibited', 'Protected MCP server tools cannot be forked.');
      return;
    }

    try {
      const response = await forkMutation.mutateAsync(tool.id);
      toast.success('Tool forked', `Created "${response.tool.name}" in your workspace.`);
      onClose();
      navigate(`/tools/${response.tool.id}`);
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        toast.error('Forking forbidden', 'Protected server tools cannot be forked to client workspace.');
        return;
      }
      toast.error('Fork failed', err instanceof Error ? err.message : String(err));
    }
  };

  const handleAttachToAgent = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedAgentId || !tool) return;
    await attachToolMutation.mutateAsync({
      agentId: selectedAgentId,
      toolId: tool.id,
      pinnedVersion: pinnedVersionToAttach ? Number(pinnedVersionToAttach) : null,
    });
    const agentName =
      agents?.find((a) => a.id === selectedAgentId)?.name ?? 'Agent';
    toast.success(
      'Tool added to agent',
      `Attached "${tool.name}"${pinnedVersionToAttach ? ` (v${pinnedVersionToAttach})` : ''} to ${agentName}.`
    );
  };

  return (
    <>
      <Drawer
        open={Boolean(toolIdOrSlug)}
        title={tool?.name ?? 'Tool details'}
        description={tool?.description ?? 'Community marketplace tool.'}
        width="xl"
        onClose={onClose}
      >
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : error ? (
          <ErrorBanner error={error} title="Failed to load tool details" />
        ) : !tool ? null : (
          <div className="space-y-6">
            {/* Header Badges & Author Metadata */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-subtle">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={tool.type === 'client' ? 'neutral' : 'info'} mono>
                  {tool.type.toUpperCase()}
                </Badge>

                {tool.is_mcp_hosted && (
                  <Badge variant="success">MCP Hosted</Badge>
                )}

                {tool.is_installed && (
                  <Badge variant="success" className="gap-1">
                    <CheckCircle size={12} />
                    Installed{tool.pinned_version_number ? ` (v${tool.pinned_version_number})` : ''}
                  </Badge>
                )}

                {isUpdateAvailable && (
                  <Badge variant="warning" className="gap-1 animate-pulse">
                    <ArrowUpCircle size={12} />
                    Update available (v{currentVersion?.version_number})
                  </Badge>
                )}

                {tool.requires_connector && (
                  <Badge
                    variant={tool.has_connector_configured ? 'neutral' : 'warning'}
                    className="gap-1"
                  >
                    <Plug size={12} />
                    {tool.requires_connector}
                    {!tool.has_connector_configured && ' (credentials missing)'}
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-1.5 text-[12px] text-secondary">
                <User size={13} className="text-muted" />
                <span>
                  By <strong className="text-primary">{tool.author.display_name}</strong>
                  {tool.author.handle && (
                    <span className="font-mono text-muted"> (@{tool.author.handle})</span>
                  )}
                </span>
              </div>
            </div>

            {/* Quick Action Toolbar */}
            <div className="flex flex-wrap items-center gap-2 bg-raised/50 p-3 rounded-xl border border-subtle">
              {tool.is_installed ? (
                <>
                  {isUpdateAvailable && (
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      icon={<ArrowUpCircle size={14} />}
                      loading={installMutation.isPending}
                      onClick={() => handleInstall()}
                    >
                      Update to latest v{currentVersion?.version_number}
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    icon={<Trash2 size={14} />}
                    loading={uninstallMutation.isPending}
                    onClick={handleUninstall}
                  >
                    Uninstall
                  </Button>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    icon={<Download size={14} />}
                    loading={installMutation.isPending}
                    onClick={() => handleInstall(selectedInstallVersionId || undefined)}
                  >
                    Install to account
                  </Button>
                  {allVersions.length > 1 && (
                    <Select
                      value={selectedInstallVersionId}
                      onChange={(e) => setSelectedInstallVersionId(e.target.value)}
                      className="font-mono text-[12px]"
                    >
                      <option value="">Latest (v{currentVersion?.version_number})</option>
                      {allVersions.map((v) => (
                        <option key={v.id ?? v.version_number} value={v.id ?? ''}>
                          Pin v{v.version_number}
                        </option>
                      ))}
                    </Select>
                  )}
                </div>
              )}

              <Tooltip
                content={
                  canFork
                    ? 'Create an editable copy of this client tool in your personal workspace'
                    : 'Protected MCP server tools cannot be forked to client workspaces.'
                }
              >
                <span>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    icon={<GitFork size={14} />}
                    disabled={!canFork}
                    loading={forkMutation.isPending}
                    onClick={handleFork}
                  >
                    Fork tool
                  </Button>
                </span>
              </Tooltip>

              <div className="ml-auto">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  icon={<ShieldAlert size={14} className="text-muted hover:text-danger" />}
                  onClick={() => setReportDialogOpen(true)}
                >
                  Report
                </Button>
              </div>
            </div>

            {/* Warning if connector credentials missing */}
            {tool.requires_connector && !tool.has_connector_configured && (
              <div className="rounded-lg border border-warning-border bg-warning-tint p-3 text-[13px] text-warning flex items-start gap-2.5">
                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                <div>
                  <strong className="font-semibold">Missing connector configuration:</strong> This tool requires credentials for{' '}
                  <span className="font-mono">{tool.requires_connector}</span>. Please visit the{' '}
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      navigate('/connectors');
                    }}
                    className="underline font-semibold hover:text-primary focus:outline-none"
                  >
                    Connectors page
                  </button>{' '}
                  to save your credentials before running this tool in agents.
                </div>
              </div>
            )}

            {/* Attach to local Agent Form */}
            <form
              onSubmit={handleAttachToAgent}
              className="rounded-xl border border-subtle bg-app p-4 space-y-4"
            >
              <div className="space-y-0.5">
                <h3 className="text-[13px] font-semibold text-primary">
                  Attach to an Agent
                </h3>
                <p className="text-[12px] text-secondary">
                  Add this tool capability to one of your personal agents.
                </p>
              </div>

              {attachToolMutation.error && (
                <ErrorBanner error={attachToolMutation.error} />
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField label="Target Agent" htmlFor="mp-agent-select" required>
                  <Select
                    id="mp-agent-select"
                    required
                    value={selectedAgentId}
                    onChange={(e) => setSelectedAgentId(e.target.value)}
                  >
                    <option value="">Select an agent…</option>
                    {(agents ?? []).map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </Select>
                </FormField>

                <FormField label="Version Pinning" htmlFor="mp-version-select">
                  <Select
                    id="mp-version-select"
                    value={pinnedVersionToAttach}
                    onChange={(e) => setPinnedVersionToAttach(e.target.value)}
                    className="font-mono"
                  >
                    <option value="">Latest registered version</option>
                    {allVersions.map((v) => (
                      <option key={v.version_number} value={String(v.version_number)}>
                        Pin v{v.version_number}
                      </option>
                    ))}
                  </Select>
                </FormField>
              </div>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={!selectedAgentId}
                  loading={attachToolMutation.isPending}
                >
                  <Plus className="w-3.5 h-3.5" />
                  Attach to agent
                </Button>
              </div>
            </form>

            {/* Parameter Schema Block */}
            {currentVersion && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-medium text-secondary">
                      Input Parameter Schema (JSON Schema)
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(
                          JSON.stringify(currentVersion.schema_json ?? {}, null, 2)
                        );
                        toast.success('Schema copied to clipboard');
                      }}
                      className="inline-flex items-center gap-1 text-[11px] text-muted hover:text-primary transition-colors"
                    >
                      <Copy size={12} />
                      Copy JSON
                    </button>
                  </div>
                  <CodeBlock
                    code={JSON.stringify(currentVersion.schema_json ?? {}, null, 2)}
                    showLineNumbers
                    maxHeight="240px"
                  />
                </div>

                {/* Versions Changelog List */}
                {allVersions.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[12px] font-medium text-secondary">
                      Registered Versions ({allVersions.length})
                    </span>
                    <div className="divide-y divide-subtle border border-subtle rounded-lg bg-card overflow-hidden">
                      {allVersions.map((ver) => (
                        <div
                          key={ver.version_number}
                          className="flex items-center justify-between p-3 text-[12px]"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-semibold text-primary">
                              v{ver.version_number}
                            </span>
                            {ver.version_number === currentVersion.version_number && (
                              <Badge variant="neutral">Latest</Badge>
                            )}
                            {ver.version_number === tool.pinned_version_number && (
                              <Badge variant="success">Your Pin</Badge>
                            )}
                            {ver.capabilities_json.map((c) => (
                              <Badge key={c} variant="info" mono>
                                {c}
                              </Badge>
                            ))}
                          </div>
                          {ver.created_at && (
                            <span className="text-muted font-mono">
                              {formatDateTime(ver.created_at)}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Drawer>

      <ToolReportDialog
        open={reportDialogOpen}
        toolId={tool?.id ?? null}
        toolName={tool?.name ?? ''}
        onClose={() => setReportDialogOpen(false)}
      />
    </>
  );
}
