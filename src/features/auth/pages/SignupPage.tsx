import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ApiError } from '../../../api/http/errors';
import { SignupRequestSchema } from '../../../api/types/auth.types';
import { ErrorBanner } from '../../../shared/components/ErrorBanner';
import { Button, Card, FormField, Input } from '../../../shared/ui';
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

  const apiErr =
    signupMutation.error instanceof ApiError ? signupMutation.error : null;
  const errorTitle =
    apiErr?.status === 409
      ? 'An account with this email already exists'
      : apiErr?.status === 400
        ? 'Please check the highlighted fields'
        : 'Sign up failed';

  return (
    <div className="min-h-screen flex items-center justify-center bg-app px-4 py-12">
      <div className="w-full max-w-lg space-y-6">
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
            Create your account
          </h1>
          <p className="text-[13px] text-secondary">
            Set up your workspace to create tools and run agents.
          </p>
        </div>

        <Card padding="lg" className="space-y-5">
          {clientErrors.length > 0 && (
            <ErrorBanner
              error={
                new ApiError({
                  status: 400,
                  messages: clientErrors,
                  primaryMessage: clientErrors[0],
                })
              }
              title="Please check your inputs"
            />
          )}

          {signupMutation.error && (
            <ErrorBanner error={signupMutation.error} title={errorTitle} />
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="First name" htmlFor="signup-first-name" required>
                <Input
                  id="signup-first-name"
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Ada"
                />
              </FormField>

              <FormField label="Middle name" htmlFor="signup-middle-name">
                <Input
                  id="signup-middle-name"
                  type="text"
                  value={middleName}
                  onChange={(e) => setMiddleName(e.target.value)}
                  placeholder="Optional"
                />
              </FormField>

              <FormField label="Last name" htmlFor="signup-last-name">
                <Input
                  id="signup-last-name"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Lovelace"
                />
              </FormField>

              <FormField label="Display name" htmlFor="signup-display-name">
                <Input
                  id="signup-display-name"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Optional"
                />
              </FormField>
            </div>

            <FormField label="Email address" htmlFor="signup-email" required>
              <Input
                id="signup-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </FormField>

            <FormField
              label="Password"
              htmlFor="signup-password"
              hint="Minimum 8 characters."
              required
            >
              <Input
                id="signup-password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
              />
            </FormField>

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              loading={signupMutation.isPending}
            >
              Create account
            </Button>
          </form>

          <div className="pt-4 border-t border-subtle flex items-center justify-between text-[12px] text-secondary">
            <span>Already have an account?</span>
            <Link
              to="/auth/login"
              className="font-medium text-accent hover:underline"
            >
              Sign in
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
