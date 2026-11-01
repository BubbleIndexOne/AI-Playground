import { Activity, Monitor, Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';
import { env } from '../config/env';
import { ErrorBanner } from '../shared/components/ErrorBanner';
import { useHealthCheckMutation } from '../shared/hooks/useHealthCheck';
import {
  applyThemePreference,
  Button,
  CodeBlock,
  Dialog,
  getThemePreference,
  subscribeThemePreference,
  ThemePreference,
} from '../shared/ui';

interface SettingsModalProps {
  readonly open: boolean;
  readonly onClose: () => void;
}

export function SettingsModal({ open, onClose }: SettingsModalProps) {
  const healthMutation = useHealthCheckMutation();
  const [themePref, setThemePref] = useState<ThemePreference>(
    getThemePreference()
  );

  useEffect(() => {
    return subscribeThemePreference(setThemePref);
  }, []);

  const themeOptions: {
    readonly id: ThemePreference;
    readonly label: string;
    readonly icon: typeof Monitor;
  }[] = [
    { id: 'system', label: 'System', icon: Monitor },
    { id: 'light', label: 'Light', icon: Sun },
    { id: 'dark', label: 'Dark', icon: Moon },
  ];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Settings"
      description="Appearance and API connection controls."
      maxWidth="lg"
    >
      <div className="space-y-6">
        {/* Theme selector */}
        <div className="space-y-2">
          <span className="block text-[13px] font-medium text-primary">
            Appearance
          </span>
          <div className="grid grid-cols-3 gap-2">
            {themeOptions.map((opt) => {
              const Icon = opt.icon;
              const active = themePref === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => applyThemePreference(opt.id)}
                  className={`flex items-center justify-center gap-2 h-9 rounded-lg border text-[13px] font-medium transition-colors duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                    active
                      ? 'border-accent bg-accent-tint text-primary'
                      : 'border-subtle bg-app text-secondary hover:text-primary hover:bg-hover'
                  }`}
                >
                  <Icon size={15} />
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Health check */}
        <div className="pt-4 border-t border-subtle space-y-3">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <span className="block text-[13px] font-medium text-primary">
                Service health check
              </span>
              <p className="text-[12px] text-secondary">
                Endpoint:{' '}
                <code className="font-mono text-primary">
                  {env.apiBaseUrl || 'Origin'}/health
                </code>
              </p>
            </div>
            <Button
              variant="secondary"
              size="md"
              icon={<Activity size={15} />}
              loading={healthMutation.isPending}
              onClick={() => healthMutation.mutate()}
            >
              Run health check
            </Button>
          </div>

          {healthMutation.error && (
            <ErrorBanner
              error={healthMutation.error}
              title="Health check failed"
            />
          )}

          {healthMutation.data !== undefined && (
            <CodeBlock
              code={JSON.stringify(healthMutation.data, null, 2)}
              showLineNumbers={false}
              maxHeight="max-h-48"
            />
          )}
        </div>
      </div>
    </Dialog>
  );
}
