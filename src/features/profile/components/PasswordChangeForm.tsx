import { FormEvent, useState } from 'react';
import { ChangePasswordSchema } from '../../../api/types/auth.types';
import { ErrorBanner } from '../../../shared/components/ErrorBanner';
import { Button, Card, FormField, Input, toast } from '../../../shared/ui';
import { useProfileMutations } from '../hooks/useProfile';

export function PasswordChangeForm() {
  const { changePasswordMutation } = useProfileMutations();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const parsed = ChangePasswordSchema.safeParse({
      current_password: currentPassword,
      new_password: newPassword,
    });

    if (!parsed.success) {
      setValidationError(parsed.error.issues.map((i) => i.message).join(' · '));
      return;
    }

    await changePasswordMutation.mutateAsync(parsed.data);
    setCurrentPassword('');
    setNewPassword('');
    toast.success('Password updated', 'Your password has been changed.');
  };

  return (
    <Card padding="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-0.5">
          <h2 className="text-[15px] font-semibold text-primary">
            Change password
          </h2>
          <p className="text-[12px] text-secondary">
            Enter your current password to set a new one.
          </p>
        </div>

        {validationError && <ErrorBanner error={new Error(validationError)} />}
        {changePasswordMutation.error && (
          <ErrorBanner
            error={changePasswordMutation.error}
            title="Password change failed"
          />
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            label="Current password"
            htmlFor="prof-current-pass"
            required
          >
            <Input
              id="prof-current-pass"
              type="password"
              required
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </FormField>

          <FormField
            label="New password"
            htmlFor="prof-new-pass"
            hint="Minimum 8 characters."
            required
          >
            <Input
              id="prof-new-pass"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </FormField>
        </div>

        <div className="flex justify-end pt-2 border-t border-subtle">
          <Button
            type="submit"
            variant="primary"
            size="sm"
            loading={changePasswordMutation.isPending}
          >
            Update password
          </Button>
        </div>
      </form>
    </Card>
  );
}
