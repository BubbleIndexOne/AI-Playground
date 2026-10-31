import { Edit3 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ToolTestResults } from '../../../api/types/tools.types';
import { ToolType } from '../../../domain/enums';
import { ErrorBanner } from '../../../shared/components/ErrorBanner';
import {
  Badge,
  Button,
  Card,
  KeyValueList,
  PageHeader,
  Skeleton,
  Tabs,
  toast,
} from '../../../shared/ui';
import { formatDateTime } from '../../../shared/utils/formatters';
import { SandboxTestPanel } from '../components/SandboxTestPanel';
import { ToolLifecycleStepper } from '../components/ToolLifecycleStepper';
import { ToolMetadataModal } from '../components/ToolMetadataModal';
import { ToolPublishingPanel } from '../components/ToolPublishingPanel';
import { ToolVersionEditor } from '../components/ToolVersionEditor';
import { ToolVersionsAndDiffPanel } from '../components/ToolVersionsAndDiffPanel';
import {
  useToolDetailQuery,
  useToolMutations,
  useToolVersionsQuery,
} from '../hooks/useTools';

const DEFAULT_CLIENT_CODE = `export default async function run(params) {
  return {
    content: {
      received: params,
      processedAt: new Date().toISOString(),
    },
  };
}
`;

const DEFAULT_SCHEMA_JSON = {
  type: 'object',
  properties: {
    query: {
      type: 'string',
      description: 'Input query string',
    },
  },
  required: ['query'],
};

type ToolTab =
  | 'overview'
  | 'code'
  | 'schema'
  | 'versions'
  | 'test'
  | 'publishing';

