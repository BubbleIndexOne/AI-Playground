import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { AdminKeyDialog } from '../features/admin/components/AdminKeyDialog';
import { useAdminKeySession } from '../features/admin/hooks/useAdmin';
import { ErrorBanner } from '../shared/components/ErrorBanner';
import { SettingsModal } from './SettingsModal';

interface NavItem {
  readonly to: string;
  readonly label: string;
}

const BASE_NAV_ITEMS: readonly NavItem[] = [
  { to: '/chat', label: 'Chat' },
  { to: '/agents', label: 'Agents' },
  { to: '/tools', label: 'Tools' },
  { to: '/marketplace', label: 'Marketplace' },
  { to: '/connectors', label: 'Connectors' },
  { to: '/model-presets', label: 'Model Presets' },
  { to: '/credentials', label: 'API Keys' },
  { to: '/profile', label: 'Profile' },
];

export function AppShell() {
  const {
    hasAdminKey,
    adminAuthError,
    clearAdminAuthError,
    setAdminKey,
  } = useAdminKeySession();

  const [adminDialogOpen, setAdminDialogOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const navItems: readonly NavItem[] = hasAdminKey
    ? [...BASE_NAV_ITEMS, { to: '/admin', label: 'Admin' }]
    : BASE_NAV_ITEMS;

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Left Navigation Sidebar */}
      <aside className="w-60 shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between p-4">
        <div className="space-y-6">
          <div className="px-2 pt-1">
            <span className="text-base font-bold tracking-tight text-slate-900 dark:text-slate-100 whitespace-nowrap">
              Agent Playground
            </span>
          </div>

          <nav className="space-y-1" aria-label="Main Navigation">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `block px-3 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                    isActive
                      ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-1.5">
          <button
            type="button"
            onClick={() => setAdminDialogOpen(true)}
            className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 transition-colors whitespace-nowrap"
          >
            {hasAdminKey ? 'Admin Key Active' : 'Enter Admin Key'}
          </button>
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 transition-colors whitespace-nowrap"
          >
            Settings &amp; Health Check
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {adminAuthError && (
          <div className="p-4 pb-0 max-w-5xl mx-auto w-full">
            <ErrorBanner
              error={new Error(adminAuthError)}
              title="Admin Authentication Error (403)"
              onDismiss={clearAdminAuthError}
            />
          </div>
        )}

        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      <AdminKeyDialog
        open={adminDialogOpen}
        onClose={() => setAdminDialogOpen(false)}
        onSaveKey={(k) => setAdminKey(k)}
      />

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onOpenAdminKeyDialog={() => setAdminDialogOpen(true)}
        hasAdminKey={hasAdminKey}
      />
    </div>
  );
}
