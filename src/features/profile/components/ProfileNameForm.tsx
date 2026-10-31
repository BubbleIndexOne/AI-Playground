import { FormEvent, useEffect, useState } from 'react';
import { UpdateProfileNamesSchema, UserProfile } from '../../../api/types/auth.types';
import { ErrorBanner } from '../../../shared/components/ErrorBanner';
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
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    setFirstName(profile.first_name);
    setMiddleName(profile.middle_name ?? '');
    setLastName(profile.last_name ?? '');
    setDisplayName(profile.display_name ?? '');
  }, [profile]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSavedNotice(false);
    const parsed = UpdateProfileNamesSchema.safeParse({
      first_name: firstName.trim(),
      middle_name: middleName.trim() || null,
      last_name: lastName.trim() || null,
      display_name: displayName.trim() || null,
    });
    if (!parsed.success) return;

    await updateNamesMutation.mutateAsync(parsed.data);
    setSavedNotice(true);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4"
    >
      <div className="space-y-1">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          Personal Information
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Update your name and display preferences via PATCH /auth/me.
        </p>
      </div>

      {updateNamesMutation.error && (
        <ErrorBanner error={updateNamesMutation.error} title="Failed to update profile" />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
            First name *
          </label>
          <input
            type="text"
            required
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
            Middle name
          </label>
          <input
            type="text"
            value={middleName}
            onChange={(e) => setMiddleName(e.target.value)}
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
            Last name
          </label>
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
            Display name
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
          />
        </div>
      </div>

      <div className="flex items-center justify-between pt-2">
        <span className="text-xs text-emerald-600 dark:text-emerald-400">
          {savedNotice ? 'Profile updated.' : ''}
        </span>
        <button
          type="submit"
          disabled={updateNamesMutation.isPending}
          className="px-4 py-2 text-xs font-medium text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 rounded-lg hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors disabled:opacity-50"
        >
          {updateNamesMutation.isPending ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}
