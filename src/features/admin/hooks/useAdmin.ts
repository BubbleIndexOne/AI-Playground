import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { adminService } from '../services/admin.service';

export function useAdminKeySession() {
  const [hasKey, setHasKey] = useState<boolean>(() =>
    adminService.hasAdminKey()
  );
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = adminService.subscribeKeyState((active, errMsg) => {
      setHasKey(active);
      if (errMsg) {
        setAuthError(errMsg);
      }
    });
    return unsubscribe;
  }, []);

  return {
    hasAdminKey: hasKey,
    adminAuthError: authError,
    clearAdminAuthError: () => setAuthError(null),
    setAdminKey: (key: string | null) => {
      setAuthError(null);
      adminService.setAdminKey(key);
    },
  };
}

export function useAdminQueueQuery(enabled: boolean) {
  return useQuery({
    queryKey: ['admin', 'registered-tools'],
    queryFn: () => adminService.listRegisteredTools(),
    enabled,
    retry: false,
  });
}

export function useAdminToolInspectionQuery(toolId: string | null) {
  return useQuery({
    queryKey: ['admin', 'tool-versions', toolId],
    queryFn: async () => {
      const versions = await adminService.getToolVersions(toolId!);
      let diffMeta = null;
      if (versions.length >= 2) {
        try {
          diffMeta = await adminService.diffVersions(
            toolId!,
            versions[1].version,
            versions[0].version
          );
        } catch {
          diffMeta = null;
        }
      }
      return { versions, diffMeta };
    },
    enabled: Boolean(toolId),
    retry: false,
  });
}

export function useAdminMutations() {
  const queryClient = useQueryClient();

  const invalidateAdmin = () => {
    queryClient.invalidateQueries({ queryKey: ['admin'] });
    queryClient.invalidateQueries({ queryKey: ['tools'] });
  };

  const approveMutation = useMutation({
    mutationFn: (toolId: string) => adminService.approveTool(toolId),
    onSuccess: invalidateAdmin,
  });

  const rejectMutation = useMutation({
    mutationFn: ({ toolId, reason }: { toolId: string; reason?: string }) =>
      adminService.rejectTool(toolId, reason),
    onSuccess: invalidateAdmin,
  });

  const deprecateMutation = useMutation({
    mutationFn: (toolId: string) => adminService.deprecateTool(toolId),
    onSuccess: invalidateAdmin,
  });

  const purgeToolMutation = useMutation({
    mutationFn: (toolId: string) => adminService.purgeTool(toolId),
    onSuccess: invalidateAdmin,
  });

  const deleteUserMutation = useMutation({
    mutationFn: (userId: string) => adminService.deleteUserById(userId),
  });

  return {
    approveMutation,
    rejectMutation,
    deprecateMutation,
    purgeToolMutation,
    deleteUserMutation,
  };
}
