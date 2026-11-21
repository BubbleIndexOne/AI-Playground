/**
 * @fileoverview Community Marketplace discovery page.
 * Displays verified community tools and curated agent personas with full-text
 * search, category switching (Tools vs. Agents), quick adding, and workspace copying.
 */

import {
  Bot,
  Check,
  Copy,
  Download,
  Eye,
  MessageSquare,
  Plug,
  Plus,
  Search,
  SlidersHorizontal,
  Sparkles,
  Store,
  User,
  Wrench,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiError } from '../../../api/http/errors';
import { MarketplaceToolSummary } from '../../../api/types/marketplace.types';
import { ErrorBanner } from '../../../shared/components/ErrorBanner';
import {
  Badge,
  BlobbieAvatar,
  BlobbieConfig,
  Button,
  Card,
  CardGridSkeleton,
  CodeBlock,
  Dialog,
  EmptyState,
  fromSeed,
  Input,
  PageHeader,
  Select,
  toast,
  Tooltip,
} from '../../../shared/ui';
import { useAgentMutations, useAgentsQuery } from '../../agents/hooks/useAgents';
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

interface CommunityAgentTemplate {
  readonly id: string;
  readonly name: string;
  readonly role: string;
  readonly author: { readonly name: string; readonly handle: string };
  readonly avatar: BlobbieConfig;
  readonly description: string;
  readonly systemPrompt: string;
  readonly category: string;
  readonly tags: readonly string[];
  readonly addCount: number;
}

const COMMUNITY_AGENTS: ReadonlyArray<CommunityAgentTemplate> = [
  {
    id: 'agent-evelyn-reed',
    name: 'Dr. Evelyn Reed',
    role: 'Senior Research Scientist',
    author: { name: 'BubbleIndex Verified', handle: 'research' },
    avatar: {
      ...fromSeed('dr-evelyn-reed-research'),
      color: '#6366f1',
      sides: 4,
      round: 0.55,
    },
    description:
      'Quantitative reasoning specialist with LaTeX mathematical verification, structured thesis formulation, and deep literature synthesis.',
    systemPrompt:
      'You are Dr. Evelyn Reed, a Senior Research Scientist and Mathematical Verification Specialist. Provide rigorous analytical explanations, compute exact answers step-by-step, format mathematical formulas cleanly in KaTeX LaTeX ($...$ and $$...$$), and synthesize structured findings.',
    category: 'Research & Math',
    tags: ['Quantitative', 'LaTeX Math', 'Research'],
    addCount: 1420,
  },
  {
    id: 'agent-atlas-architect',
    name: 'Atlas Architect',
    role: 'Senior Software Architect',
    author: { name: 'DevOps Working Group', handle: 'infra' },
    avatar: {
      ...fromSeed('atlas-architect-system'),
      color: '#10b981',
      sides: 6,
      round: 0.35,
    },
    description:
      'Analyzes system boundaries, enforces clean architectural boundaries, strict type safety, modularity, and distributed resilience.',
    systemPrompt:
      'You are Atlas, a Senior Software Architect. Guide technical designs, evaluate edge cases, suggest robust design patterns, and ensure strict type safety, modular decoupling, and high performance.',
    category: 'Engineering',
    tags: ['Architecture', 'TypeScript', 'Review'],
    addCount: 1180,
  },
  {
    id: 'agent-clara-storyteller',
    name: 'Clara Storyteller',
    role: 'Creative Narrative & Copy Lead',
    author: { name: 'Creative Commons', handle: 'editorial' },
    avatar: {
      ...fromSeed('clara-storyteller-creative'),
      color: '#f59e0b',
      sides: 0,
      round: 0.75,
    },
    description:
      'Crafts compelling narrative voice, vivid copy, educational walkthroughs, and storytelling tailored to specific target audiences.',
    systemPrompt:
      'You are Clara, a Creative Narrative Director. Help write compelling copy, clear documentation, engaging dialogue, and vivid prose with empathetic and lively tone.',
    category: 'Writing',
    tags: ['Creative', 'Narrative', 'Documentation'],
    addCount: 930,
  },
  {
    id: 'agent-datapulse-lead',
    name: 'DataPulse Analyst',
    role: 'Applied Data Scientist',
    author: { name: 'DataLab Guild', handle: 'analytics' },
    avatar: {
      ...fromSeed('datapulse-analyst-data'),
      color: '#8b5cf6',
      sides: 0,
      round: 0.85,
    },
    description:
      'Transforms complex datasets into statistical models, metric definitions, and actionable, executive-ready analytical insights.',
    systemPrompt:
      'You are DataPulse, an Applied Data Scientist. Formulate analytical hypotheses, compute descriptive and inferential statistics, interpret datasets, and deliver clear metrics.',
    category: 'Data',
    tags: ['Data Science', 'Statistics', 'Metrics'],
    addCount: 875,
  },
  {
    id: 'agent-kira-troubleshooter',
    name: 'Kira Troubleshooter',
    role: 'Customer Support & Debug Lead',
    author: { name: 'Support Ops Guild', handle: 'helpdesk' },
    avatar: {
      ...fromSeed('kira-troubleshooter-support'),
      color: '#06b6d4',
      sides: 0,
      point: 0.35,
    },
    description:
      'Empathetic, clear, and structured troubleshooting for end-users, handling issue triage and root-cause explanations with patience.',
    systemPrompt:
      'You are Kira, a patient and knowledgeable Customer Experience and Troubleshooting Specialist. Walk users through diagnostic steps calmly and systematically.',
    category: 'Operations',
    tags: ['Support', 'Troubleshooting', 'Triage'],
    addCount: 760,
  },
  {
    id: 'agent-sentinel-qa',
    name: 'Sentinel QA',
    role: 'QA & Security Specialist',
    author: { name: 'SecOps Network', handle: 'security' },
    avatar: {
      ...fromSeed('sentinel-qa-security-auditor'),
      color: '#ec4899',
      sides: 4,
      round: 0.45,
    },
    description:
      'Audits edge cases, boundary parameters, regression tests, and security invariants across software systems and APIs.',
    systemPrompt:
      'You are Sentinel, a strict QA and Security Specialist. Identify boundary edge cases, simulate failure modes, verify validation schemas, and ensure rock-solid resilience.',
    category: 'Engineering',
    tags: ['QA', 'Security', 'Edge Cases'],
    addCount: 690,
  },
];

