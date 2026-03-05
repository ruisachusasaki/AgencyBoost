import { ReactNode } from "react";
import { useHasPermission } from "@/hooks/use-has-permission";

interface PermissionGateProps {
  children: ReactNode;
  permission: string;
  fallback?: ReactNode;
  showLoading?: boolean;
}

/**
 * PermissionGate component for conditionally rendering content based on user permissions
 * 
 * Usage:
 * <PermissionGate permission="tasks.all.delete">
 *   <DeleteButton />
 * </PermissionGate>
 * 
 * With fallback:
 * <PermissionGate permission="hr.staff.edit" fallback={<ReadOnlyView />}>
 *   <EditableView />
 * </PermissionGate>
 */
export function PermissionGate({ 
  children, 
  permission, 
  fallback = null,
  showLoading = false 
}: PermissionGateProps) {
  const { hasPermission, isLoading } = useHasPermission(permission);

  if (isLoading && showLoading) {
    return null;
  }

  if (isLoading) {
    return <>{fallback}</>;
  }

  if (!hasPermission) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

interface MultiPermissionGateProps {
  children: ReactNode;
  permissions: string[];
  requireAll?: boolean;
  fallback?: ReactNode;
}

/**
 * MultiPermissionGate component for checking multiple permissions
 * 
 * Usage:
 * <MultiPermissionGate permissions={["tasks.all.view", "tasks.all.edit"]} requireAll={false}>
 *   <AdminTaskView />
 * </MultiPermissionGate>
 */
export function MultiPermissionGate({
  children,
  permissions,
  requireAll = false,
  fallback = null
}: MultiPermissionGateProps) {
  const permissionResults = permissions.map(p => useHasPermission(p));
  
  const isLoading = permissionResults.some(r => r.isLoading);
  
  if (isLoading) {
    return <>{fallback}</>;
  }

  const hasAllPermissions = permissionResults.every(r => r.hasPermission);
  const hasAnyPermission = permissionResults.some(r => r.hasPermission);

  const hasPermission = requireAll ? hasAllPermissions : hasAnyPermission;

  if (!hasPermission) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

export default PermissionGate;
