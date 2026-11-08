/**
 * @fileoverview API client for Community Marketplace endpoints.
 * Handles discovery, search, version pinning, installation, uninstallation,
 * client tool forking, and abuse reporting according to OpenAPI 3.1.0.
 */

import { apiRequest } from './http/client';
import {
  InstallToolInput,
  ListMarketplaceToolsParams,
  MarketplaceToolDetailResponse,
  MarketplaceToolDetailResponseSchema,
  MarketplaceToolsResponse,
  MarketplaceToolsResponseSchema,
  ToolForkResponse,
  ToolForkResponseSchema,
  ToolInstallResponse,
  ToolInstallResponseSchema,
  ToolReportInput,
  ToolReportResponse,
  ToolReportResponseSchema,
  ToolUninstallResponse,
  ToolUninstallResponseSchema,
} from './types/marketplace.types';

export const marketplaceApi = {
  /**
   * Lists verified community marketplace tools with full-text search,
   * category filtering, environment/connector tags, and pagination.
   */
  list(params?: ListMarketplaceToolsParams): Promise<MarketplaceToolsResponse> {
    return apiRequest({
      method: 'GET',
      path: '/marketplace/tools',
      query: {
        q: params?.q,
        type: params?.type,
        connector: params?.connector,
        tag: params?.tag,
        hosting_tier: params?.hosting_tier,
        sort: params?.sort,
        cursor: params?.cursor,
        limit: params?.limit,
      },
      security: 'bearer',
      schema: MarketplaceToolsResponseSchema,
    });
  },

  /**
   * Retrieves full details, version history, author information,
   * and capability schemas for a tool by UUID or author-handle/slug.
   */
  getByIdOrSlug(idOrSlug: string): Promise<MarketplaceToolDetailResponse> {
    return apiRequest({
      method: 'GET',
      path: `/marketplace/tools/${encodeURIComponent(idOrSlug)}`,
      security: 'bearer',
      schema: MarketplaceToolDetailResponseSchema,
    });
  },

  /**
   * Installs and pins a tool version to caller's account.
   * If version_id is omitted, defaults to tool's current registered version.
   */
  install(id: string, body?: InstallToolInput): Promise<ToolInstallResponse> {
    return apiRequest({
      method: 'POST',
      path: `/marketplace/tools/${encodeURIComponent(id)}/install`,
      body: body ?? {},
      security: 'bearer',
      schema: ToolInstallResponseSchema,
    });
  },

  /**
   * Uninstalls a tool from caller's account and decrements install count.
   */
  uninstall(id: string): Promise<ToolUninstallResponse> {
    return apiRequest({
      method: 'DELETE',
      path: `/marketplace/tools/${encodeURIComponent(id)}/install`,
      security: 'bearer',
      schema: ToolUninstallResponseSchema,
    });
  },

  /**
   * Forks an open-source client tool into caller's personal workspace.
   * Fails with 403 Forbidden for protected/MCP tools.
   */
  fork(id: string): Promise<ToolForkResponse> {
    return apiRequest({
      method: 'POST',
      path: `/marketplace/tools/${encodeURIComponent(id)}/fork`,
      security: 'bearer',
      schema: ToolForkResponseSchema,
    });
  },

  /**
   * Submits a moderation/abuse report against a tool.
   */
  report(id: string, body: ToolReportInput): Promise<ToolReportResponse> {
    return apiRequest({
      method: 'POST',
      path: `/marketplace/tools/${encodeURIComponent(id)}/report`,
      body,
      security: 'bearer',
      schema: ToolReportResponseSchema,
    });
  },
};

