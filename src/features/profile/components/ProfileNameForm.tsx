import { FormEvent, useEffect, useState } from 'react';
import { UpdateProfileNamesSchema, UserProfile } from '../../../api/types/auth.types';
import { ErrorBanner } from '../../../shared/components/ErrorBanner';
import { Button, Card, FormField, Input, toast } from '../../../shared/ui';
import { useProfileMutations } from '../hooks/useProfile';

interface ProfileNameFormProps {
  readonly profile: UserProfile;
}

export function ProfileNameForm({ profile }: ProfileNameFormProps) {
  const { updateNamesMutation } = useProfileMutations();

  const [firstName, setFirstName] = useState(profile.first_name);
  const [middleName, setMiddleName] = useState(profile.middle_name ?? '');
  const [lastName, setLastName] = useState(profile.last_name ?? '');
  const [displayName, setDisplayName] = useState(profile.display_name ?? '');

  useEffect(() => {
    setFirstName(profile.first_name);
    setMiddleName(profile.middle_name ?? '');
    setLastName(profile.last_name ?? '');
    setDisplayName(profile.display_name ?? '');
  }, [profile]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const parsed = UpdateProfileNamesSchema.safeParse({
      first_name: firstName.trim(),
      middle_name: middleName.trim() || null,
      last_name: lastName.trim() || null,
      display_name: displayName.trim() || null,
    });
    if (!parsed.success) return;

    await updateNamesMutation.mutateAsync(parsed.data);
    toast.success('Profile updated', 'Your personal details have been saved.');
  };

  return (
    <Card padding="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-0.5">
          <h2 className="text-[15px] font-semibold text-primary">
            Personal information
          </h2>
          <p className="text-[12px] text-secondary">
            Update how your name appears across the workspace.
          </p>
        </div>

        {updateNamesMutation.error && (
          <ErrorBanner
            error={updateNamesMutation.error}
            title="Failed to update profile"
          />
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="First name" htmlFor="prof-first-name" required>
            <Input
              id="prof-first-name"
              type="text"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </FormField>

          <FormField label="Middle name" htmlFor="prof-middle-name">
            <Input
              id="prof-middle-name"
              type="text"
              value={middleName}
              onChange={(e) => setMiddleName(e.target.value)}
            />
          </FormField>

          <FormField label="Last name" htmlFor="prof-last-name">
            <Input
              id="prof-last-name"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </FormField>

          <FormField label="Display name" htmlFor="prof-display-name">
            <Input
              id="prof-display-name"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </FormField>
        </div>

        <div className="flex justify-end pt-2 border-t border-subtle">
          <Button
            type="submit"
            variant="primary"
            size="sm"
            loading={updateNamesMutation.isPending}
          >
            Save changes
          </Button>
        </div>
      </form>
    </Card>
  );
}
