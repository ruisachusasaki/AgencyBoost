import { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Loader2, Lock } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface RequirePermissionProps {
  children: ReactNode;
  module: string;
  permission?: 'canView' | 'canCreate' | 'canEdit' | 'canDelete' | 'canManage';
  fallbackPath?: string;
}

export default function RequirePermission({ 
  children, 
  module, 
  permission = 'canView',
  fallbackPath = '/'
}: RequirePermissionProps) {
  const [, setLocation] = useLocation();

  // Fetch current user data for permission checking
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

  // Show loading state while checking permissions
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

  // Show error state if user fetch failed
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

  // Check if user has the required permission
  const hasPermission = () => {
    // Only admins get automatic access
    if (currentUser?.role === 'Admin' || currentUser?.role === 'admin') {
      return true;
    }
    
    if (!currentUser?.permissions) {
      // DENY by default if no permissions data - only admins get fallback access
      return false;
    }
    
    // Check if user has the required permission for the module
    const userPermission = currentUser.permissions.find((p: any) => p.module === module);
    return userPermission?.[permission] === true;
  };

  // Show access denied if user doesn't have permission
  if (!hasPermission()) {
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

  // User has permission, render the protected content
  return <>{children}</>;
}