const AGENT_CATEGORY_CHIPS: ReadonlyArray<string> = [
  'All categories',
  'Research & Math',
  'Engineering',
  'Writing',
  'Data',
  'Operations',
];

export function MarketplacePage() {
  const navigate = useNavigate();

  // Top level category switcher: Tools vs Agents
  const [activeCategory, setActiveCategory] = useState<'tools' | 'agents'>('tools');

  // Tools state
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'client' | 'mcp' | ''>('');
  const [sortOption, setSortOption] = useState<SortOrder>('popular');
  const [selectedToolId, setSelectedToolId] = useState<string | null>(null);

  // Agents state
  const [agentSearchQuery, setAgentSearchQuery] = useState('');
  const [agentCategoryFilter, setAgentCategoryFilter] = useState('All categories');
  const [previewAgent, setPreviewAgent] = useState<CommunityAgentTemplate | null>(null);
  const [addingAgentId, setAddingAgentId] = useState<string | null>(null);

  // Queries and mutations
  const {
    data: marketplaceData,
    isLoading: isToolsLoading,
    error: toolsError,
  } = useMarketplaceToolsQuery({
    q: searchQuery.trim() || undefined,
    type: typeFilter || undefined,
    sort: sortOption,
    limit: 30,
  });

  const { data: userAgents } = useAgentsQuery();
  const { saveAgentMutation } = useAgentMutations();
  const { installMutation, uninstallMutation, forkMutation } =
    useMarketplaceMutations();

  const [copyingToolId, setCopyingToolId] = useState<string | null>(null);
  const [togglingToolId, setTogglingToolId] = useState<string | null>(null);

  const tools = marketplaceData?.tools ?? [];

  // Map user agents by lowercase name for instant duplicate/installed detection
  const existingAgentNameMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const a of userAgents ?? []) {
      map.set(a.name.toLowerCase().trim(), a.id);
    }
    return map;
  }, [userAgents]);

  const handleQuickAddToolToggle = async (
    e: React.MouseEvent,
    tool: MarketplaceToolSummary
  ) => {
    e.stopPropagation();
    setTogglingToolId(tool.id);
    try {
      if (tool.is_installed) {
        await uninstallMutation.mutateAsync(tool.id);
        toast.info('Tool removed', `Removed ${tool.name} from your pool.`);
      } else {
        await installMutation.mutateAsync({ id: tool.id });
        toast.success('Tool added', `Pinned ${tool.name} to your pool.`);
      }
    } catch (err) {
      toast.error('Action failed', err instanceof Error ? err.message : String(err));
    } finally {
      setTogglingToolId(null);
    }
  };

  const handleQuickCopyTool = async (
    e: React.MouseEvent,
    tool: MarketplaceToolSummary
  ) => {
    e.stopPropagation();
    if (tool.is_mcp_hosted || !tool.allow_client_execution) {
      toast.info(
        'Protected tool',
        'Protected MCP server tools cannot be copied to client workspace.'
      );
      return;
    }

    setCopyingToolId(tool.id);
    try {
      const res = await forkMutation.mutateAsync(tool.id);
      toast.success('Tool copied', `Copied ${res.tool.name} into your workspace.`);
      navigate(`/tools/${res.tool.id}`);
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        toast.error('Copying forbidden', 'Protected server tools cannot be copied.');
        return;
      }
      toast.error('Copy failed', err instanceof Error ? err.message : String(err));
    } finally {
      setCopyingToolId(null);
    }
  };

  const handleAddAgent = async (
    e: React.MouseEvent,
    template: CommunityAgentTemplate
  ) => {
    e.stopPropagation();
    setAddingAgentId(template.id);
    try {
      const created = await saveAgentMutation.mutateAsync({
        name: template.name,
        description: template.description,
        systemPrompt: template.systemPrompt,
        avatar: template.avatar,
        modelPresetId: '',
        attachedTools: [],
        attachedConnectors: [],
      });
      toast.success(
        'Agent added',
        `Added "${template.name}" to your workspace.`
      );
      if (created?.id) {
        navigate(`/chat?agentId=${created.id}`);
      }
    } catch (err) {
      toast.error(
        'Failed to add agent',
        err instanceof Error ? err.message : String(err)
      );
    } finally {
      setAddingAgentId(null);
    }
  };

  // Filtered community agents
  const filteredAgents = useMemo(() => {
    return COMMUNITY_AGENTS.filter((agent) => {
      if (
        agentCategoryFilter !== 'All categories' &&
        agent.category !== agentCategoryFilter
      ) {
        return false;
      }
      if (agentSearchQuery.trim()) {
        const query = agentSearchQuery.toLowerCase();
        const matchesName = agent.name.toLowerCase().includes(query);
        const matchesRole = agent.role.toLowerCase().includes(query);
        const matchesDesc = agent.description.toLowerCase().includes(query);
        const matchesTags = agent.tags.some((t) => t.toLowerCase().includes(query));
        return matchesName || matchesRole || matchesDesc || matchesTags;
      }
      return true;
    });
  }, [agentSearchQuery, agentCategoryFilter]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Marketplace"
        description="Browse, add, and copy verified community tools and curated agents for your workspace."
      />

      {/* Primary Category Switcher: Tools vs Agents */}
      <div className="flex items-center gap-2 border-b border-subtle pb-3">
        <button
          type="button"
          onClick={() => setActiveCategory('tools')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium transition-all ${
            activeCategory === 'tools'
              ? 'bg-accent text-white shadow-sm'
              : 'text-secondary hover:text-primary hover:bg-hover'
          }`}
        >
          <Wrench size={14} />
          <span>Tools</span>
          <span
            className={`text-[11px] px-1.5 py-0.5 rounded-full font-mono ${
              activeCategory === 'tools'
                ? 'bg-white/20 text-white'
                : 'bg-muted/20 text-muted'
            }`}
          >
            {tools.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveCategory('agents')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium transition-all ${
            activeCategory === 'agents'
              ? 'bg-accent text-white shadow-sm'
              : 'text-secondary hover:text-primary hover:bg-hover'
          }`}
        >
          <Bot size={14} />
          <span>Agents</span>
          <span
            className={`text-[11px] px-1.5 py-0.5 rounded-full font-mono ${
              activeCategory === 'agents'
                ? 'bg-white/20 text-white'
                : 'bg-accent/20 text-accent font-semibold'
            }`}
          >
            {COMMUNITY_AGENTS.length}
          </span>
        </button>
      </div>

      {/* ===================== TOOLS VIEW ===================== */}
      {activeCategory === 'tools' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Tools Filter and Search Controls */}
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

          {toolsError && (
            <ErrorBanner error={toolsError} title="Failed to load marketplace tools" />
          )}

          {isToolsLoading ? (
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
                const canCopy = tool.allow_client_execution && !tool.is_mcp_hosted;
                return (
                  <Card
                    key={tool.id}
                    interactive
                    onClick={() => setSelectedToolId(tool.id)}
                    className="flex flex-col justify-between gap-4 p-4 hover:border-accent/40 transition-all cursor-pointer"
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
                            Added
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        {canCopy && (
                          <Tooltip content="Make an editable copy in your workspace">
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              icon={<Copy size={13} />}
                              loading={forkMutation.isPending && copyingToolId === tool.id}
                              disabled={forkMutation.isPending && copyingToolId !== tool.id}
                              onClick={(e) => handleQuickCopyTool(e, tool)}
                            >
                              Copy
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
                              <Plus size={13} />
                            )
                          }
                          loading={
                            (installMutation.isPending || uninstallMutation.isPending) &&
                            togglingToolId === tool.id
                          }
                          disabled={
                            (installMutation.isPending || uninstallMutation.isPending) &&
                            togglingToolId !== tool.id
                          }
                          onClick={(e) => handleQuickAddToolToggle(e, tool)}
                        >
                          {tool.is_installed ? 'Added' : 'Add'}
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ===================== AGENTS VIEW ===================== */}
      {activeCategory === 'agents' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Agent Search and Category Chips */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[240px] max-w-md">
              <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <Input
                type="search"
                value={agentSearchQuery}
                onChange={(e) => setAgentSearchQuery(e.target.value)}
                placeholder="Search agents by role, skill, prompt keywords…"
                className="pl-9"
              />
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {AGENT_CATEGORY_CHIPS.map((cat) => {
                const active = agentCategoryFilter === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setAgentCategoryFilter(cat)}
                    className={`px-3 py-1 rounded-md text-[12px] font-medium transition-colors ${
                      active
                        ? 'bg-accent text-white'
                        : 'text-secondary hover:text-primary hover:bg-hover'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {filteredAgents.length === 0 ? (
            <EmptyState
              icon={<Bot className="w-5 h-5" />}
              title="No agents found"
              description="Try adjusting your search query or category filter."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAgents.map((template) => {
                const existingId = existingAgentNameMap.get(template.name.toLowerCase().trim());
                const isAlreadyAdded = Boolean(existingId);
                const isAdding = addingAgentId === template.id;

                return (
                  <Card
                    key={template.id}
                    interactive
                    onClick={() => setPreviewAgent(template)}
                    className="flex flex-col justify-between gap-4 p-4 hover:border-accent/40 transition-all cursor-pointer group"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <BlobbieAvatar
                            config={template.avatar}
                            size="md"
                            title={template.name}
                          />
                          <div className="min-w-0">
                            <h3 className="text-[15px] font-semibold text-primary truncate group-hover:text-accent transition-colors">
                              {template.name}
                            </h3>
                            <div className="text-[11px] text-muted truncate">
                              {template.role} · <span className="font-mono">@{template.author.handle}</span>
                            </div>
                          </div>
                        </div>

                        <Badge variant="neutral" mono className="text-[10px]">
                          {template.category}
                        </Badge>
                      </div>

                      <p className="text-[13px] text-secondary line-clamp-3 min-h-[54px]">
                        {template.description}
                      </p>

                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        {template.tags.map((tag) => (
                          <Badge key={tag} variant="info" mono className="text-[10px]">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-3 border-t border-subtle">
                      <div className="flex items-center gap-2 text-[12px] text-muted">
                        <span className="inline-flex items-center gap-1">
                          <Sparkles size={12} className="text-accent" />
                          {template.addCount} uses
                        </span>
                        {isAlreadyAdded && (
                          <Badge variant="success" className="text-[11px]">
                            Added
                          </Badge>
                        )}
                      </div>

                      <div
                        className="flex items-center gap-1.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Tooltip content="Preview agent instructions & prompt">
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            icon={<Eye size={13} />}
                            onClick={() => setPreviewAgent(template)}
                          >
                            Preview
                          </Button>
                        </Tooltip>

                        {isAlreadyAdded ? (
                          <Button
                            type="button"
                            variant="primary"
                            size="sm"
                            icon={<MessageSquare size={13} />}
                            onClick={() => navigate(`/chat?agentId=${existingId}`)}
                          >
                            Chat
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            variant="primary"
                            size="sm"
                            icon={<Plus size={13} />}
                            loading={isAdding}
                            disabled={isAdding}
                            onClick={(e) => handleAddAgent(e, template)}
                          >
                            Add
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tool Detail Drawer */}
      <MarketplaceToolDetailModal
        toolIdOrSlug={selectedToolId}
        onClose={() => setSelectedToolId(null)}
      />

      {/* Agent Template Preview Dialog */}
      {previewAgent && (
        <Dialog
          open={Boolean(previewAgent)}
          onClose={() => setPreviewAgent(null)}
          title={previewAgent.name}
          description={`${previewAgent.role} · by ${previewAgent.author.name} (@${previewAgent.author.handle})`}
          maxWidth="lg"
          footer={
            <div className="flex items-center justify-between w-full">
              <span className="text-[12px] text-muted">
                Category: <strong className="text-primary">{previewAgent.category}</strong>
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPreviewAgent(null)}
                >
                  Close
                </Button>
                {existingAgentNameMap.has(previewAgent.name.toLowerCase().trim()) ? (
                  <Button
                    variant="primary"
                    size="sm"
                    icon={<MessageSquare size={14} />}
                    onClick={() => {
                      const id = existingAgentNameMap.get(previewAgent.name.toLowerCase().trim());
                      setPreviewAgent(null);
                      navigate(`/chat?agentId=${id}`);
                    }}
                  >
                    Open Chat
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    icon={<Plus size={14} />}
                    loading={addingAgentId === previewAgent.id}
                    onClick={async (e) => {
                      await handleAddAgent(e, previewAgent);
                      setPreviewAgent(null);
                    }}
                  >
                    Add to My Agents
                  </Button>
                )}
              </div>
            </div>
          }
        >
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-raised/40 border border-subtle">
              <BlobbieAvatar config={previewAgent.avatar} size="lg" title={previewAgent.name} />
              <div>
                <h4 className="text-[15px] font-semibold text-primary">{previewAgent.name}</h4>
                <p className="text-[13px] text-secondary">{previewAgent.description}</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[12px] font-medium text-secondary">
                  System Instructions & Prompt
                </label>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(previewAgent.systemPrompt);
                    toast.success('Prompt copied to clipboard');
                  }}
                  className="inline-flex items-center gap-1 text-[11px] text-muted hover:text-primary transition-colors"
                >
                  <Copy size={12} />
                  Copy prompt
                </button>
              </div>
              <CodeBlock code={previewAgent.systemPrompt} maxHeight="200px" />
            </div>

            <div className="space-y-1.5">
              <label className="text-[12px] font-medium text-secondary">Capabilities & Tags</label>
              <div className="flex flex-wrap items-center gap-1.5">
                {previewAgent.tags.map((tag) => (
                  <Badge key={tag} variant="info" mono>
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}
