import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ErrorBanner } from '../../../shared/components/ErrorBanner';
import {
  Button,
  Card,
  ConfirmDialog,
  FormField,
  Input,
} from '../../../shared/ui';
import { useProfileMutations } from '../hooks/useProfile';

export function DeleteAccountSection() {
  const navigate = useNavigate();
  const { deleteAccountMutation } = useProfileMutations();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [password, setPassword] = useState('');

  const handleConfirmDelete = async () => {
    if (!password.trim()) return;
    try {
      await deleteAccountMutation.mutateAsync({ password });
      setDialogOpen(false);
      navigate('/auth/login', { replace: true });
    } catch {
      // Displayed in dialog
    }
  };

  return (
    <Card padding="lg" className="border-danger/30">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-0.5">
          <h2 className="text-[15px] font-semibold text-danger">
            Delete account
          </h2>
          <p className="text-[12px] text-secondary">
            Permanently delete your account and remove access to your workspace.
          </p>
        </div>
        <Button
          type="button"
          variant="danger"
          size="sm"
          onClick={() => {
            setPassword('');
            setDialogOpen(true);
          }}
        >
          Delete account
        </Button>
      </div>

      <ConfirmDialog
        open={dialogOpen}
        title="Delete your account?"
        description="This permanently deletes your account and cannot be undone. Enter your password to confirm."
        confirmLabel="Delete account"
        isDestructive
        isPending={deleteAccountMutation.isPending}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDialogOpen(false)}
      >
        <div className="space-y-3">
          {deleteAccountMutation.error && (
            <ErrorBanner error={deleteAccountMutation.error} />
          )}
          <FormField
            label="Confirm password"
            htmlFor="delete-acc-password"
            required
          >
            <Input
              id="delete-acc-password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
            />
          </FormField>
        </div>
      </ConfirmDialog>
    </Card>
  );
}
