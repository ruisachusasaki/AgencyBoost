import { useQuery } from "@tanstack/react-query";

interface GranularPermission {
  module: string;
  enabled: boolean;
  subPermissions: Record<string, boolean>;
}

interface CurrentUser {
  id: string;
  role: string;
  granularPermissions?: GranularPermission[];
  permissions?: Array<{
    module: string;
    canView?: boolean;
    canCreate?: boolean;
    canEdit?: boolean;
    canDelete?: boolean;
    canManage?: boolean;
  }>;
}

export function useHasPermission(permissionKey: string) {
  const { data: currentUser, isLoading } = useQuery<CurrentUser>({
    queryKey: ['/api/auth/current-user'],
    retry: false,
  });

  if (isLoading) {
    return { hasPermission: false, isLoading: true };
  }

  if (!currentUser) {
    return { hasPermission: false, isLoading: false };
  }

  // Admin role has all permissions
  if (currentUser.role === 'Admin' || currentUser.role === 'admin') {
    return { hasPermission: true, isLoading: false };
  }

  // Check granular sub-permissions (format: "module.subPermissionKey")
  if (permissionKey.includes('.')) {
    const [module, subKey] = permissionKey.split('.');
    
    if (currentUser.granularPermissions && currentUser.granularPermissions.length > 0) {
      const modulePermission = currentUser.granularPermissions.find(
        (gp) => gp.module === module
      );
      
      if (modulePermission && modulePermission.enabled) {
        const hasSubPermission = modulePermission.subPermissions?.[permissionKey] === true;
        return { hasPermission: hasSubPermission, isLoading: false };
      }
    }
    
    return { hasPermission: false, isLoading: false };
  }

  // Check module-level permissions (legacy format)
  if (currentUser.granularPermissions && currentUser.granularPermissions.length > 0) {
    const hasGranularPermission = currentUser.granularPermissions.some(
      (gp) => gp.module === permissionKey && gp.enabled === true
    );
    
    if (hasGranularPermission) {
      return { hasPermission: true, isLoading: false };
    }
  }

  // Fallback to legacy permissions
  if (currentUser.permissions) {
    const permission = currentUser.permissions.find((p) => p.module === permissionKey);
    if (permission?.canView === true) {
      return { hasPermission: true, isLoading: false };
    }
  }

  return { hasPermission: false, isLoading: false };
}
