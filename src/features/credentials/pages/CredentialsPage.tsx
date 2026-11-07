import { HelpCircle } from 'lucide-react';
import { AI_PROVIDERS } from '../../../domain/providers';
import { ErrorBanner } from '../../../shared/components/ErrorBanner';
import { Card, PageHeader, TableSkeleton, Tooltip } from '../../../shared/ui';
import { ProviderCredentialRow } from '../components/ProviderCredentialRow';
import { useModelCredentials } from '../hooks/useModelCredentials';

/**
 * CredentialsPage allows users to manage API credentials for each AI model provider,
 * supporting encrypted account vault storage and per-browser-session memory storage.
 */
export function CredentialsPage() {
  const { data: credentials, isLoading, error } = useModelCredentials();

  const credentialByProvider = new Map(
    (credentials ?? []).map((item) => [item.provider, item])
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="API Keys"
        description="Configure keys for model providers. Choose whether to keep them in this browser tab only or save them encrypted to your account."
        actions={
          <Tooltip
            content="Flow paths: Session mode (Browser → Provider) vs Account mode (Browser → Proxy → Provider)"
            side="top"
          >
            <div
              tabIndex={0}
              role="button"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-subtle bg-raised text-[12px] font-medium text-secondary hover:text-primary transition-colors cursor-help focus:outline-none"
            >
              <HelpCircle size={13} className="text-accent shrink-0" />
              <span>How keys work</span>
            </div>
          </Tooltip>
        }
      />

      {error && <ErrorBanner error={error} />}

      {isLoading ? (
        <TableSkeleton rows={3} />
      ) : error && !credentials ? null : (
        <Card padding="none" className="divide-y divide-subtle overflow-hidden">
          {AI_PROVIDERS.map((providerMeta) => (
            <ProviderCredentialRow
              key={providerMeta.id}
              provider={providerMeta.id}
              providerName={providerMeta.name}
              credential={credentialByProvider.get(providerMeta.id) ?? null}
            />
          ))}
        </Card>
      )}
    </div>
  );
}
