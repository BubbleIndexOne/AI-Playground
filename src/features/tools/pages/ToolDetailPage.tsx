import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ErrorBanner } from '../../../shared/components/ErrorBanner';
import { ToolLifecycleStepper } from '../components/ToolLifecycleStepper';
import { ToolMetadataModal } from '../components/ToolMetadataModal';
import { ToolPublishingPanel } from '../components/ToolPublishingPanel';
import { ToolVersionEditor } from '../components/ToolVersionEditor';
import { ToolVersionsAndDiffPanel } from '../components/ToolVersionsAndDiffPanel';
import { useToolDetailQuery, useToolVersionsQuery } from '../hooks/useTools';

export function ToolDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: tool, isLoading, error } = useToolDetailQuery(id);
  const { data: versionsList } = useToolVersionsQuery(id);

  const [editMetaOpen, setEditMetaOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto p-6 text-sm text-slate-500">
        Loading tool from GET /tools/{id}...
      </div>
    );
  }

  if (error || !tool) {
    return (
      <div className="max-w-5xl mx-auto space-y-4">
        <ErrorBanner error={error ?? new Error('Tool not found')} />
        <Link
          to="/tools"
          className="inline-block text-xs font-medium text-slate-700 dark:text-slate-300 hover:underline"
        >
          Back to My Tools
        </Link>
      </div>
    );
  }

  const allVersions = versionsList ?? tool.versions ?? [];
  const currentVersion =
    tool.current_version ?? allVersions[0] ?? null;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <Link to="/tools" className="hover:underline">
              My Tools
            </Link>
            <span aria-hidden="true">/</span>
            <span className="font-mono">{tool.id}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {tool.name}
          </h1>
          {tool.description && (
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {tool.description}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 pt-1">
            <span className="font-mono">Type: {tool.type}</span>
            <span aria-hidden="true">·</span>
            <span>Status: {tool.status}</span>
            {tool.connector_type && (
              <>
                <span aria-hidden="true">·</span>
                <span>Connector: {tool.connector_type}</span>
              </>
            )}
            <span aria-hidden="true">·</span>
            <span>
              {tool.allow_client_execution
                ? 'Client execution allowed'
                : 'Client execution disabled'}
            </span>
            <span aria-hidden="true">·</span>
            <span>{tool.is_public ? 'Public requested' : 'Private'}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setEditMetaOpen(true)}
          className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
        >
          Edit Metadata
        </button>
      </div>

      <ToolLifecycleStepper
        status={tool.status}
        rejectionReason={tool.rejection_reason ?? tool.reason}
      />

      <ToolVersionEditor tool={tool} baseVersion={currentVersion} />

      <ToolPublishingPanel tool={tool} currentVersion={currentVersion} />

      <ToolVersionsAndDiffPanel toolId={tool.id} versions={allVersions} />

      <ToolMetadataModal
        open={editMetaOpen}
        initialTool={tool}
        onClose={() => setEditMetaOpen(false)}
      />
    </div>
  );
}
