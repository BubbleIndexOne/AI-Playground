import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LoginRequestSchema } from '../../../api/types/auth.types';
import { ErrorBanner } from '../../../shared/components/ErrorBanner';
import { Button, Card, FormField, Input } from '../../../shared/ui';
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
    <div className="min-h-screen flex items-center justify-center bg-app px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center text-white text-[13px] font-semibold">
              A
            </span>
            <span className="text-[16px] font-semibold tracking-tight text-primary">
              AI Playground
            </span>
          </div>
          <h1 className="text-[20px] font-semibold tracking-tight text-primary pt-1">
            Sign in to your workspace
          </h1>
          <p className="text-[13px] text-secondary">
            Build and test tools, configure connectors, and run agents.
          </p>
        </div>

        <Card padding="lg" className="space-y-5">
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
            <FormField label="Email address" htmlFor="login-email" required>
              <Input
                id="login-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </FormField>

            <FormField label="Password" htmlFor="login-password" required>
              <Input
                id="login-password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </FormField>

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              loading={loginMutation.isPending}
            >
              Sign in
            </Button>
          </form>

          <div className="pt-4 border-t border-subtle flex items-center justify-between text-[12px] text-secondary">
            <span>New to AI Playground?</span>
            <Link
              to="/auth/signup"
              className="font-medium text-accent hover:underline"
            >
              Create an account
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
