import { ShieldCheck } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { getProviderDisplayName, ModelProvider } from '../../../domain/providers';
import { Badge, Button, ConfirmDialog, Dialog, toast } from '../../../shared/ui';
import { MODEL_CREDENTIALS_QUERY_KEY } from '../hooks/useModelCredentials';
import {
  checkLegacyCredentials,
  declineLegacyCredentialsMigration,
  migrateLegacyCredentialsToVault,
} from './legacyCredentialMigration';

/**
 * Modal dialog that prompts the user when legacy browser-stored credentials exist,
 * offering to migrate them to the encrypted vault or decline and remove them.
 */
export function LegacyCredentialMigrationDialog() {
  const queryClient = useQueryClient();
  const [legacyProviders, setLegacyProviders] = useState<ModelProvider[]>([]);
  const [confirmDeclineOpen, setConfirmDeclineOpen] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [isWiping, setIsWiping] = useState(false);

  useEffect(() => {
    let active = true;
    checkLegacyCredentials()
      .then((records) => {
        if (!active || records.length === 0) return;
        setLegacyProviders(records.map((r) => r.provider));
      })
      .catch(() => {
        // Ignore if IndexedDB is unavailable
      });
    return () => {
      active = false;
    };
  }, []);

  if (legacyProviders.length === 0) {
    return null;
  }

  const handleMoveToVault = async () => {
    setIsMigrating(true);
    try {
      const result = await migrateLegacyCredentialsToVault();
      await queryClient.invalidateQueries({
        queryKey: MODEL_CREDENTIALS_QUERY_KEY,
      });
      if (result.errors.length > 0) {
        setLegacyProviders(result.errors.map((e) => e.provider));
        toast.error(
          'Some keys could not be moved to vault',
          result.errors
            .map(
              (e) => `${getProviderDisplayName(e.provider)}: ${e.message}`
            )
            .join(' · ')
        );
      } else {
        setLegacyProviders([]);
        toast.success('Moved API keys to encrypted vault');
      }
    } finally {
      setIsMigrating(false);
    }
  };

  const handleConfirmDecline = async () => {
    setIsWiping(true);
    try {
      await declineLegacyCredentialsMigration();
      setConfirmDeclineOpen(false);
      setLegacyProviders([]);
      toast.info('Local API keys removed');
    } finally {
      setIsWiping(false);
    }
  };

  return (
    <>
      <Dialog
        open={legacyProviders.length > 0 && !confirmDeclineOpen}
        onClose={() => setConfirmDeclineOpen(true)}
        title="Move API keys to encrypted vault"
        description="Legacy browser-stored provider API keys were found. Move them to the server's encrypted vault or delete them from this browser."
        maxWidth="md"
        footer={
          <>
            <Button
              type="button"
              variant="secondary"
              disabled={isMigrating}
              onClick={() => setConfirmDeclineOpen(true)}
            >
              Decline
            </Button>
            <Button
              type="button"
              variant="primary"
              loading={isMigrating}
              icon={<ShieldCheck size={15} />}
              onClick={handleMoveToVault}
            >
              Move to encrypted vault
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-[13px] text-secondary">
            Detected local keys for the following providers:
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {legacyProviders.map((provider) => (
              <Badge key={provider} variant="neutral">
                {getProviderDisplayName(provider)}
              </Badge>
            ))}
          </div>
        </div>
      </Dialog>

      <ConfirmDialog
        open={confirmDeclineOpen}
        title="Delete local API keys?"
        description="Declining migration will permanently delete all local provider API keys stored in this browser."
        confirmLabel="Delete local keys"
        isDestructive
        isPending={isWiping}
        onConfirm={handleConfirmDecline}
        onCancel={() => setConfirmDeclineOpen(false)}
      />
    </>
  );
}
