/**
 * @fileoverview React Query hooks for Marketplace tool discovery, inspection,
 * installation, forking, and reporting.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  InstallToolInput,
  ListMarketplaceToolsParams,
  ToolReportInput,
} from '../../../api/types/marketplace.types';
import { marketplaceService } from '../services/marketplace.service';

export const MARKETPLACE_TOOLS_QUERY_KEY = ['marketplace', 'tools'] as const;
export const MARKETPLACE_TOOL_DETAIL_QUERY_KEY = [
  'marketplace',
  'tool-detail',
] as const;

/**
 * Hook to fetch paginated marketplace tools with filters.
 */
export function useMarketplaceToolsQuery(
  params?: ListMarketplaceToolsParams,
  enabled = true
) {
  return useQuery({
    queryKey: [...MARKETPLACE_TOOLS_QUERY_KEY, params ?? {}],
    queryFn: () => marketplaceService.list(params),
    enabled,
    staleTime: 30_000,
  });
}

/**
 * Hook to fetch full tool details and version history by ID or slug.
 */
export function useMarketplaceToolDetailQuery(
  idOrSlug: string | null | undefined,
  enabled = true
) {
  return useQuery({
    queryKey: [...MARKETPLACE_TOOL_DETAIL_QUERY_KEY, idOrSlug],
    queryFn: () => marketplaceService.getByIdOrSlug(idOrSlug!),
    enabled: Boolean(enabled && idOrSlug),
    staleTime: 30_000,
  });
}

/**
 * Hook providing marketplace mutations: install, uninstall, fork, report.
 */
export function useMarketplaceMutations() {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: MARKETPLACE_TOOLS_QUERY_KEY });
    queryClient.invalidateQueries({
      queryKey: MARKETPLACE_TOOL_DETAIL_QUERY_KEY,
    });
    queryClient.invalidateQueries({ queryKey: ['tools'] });
  };

  const installMutation = useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      readonly id: string;
      readonly input?: InstallToolInput;
    }) => marketplaceService.install(id, input),
    onSuccess: invalidate,
  });

  const uninstallMutation = useMutation({
    mutationFn: (id: string) => marketplaceService.uninstall(id),
    onSuccess: invalidate,
  });

  const forkMutation = useMutation({
    mutationFn: (id: string) => marketplaceService.fork(id),
    onSuccess: invalidate,
  });

  const reportMutation = useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      readonly id: string;
      readonly input: ToolReportInput;
    }) => marketplaceService.report(id, input),
  });

  return {
    installMutation,
    uninstallMutation,
    forkMutation,
    reportMutation,
  };
}
