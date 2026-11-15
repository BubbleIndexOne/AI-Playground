/**
 * @fileoverview Service layer for Marketplace operations.
 * Wraps the marketplace API and prepares data for UI consumption.
 */

import { marketplaceApi } from '../../../api/marketplace.api';
import {
  InstallToolInput,
  ListMarketplaceToolsParams,
  MarketplaceToolDetailResponse,
  MarketplaceToolsResponse,
  ToolForkResponse,
  ToolInstallResponse,
  ToolReportInput,
  ToolReportResponse,
  ToolUninstallResponse,
} from '../../../api/types/marketplace.types';

export const marketplaceService = {
  /**
   * Fetches community marketplace tools with optional search and filters.
   */
  list(params?: ListMarketplaceToolsParams): Promise<MarketplaceToolsResponse> {
    return marketplaceApi.list(params);
  },

  /**
   * Fetches detailed metadata and version history for a specific tool.
   */
  getByIdOrSlug(idOrSlug: string): Promise<MarketplaceToolDetailResponse> {
    return marketplaceApi.getByIdOrSlug(idOrSlug);
  },

  /**
   * Installs and pins a tool to the user's account pool.
   */
  install(id: string, body?: InstallToolInput): Promise<ToolInstallResponse> {
    return marketplaceApi.install(id, body);
  },

  /**
   * Uninstalls a tool from the user's account pool.
   */
  uninstall(id: string): Promise<ToolUninstallResponse> {
    return marketplaceApi.uninstall(id);
  },

  /**
   * Forks an open-source client tool into the caller's workspace.
   */
  fork(id: string): Promise<ToolForkResponse> {
    return marketplaceApi.fork(id);
  },

  /**
   * Submits an abuse/moderation report for a tool.
   */
  report(id: string, body: ToolReportInput): Promise<ToolReportResponse> {
    return marketplaceApi.report(id, body);
  },
};

