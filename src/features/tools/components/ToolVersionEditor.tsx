import { FormEvent, useEffect, useState } from 'react';
import {
  Tool,
  ToolTestResults,
  ToolVersion,
} from '../../../api/types/tools.types';
import { TOOL_CAPABILITIES } from '../../../domain/capabilities';
import { ToolType } from '../../../domain/enums';
import { ErrorBanner } from '../../../shared/components/ErrorBanner';
import { useToolMutations } from '../hooks/useTools';
import { SandboxTestPanel } from './SandboxTestPanel';

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

interface ToolVersionEditorProps {
  readonly tool: Tool;
  readonly baseVersion?: ToolVersion | null;
}

export function ToolVersionEditor({ tool, baseVersion }: ToolVersionEditorProps) {
  const { createVersionMutation } = useToolMutations(tool.id);

  const isClientTool = tool.type === ToolType.Client;

  const [code, setCode] = useState(
    isClientTool ? baseVersion?.code ?? DEFAULT_CLIENT_CODE : ''
  );
  const [schemaText, setSchemaText] = useState(
    JSON.stringify(baseVersion?.schema_json ?? DEFAULT_SCHEMA_JSON, null, 2)
  );
  const [capabilities, setCapabilities] = useState<string[]>(
    baseVersion?.capabilities_json ?? []
  );
  const [attachedTestResults, setAttachedTestResults] =
    useState<ToolTestResults | null>(baseVersion?.test_results_json ?? null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [savedVersionNum, setSavedVersionNum] = useState<number | null>(null);

  useEffect(() => {
    if (baseVersion) {
      setCode(isClientTool ? baseVersion.code ?? '' : '');
      setSchemaText(JSON.stringify(baseVersion.schema_json ?? {}, null, 2));
      setCapabilities(baseVersion.capabilities_json ?? []);
      setAttachedTestResults(baseVersion.test_results_json ?? null);
    }
  }, [baseVersion, isClientTool]);

  let parsedSchema: Record<string, unknown> = {};
  try {
    const raw = JSON.parse(schemaText);
    if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
      parsedSchema = raw as Record<string, unknown>;
    }
  } catch {
    // Handled on submit
  }

  const toggleCapability = (capId: string) => {
    setCapabilities((prev) =>
      prev.includes(capId) ? prev.filter((c) => c !== capId) : [...prev, capId]
    );
  };

  const handleSaveNewVersion = async (e: FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    setSavedVersionNum(null);

    // Spec rule: client tools require code, mcp tools must not have code
    if (isClientTool && !code.trim()) {
      setValidationError('Client tools require non-empty JavaScript module code.');
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
        setValidationError('schema_json must be a valid JSON object.');
        return;
      }
      validSchema = parsed as Record<string, unknown>;
    } catch (err) {
      setValidationError(
        `Invalid schema_json: ${err instanceof Error ? err.message : String(err)}`
      );
      return;
    }

    const created = await createVersionMutation.mutateAsync({
      code: isClientTool ? code : null,
      schema_json: validSchema,
      capabilities_json: capabilities,
      test_results_json: attachedTestResults,
    });
    setSavedVersionNum(created.version);
  };

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleSaveNewVersion}
        className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-5"
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-0.5">
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Author Immutable Version (POST /tools/&#123;id&#125;/versions)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isClientTool
                ? 'Contract: export default async function run(params) { return { content: ... } }'
                : 'MCP tool: code is prohibited by the spec; configure schema_json and capabilities_json only.'}
            </p>
          </div>

          <button
            type="submit"
            disabled={createVersionMutation.isPending}
            className="px-4 py-2 text-xs font-medium text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 disabled:opacity-50"
          >
            {createVersionMutation.isPending
              ? 'Creating Version...'
              : 'Save as New Version'}
          </button>
        </div>

        {validationError && <ErrorBanner error={new Error(validationError)} />}
        {createVersionMutation.error && (
          <ErrorBanner
            error={createVersionMutation.error}
            title="Failed to save version"
          />
        )}
        {savedVersionNum !== null && (
          <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
            Saved immutable version v{savedVersionNum}.
          </p>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {isClientTool ? (
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                Tool Code (JavaScript Module) *
              </label>
              <textarea
                rows={12}
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                spellCheck={false}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-3 text-xs font-mono leading-relaxed text-slate-900 dark:text-slate-100"
              />
            </div>
          ) : (
            <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4 flex items-center justify-center text-xs text-slate-500">
              MCP tool selected — code field is disabled and omitted per OpenAPI spec.
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
              Parameter JSON Schema (schema_json) *
            </label>
            <textarea
              rows={12}
              required
              value={schemaText}
              onChange={(e) => setSchemaText(e.target.value)}
              spellCheck={false}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-3 text-xs font-mono leading-relaxed text-slate-900 dark:text-slate-100"
            />
          </div>
        </div>

        <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
          <span className="block text-xs font-semibold text-slate-900 dark:text-slate-100">
            Declared Capabilities (capabilities_json)
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {TOOL_CAPABILITIES.map((cap) => (
              <label
                key={cap.id}
                className="flex items-start gap-2.5 rounded-lg border border-slate-200 dark:border-slate-800 p-2.5 text-xs cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40"
              >
                <input
                  type="checkbox"
                  checked={capabilities.includes(cap.id)}
                  onChange={() => toggleCapability(cap.id)}
                  className="mt-0.5 rounded border-slate-300 dark:border-slate-700"
                />
                <div>
                  <p className="font-mono font-medium text-slate-900 dark:text-slate-100">
                    {cap.id}
                  </p>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                    {cap.description}
                  </p>
                </div>
              </label>
            ))}
          </div>
        </div>
      </form>

      <SandboxTestPanel
        toolType={tool.type}
        code={code}
        schemaJson={parsedSchema}
        declaredCapabilities={capabilities}
        attachedResults={attachedTestResults}
        onAttachResults={setAttachedTestResults}
      />
    </div>
  );
}
