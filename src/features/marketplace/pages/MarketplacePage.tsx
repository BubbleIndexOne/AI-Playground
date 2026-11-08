/**
 * @fileoverview Community Marketplace discovery page.
 * Displays verified community tools with server-side full-text search,
 * execution tier filters, installation counters, forking, and version pinning.
 */

import {
  Check,
  Download,
  GitFork,
  Plug,
  Search,
  SlidersHorizontal,
  Store,
  User,
} from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiError } from '../../../api/http/errors';
import { MarketplaceToolSummary } from '../../../api/types/marketplace.types';
import { ErrorBanner } from '../../../shared/components/ErrorBanner';
import {
  Badge,
  Button,
  Card,
  CardGridSkeleton,
  EmptyState,
  Input,
  PageHeader,
  Select,
  toast,
  Tooltip,
} from '../../../shared/ui';
import { MarketplaceToolDetailModal } from '../components/MarketplaceToolDetailModal';
import {
  useMarketplaceMutations,
  useMarketplaceToolsQuery,
} from '../hooks/useMarketplace';

const TYPE_CHIPS: ReadonlyArray<{ value: 'client' | 'mcp' | ''; label: string }> = [
  { value: '', label: 'All types' },
  { value: 'client', label: 'Client' },
  { value: 'mcp', label: 'MCP' },
];

type SortOrder = 'popular' | 'recent' | 'name';

export function MarketplacePage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'client' | 'mcp' | ''>('');
  const [sortOption, setSortOption] = useState<SortOrder>('popular');
  const [selectedToolId, setSelectedToolId] = useState<string | null>(null);

  const {
    data: marketplaceData,
    isLoading,
    error,
  } = useMarketplaceToolsQuery({
    q: searchQuery.trim() || undefined,
    type: typeFilter || undefined,
    sort: sortOption,
    limit: 30,
  });

  const { installMutation, uninstallMutation, forkMutation } =
    useMarketplaceMutations();

  const tools = marketplaceData?.tools ?? [];

  const handleQuickInstallToggle = async (
    e: React.MouseEvent,
    tool: MarketplaceToolSummary
  ) => {
    e.stopPropagation();
    try {
      if (tool.is_installed) {
        await uninstallMutation.mutateAsync(tool.id);
        toast.info('Tool uninstalled', `Removed ${tool.name} from your pool.`);
      } else {
        await installMutation.mutateAsync({ id: tool.id });
        toast.success('Tool installed', `Pinned ${tool.name} to your pool.`);
      }
    } catch (err) {
      toast.error('Action failed', err instanceof Error ? err.message : String(err));
    }
  };

  const handleQuickFork = async (
    e: React.MouseEvent,
    tool: MarketplaceToolSummary
  ) => {
    e.stopPropagation();
    if (tool.is_mcp_hosted || !tool.allow_client_execution) {
      toast.info(
        'Protected tool',
        'Protected MCP server tools cannot be forked to client workspace.'
      );
      return;
    }

    try {
      const res = await forkMutation.mutateAsync(tool.id);
      toast.success('Tool forked', `Forked ${res.tool.name} into your workspace.`);
      navigate(`/tools/${res.tool.id}`);
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        toast.error('Forking forbidden', 'Protected server tools cannot be forked.');
        return;
      }
      toast.error('Fork failed', err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Marketplace"
        description="Browse, install, and fork verified community tools for your agents."
      />

      {/* Filter and Search Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <Input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tools by name, description, tags…"
            className="pl-9"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="inline-flex items-center gap-1 rounded-lg border border-subtle bg-card p-1">
            {TYPE_CHIPS.map((chip) => {
              const active = typeFilter === chip.value;
              return (
                <button
                  key={chip.label}
                  type="button"
                  onClick={() => setTypeFilter(chip.value)}
                  className={`px-3 py-1 rounded-md text-[12px] font-medium transition-colors ${
                    active
                      ? 'bg-accent text-white'
                      : 'text-secondary hover:text-primary hover:bg-hover'
                  }`}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-1.5 text-[12px] text-secondary">
            <SlidersHorizontal size={13} className="text-muted" />
            <Select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as SortOrder)}
              className="w-28 text-[12px]"
            >
              <option value="popular">Most popular</option>
              <option value="recent">Recently added</option>
              <option value="name">Alphabetical</option>
            </Select>
          </div>
        </div>
      </div>

      {error && <ErrorBanner error={error} title="Failed to load marketplace tools" />}

      {isLoading ? (
        <CardGridSkeleton count={6} />
      ) : tools.length === 0 ? (
        <EmptyState
          icon={<Store className="w-5 h-5" />}
          title="No marketplace tools found"
          description={
            searchQuery || typeFilter
              ? 'Try adjusting your search criteria or filters.'
              : 'Verified public tools will appear here once published.'
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tools.map((tool) => {
            const canFork = tool.allow_client_execution && !tool.is_mcp_hosted;
            return (
              <Card
                key={tool.id}
                interactive
                onClick={() => setSelectedToolId(tool.id)}
                className="flex flex-col justify-between gap-4 p-4 hover:border-accent/40 transition-all"
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="text-[15px] font-semibold text-primary truncate">
                        {tool.name}
                      </h3>
                      <div className="flex items-center gap-1.5 text-[11px] text-muted truncate mt-0.5">
                        <User size={11} className="shrink-0" />
                        <span>{tool.author.display_name}</span>
                        {tool.author.handle && (
                          <span className="font-mono">(@{tool.author.handle})</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <Badge variant={tool.type === 'client' ? 'neutral' : 'info'} mono>
                        {tool.type.toUpperCase()}
                      </Badge>
                      {tool.is_mcp_hosted && (
                        <Badge variant="success">MCP</Badge>
                      )}
                    </div>
                  </div>

                  <p className="text-[13px] text-secondary line-clamp-2 min-h-[38px]">
                    {tool.description || 'No description provided.'}
                  </p>

                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {tool.capabilities.map((cap) => (
                      <Badge key={cap} variant="info" mono>
                        {cap}
                      </Badge>
                    ))}
                    {tool.requires_connector && (
                      <Badge
                        variant={tool.has_connector_configured ? 'neutral' : 'warning'}
                        className="gap-1"
                      >
                        <Plug size={10} />
                        {tool.requires_connector}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-3 border-t border-subtle">
                  <div className="flex items-center gap-2 text-[12px] text-muted">
                    <span className="inline-flex items-center gap-1">
                      <Download size={12} />
                      {tool.install_count}
                    </span>
                    {tool.is_installed && (
                      <Badge variant="success" className="text-[11px]">
                        Installed
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {canFork && (
                      <Tooltip content="Fork client tool into personal workspace">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          icon={<GitFork size={13} />}
                          loading={forkMutation.isPending}
                          onClick={(e) => handleQuickFork(e, tool)}
                        >
                          Fork
                        </Button>
                      </Tooltip>
                    )}

                    <Button
                      type="button"
                      variant={tool.is_installed ? 'secondary' : 'primary'}
                      size="sm"
                      icon={
                        tool.is_installed ? (
                          <Check size={13} className="text-success" />
                        ) : (
                          <Download size={13} />
                        )
                      }
                      loading={
                        installMutation.isPending || uninstallMutation.isPending
                      }
                      onClick={(e) => handleQuickInstallToggle(e, tool)}
                    >
                      {tool.is_installed ? 'Installed' : 'Install'}
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <MarketplaceToolDetailModal
        toolIdOrSlug={selectedToolId}
        onClose={() => setSelectedToolId(null)}
      />
    </div>
  );
}
