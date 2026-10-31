import { ToolStatus } from '../../../domain/enums';

export type ThemePreference = 'system' | 'light' | 'dark';

export type SemanticVariant =
  | 'neutral'
  | 'info'
  | 'success'
  | 'warning'
  | 'danger'
  | 'muted';

export interface LifecycleVisualMeta {
  readonly label: string;
  readonly variant: SemanticVariant;
}

export const TOOL_STATUS_META: Record<ToolStatus, LifecycleVisualMeta> = {
  [ToolStatus.Draft]: { label: 'Draft', variant: 'neutral' },
  [ToolStatus.Testing]: { label: 'Testing', variant: 'info' },
  [ToolStatus.Registered]: { label: 'Awaiting review', variant: 'warning' },
  [ToolStatus.Verified]: { label: 'Verified', variant: 'success' },
  [ToolStatus.Rejected]: { label: 'Rejected', variant: 'danger' },
  [ToolStatus.Deprecated]: { label: 'Deprecated', variant: 'muted' },
};

const THEME_STORAGE_KEY = 'agent_playground_theme_pref';
let currentThemePref: ThemePreference =
  (typeof localStorage !== 'undefined'
    ? (localStorage.getItem(THEME_STORAGE_KEY) as ThemePreference | null)
    : null) ?? 'system';

const themeListeners = new Set<(pref: ThemePreference) => void>();

export function applyThemePreference(pref: ThemePreference): void {
  currentThemePref = pref;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, pref);
  } catch {
    // Ignore storage restriction
  }
  const prefersDark =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = pref === 'dark' || (pref === 'system' && prefersDark);
  if (typeof document !== 'undefined') {
    document.documentElement.classList.toggle('dark', isDark);
  }
  for (const listener of themeListeners) {
    listener(pref);
  }
}

export function getThemePreference(): ThemePreference {
  return currentThemePref;
}

export function subscribeThemePreference(
  listener: (pref: ThemePreference) => void
): () => void {
  themeListeners.add(listener);
  return () => {
    themeListeners.delete(listener);
  };
}
