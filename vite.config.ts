import fs from 'node:fs';
import path from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import {defineConfig, loadEnv} from 'vite';

/**
 * Resolves API base URL dynamically from wrangler.toml per environment.
 * Priority:
 * 1. CLI / process.env / .env override (VITE_API_BASE_URL)
 * 2. [env.<targetEnv>.vars] from wrangler.toml (dev vs production)
 * 3. [vars] default section from wrangler.toml
 */
function resolveWranglerApiBaseUrl(targetEnv: string): string {
  try {
    const wranglerPath = path.resolve(process.cwd(), 'wrangler.toml');
    if (!fs.existsSync(wranglerPath)) {
      return '';
    }

    const content = fs.readFileSync(wranglerPath, 'utf8');

    const extractVarFromSection = (sectionName: string, key: string) => {
      const escapedSection = sectionName.replace(/\./g, '\\.');
      const regex = new RegExp(`\\[${escapedSection}\\]([\\s\\S]*?)(?=\\n\\s*\\[|$)`, 'i');
      const match = content.match(regex);
      if (!match) return null;

      const keyRegex = new RegExp(`^\\s*${key}\\s*=\\s*["']([^"']*)["']`, 'm');
      const keyMatch = match[1].match(keyRegex);
      return keyMatch ? keyMatch[1] : null;
    };

    // 1. Check target environment section [env.<targetEnv>.vars]
    const envSpecific =
      extractVarFromSection(`env.${targetEnv}.vars`, 'VITE_API_BASE_URL') ||
      extractVarFromSection(`env.${targetEnv}.vars`, 'NEXT_PUBLIC_API_BASE_URL');
    if (envSpecific) return envSpecific;

    // 2. Fall back to root [vars]
    const defaultVar =
      extractVarFromSection('vars', 'VITE_API_BASE_URL') ||
      extractVarFromSection('vars', 'NEXT_PUBLIC_API_BASE_URL');
    if (defaultVar) return defaultVar;

    return '';
  } catch {
    return '';
  }
}

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, process.cwd(), '');

  // Determine target environment:
  // Explicit CF_ENV or APP_ENV takes precedence, otherwise derive from Vite's build mode.
  const isProduction =
    process.env.CF_ENV !== undefined
      ? process.env.CF_ENV === 'production'
      : process.env.APP_ENV !== undefined
        ? process.env.APP_ENV === 'production'
        : mode === 'production';

  const targetEnv = isProduction ? 'production' : 'dev';

  const resolvedApiUrl =
    env.VITE_API_BASE_URL ||
    process.env.VITE_API_BASE_URL ||
    resolveWranglerApiBaseUrl(targetEnv);

  return {
    envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname ?? '.', '.'),
      },
    },
    define: resolvedApiUrl
      ? {
          'import.meta.env.VITE_API_BASE_URL': JSON.stringify(resolvedApiUrl),
        }
      : undefined,
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
