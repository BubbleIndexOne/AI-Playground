import { authApi } from '../../../api/auth.api';
import {
  getAdminKey,
  setAdminKey,
  subscribeAdminKey,
} from '../../../api/http/authInterceptor';
import { toolsApi } from '../../../api/tools.api';
import { Tool, ToolVersion, ToolVersionDiff } from '../../../api/types/tools.types';
import { ToolStatus } from '../../../domain/enums';

export const adminService = {
  hasAdminKey(): boolean {
    return getAdminKey() !== null;
  },

  setAdminKey(key: string | null, errorMsg?: string): void {
    setAdminKey(key, errorMsg);
  },

  subscribeKeyState(
    listener: (hasKey: boolean, error?: string) => void
  ): () => void {
    return subscribeAdminKey(listener);
  },

  listRegisteredTools(): Promise<Tool[]> {
    return toolsApi.list({ status: ToolStatus.Registered }, 'adminKey');
  },

  getToolVersions(toolId: string): Promise<ToolVersion[]> {
    return toolsApi.listVersions(toolId, 'adminKey');
  },

  getToolVersion(toolId: string, version: number): Promise<ToolVersion> {
    return toolsApi.getVersion(toolId, version, 'adminKey');
  },

  diffVersions(
    toolId: string,
    fromVersion: number,
    toVersion: number
  ): Promise<ToolVersionDiff> {
    return toolsApi.diffVersions(toolId, fromVersion, toVersion, 'adminKey');
  },

  approveTool(toolId: string): Promise<Tool> {
    return toolsApi.update(
      toolId,
      { status: ToolStatus.Verified, is_public: true },
      'adminKey'
    );
  },

  rejectTool(toolId: string, reason?: string): Promise<Tool> {
    return toolsApi.update(
      toolId,
      {
        status: ToolStatus.Rejected,
        ...(reason?.trim()
          ? { rejection_reason: reason.trim(), reason: reason.trim() }
          : {}),
      },
      'adminKey'
    );
  },

  deprecateTool(toolId: string): Promise<Tool> {
    return toolsApi.update(
      toolId,
      { status: ToolStatus.Deprecated },
      'adminKey'
    );
  },

  purgeTool(toolId: string): Promise<unknown> {
    return toolsApi.delete(toolId, { purge: true, security: 'adminKey' });
  },

  deleteUserById(userId: string): Promise<unknown> {
    return authApi.adminDeleteUser(userId);
  },
};
