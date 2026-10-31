import { Save } from 'lucide-react';
import { FormEvent } from 'react';
import { ToolTestResults } from '../../../api/types/tools.types';
import { TOOL_CAPABILITIES } from '../../../domain/capabilities';
import { ToolType } from '../../../domain/enums';
import { ErrorBanner } from '../../../shared/components/ErrorBanner';
import {
  Button,
  Card,
  Checkbox,
  CodeEditor,
} from '../../../shared/ui';

interface ToolVersionEditorProps {
  readonly mode: 'code' | 'schema';
  readonly toolType: ToolType;
  readonly code: string;
  readonly onChangeCode: (next: string) => void;
  readonly schemaText: string;
  readonly onChangeSchemaText: (next: string) => void;
  readonly capabilities: readonly string[];
  readonly onToggleCapability: (capId: string) => void;
  readonly attachedTestResults: ToolTestResults | null;
  readonly validationError: string | null;
  readonly mutationError: unknown;
  readonly isPending: boolean;
  readonly onSaveVersion: () => Promise<void>;
}

export function ToolVersionEditor({
  mode,
  toolType,
  code,
  onChangeCode,
  schemaText,
  onChangeSchemaText,
  capabilities,
  onToggleCapability,
  attachedTestResults,
  validationError,
  mutationError,
  isPending,
  onSaveVersion,
}: ToolVersionEditorProps) {
  const isClientTool = toolType === ToolType.Client;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await onSaveVersion();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {validationError && <ErrorBanner error={new Error(validationError)} />}
      {Boolean(mutationError) && (
        <ErrorBanner error={mutationError} title="Could not save version" />
      )}

      {mode === 'code' ? (
        <Card padding="md" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-0.5">
              <h3 className="text-[14px] font-semibold text-primary">
                Module source code
              </h3>
              <p className="text-[12px] text-secondary">
                {isClientTool
                  ? 'Export a default async function run(params) that returns { content }.'
                  : 'MCP tools do not contain client-side code.'}
              </p>
            </div>
            <Button
              variant="primary"
              size="md"
              type="submit"
              icon={<Save size={15} />}
              loading={isPending}
            >
              Save new version
            </Button>
          </div>

          {isClientTool ? (
            <CodeEditor rows={16} value={code} onChange={onChangeCode} />
          ) : (
            <div className="rounded-lg border border-subtle bg-app p-6 text-center text-[13px] text-secondary">
              Code is disabled for MCP tools. Configure the parameter schema and capabilities instead.
            </div>
          )}
        </Card>
      ) : (
        <div className="space-y-4">
          <Card padding="md" className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-0.5">
                <h3 className="text-[14px] font-semibold text-primary">
                  Input parameter JSON schema
                </h3>
                <p className="text-[12px] text-secondary">
                  Defines the parameters passed to this tool and generates test inputs.
                </p>
              </div>
              <Button
                variant="primary"
                size="md"
                type="submit"
                icon={<Save size={15} />}
                loading={isPending}
              >
                Save new version
              </Button>
            </div>

            <CodeEditor
              rows={14}
              value={schemaText}
              onChange={onChangeSchemaText}
            />
          </Card>

          <Card padding="md" className="space-y-3">
            <div className="space-y-0.5">
              <h3 className="text-[14px] font-semibold text-primary">
                Declared capabilities
              </h3>
              <p className="text-[12px] text-secondary">
                Any call outside declared capabilities fails sandbox and registration audits.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {TOOL_CAPABILITIES.map((cap) => (
                <div
                  key={cap.id}
                  className="rounded-lg border border-subtle bg-app p-3"
                >
                  <Checkbox
                    checked={capabilities.includes(cap.id)}
                    onChange={() => onToggleCapability(cap.id)}
                    label={<span className="font-mono text-[12px]">{cap.id}</span>}
                    description={cap.description}
                  />
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {attachedTestResults && (
        <p className="text-[12px] text-success">
          Saving this version will include the attached sandbox test result ({attachedTestResults.status}).
        </p>
      )}
    </form>
  );
}
