import { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Loader2, Lock } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { permissionMatches } from "@/hooks/use-has-permission";

interface RequirePermissionProps {
  children: ReactNode;
  module: string;
  permission?: string;
  fallbackPath?: string;
}

/**
 * RequirePermission component wraps pages/sections to enforce access control
 * 
 * Usage for module-level access (any permission in module):
 * <RequirePermission module="hr">
 *   <HRPage />
 * </RequirePermission>
 * 
 * Usage for specific permission:
 * <RequirePermission module="tasks" permission="tasks.templates.manage">
 *   <TemplatesSection />
 * </RequirePermission>
 */
export default function RequirePermission({ 
  children, 
  module, 
  permission,
  fallbackPath = '/'
}: RequirePermissionProps) {
  const [, setLocation] = useLocation();

  const { data: currentUser, isLoading, error } = useQuery({
    queryKey: ['/api/auth/current-user'],
    retry: false,
    queryFn: async () => {
      const response = await fetch('/api/auth/current-user', {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch current user');
      }
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Checking permissions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900 p-6">
        <Alert variant="destructive" className="max-w-md">
          <Lock className="h-4 w-4" />
          <AlertTitle>Authentication Error</AlertTitle>
          <AlertDescription className="mb-4">
            Unable to verify your permissions. Please try refreshing the page or logging in again.
          </AlertDescription>
          <Button onClick={() => setLocation('/login')} variant="outline">
            Go to Login
          </Button>
        </Alert>
      </div>
    );
  }

  const checkHasPermission = (): boolean => {
    // Admin role has all permissions
    if (currentUser?.role === 'Admin' || currentUser?.role === 'admin') {
      return true;
    }

    // Check granular permissions (flat array format from API)
    if (currentUser?.granularPermissions && currentUser.granularPermissions.length > 0) {
      if (permission) {
        const hasMatch = currentUser.granularPermissions.some(
          (gp: any) => gp.enabled === true && permissionMatches(gp.permissionKey, permission)
        );
        
        if (hasMatch) return true;
      } else {
        const hasModuleAccess = currentUser.granularPermissions.some(
          (gp: any) => gp.module === module && gp.enabled === true
        );
        if (hasModuleAccess) return true;
      }
    }
    
    // Fallback to legacy permissions (always check, even if granular permissions exist but didn't match)
    if (currentUser?.permissions) {
      const modulePermission = currentUser.permissions.find((p: any) => p.module === module);
      if (modulePermission?.canView === true) return true;
    }

    // DENY by default
    return false;
  };

  if (!checkHasPermission()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900 p-6">
        <Alert variant="destructive" className="max-w-md">
          <Lock className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription className="mb-4">
            You don't have permission to access this page. Please contact your administrator if you believe this is an error.
          </AlertDescription>
          <Button onClick={() => setLocation(fallbackPath)} variant="outline">
            Go Back
          </Button>
        </Alert>
      </div>
    );
  }

  return <>{children}</>;
}
