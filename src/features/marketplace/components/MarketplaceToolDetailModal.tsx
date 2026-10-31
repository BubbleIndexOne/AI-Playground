import { FormEvent, useState } from 'react';
import { Tool } from '../../../api/types/tools.types';
import { ErrorBanner } from '../../../shared/components/ErrorBanner';
import {
  Badge,
  Button,
  CodeBlock,
  Drawer,
  FormField,
  Select,
  ToolStatusBadge,
  toast,
} from '../../../shared/ui';
import { useAgentMutations, useAgentsQuery } from '../../agents/hooks/useAgents';
import { useToolVersionsQuery } from '../../tools/hooks/useTools';

interface MarketplaceToolDetailModalProps {
  readonly tool: Tool | null;
  readonly onClose: () => void;
}

export function MarketplaceToolDetailModal({
  tool,
  onClose,
}: MarketplaceToolDetailModalProps) {
  const { data: versions } = useToolVersionsQuery(tool?.id);
  const { data: agents } = useAgentsQuery();
  const { attachToolMutation } = useAgentMutations();

  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [pinnedVersion, setPinnedVersion] = useState<string>('');

  if (!tool) return null;

  const allVersions = versions ?? tool.versions ?? [];
  const activeVersion = tool.current_version ?? allVersions[0] ?? null;

  const handleAttachToAgent = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedAgentId) return;
    await attachToolMutation.mutateAsync({
      agentId: selectedAgentId,
      toolId: tool.id,
      pinnedVersion: pinnedVersion ? Number(pinnedVersion) : null,
    });
    const agentName =
      agents?.find((a) => a.id === selectedAgentId)?.name ?? 'Agent';
    toast.success(
      'Tool added to agent',
      `Added "${tool.name}"${pinnedVersion ? ` (v${pinnedVersion})` : ''} to ${agentName}.`
    );
  };

  return (
    <Drawer
      open={Boolean(tool)}
      title={tool.name}
      description={tool.description ?? 'Verified marketplace tool.'}
      width="xl"
      onClose={onClose}
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-2">
          <ToolStatusBadge status={tool.status} />
          <Badge variant="neutral" mono>
            {tool.type}
          </Badge>
          {activeVersion && (
            <Badge variant="neutral" mono>
              v{activeVersion.version}
            </Badge>
          )}
          {(activeVersion?.capabilities_json ?? []).map((cap) => (
            <Badge key={cap} variant="info" mono>
              {cap}
            </Badge>
          ))}
        </div>

        <form
          onSubmit={handleAttachToAgent}
          className="rounded-xl border border-subtle bg-app p-4 space-y-4"
        >
          <div className="space-y-0.5">
            <h3 className="text-[13px] font-semibold text-primary">
              Add to agent
            </h3>
            <p className="text-[12px] text-secondary">
              Attach this tool to an existing agent and optionally pin a specific version.
            </p>
          </div>

          {attachToolMutation.error && (
            <ErrorBanner error={attachToolMutation.error} />
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Agent" htmlFor="mp-agent-select">
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

            <FormField label="Version" htmlFor="mp-version-select">
              <Select
                id="mp-version-select"
                value={pinnedVersion}
                onChange={(e) => setPinnedVersion(e.target.value)}
                className="font-mono"
              >
                <option value="">Latest version</option>
                {allVersions.map((v) => (
                  <option key={v.version} value={String(v.version)}>
                    Pin v{v.version}
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
              Add to agent
            </Button>
          </div>
        </form>

        {activeVersion && (
          <div className="space-y-5">
            <div className="space-y-1.5">
              <span className="text-[12px] font-medium text-secondary">
                Source code
              </span>
              <CodeBlock
                code={activeVersion.code ?? '// No client source code (MCP tool)'}
                showLineNumbers
                maxHeight="240px"
              />
            </div>

            <div className="space-y-1.5">
              <span className="text-[12px] font-medium text-secondary">
                Parameter schema
              </span>
              <CodeBlock
                code={JSON.stringify(activeVersion.schema_json ?? {}, null, 2)}
                showLineNumbers
                maxHeight="240px"
              />
            </div>

            {allVersions.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[12px] font-medium text-secondary">
                  Published versions ({allVersions.length})
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {allVersions.map((v) => (
                    <Badge key={v.version} variant="neutral" mono>
                      v{v.version}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Drawer>
  );
}
