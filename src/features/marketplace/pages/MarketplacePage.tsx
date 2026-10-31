import { Plus, Search, Store } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Tool } from '../../../api/types/tools.types';
import { ToolStatus, ToolType } from '../../../domain/enums';
import { ErrorBanner } from '../../../shared/components/ErrorBanner';
import {
  Badge,
  Button,
  Card,
  CardGridSkeleton,
  EmptyState,
  Input,
  PageHeader,
} from '../../../shared/ui';
import { useToolsListQuery } from '../../tools/hooks/useTools';
import { MarketplaceToolDetailModal } from '../components/MarketplaceToolDetailModal';

const TYPE_CHIPS: ReadonlyArray<{ value: ToolType | ''; label: string }> = [
  { value: '', label: 'All' },
  { value: ToolType.Client, label: 'Client' },
  { value: ToolType.Mcp, label: 'MCP' },
];

export function MarketplacePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<ToolType | ''>('');
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);

  const { data: tools, isLoading, error } = useToolsListQuery({
    include_public: true,
  });

  const filteredTools = useMemo(() => {
    const publicVerified = (tools ?? []).filter(
      (t) => t.is_public || t.status === ToolStatus.Verified
    );
    return publicVerified.filter((tool) => {
      if (typeFilter && tool.type !== typeFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const nameMatch = tool.name.toLowerCase().includes(q);
        const descMatch = (tool.description ?? '').toLowerCase().includes(q);
        return nameMatch || descMatch;
      }
      return true;
    });
  }, [tools, typeFilter, searchQuery]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Marketplace"
        description="Browse verified public tools and attach them to your agents."
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <Input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tools by name or description…"
            className="pl-9"
          />
        </div>

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
      </div>

      {error && <ErrorBanner error={error} title="Failed to load marketplace" />}

      {isLoading ? (
        <CardGridSkeleton count={4} />
      ) : filteredTools.length === 0 ? (
        <EmptyState
          icon={<Store className="w-5 h-5" />}
          title="No public tools found"
          description="Verified public tools appear here once published."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTools.map((tool) => {
            const capabilities = tool.current_version?.capabilities_json ?? [];
            return (
              <Card
                key={tool.id}
                interactive
                onClick={() => setSelectedTool(tool)}
                className="flex flex-col justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-[15px] font-semibold text-primary truncate">
                      {tool.name}
                    </h3>
                    <Badge variant="neutral" mono>
                      {tool.type}
                    </Badge>
                  </div>

                  <p className="text-[13px] text-secondary line-clamp-2 min-h-[38px]">
                    {tool.description || 'No description provided.'}
                  </p>

                  {capabilities.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {capabilities.map((cap) => (
                        <Badge key={cap} variant="info" mono>
                          {cap}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between gap-2 pt-3 border-t border-subtle">
                  <span className="text-[12px] font-mono text-muted">
                    {tool.current_version
                      ? `v${tool.current_version.version}`
                      : 'Unversioned'}
                  </span>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedTool(tool);
                    }}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add to agent
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <MarketplaceToolDetailModal
        tool={selectedTool}
        onClose={() => setSelectedTool(null)}
      />
    </div>
  );
}
