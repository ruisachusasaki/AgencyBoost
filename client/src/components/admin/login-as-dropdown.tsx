import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, UserCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  position: string;
}

interface LoginAsDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoginAsDropdown({ isOpen, onClose }: LoginAsDropdownProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all users for impersonation
  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/impersonation/users"],
    enabled: isOpen,
  });

  // Start impersonation mutation
  const startImpersonationMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiRequest("POST", "/api/admin/impersonation/start", { userId });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        variant: "default",
        description: `Now logged in as ${data.impersonatedUser.firstName} ${data.impersonatedUser.lastName}`,
      });
      queryClient.invalidateQueries();
      onClose();
      // Reload the page to reflect the impersonated user's permissions
      window.location.reload();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to start impersonation",
        variant: "destructive",
      });
    },
  });

  const filteredUsers = users.filter((user) => {
    const query = searchQuery.toLowerCase();
    return (
      user.firstName.toLowerCase().includes(query) ||
      user.lastName.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      user.department?.toLowerCase().includes(query) ||
      user.position?.toLowerCase().includes(query)
    );
  });

  const handleLoginAs = (userId: string) => {
    startImpersonationMutation.mutate(userId);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Login As</DialogTitle>
          <DialogDescription>
            Select a user to impersonate. You can return to your admin account at any time.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              type="search"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search-user"
            />
          </div>

          {/* User List */}
          <div className="border rounded-lg">
            <div className="bg-slate-50 px-4 py-2 border-b">
              <p className="text-sm font-medium text-slate-600">All Users</p>
            </div>
            
            <ScrollArea className="h-[400px]">
              {isLoading ? (
                <div className="p-8 text-center text-sm text-slate-500">
                  Loading users...
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="p-8 text-center">
                  <UserCircle className="h-12 w-12 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">No users found</p>
                </div>
              ) : (
                <div className="divide-y">
                  {filteredUsers.map((user) => (
                    <div
                      key={user.id}
                      className="px-4 py-3 hover:bg-slate-50 cursor-pointer transition-colors"
                      onClick={() => handleLoginAs(user.id)}
                      data-testid={`user-item-${user.id}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-sm font-medium text-primary">
                              {user.firstName[0]}{user.lastName[0]}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900">
                            {user.firstName} {user.lastName}
                          </p>
                          <p className="text-xs text-slate-500 truncate">
                            {user.email}
                          </p>
                          {(user.department || user.position) && (
                            <p className="text-xs text-slate-400 mt-0.5">
                              {[user.department, user.position].filter(Boolean).join(" • ")}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            data-testid="button-cancel"
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
