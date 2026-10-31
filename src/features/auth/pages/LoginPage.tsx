import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LoginRequestSchema } from '../../../api/types/auth.types';
import { ErrorBanner } from '../../../shared/components/ErrorBanner';
import { useAuthMutations } from '../hooks/useAuth';

export function LoginPage() {
  const navigate = useNavigate();
  const { loginMutation } = useAuthMutations();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setValidationErrors([]);

    const parsed = LoginRequestSchema.safeParse({ email, password });
    if (!parsed.success) {
      setValidationErrors(parsed.error.issues.map((i) => i.message));
      return;
    }

    try {
      await loginMutation.mutateAsync(parsed.data);
      navigate('/chat', { replace: true });
    } catch {
      // Handled via loginMutation.error
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 py-12">
      <div className="w-full max-w-md rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 space-y-6">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Sign in to Agent Playground
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Access your tools, connectors, model presets, and BYOK agents.
          </p>
        </div>

        {validationErrors.length > 0 && (
          <ErrorBanner
            error={new Error(validationErrors.join(' · '))}
            title="Validation error"
          />
        )}

        {loginMutation.error && (
          <ErrorBanner error={loginMutation.error} title="Sign in failed" />
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <label
              htmlFor="login-email"
              className="block text-xs font-medium text-slate-700 dark:text-slate-300"
            >
              Email address
            </label>
            <input
              id="login-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-300"
              placeholder="you@example.com"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="login-password"
              className="block text-xs font-medium text-slate-700 dark:text-slate-300"
            >
              Password
            </label>
            <input
              id="login-password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-300"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loginMutation.isPending}
            className="w-full py-2.5 px-4 rounded-lg text-sm font-medium text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors disabled:opacity-50"
          >
            {loginMutation.isPending ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>Don&apos;t have an account?</span>
          <Link
            to="/auth/signup"
            className="font-medium text-slate-900 dark:text-slate-100 hover:underline"
          >
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
}
