import {
  Bot,
  Cable,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Menu,
  MessageSquare,
  Plug,
  Settings,
  Sliders,
  Store,
  User,
  Wrench,
  X,
} from 'lucide-react';
import { ComponentType, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuthMutations } from '../features/auth/hooks/useAuth';
import { LegacyCredentialMigrationDialog } from '../features/credentials/migration/LegacyCredentialMigrationDialog';
import { useProfileQuery } from '../features/profile/hooks/useProfile';
import { DropdownMenu, IconButton, toast, Tooltip } from '../shared/ui';
import { SettingsModal } from './SettingsModal';

interface NavEntry {
  readonly to: string;
  readonly label: string;
  readonly icon: ComponentType<{ size?: number; className?: string }>;
}

interface NavGroup {
  readonly section: string;
  readonly items: readonly NavEntry[];
}

const NAV_GROUPS: readonly NavGroup[] = [
  {
    section: 'Build',
    items: [
      { to: '/agents', label: 'Agents', icon: Bot },
      { to: '/tools', label: 'Tools', icon: Wrench },
      { to: '/connectors', label: 'Connectors', icon: Plug },
      { to: '/model-presets', label: 'Model Presets', icon: Sliders },
    ],
  },
  {
    section: 'Use',
    items: [
      { to: '/chat', label: 'Chat', icon: MessageSquare },
      { to: '/marketplace', label: 'Marketplace', icon: Store },
    ],
  },
  {
    section: 'Account',
    items: [
      { to: '/credentials', label: 'API Keys', icon: Cable },
      { to: '/profile', label: 'Profile', icon: User },
    ],
  },
];

