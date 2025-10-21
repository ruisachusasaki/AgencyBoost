import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { AlertCircle, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ImpersonationStatus {
  isImpersonating: boolean;
  originalAdminId?: string;
  impersonatedUser?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export default function ImpersonationBanner() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch impersonation status
  const { data: impersonationStatus } = useQuery<ImpersonationStatus>({
    queryKey: ["/api/admin/impersonation/status"],
    refetchInterval: 10000, // Check every 10 seconds
  });

  // Stop impersonation mutation
  const stopImpersonationMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/admin/impersonation/stop");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Returned to admin account",
      });
      queryClient.invalidateQueries();
      // Reload the page to reflect the admin's permissions
      window.location.reload();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to stop impersonation",
        variant: "destructive",
      });
    },
  });

  if (!impersonationStatus?.isImpersonating) {
    return null;
  }

  return (
    <div className="bg-amber-50 border-b-2 border-amber-400 px-6 py-3" data-testid="impersonation-banner">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600" />
          <div>
            <p className="text-sm font-medium text-amber-900">
              Admin Mode: Viewing as{" "}
              <span className="font-bold">
                {impersonationStatus.impersonatedUser?.firstName}{" "}
                {impersonationStatus.impersonatedUser?.lastName}
              </span>
            </p>
            <p className="text-xs text-amber-700">
              {impersonationStatus.impersonatedUser?.email}
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => stopImpersonationMutation.mutate()}
          disabled={stopImpersonationMutation.isPending}
          className="bg-white hover:bg-amber-100 border-amber-300 text-amber-900"
          data-testid="button-exit-impersonation"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Exit & Return to Admin
        </Button>
      </div>
    </div>
  );
}
