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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Globe, Lock, Users, User, Plus, X } from "lucide-react";

interface ArticlePermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  articleId: string;
  articleTitle: string;
}

interface Permission {
  id?: string;
  accessType: 'role' | 'user';
  accessId: string;
  permission: 'read' | 'write' | 'admin';
}

export function ArticlePermissionsModal({ 
  isOpen, 
  onClose, 
  articleId, 
  articleTitle 
}: ArticlePermissionsModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isPublic, setIsPublic] = useState(true);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [newPermissionType, setNewPermissionType] = useState<'role' | 'user'>('role');
  const [newPermissionAccess, setNewPermissionAccess] = useState('');
  const [newPermissionLevel, setNewPermissionLevel] = useState<'read' | 'write' | 'admin'>('read');

  // Fetch staff for user permissions
  const { data: staff = [] } = useQuery({
    queryKey: ['/api/staff'],
    enabled: isOpen
  });

  // Fetch current permissions
  const { data: currentPermissions, isLoading } = useQuery({
    queryKey: [`/api/knowledge-base/articles/${articleId}/permissions`],
    enabled: isOpen && !!articleId,
    onSuccess: (data: any) => {
      setIsPublic(data.isPublic);
      setPermissions(data.permissions || []);
    }
  });

  // Update permissions mutation
  const updatePermissionsMutation = useMutation({
    mutationFn: async (data: { isPublic: boolean; permissions: Permission[] }) => {
      const response = await apiRequest("PUT", `/api/knowledge-base/articles/${articleId}/permissions`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Article permissions updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/knowledge-base/articles/${articleId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/knowledge-base/articles'] });
      onClose();
    },
    onError: (error: any) => {
      console.error("Permissions update error:", error);
      toast({
        title: "Error",
        description: "Failed to update permissions",
        variant: "destructive",
      });
    },
  });

  // Reset form when opening
  useEffect(() => {
    if (isOpen && currentPermissions) {
      setIsPublic(currentPermissions.isPublic);
      setPermissions(currentPermissions.permissions || []);
    }
  }, [isOpen, currentPermissions]);

  const handleAddPermission = () => {
    if (!newPermissionAccess) {
      toast({
        title: "Error",
        description: "Please select a user or role",
        variant: "destructive",
      });
      return;
    }

    // Check if permission already exists
    const exists = permissions.some(p => 
      p.accessType === newPermissionType && p.accessId === newPermissionAccess
    );

    if (exists) {
      toast({
        title: "Error", 
        description: "Permission already exists for this user/role",
        variant: "destructive",
      });
      return;
    }

    const newPermission: Permission = {
      accessType: newPermissionType,
      accessId: newPermissionAccess,
      permission: newPermissionLevel,
    };

    setPermissions([...permissions, newPermission]);
    setNewPermissionAccess('');
  };

  const handleRemovePermission = (index: number) => {
    setPermissions(permissions.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    updatePermissionsMutation.mutate({
      isPublic,
      permissions,
    });
  };

  const getDisplayName = (permission: Permission) => {
    if (permission.accessType === 'role') {
      return permission.accessId;
    } else {
      const user = staff.find((s: any) => s.id === permission.accessId);
      return user ? `${user.firstName} ${user.lastName}` : 'Unknown User';
    }
  };

  const availableRoles = ['Admin', 'Manager', 'User', 'Accounting'];
  const availableUsers = staff.filter((s: any) => 
    !permissions.some(p => p.accessType === 'user' && p.accessId === s.id)
  );
  const availableRolesFiltered = availableRoles.filter(role =>
    !permissions.some(p => p.accessType === 'role' && p.accessId === role)
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Article Permissions
          </DialogTitle>
          <DialogDescription>
            Manage access and permissions for "{articleTitle}"
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="text-center py-8">Loading permissions...</div>
        ) : (
          <div className="space-y-6">
            {/* Public/Private Toggle */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  {isPublic ? <Globe className="w-5 h-5 text-green-600" /> : <Lock className="w-5 h-5 text-red-600" />}
                  Visibility
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-sm font-medium">
                      {isPublic ? "Public Article" : "Private Article"}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {isPublic 
                        ? "All authenticated users can view this article" 
                        : "Only users with specific permissions can access this article"
                      }
                    </p>
                  </div>
                  <Switch
                    checked={isPublic}
                    onCheckedChange={setIsPublic}
                    data-testid="switch-public"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Permissions Management */}
            {!isPublic && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Access Control
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Add Permission */}
                  <div className="border rounded-lg p-4 bg-muted/50">
                    <Label className="text-sm font-medium mb-3 block">Add Access</Label>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <Select value={newPermissionType} onValueChange={(value: 'role' | 'user') => {
                        setNewPermissionType(value);
                        setNewPermissionAccess('');
                      }}>
                        <SelectTrigger data-testid="select-permission-type">
                          <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="role">Role</SelectItem>
                          <SelectItem value="user">User</SelectItem>
                        </SelectContent>
                      </Select>

                      <Select value={newPermissionAccess} onValueChange={setNewPermissionAccess}>
                        <SelectTrigger data-testid="select-permission-access">
                          <SelectValue placeholder={newPermissionType === 'role' ? "Select role" : "Select user"} />
                        </SelectTrigger>
                        <SelectContent>
                          {newPermissionType === 'role' ? (
                            availableRolesFiltered.map(role => (
                              <SelectItem key={role} value={role}>{role}</SelectItem>
                            ))
                          ) : (
                            availableUsers.map((user: any) => (
                              <SelectItem key={user.id} value={user.id}>
                                {user.firstName} {user.lastName}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>

                      <Select value={newPermissionLevel} onValueChange={(value: 'read' | 'write' | 'admin') => setNewPermissionLevel(value)}>
                        <SelectTrigger data-testid="select-permission-level">
                          <SelectValue placeholder="Permission" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="read">Read</SelectItem>
                          <SelectItem value="write">Write</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>

                      <Button
                        onClick={handleAddPermission}
                        size="sm"
                        data-testid="button-add-permission"
                        disabled={!newPermissionAccess}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Current Permissions */}
                  {permissions.length > 0 && (
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Current Access</Label>
                      {permissions.map((permission, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            {permission.accessType === 'role' ? (
                              <Users className="w-4 h-4 text-blue-600" />
                            ) : (
                              <User className="w-4 h-4 text-green-600" />
                            )}
                            <div>
                              <div className="font-medium">{getDisplayName(permission)}</div>
                              <div className="text-xs text-muted-foreground">
                                {permission.accessType === 'role' ? 'Role' : 'User'}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {permission.permission}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemovePermission(index)}
                              data-testid={`button-remove-permission-${index}`}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {permissions.length === 0 && (
                    <div className="text-center py-6 text-muted-foreground">
                      <Lock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No specific permissions set</p>
                      <p className="text-xs">Only you can access this private article</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} data-testid="button-cancel-permissions">
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={updatePermissionsMutation.isPending}
            data-testid="button-save-permissions"
            className="bg-[#00C9C6] hover:bg-[#00b3b0] text-white"
          >
            {updatePermissionsMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}