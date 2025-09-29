import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Shield, Plus, Edit, Trash2, Users, Eye, Settings, ArrowLeft, AlertTriangle, Lock } from "lucide-react";
import { Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Role, Permission, InsertRole } from "@shared/schema";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface RoleWithPermissions extends Role {
  userCount: number;
  permissions: Permission[];
}

interface EditablePermission {
  module: string;
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canManage: boolean;
}

interface PermissionFormData {
  module: string;
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canManage: boolean;
}

export default function RolesPermissions() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddRoleDialogOpen, setIsAddRoleDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<(Omit<RoleWithPermissions, 'permissions'> & { permissions: EditablePermission[] }) | null>(null);
  const [newRole, setNewRole] = useState({
    name: "",
    description: "",
    permissions: [] as PermissionFormData[]
  });

  // Fetch current user data for admin check
  const { data: currentUser, isLoading: loadingUser, error: userError } = useQuery({
    queryKey: ['/api/auth/current-user'],
    retry: false,
    queryFn: async () => {
      const response = await fetch('/api/auth/current-user', {
        credentials: 'include',
      });
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required');
        }
        throw new Error('Failed to fetch current user');
      }
      return response.json();
    },
  });

  // Check if user is admin - only admins can manage roles
  const isAdmin = currentUser && ['Admin', 'admin'].includes(currentUser.role);

  // Available modules for permissions
  const modules = [
    "clients", "projects", "sales", "tasks", "invoices", 
    "leads", "workflows", "reports", "settings", "staff", "roles"
  ];

  // Fetch roles - only if user is admin
  const { data: roles = [], isLoading } = useQuery<RoleWithPermissions[]>({
    queryKey: ["/api/roles"],
    enabled: isAdmin, // Only fetch if user is admin
    retry: false,
  });

  // Create role mutation
  const createRoleMutation = useMutation({
    mutationFn: async (roleData: InsertRole & { permissions: PermissionFormData[] }) => {
      const response = await apiRequest("POST", "/api/roles", roleData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/roles"] });
      toast({
        title: "Success",
        description: "Role created successfully.",
      });
      setIsAddRoleDialogOpen(false);
      setNewRole({ name: "", description: "", permissions: [] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create role. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update role mutation
  const updateRoleMutation = useMutation({
    mutationFn: async ({ id, ...roleData }: { id: string } & InsertRole & { permissions: PermissionFormData[] }) => {
      const response = await apiRequest("PUT", `/api/roles/${id}`, roleData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/roles"] });
      toast({
        title: "Success",
        description: "Role updated successfully.",
      });
      setEditingRole(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update role. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete role mutation
  const deleteRoleMutation = useMutation({
    mutationFn: async (roleId: string) => {
      const response = await apiRequest("DELETE", `/api/roles/${roleId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/roles"] });
      toast({
        title: "Success",
        description: "Role deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete role. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleAddRole = (e: React.FormEvent, roleData: { name: string; description: string; permissions: PermissionFormData[] }) => {
    e.preventDefault();
    createRoleMutation.mutate(roleData);
  };

  const handleUpdateRole = (e: React.FormEvent, roleData: { name: string; description: string; permissions: PermissionFormData[] }) => {
    e.preventDefault();
    if (editingRole) {
      const { id, userCount, createdAt, updatedAt, ...existingRoleData } = editingRole;
      
      const permissionsPayload = roleData.permissions.map(p => ({
        module: p.module,
        canView: p.canView ?? false,
        canCreate: p.canCreate ?? false,
        canEdit: p.canEdit ?? false,
        canDelete: p.canDelete ?? false,
        canManage: p.canManage ?? false,
      }));
      
      updateRoleMutation.mutate({ 
        id, 
        name: roleData.name,
        description: roleData.description,
        permissions: permissionsPayload
      });
    }
  };

  const handleDeleteRole = (roleId: string, roleName: string) => {
    if (!confirm(`Are you sure you want to delete the "${roleName}" role? This will affect all users assigned to this role.`)) return;
    deleteRoleMutation.mutate(roleId);
  };

  const initializePermissions = () => {
    return modules.map(module => ({
      module,
      canView: false,
      canCreate: false,
      canEdit: false,
      canDelete: false,
      canManage: false,
    }));
  };

  const updatePermission = (
    permissions: PermissionFormData[], 
    setPermissions: (perms: PermissionFormData[]) => void,
    module: string, 
    action: keyof Omit<PermissionFormData, 'module'>, 
    value: boolean
  ) => {
    const updated = permissions.map(perm => 
      perm.module === module ? { ...perm, [action]: value } : perm
    );
    setPermissions(updated);
  };

  const getPermissionIcon = (action: string) => {
    switch (action) {
      case "canView": return <Eye className="h-3 w-3" />;
      case "canCreate": return <Plus className="h-3 w-3" />;
      case "canEdit": return <Edit className="h-3 w-3" />;
      case "canDelete": return <Trash2 className="h-3 w-3" />;
      case "canManage": return <Settings className="h-3 w-3" />;
      default: return null;
    }
  };

  const formatModuleName = (module: string) => {
    return module.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const RoleForm = ({ 
    role, 
    isEdit = false, 
    onSubmit, 
    onCancel 
  }: { 
    role: { name: string; description: string; permissions: PermissionFormData[] },
    isEdit?: boolean,
    onSubmit: (e: React.FormEvent, roleData: { name: string; description: string; permissions: PermissionFormData[] }) => void,
    onCancel: () => void 
  }) => {
    const [localRole, setLocalRole] = useState(role);

    // Initialize permissions if empty on mount or when role changes
    useEffect(() => {
      if (role.permissions.length === 0) {
        const initialPermissions = initializePermissions();
        setLocalRole(prev => ({ ...prev, permissions: initialPermissions }));
      } else {
        // Filter existing permissions to only show current modules
        const filteredPermissions = role.permissions.filter(perm => 
          modules.includes(perm.module)
        );
        
        // Add any missing modules with default permissions
        const existingModules = filteredPermissions.map(p => p.module);
        const missingModules = modules.filter(module => !existingModules.includes(module));
        const missingPermissions = missingModules.map(module => ({
          module,
          canView: false,
          canCreate: false,
          canEdit: false,
          canDelete: false,
          canManage: false,
        }));
        
        const allPermissions = [...filteredPermissions, ...missingPermissions];
        setLocalRole(prev => ({ ...prev, ...role, permissions: allPermissions }));
      }
    }, [role]);


    return (
      <form onSubmit={(e) => onSubmit(e, localRole)} className="space-y-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Role Name</Label>
            <Input
              id="name"
              value={localRole.name}
              onChange={(e) => {
                setLocalRole(prev => ({ ...prev, name: e.target.value }));
              }}
              placeholder="Enter role name"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={localRole.description || ""}
              onChange={(e) => {
                setLocalRole(prev => ({ ...prev, description: e.target.value }));
              }}
              placeholder="Enter role description"
              rows={3}
            />
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-medium">Permissions</h4>
          <div className="border rounded-lg">
            <div className="grid grid-cols-6 gap-2 p-3 border-b bg-muted/50 text-sm font-medium">
              <div>Module</div>
              <div className="text-center">View</div>
              <div className="text-center">Create</div>
              <div className="text-center">Edit</div>
              <div className="text-center">Delete</div>
              <div className="text-center">Manage</div>
            </div>
            {localRole.permissions.map((perm) => (
              <div key={perm.module} className="grid grid-cols-6 gap-2 p-3 border-b last:border-b-0">
                <div className="font-medium">{formatModuleName(perm.module)}</div>
                {(['canView', 'canCreate', 'canEdit', 'canDelete', 'canManage'] as const).map((action) => (
                  <div key={action} className="flex justify-center">
                    <Switch
                      checked={perm[action]}
                      onCheckedChange={(checked) => {
                        const updatedPermissions = localRole.permissions.map(p => 
                          p.module === perm.module ? { ...p, [action]: checked } : p
                        );
                        setLocalRole(prev => ({ ...prev, permissions: updatedPermissions }));
                      }}
                    />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={createRoleMutation.isPending || updateRoleMutation.isPending}
          >
            {isEdit ? 'Update Role' : 'Create Role'}
          </Button>
        </div>
      </form>
    );
  };

  // Show loading state while checking authentication
  if (loadingUser) {
    return (
      <div className="space-y-6">
        <Link to="/settings">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Settings
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Roles & Permissions</h1>
            <p className="text-muted-foreground">Checking permissions...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show authentication error
  if (userError) {
    return (
      <div className="space-y-6">
        <Link to="/settings">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Settings
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Roles & Permissions</h1>
          </div>
        </div>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Authentication Error</AlertTitle>
          <AlertDescription>
            {userError.message === 'Authentication required' 
              ? 'Please log in to access this page.'
              : 'Unable to verify your identity. Please try refreshing the page or logging in again.'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Show access denied for non-admin users
  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <Link to="/settings">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Settings
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Roles & Permissions</h1>
          </div>
        </div>
        <Alert variant="destructive">
          <Lock className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You need administrator privileges to access role and permission management.
            Please contact your system administrator for access.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Show loading state for roles data
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Link to="/settings">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Settings
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Roles & Permissions</h1>
            <p className="text-muted-foreground">Loading roles...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <Link to="/settings">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Settings
          </Button>
        </Link>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Roles & Permissions</h1>
              <p className="text-muted-foreground">
                Manage user roles and their permissions
              </p>
            </div>
          </div>

          <Dialog open={isAddRoleDialogOpen} onOpenChange={setIsAddRoleDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Role
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Role</DialogTitle>
              <DialogDescription>
                Create a new role and set specific permissions for different modules.
              </DialogDescription>
            </DialogHeader>
            <RoleForm
              role={newRole}
              onSubmit={handleAddRole}
              onCancel={() => setIsAddRoleDialogOpen(false)}
            />
          </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Roles Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {roles.map((role) => (
          <Card key={role.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-blue-600" />
                  <CardTitle className="text-lg">{role.name}</CardTitle>
                  {role.isSystem && (
                    <Badge variant="secondary" className="text-xs">
                      System
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Dialog 
                    open={editingRole?.id === role.id} 
                    onOpenChange={(open) => {
                      if (open) {
                        // Initialize permissions for current modules only, filtering out old modules
                        const filteredPermissions = role.permissions.filter(perm => 
                          modules.includes(perm.module)
                        );
                        
                        const fullPermissions = modules.map(module => {
                          const existingPerm = filteredPermissions.find(p => p.module === module);
                          return {
                            module,
                            canView: existingPerm?.canView ?? false,
                            canCreate: existingPerm?.canCreate ?? false,
                            canEdit: existingPerm?.canEdit ?? false,
                            canDelete: existingPerm?.canDelete ?? false,
                            canManage: existingPerm?.canManage ?? false,
                          };
                        });
                        
                        setEditingRole({
                          ...role,
                          permissions: fullPermissions
                        });
                      } else {
                        setEditingRole(null);
                      }
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Edit Role: {role.name}</DialogTitle>
                        <DialogDescription>
                          Modify the role name, description, and permissions for different modules.
                        </DialogDescription>
                      </DialogHeader>
                      {editingRole && (
                        <RoleForm
                          role={{
                            name: editingRole.name,
                            description: editingRole.description || "",
                            permissions: editingRole.permissions.map(p => ({
                              module: p.module,
                              canView: p.canView ?? false,
                              canCreate: p.canCreate ?? false,
                              canEdit: p.canEdit ?? false,
                              canDelete: p.canDelete ?? false,
                              canManage: p.canManage ?? false,
                            }))
                          }}
                          isEdit={true}
                          onSubmit={handleUpdateRole}
                          onCancel={() => setEditingRole(null)}
                        />
                      )}
                    </DialogContent>
                  </Dialog>
                  
                  {!role.isSystem && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteRole(role.id, role.name)}
                      disabled={deleteRoleMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  )}
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{role.description}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4" />
                <span>{role.userCount} users assigned</span>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-2">Permissions Summary</h4>
                <div className="space-y-1">
                  {role.permissions
                    .filter(perm => modules.includes(perm.module))
                    .map((perm) => {
                    const actions = [];
                    if (perm.canView) actions.push("View");
                    if (perm.canCreate) actions.push("Create");
                    if (perm.canEdit) actions.push("Edit");
                    if (perm.canDelete) actions.push("Delete");
                    if (perm.canManage) actions.push("Manage");
                    
                    if (actions.length > 0) {
                      return (
                        <div key={perm.module} className="flex justify-between text-xs">
                          <span className="font-medium">{formatModuleName(perm.module)}:</span>
                          <span className="text-muted-foreground">{actions.join(", ")}</span>
                        </div>
                      );
                    }
                    return null;
                  }).filter(Boolean)}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}