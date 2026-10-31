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
import {
  Button,
  Dialog,
  FormField,
  Input,
  Select,
  Switch,
  Textarea,
  toast,
} from '../../../shared/ui';
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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (initialTool) {
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
        setValidationError(
          parsed.error.issues.map((i) => i.message).join(' · ')
        );
        return;
      }
      await updateToolMutation.mutateAsync({
        id: initialTool.id,
        body: parsed.data,
      });
      toast.success('Tool details updated');
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
        setValidationError(
          parsed.error.issues.map((i) => i.message).join(' · ')
        );
        return;
      }
      const created = await createToolMutation.mutateAsync(parsed.data);
      toast.success('Tool created');
      onClose();
      onCreated?.(created);
    }
  };

  const isPending = createToolMutation.isPending || updateToolMutation.isPending;
  const mutationError = createToolMutation.error ?? updateToolMutation.error;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={initialTool ? 'Edit tool details' : 'Create tool'}
      description={
        initialTool
          ? 'Update name, description, visibility, and status.'
          : 'Define a client-side JavaScript tool or an MCP tool.'
      }
      maxWidth="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            form="tool-metadata-form"
            loading={isPending}
          >
            {initialTool ? 'Save changes' : 'Create tool'}
          </Button>
        </>
      }
    >
      <form
        id="tool-metadata-form"
        onSubmit={handleSubmit}
        className="space-y-4"
      >
        {validationError && <ErrorBanner error={new Error(validationError)} />}
        {mutationError && <ErrorBanner error={mutationError} />}

        <FormField label="Name" required>
          <Input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="weather_lookup"
          />
        </FormField>

        <FormField label="Description">
          <Textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Explain what this tool does and when an agent should call it..."
          />
        </FormField>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Tool type" required>
            <Select
              value={type}
              disabled={Boolean(initialTool)}
              onChange={(e) => setType(e.target.value as ToolType)}
            >
              <option value={ToolType.Client}>Client (JavaScript)</option>
              <option value={ToolType.Mcp}>MCP</option>
            </Select>
          </FormField>

          <FormField label="Connector">
            <Select
              value={connectorType}
              onChange={(e) =>
                setConnectorType(e.target.value as ConnectorType | '')
              }
            >
              <option value="">None</option>
              <option value={ConnectorType.Postgres}>Postgres</option>
              <option value={ConnectorType.Slack}>Slack</option>
            </Select>
          </FormField>
        </div>

        {initialTool && (
          <FormField
            label="Lifecycle status"
            hint="Creators can set a tool to Draft or Deprecated."
          >
            <Select
              value={
                CREATOR_ALLOWED_STATUSES.includes(status)
                  ? status
                  : ToolStatus.Draft
              }
              onChange={(e) => setStatus(e.target.value as ToolStatus)}
            >
              {CREATOR_ALLOWED_STATUSES.map((st) => (
                <option key={st} value={st}>
                  {st === ToolStatus.Draft ? 'Draft' : 'Deprecated'}
                </option>
              ))}
            </Select>
          </FormField>
        )}

        <div className="pt-2 space-y-3">
          <Switch
            checked={allowClientExecution}
            onChange={setAllowClientExecution}
            label="Allow browser execution"
            description="Permits running this tool inside the isolated browser worker sandbox."
          />
          <Switch
            checked={isPublic}
            onChange={setIsPublic}
            label="Public visibility"
            description="List in the Marketplace once verified by an admin."
          />
        </div>
      </form>
    </Dialog>
  );
}