export function AppShell() {
  const navigate = useNavigate();
  const { data: profile } = useProfileQuery();
  const { logoutMutation } = useAuthMutations();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const displayName =
    profile?.display_name ||
    [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') ||
    'Account';
  const initials = (
    profile?.display_name?.[0] ||
    profile?.first_name?.[0] ||
    profile?.email?.[0] ||
    'U'
  ).toUpperCase();

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    toast.info('Signed out');
    navigate('/auth/login', { replace: true });
  };

  const renderSidebarContent = (isRail: boolean) => (
    <div className="flex flex-col h-full select-none">
      {/* Top Fixed Brand Header */}
      <div className="shrink-0 p-3 pb-2">
        <div
          className={`flex items-center ${
            isRail ? 'justify-center' : 'justify-between px-2'
          } h-9`}
        >
          <div
            className={`flex items-center ${
              isRail ? 'justify-center' : 'gap-2.5 min-w-0'
            }`}
          >
            <div className="h-7 w-7 rounded-md bg-accent flex items-center justify-center text-accent-fg font-semibold text-[13px] shrink-0">
              A
            </div>
            {!isRail && (
              <span className="text-[14px] font-semibold tracking-tight text-primary truncate">
                AI Playground
              </span>
            )}
          </div>
          {!isRail && (
            <button
              type="button"
              aria-label="Collapse sidebar"
              onClick={() => setCollapsed(true)}
              className="hidden md:inline-flex items-center justify-center text-muted hover:text-primary p-1 rounded-md hover:bg-hover transition-colors cursor-pointer"
            >
              <ChevronLeft size={15} />
            </button>
          )}
        </div>

        {isRail && (
          <div className="hidden md:flex justify-center mt-2">
            <button
              type="button"
              aria-label="Expand sidebar"
              onClick={() => setCollapsed(false)}
              className="w-10 h-8 flex items-center justify-center text-muted hover:text-primary rounded-lg hover:bg-hover transition-colors cursor-pointer"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        )}
      </div>

      {/* Scrollable Navigation Sections */}
      <nav
        aria-label="Main navigation"
        className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-2 space-y-4"
      >
        {NAV_GROUPS.map((group) => (
          <div
            key={group.section}
            className={`space-y-1 ${isRail ? 'flex flex-col items-center' : ''}`}
          >
            {!isRail && (
              <div className="px-2.5 pb-1 text-[11px] font-medium text-muted">
                {group.section}
              </div>
            )}
            {group.items.map((item) => {
              const Icon = item.icon;
              const linkEl = (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `relative flex items-center ${
                      isRail
                        ? 'w-10 h-9 justify-center mx-auto'
                        : 'w-full gap-2.5 px-2.5 h-8'
                    } rounded-lg text-[13px] font-medium transition-colors duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                      isActive
                        ? 'bg-accent-tint text-primary'
                        : 'text-secondary hover:text-primary hover:bg-hover'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <span
                          aria-hidden="true"
                          className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-r bg-accent"
                        />
                      )}
                      <Icon
                        size={18}
                        className={
                          isActive ? 'text-accent shrink-0' : 'shrink-0'
                        }
                      />
                      {!isRail && (
                        <span className="truncate">{item.label}</span>
                      )}
                    </>
                  )}
                </NavLink>
              );

              return isRail ? (
                <Tooltip
                  key={item.to}
                  content={item.label}
                  side="right"
                  className="w-full"
                >
                  {linkEl}
                </Tooltip>
              ) : (
                linkEl
              );
            })}
          </div>
        ))}
      </nav>

      {/* Pinned Bottom Controls & User Block */}
      <div className="shrink-0 p-3 border-t border-subtle space-y-2">
        <div
          className={`space-y-0.5 ${isRail ? 'flex flex-col items-center' : ''}`}
        >
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className={`flex items-center ${
              isRail
                ? 'w-10 h-9 justify-center mx-auto'
                : 'w-full gap-2.5 px-2.5 h-8'
            } rounded-lg text-[13px] text-secondary hover:text-primary hover:bg-hover transition-colors cursor-pointer`}
            title="Settings"
          >
            <Settings size={16} className="shrink-0" />
            {!isRail && <span className="truncate">Settings</span>}
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className={`flex items-center ${
              isRail
                ? 'w-10 h-9 justify-center mx-auto'
                : 'w-full gap-2.5 px-2.5 h-8'
            } rounded-lg text-[13px] text-secondary hover:text-danger hover:bg-danger-tint transition-colors cursor-pointer`}
            title="Log out"
          >
            <LogOut size={16} className="shrink-0" />
            {!isRail && <span className="truncate">Log out</span>}
          </button>
        </div>

        {/* User Profile Dropdown (opens upward so it is never clipped) */}
        <div className="pt-2 border-t border-subtle">
          <DropdownMenu
            align="left"
            side="top"
            className={isRail ? 'w-full flex justify-center' : 'w-full block'}
            items={[
              {
                label: 'Profile settings',
                icon: <User size={14} />,
                onClick: () => navigate('/profile'),
              },
              {
                label: 'Log out',
                icon: <LogOut size={14} />,
                danger: true,
                onClick: handleLogout,
              },
            ]}
            trigger={
              <button
                type="button"
                title={`${displayName} — Profile & Log out`}
                className={`flex items-center ${
                  isRail
                    ? 'w-10 h-10 justify-center mx-auto'
                    : 'w-full gap-2.5 px-2 py-1.5'
                } rounded-lg hover:bg-hover transition-colors text-left cursor-pointer`}
              >
                <div className="h-7 w-7 rounded-full bg-raised border border-subtle flex items-center justify-center text-[12px] font-semibold text-primary shrink-0">
                  {initials}
                </div>
                {!isRail && (
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium text-primary truncate leading-4">
                      {displayName}
                    </p>
                    <p className="text-[11px] text-muted truncate leading-4 mt-0.5">
                      {profile?.email ?? 'Signed in'}
                    </p>
                  </div>
                )}
              </button>
            }
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-screen overflow-hidden flex bg-app text-primary">
      {/* Desktop Fixed Sidebar */}
      <aside
        className={`hidden md:flex md:flex-col h-screen shrink-0 border-r border-subtle bg-card transition-all duration-150 ease-out ${
          collapsed ? 'w-16' : 'w-60'
        }`}
      >
        {renderSidebarContent(collapsed)}
      </aside>

      {/* Mobile Drawer Sidebar (<768px) */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 md:hidden flex bg-black/60"
          onClick={(e) => {
            if (e.target === e.currentTarget) setMobileOpen(false);
          }}
        >
          <aside className="w-60 h-full bg-card border-r border-subtle flex flex-col">
            <div className="flex items-center justify-end px-3 pt-2">
              <IconButton
                aria-label="Close navigation menu"
                icon={<X size={16} />}
                size="sm"
                onClick={() => setMobileOpen(false)}
              />
            </div>
            <div className="flex-1 min-h-0">{renderSidebarContent(false)}</div>
          </aside>
        </div>
      )}

      {/* Main Content Area (scrolls independently) */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Mobile Top Bar */}
        <header className="md:hidden shrink-0 flex items-center justify-between px-4 h-12 border-b border-subtle bg-card">
          <div className="flex items-center gap-2.5">
            <IconButton
              aria-label="Open navigation menu"
              icon={<Menu size={18} />}
              size="sm"
              onClick={() => setMobileOpen(true)}
            />
            <span className="text-[14px] font-semibold text-primary">
              AI Playground
            </span>
          </div>
          <IconButton
            aria-label="Open settings"
            icon={<Settings size={16} />}
            size="sm"
            onClick={() => setSettingsOpen(true)}
          />
        </header>

        <main className="flex-1 p-5 md:p-8 overflow-y-auto">
          <div className="max-w-[1200px] mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />

      <LegacyCredentialMigrationDialog />
    </div>
  );
}
