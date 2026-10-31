import { FormEvent, useEffect, useState } from 'react';
import {
  CreateToolSchema,
  Tool,
  UpdateToolSchema,
} from '../../../api/types/tools.types';
import {
  ConnectorType,
  CREATOR_ALLOWED_STATUSES,
  ToolStatus,
  ToolType,
} from '../../../domain/enums';
import { ErrorBanner } from '../../../shared/components/ErrorBanner';
import { useToolMutations } from '../hooks/useTools';

interface ToolMetadataModalProps {
  readonly open: boolean;
  readonly initialTool?: Tool | null;
  readonly onClose: () => void;
  readonly onCreated?: (tool: Tool) => void;
}

export function ToolMetadataModal({
  open,
  initialTool,
  onClose,
  onCreated,
}: ToolMetadataModalProps) {
  const { createToolMutation, updateToolMutation } = useToolMutations(
    initialTool?.id
  );

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<ToolType>(ToolType.Client);
  const [connectorType, setConnectorType] = useState<ConnectorType | ''>('');
  const [isPublic, setIsPublic] = useState(false);
  const [allowClientExecution, setAllowClientExecution] = useState(true);
  const [status, setStatus] = useState<ToolStatus>(ToolStatus.Draft);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (initialTool) {
      setName(initialTool.name);
      setDescription(initialTool.description ?? '');
      setType(initialTool.type);
      setConnectorType(initialTool.connector_type ?? '');
      setIsPublic(initialTool.is_public);
      setAllowClientExecution(initialTool.allow_client_execution);
      setStatus(initialTool.status);
    } else {
      setName('');
      setDescription('');
      setType(ToolType.Client);
      setConnectorType('');
      setIsPublic(false);
      setAllowClientExecution(true);
      setStatus(ToolStatus.Draft);
    }
    setValidationError(null);
  }, [open, initialTool]);

  if (!open) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (initialTool) {
      // Creators may set only draft or deprecated themselves through PATCH
      const nextStatus = CREATOR_ALLOWED_STATUSES.includes(status)
        ? status
        : undefined;
      const parsed = UpdateToolSchema.safeParse({
        name: name.trim(),
        description: description.trim() || null,
        connector_type: connectorType ? connectorType : null,
        is_public: isPublic,
        allow_client_execution: allowClientExecution,
        ...(nextStatus ? { status: nextStatus } : {}),
      });
      if (!parsed.success) {
        setValidationError(parsed.error.issues.map((i) => i.message).join(' · '));
        return;
      }
      await updateToolMutation.mutateAsync({
        id: initialTool.id,
        body: parsed.data,
      });
      onClose();
    } else {
      const parsed = CreateToolSchema.safeParse({
        name: name.trim(),
        description: description.trim() || undefined,
        type,
        connector_type: connectorType ? connectorType : null,
        is_public: isPublic,
        allow_client_execution: allowClientExecution,
      });
      if (!parsed.success) {
        setValidationError(parsed.error.issues.map((i) => i.message).join(' · '));
        return;
      }
      const created = await createToolMutation.mutateAsync(parsed.data);
      onClose();
      onCreated?.(created);
    }
  };

  const isPending = createToolMutation.isPending || updateToolMutation.isPending;
  const mutationError = createToolMutation.error ?? updateToolMutation.error;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-lg space-y-4"
      >
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {initialTool ? 'Edit Tool Metadata' : 'Create New Tool'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {initialTool
              ? 'Update metadata via PATCH /tools/{id}. Creators can set status only to draft or deprecated.'
              : 'Register a client or MCP tool via POST /tools.'}
          </p>
        </div>

        {validationError && <ErrorBanner error={new Error(validationError)} />}
        {mutationError && <ErrorBanner error={mutationError} />}

        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
            Name *
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="weather_lookup"
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
            Description
          </label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what this tool does for the agent..."
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
              Tool Type *
            </label>
            <select
              value={type}
              disabled={Boolean(initialTool)}
              onChange={(e) => setType(e.target.value as ToolType)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm disabled:opacity-60"
            >
              <option value={ToolType.Client}>client (JavaScript module)</option>
              <option value={ToolType.Mcp}>mcp (Model Context Protocol)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
              Connector Type
            </label>
            <select
              value={connectorType}
              onChange={(e) =>
                setConnectorType(e.target.value as ConnectorType | '')
              }
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
            >
              <option value="">None</option>
              <option value={ConnectorType.Postgres}>postgres</option>
              <option value={ConnectorType.Slack}>slack</option>
            </select>
          </div>
        </div>

        {initialTool && (
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
              Creator Status (only draft or deprecated allowed)
            </label>
            <select
              value={
                CREATOR_ALLOWED_STATUSES.includes(status)
                  ? status
                  : ToolStatus.Draft
              }
              onChange={(e) => setStatus(e.target.value as ToolStatus)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
            >
              {CREATOR_ALLOWED_STATUSES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-6 pt-1">
          <label className="inline-flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={allowClientExecution}
              onChange={(e) => setAllowClientExecution(e.target.checked)}
              className="rounded border-slate-300 dark:border-slate-700"
            />
            Allow client execution
          </label>
          <label className="inline-flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="rounded border-slate-300 dark:border-slate-700"
            />
            Request public listing
          </label>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-lg"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="px-4 py-2 text-xs font-medium text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 rounded-lg disabled:opacity-50"
          >
            {isPending ? 'Saving...' : initialTool ? 'Save Changes' : 'Create Tool'}
          </button>
        </div>
      </form>
    </div>
  );
}
