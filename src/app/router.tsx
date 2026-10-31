import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AdminPage } from '../features/admin/pages/AdminPage';
import { AgentsPage } from '../features/agents/pages/AgentsPage';
import { LoginPage } from '../features/auth/pages/LoginPage';
import { SignupPage } from '../features/auth/pages/SignupPage';
import { ChatPage } from '../features/chat/pages/ChatPage';
import { ConnectorsPage } from '../features/connectors/pages/ConnectorsPage';
import { CredentialsPage } from '../features/credentials/pages/CredentialsPage';
import { MarketplacePage } from '../features/marketplace/pages/MarketplacePage';
import { ModelPresetsPage } from '../features/presets/pages/ModelPresetsPage';
import { ProfilePage } from '../features/profile/pages/ProfilePage';
import { ToolDetailPage } from '../features/tools/pages/ToolDetailPage';
import { ToolsListPage } from '../features/tools/pages/ToolsListPage';
import { AppShell } from './AppShell';
import { RedirectIfAuthenticated, RequireAuth } from './RouteGuards';

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/auth/login"
          element={
            <RedirectIfAuthenticated>
              <LoginPage />
            </RedirectIfAuthenticated>
          }
        />
        <Route
          path="/auth/signup"
          element={
            <RedirectIfAuthenticated>
              <SignupPage />
            </RedirectIfAuthenticated>
          }
        />

        <Route
          path="/"
          element={
            <RequireAuth>
              <AppShell />
            </RequireAuth>
          }
        >
          <Route index element={<Navigate to="/chat" replace />} />
          <Route path="chat" element={<ChatPage />} />
          <Route path="agents" element={<AgentsPage />} />
          <Route path="tools" element={<ToolsListPage />} />
          <Route path="tools/:id" element={<ToolDetailPage />} />
          <Route path="marketplace" element={<MarketplacePage />} />
          <Route path="connectors" element={<ConnectorsPage />} />
          <Route path="model-presets" element={<ModelPresetsPage />} />
          <Route path="credentials" element={<CredentialsPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="admin" element={<AdminPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/chat" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
