import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ApiError } from '../../../api/http/errors';
import { SignupRequestSchema } from '../../../api/types/auth.types';
import { ErrorBanner } from '../../../shared/components/ErrorBanner';
import { useAuthMutations } from '../hooks/useAuth';

export function SignupPage() {
  const navigate = useNavigate();
  const { signupMutation } = useAuthMutations();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [clientErrors, setClientErrors] = useState<string[]>([]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setClientErrors([]);

    const parsed = SignupRequestSchema.safeParse({
      email,
      password,
      first_name: firstName,
      middle_name: middleName || undefined,
      last_name: lastName || undefined,
      display_name: displayName || undefined,
    });

    if (!parsed.success) {
      setClientErrors(parsed.error.issues.map((i) => i.message));
      return;
    }

    try {
      const res = await signupMutation.mutateAsync(parsed.data);
      if (res.accessToken) {
        navigate('/chat', { replace: true });
      } else {
        navigate('/auth/login', { replace: true });
      }
    } catch {
      // Handled via signupMutation.error
    }
  };

  const apiErr = signupMutation.error instanceof ApiError ? signupMutation.error : null;
  const errorTitle =
    apiErr?.status === 409
      ? 'Account already exists (409)'
      : apiErr?.status === 400
        ? 'Validation failed (400)'
        : 'Signup failed';

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 py-12">
      <div className="w-full max-w-lg rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 space-y-6">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Create your account
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Set up your Agent Playground profile to build and test tools and agents.
          </p>
        </div>

        {clientErrors.length > 0 && (
          <ErrorBanner
            error={new ApiError({
              status: 400,
              messages: clientErrors,
              primaryMessage: clientErrors[0],
            })}
            title="Please check your inputs"
          />
        )}

        {signupMutation.error && (
          <ErrorBanner error={signupMutation.error} title={errorTitle} />
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
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
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100"
                placeholder="Ada"
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
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100"
                placeholder="Optional"
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
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100"
                placeholder="Lovelace"
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
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100"
                placeholder="Optional"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
              Email address *
            </label>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100"
              placeholder="you@example.com"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
              Password * (min 8 characters)
            </label>
            <input
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100"
              placeholder="At least 8 characters"
            />
          </div>

          <button
            type="submit"
            disabled={signupMutation.isPending}
            className="w-full py-2.5 px-4 rounded-lg text-sm font-medium text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors disabled:opacity-50"
          >
            {signupMutation.isPending ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>Already have an account?</span>
          <Link
            to="/auth/login"
            className="font-medium text-slate-900 dark:text-slate-100 hover:underline"
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
