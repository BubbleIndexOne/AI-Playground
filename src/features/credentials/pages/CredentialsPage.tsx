import { AI_PROVIDERS } from '../../../domain/providers';
import { ErrorBanner } from '../../../shared/components/ErrorBanner';
import { Card, PageHeader, TableSkeleton } from '../../../shared/ui';
import { ProviderCredentialRow } from '../components/ProviderCredentialRow';
import { useModelCredentials } from '../hooks/useModelCredentials';

export function CredentialsPage() {
  const { data: credentials, isLoading, error } = useModelCredentials();

  const credentialByProvider = new Map(
    (credentials ?? []).map((item) => [item.provider, item])
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="API Keys"
        description="Keys are encrypted on the server and never shown again."
      />

      {error && <ErrorBanner error={error} />}

      {isLoading ? (
        <TableSkeleton rows={3} />
      ) : (
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
