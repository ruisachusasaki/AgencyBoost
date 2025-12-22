import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Globe, Lock, Users, User, Plus, X, Shield, Info } from "lucide-react";

interface CategoryPermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryId: string;
  categoryName: string;
}

interface Permission {
  id?: string;
  accessType: 'team' | 'user';
  accessId: string;
  permission: 'read' | 'write' | 'admin';
  accessName?: string;
}

export function CategoryPermissionsModal({ 
  isOpen, 
  onClose, 
  categoryId, 
  categoryName 
}: CategoryPermissionsModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [newPermissionType, setNewPermissionType] = useState<'team' | 'user'>('team');
  const [newPermissionAccess, setNewPermissionAccess] = useState('');

  const { data: staff = [] } = useQuery({
    queryKey: ['/api/staff'],
    enabled: isOpen
  });

  const { data: availableTeams = [] } = useQuery({
    queryKey: ['/api/departments'],
    enabled: isOpen
  });

  const { data: currentPermissions, isLoading } = useQuery<Permission[]>({
    queryKey: ['/api/knowledge-base/categories', categoryId, 'permissions'],
    queryFn: async () => {
      const response = await fetch(`/api/knowledge-base/categories/${categoryId}/permissions`);
      if (!response.ok) throw new Error('Failed to fetch permissions');
      return response.json();
    },
    enabled: isOpen && !!categoryId
  });

  const updatePermissionsMutation = useMutation({
    mutationFn: async (data: { permissions: Permission[] }) => {
      const response = await apiRequest("PUT", `/api/knowledge-base/categories/${categoryId}/permissions`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Category access updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/knowledge-base/categories'] });
      queryClient.invalidateQueries({ queryKey: ['/api/knowledge-base/categories', categoryId, 'permissions'] });
      onClose();
    },
    onError: (error: any) => {
      console.error("Permissions update error:", error);
      toast({
        title: "Error",
        description: "Failed to update category access",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (isOpen && currentPermissions) {
      setPermissions(currentPermissions || []);
    } else if (isOpen && !currentPermissions) {
      setPermissions([]);
    }
  }, [isOpen, currentPermissions]);

  const handleAddPermission = () => {
    if (!newPermissionAccess) {
      toast({
        title: "Error",
        description: "Please select a user or team",
        variant: "destructive",
      });
      return;
    }

    const exists = permissions.some(p => 
      p.accessType === newPermissionType && p.accessId === newPermissionAccess
    );

    if (exists) {
      toast({
        title: "Error", 
        description: "Access already granted to this user/team",
        variant: "destructive",
      });
      return;
    }

    const newPermission: Permission = {
      accessType: newPermissionType,
      accessId: newPermissionAccess,
      permission: 'read',
    };

    setPermissions([...permissions, newPermission]);
    setNewPermissionAccess('');
  };

  const handleRemovePermission = (index: number) => {
    setPermissions(permissions.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    updatePermissionsMutation.mutate({ permissions });
  };

  const getDisplayName = (permission: Permission) => {
    if (permission.accessName) return permission.accessName;
    
    if (permission.accessType === 'team') {
      const team = availableTeams.find((t: any) => t.id === permission.accessId);
      return team ? team.name : 'Unknown Team';
    } else {
      const user = staff.find((s: any) => s.id === permission.accessId);
      return user ? `${user.firstName} ${user.lastName}` : 'Unknown User';
    }
  };

  const availableUsers = staff.filter((s: any) => 
    !permissions.some(p => p.accessType === 'user' && p.accessId === s.id)
  );
  const availableTeamsFiltered = availableTeams.filter((team: any) =>
    !permissions.some(p => p.accessType === 'team' && p.accessId === team.id)
  );

  const isRestricted = permissions.length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Category Access Control
          </DialogTitle>
          <DialogDescription>
            Manage who can see the "{categoryName}" category and its articles.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <Card className={isRestricted ? "border-amber-200 bg-amber-50/50" : "border-green-200 bg-green-50/50"}>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                {isRestricted ? (
                  <>
                    <Lock className="w-5 h-5 text-amber-600" />
                    <div>
                      <p className="font-medium text-amber-900">Restricted Access</p>
                      <p className="text-sm text-amber-700">
                        Only the selected users and teams below can view this category.
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <Globe className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-medium text-green-900">Public Access</p>
                      <p className="text-sm text-green-700">
                        This category is visible to all team members. Add users or teams below to restrict access.
                      </p>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-blue-800">
              When you restrict a category, users without access will not see it in the sidebar, and cannot access any articles within it.
            </p>
          </div>

          <Separator />

          <div className="space-y-4">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-4 h-4" />
              {isRestricted ? "Users & Teams with Access" : "Restrict Access To"}
            </CardTitle>

            {permissions.length > 0 && (
              <div className="space-y-2">
                {permissions.map((permission, index) => (
                  <div 
                    key={index} 
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      {permission.accessType === 'team' ? (
                        <Users className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <User className="w-4 h-4 text-muted-foreground" />
                      )}
                      <span>{getDisplayName(permission)}</span>
                      <Badge variant="secondary" className="ml-2">
                        {permission.accessType === 'team' ? 'Team' : 'User'}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemovePermission(index)}
                      className="text-destructive hover:text-destructive"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Add Access</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="permission-type">Type</Label>
                    <Select
                      value={newPermissionType}
                      onValueChange={(value: 'team' | 'user') => {
                        setNewPermissionType(value);
                        setNewPermissionAccess('');
                      }}
                    >
                      <SelectTrigger id="permission-type" data-testid="select-permission-type">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="team">Team</SelectItem>
                        <SelectItem value="user">User</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="permission-access">
                      {newPermissionType === 'team' ? 'Team' : 'User'}
                    </Label>
                    <Select
                      value={newPermissionAccess}
                      onValueChange={setNewPermissionAccess}
                    >
                      <SelectTrigger id="permission-access" data-testid="select-permission-access">
                        <SelectValue placeholder={`Select ${newPermissionType}`} />
                      </SelectTrigger>
                      <SelectContent>
                        {newPermissionType === 'team' ? (
                          availableTeamsFiltered.length > 0 ? (
                            availableTeamsFiltered.map((team: any) => (
                              <SelectItem key={team.id} value={team.id}>
                                {team.name}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="" disabled>No teams available</SelectItem>
                          )
                        ) : (
                          availableUsers.length > 0 ? (
                            availableUsers.map((user: any) => (
                              <SelectItem key={user.id} value={user.id}>
                                {user.firstName} {user.lastName}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="" disabled>No users available</SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button
                  onClick={handleAddPermission}
                  variant="outline"
                  className="w-full"
                  disabled={!newPermissionAccess}
                  data-testid="button-add-category-permission"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Access
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} data-testid="button-cancel-category-permissions">
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={updatePermissionsMutation.isPending}
            data-testid="button-save-category-permissions"
          >
            {updatePermissionsMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
