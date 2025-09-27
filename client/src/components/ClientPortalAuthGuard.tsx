import { ReactNode, useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";

interface ClientPortalAuthGuardProps {
  children: ReactNode;
}

export default function ClientPortalAuthGuard({ children }: ClientPortalAuthGuardProps) {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [shouldRedirect, setShouldRedirect] = useState(false);
  
  const { data: user, isLoading, error, refetch } = useQuery({
    queryKey: ["/api/client-portal/me"],
    retry: false, // Don't retry failed auth requests
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true, // Re-check auth when window regains focus
  });

  useEffect(() => {
    // Only redirect on 401 Unauthorized (authentication error)
    if (error && !isLoading) {
      // Check if it's a 401 authentication error
      // TanStack Query error format: Error with message like "401: {...}"
      const status = (error as any)?.status ?? (error as any)?.response?.status;
      const messageStatus = (error as any)?.message?.match(/^(\d+):/)?.[1];
      const extractedStatus = status || parseInt(messageStatus || "0", 10);
      const isAuthError = extractedStatus === 401;
      
      if (isAuthError) {
        setShouldRedirect(true);
        navigate("/client-portal/login", { replace: true });
      }
    }
  }, [error, isLoading, navigate]);

  // Handle successful authentication
  useEffect(() => {
    if (user?.success && user?.user) {
      // Store user data for display purposes only (not for auth)
      sessionStorage.setItem("clientPortalUser", JSON.stringify(user.user));
    }
  }, [user]);

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Check if we should redirect (prevents render-time navigation)
  if (shouldRedirect) {
    return null;
  }

  // Show error state for non-auth errors (network issues, server errors, etc.)
  const status = (error as any)?.status ?? (error as any)?.response?.status;
  const messageStatus = (error as any)?.message?.match(/^(\d+):/)?.[1];
  const extractedStatus = status || parseInt(messageStatus || "0", 10);
  const isAuthError = extractedStatus === 401;
  
  if (error && !isAuthError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Connection Error</h3>
          <p className="text-muted-foreground mb-4">
            Unable to verify your authentication. Please check your connection and try again.
          </p>
          <Button
            onClick={() => refetch()}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // If no user data but no error, something went wrong
  if (!user?.success) {
    return null;
  }

  // Render protected content
  return <>{children}</>;
}