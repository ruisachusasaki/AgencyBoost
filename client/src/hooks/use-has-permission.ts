import { useQuery } from "@tanstack/react-query";

interface GranularPermissionFromAPI {
  module: string;
  permissionKey: string;
  enabled: boolean;
}

interface CurrentUser {
  id: string;
  role: string;
  granularPermissions?: GranularPermissionFromAPI[];
  permissions?: Array<{
    module: string;
    canView?: boolean;
    canCreate?: boolean;
    canEdit?: boolean;
    canDelete?: boolean;
    canManage?: boolean;
  }>;
}

/**
 * Hook to check if current user has a specific permission
 * @param permissionKey - Either a module name ("hr") or a specific permission key ("hr.view_staff_directory")
 * @returns Object with hasPermission boolean and isLoading state
 */
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

  // Check granular permissions from API (flat array format)
  if (currentUser.granularPermissions && currentUser.granularPermissions.length > 0) {
    // Check for specific permission key (format: "module.subPermissionKey")
    if (permissionKey.includes('.')) {
      // Look for exact match on permissionKey
      const hasPermission = currentUser.granularPermissions.some(
        (gp) => gp.permissionKey === permissionKey && gp.enabled === true
      );
      return { hasPermission, isLoading: false };
    }
    
    // Check for module-level access (user can access module if ANY permission for it is enabled)
    const hasModulePermission = currentUser.granularPermissions.some(
      (gp) => gp.module === permissionKey && gp.enabled === true
    );
    
    if (hasModulePermission) {
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

/**
 * Hook to check multiple permissions at once
 * Returns an object with each permission key mapped to its boolean value
 */
export function useHasPermissions(permissionKeys: string[]) {
  const { data: currentUser, isLoading } = useQuery<CurrentUser>({
    queryKey: ['/api/auth/current-user'],
    retry: false,
  });

  const permissions: Record<string, boolean> = {};
  
  for (const key of permissionKeys) {
    permissions[key] = false;
  }

  if (isLoading) {
    return { permissions, isLoading: true };
  }

  if (!currentUser) {
    return { permissions, isLoading: false };
  }

  // Admin role has all permissions
  const isAdmin = currentUser.role === 'Admin' || currentUser.role === 'admin';
  
  for (const permissionKey of permissionKeys) {
    if (isAdmin) {
      permissions[permissionKey] = true;
      continue;
    }

    // Check granular permissions from API (flat array format)
    if (currentUser.granularPermissions && currentUser.granularPermissions.length > 0) {
      if (permissionKey.includes('.')) {
        // Check for specific permission key
        permissions[permissionKey] = currentUser.granularPermissions.some(
          (gp) => gp.permissionKey === permissionKey && gp.enabled === true
        );
      } else {
        // Check for module-level access
        permissions[permissionKey] = currentUser.granularPermissions.some(
          (gp) => gp.module === permissionKey && gp.enabled === true
        );
      }
    }

    // Fallback to legacy permissions if not found
    if (!permissions[permissionKey] && currentUser.permissions) {
      const permission = currentUser.permissions.find((p) => p.module === permissionKey);
      if (permission?.canView === true) {
        permissions[permissionKey] = true;
      }
    }
  }

  return { permissions, isLoading: false };
}

/**
 * Get current user data with permissions
 */
export function useCurrentUser() {
  const { data: currentUser, isLoading, error } = useQuery<CurrentUser>({
    queryKey: ['/api/auth/current-user'],
    retry: false,
  });

  const isAdmin = currentUser?.role === 'Admin' || currentUser?.role === 'admin';

  return { currentUser, isLoading, error, isAdmin };
}