export function ToolDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: tool, isLoading, error } = useToolDetailQuery(id);
  const { data: versionsList } = useToolVersionsQuery(id);
  const { createVersionMutation } = useToolMutations(id);

  const [activeTab, setActiveTab] = useState<ToolTab>('overview');
  const [editMetaOpen, setEditMetaOpen] = useState(false);

  const allVersions = versionsList ?? tool?.versions ?? [];
  const currentVersion = tool?.current_version ?? allVersions[0] ?? null;
  const isClientTool = tool?.type === ToolType.Client;

  const [code, setCode] = useState(DEFAULT_CLIENT_CODE);
  const [schemaText, setSchemaText] = useState(
    JSON.stringify(DEFAULT_SCHEMA_JSON, null, 2)
  );
  const [capabilities, setCapabilities] = useState<string[]>([]);
  const [attachedTestResults, setAttachedTestResults] =
    useState<ToolTestResults | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (!tool) return;
    const ver = tool.current_version ?? allVersions[0] ?? null;
    if (ver) {
      setCode(tool.type === ToolType.Client ? ver.code ?? '' : '');
      setSchemaText(JSON.stringify(ver.schema_json ?? {}, null, 2));
      setCapabilities(ver.capabilities_json ?? []);
      setAttachedTestResults(ver.test_results_json ?? null);
    } else {
      setCode(tool.type === ToolType.Client ? DEFAULT_CLIENT_CODE : '');
      setSchemaText(JSON.stringify(DEFAULT_SCHEMA_JSON, null, 2));
      setCapabilities([]);
      setAttachedTestResults(null);
    }
  }, [tool, allVersions.length]);

  if (isLoading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }

  if (error || !tool) {
    return <ErrorBanner error={error ?? new Error('Tool not found')} />;
  }

  let parsedSchema: Record<string, unknown> = {};
  try {
    const raw = JSON.parse(schemaText);
    if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
      parsedSchema = raw as Record<string, unknown>;
    }
  } catch {
    // Handled on save
  }

  const handleSaveVersion = async (overrideTestResult?: ToolTestResults) => {
    setValidationError(null);
    if (isClientTool && !code.trim()) {
      setValidationError('Client tools require JavaScript module code.');
      return;
    }
    if (!isClientTool && code.trim().length > 0) {
      setValidationError('MCP tools must not include code.');
      return;
    }

    let validSchema: Record<string, unknown>;
    try {
      const parsed = JSON.parse(schemaText);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        setValidationError('Schema must be a valid JSON object.');
        return;
      }
      validSchema = parsed as Record<string, unknown>;
    } catch (err) {
      setValidationError(
        `Invalid JSON schema: ${err instanceof Error ? err.message : String(err)}`
      );
      return;
    }

    const nextTestResults = overrideTestResult ?? attachedTestResults;
    const created = await createVersionMutation.mutateAsync({
      code: isClientTool ? code : null,
      schema_json: validSchema,
      capabilities_json: capabilities,
      test_results_json: nextTestResults,
    });
    if (overrideTestResult) {
      setAttachedTestResults(overrideTestResult);
    }
    toast.success(`Saved version ${created.version}`);
  };

  const toggleCapability = (capId: string) => {
    setCapabilities((prev) =>
      prev.includes(capId) ? prev.filter((c) => c !== capId) : [...prev, capId]
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[
          { label: 'Tools', to: '/tools' },
          { label: tool.name },
          ...(currentVersion
            ? [{ label: `Version ${currentVersion.version}` }]
            : []),
        ]}
        title={tool.name}
        description={tool.description || 'No description provided.'}
        actions={
          <Button
            variant="secondary"
            size="md"
            icon={<Edit3 size={15} />}
            onClick={() => setEditMetaOpen(true)}
          >
            Edit details
          </Button>
        }
      />

      <ToolLifecycleStepper
        status={tool.status}
        rejectionReason={tool.rejection_reason ?? tool.reason}
      />

      <Tabs<ToolTab>
        activeTab={activeTab}
        onChange={setActiveTab}
        tabs={[
          { id: 'overview', label: 'Overview' },
          { id: 'code', label: 'Code' },
          { id: 'schema', label: 'Schema' },
          { id: 'versions', label: 'Versions', count: allVersions.length },
          { id: 'test', label: 'Test' },
          { id: 'publishing', label: 'Publishing' },
        ]}
      />

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Card padding="md" className="space-y-3">
            <h3 className="text-[14px] font-semibold text-primary">
              Tool configuration
            </h3>
            <KeyValueList
              items={[
                { key: 'ID', value: tool.id, mono: true },
                { key: 'Type', value: tool.type, mono: true },
                {
                  key: 'Connector',
                  value: tool.connector_type ?? 'None',
                  mono: Boolean(tool.connector_type),
                },
                {
                  key: 'Browser execution',
                  value: tool.allow_client_execution ? 'Allowed' : 'Disabled',
                },
                {
                  key: 'Visibility',
                  value: tool.is_public ? 'Public' : 'Private',
                },
                {
                  key: 'Updated',
                  value: formatDateTime(tool.updated_at),
                },
              ]}
            />
          </Card>

          <Card padding="md" className="space-y-3">
            <h3 className="text-[14px] font-semibold text-primary">
              Active version summary
            </h3>
            {currentVersion ? (
              <div className="space-y-3">
                <KeyValueList
                  items={[
                    {
                      key: 'Version number',
                      value: `v${currentVersion.version}`,
                      mono: true,
                    },
                    {
                      key: 'Sandbox test status',
                      value: currentVersion.test_results_json?.status ?? 'Not tested',
                    },
                    {
                      key: 'Created',
                      value: formatDateTime(currentVersion.created_at),
                    },
                  ]}
                />
                <div className="space-y-1.5">
                  <span className="text-[12px] text-secondary">
                    Declared capabilities
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {currentVersion.capabilities_json?.length ? (
                      currentVersion.capabilities_json.map((c) => (
                        <Badge key={c} mono variant="neutral">
                          {c}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-[12px] text-muted">None</span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-[13px] text-secondary">
                No version has been saved yet. Author code and schema to create version 1.
              </p>
            )}
          </Card>
        </div>
      )}

      {(activeTab === 'code' || activeTab === 'schema') && (
        <ToolVersionEditor
          mode={activeTab}
          toolType={tool.type}
          code={code}
          onChangeCode={setCode}
          schemaText={schemaText}
          onChangeSchemaText={setSchemaText}
          capabilities={capabilities}
          onToggleCapability={toggleCapability}
          attachedTestResults={attachedTestResults}
          validationError={validationError}
          mutationError={createVersionMutation.error}
          isPending={createVersionMutation.isPending}
          onSaveVersion={() => handleSaveVersion()}
        />
      )}

      {activeTab === 'versions' && (
        <ToolVersionsAndDiffPanel toolId={tool.id} versions={allVersions} />
      )}

      {activeTab === 'test' && (
        <SandboxTestPanel
          toolType={tool.type}
          code={code}
          onChangeCode={setCode}
          schemaJson={parsedSchema}
          declaredCapabilities={capabilities}
          attachedResults={attachedTestResults}
          onAttachResults={setAttachedTestResults}
          onSaveVersionWithTest={(res) => handleSaveVersion(res)}
          isSavingVersion={createVersionMutation.isPending}
        />
      )}

      {activeTab === 'publishing' && (
        <ToolPublishingPanel tool={tool} currentVersion={currentVersion} />
      )}

      <ToolMetadataModal
        open={editMetaOpen}
        initialTool={tool}
        onClose={() => setEditMetaOpen(false)}
      />
    </div>
  );
}
