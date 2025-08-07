import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Shield, Plus, Edit, Trash2, Users, Eye, Edit3, Trash, Settings } from "lucide-react";

interface Role {
  id: string;
  name: string;
  description: string;
  userCount: number;
  permissions: Permission[];
  isSystem: boolean;
  createdAt: string;
}

interface Permission {
  module: string;
  actions: {
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
    manage?: boolean;
  };
}

export default function RolesPermissions() {
  const { toast } = useToast();
  const [isAddRoleDialogOpen, setIsAddRoleDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Mock roles data
  const [roles] = useState<Role[]>([
    {
      id: "1",
      name: "Admin",
      description: "Full system access with all permissions",
      userCount: 2,
      isSystem: true,
      createdAt: "2024-01-01",
      permissions: [
        { module: "Clients", actions: { view: true, create: true, edit: true, delete: true } },
        { module: "Projects", actions: { view: true, create: true, edit: true, delete: true } },
        { module: "Campaigns", actions: { view: true, create: true, edit: true, delete: true } },
        { module: "Settings", actions: { view: true, create: true, edit: true, delete: true, manage: true } },
        { module: "Users", actions: { view: true, create: true, edit: true, delete: true, manage: true } },
        { module: "Reports", actions: { view: true, create: true, edit: true, delete: true } }
      ]
    },
    {
      id: "2",
      name: "Manager",
      description: "Team management with limited admin access",
      userCount: 3,
      isSystem: true,
      createdAt: "2024-01-01",
      permissions: [
        { module: "Clients", actions: { view: true, create: true, edit: true, delete: false } },
        { module: "Projects", actions: { view: true, create: true, edit: true, delete: true } },
        { module: "Campaigns", actions: { view: true, create: true, edit: true, delete: true } },
        { module: "Settings", actions: { view: true, create: false, edit: false, delete: false } },
        { module: "Users", actions: { view: true, create: false, edit: false, delete: false } },
        { module: "Reports", actions: { view: true, create: true, edit: false, delete: false } }
      ]
    },
    {
      id: "3",
      name: "User",
      description: "Standard user access for daily operations",
      userCount: 8,
      isSystem: true,
      createdAt: "2024-01-01",
      permissions: [
        { module: "Clients", actions: { view: true, create: true, edit: true, delete: false } },
        { module: "Projects", actions: { view: true, create: false, edit: true, delete: false } },
        { module: "Campaigns", actions: { view: true, create: false, edit: false, delete: false } },
        { module: "Settings", actions: { view: false, create: false, edit: false, delete: false } },
        { module: "Users", actions: { view: false, create: false, edit: false, delete: false } },
        { module: "Reports", actions: { view: true, create: false, edit: false, delete: false } }
      ]
    },
    {
      id: "4",
      name: "Accounting",
      description: "Access to financial data and invoicing",
      userCount: 1,
      isSystem: false,
      createdAt: "2024-02-15",
      permissions: [
        { module: "Clients", actions: { view: true, create: false, edit: false, delete: false } },
        { module: "Projects", actions: { view: true, create: false, edit: false, delete: false } },
        { module: "Campaigns", actions: { view: false, create: false, edit: false, delete: false } },
        { module: "Settings", actions: { view: false, create: false, edit: false, delete: false } },
        { module: "Users", actions: { view: false, create: false, edit: false, delete: false } },
        { module: "Reports", actions: { view: true, create: true, edit: false, delete: false } }
      ]
    }
  ]);

  const [newRole, setNewRole] = useState({
    name: "",
    description: "",
    permissions: [] as Permission[]
  });

  const modules = [
    "Clients", "Projects", "Campaigns", "Tasks", "Invoices", 
    "Reports", "Settings", "Users", "Workflows", "Social Media"
  ];

  const handleAddRole = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // TODO: Implement API call to add role
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      toast({
        title: "Success",
        description: "Role created successfully.",
      });
      
      setIsAddRoleDialogOpen(false);
      setNewRole({ name: "", description: "", permissions: [] });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create role. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteRole = async (roleId: string, roleName: string) => {
    if (!confirm(`Are you sure you want to delete the "${roleName}" role? This will affect all users assigned to this role.`)) return;
    
    try {
      // TODO: Implement API call to delete role
      await new Promise(resolve => setTimeout(resolve, 500));
      
      toast({
        title: "Success",
        description: "Role deleted successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete role. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getPermissionIcon = (action: string) => {
    switch (action) {
      case "view": return <Eye className="h-3 w-3" />;
      case "create": return <Plus className="h-3 w-3" />;
      case "edit": return <Edit3 className="h-3 w-3" />;
      case "delete": return <Trash className="h-3 w-3" />;
      case "manage": return <Settings className="h-3 w-3" />;
      default: return null;
    }
  };

  const getActionColor = (action: string, hasPermission: boolean) => {
    if (!hasPermission) return "text-gray-300";
    
    switch (action) {
      case "view": return "text-blue-600";
      case "create": return "text-green-600";
      case "edit": return "text-yellow-600";
      case "delete": return "text-red-600";
      case "manage": return "text-purple-600";
      default: return "text-gray-600";
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Shield className="h-8 w-8 text-primary" />
              Roles & Permissions
            </h1>
            <p className="text-gray-600 mt-2">Create custom roles and manage permissions</p>
          </div>
          
          <Dialog open={isAddRoleDialogOpen} onOpenChange={setIsAddRoleDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Role
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Create Custom Role</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddRole} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="roleName">Role Name *</Label>
                    <Input
                      id="roleName"
                      value={newRole.name}
                      onChange={(e) => setNewRole({...newRole, name: e.target.value})}
                      placeholder="e.g., Content Manager"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="roleDescription">Description</Label>
                    <Input
                      id="roleDescription"
                      value={newRole.description}
                      onChange={(e) => setNewRole({...newRole, description: e.target.value})}
                      placeholder="Brief description of this role"
                    />
                  </div>
                </div>
                
                {/* Permissions Grid */}
                <div>
                  <Label className="text-base font-semibold">Permissions</Label>
                  <div className="mt-3 border rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-2 grid grid-cols-6 gap-4 text-sm font-medium text-gray-700 border-b">
                      <div>Module</div>
                      <div className="text-center">View</div>
                      <div className="text-center">Create</div>
                      <div className="text-center">Edit</div>
                      <div className="text-center">Delete</div>
                      <div className="text-center">Manage</div>
                    </div>
                    
                    {modules.map((module) => (
                      <div key={module} className="px-4 py-3 grid grid-cols-6 gap-4 items-center border-b">
                        <div className="font-medium">{module}</div>
                        <div className="text-center">
                          <Switch size="sm" />
                        </div>
                        <div className="text-center">
                          <Switch size="sm" />
                        </div>
                        <div className="text-center">
                          <Switch size="sm" />
                        </div>
                        <div className="text-center">
                          <Switch size="sm" />
                        </div>
                        <div className="text-center">
                          {(module === "Settings" || module === "Users") && <Switch size="sm" />}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsAddRoleDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Creating..." : "Create Role"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Summary Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Shield className="h-8 w-8 text-primary mr-3" />
                <div>
                  <div className="text-2xl font-bold">{roles.length}</div>
                  <div className="text-sm text-gray-600">Total Roles</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-green-600 mr-3" />
                <div>
                  <div className="text-2xl font-bold">{roles.reduce((sum, role) => sum + role.userCount, 0)}</div>
                  <div className="text-sm text-gray-600">Total Users</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-blue-600 font-bold">S</span>
                </div>
                <div>
                  <div className="text-2xl font-bold">{roles.filter(r => r.isSystem).length}</div>
                  <div className="text-sm text-gray-600">System Roles</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-purple-600 font-bold">C</span>
                </div>
                <div>
                  <div className="text-2xl font-bold">{roles.filter(r => !r.isSystem).length}</div>
                  <div className="text-sm text-gray-600">Custom Roles</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Roles List */}
        <div className="grid gap-6">
          {roles.map((role) => (
            <Card key={role.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-primary" />
                      {role.name}
                    </CardTitle>
                    <div className="flex space-x-2">
                      <Badge variant={role.isSystem ? "default" : "secondary"}>
                        {role.isSystem ? "System" : "Custom"}
                      </Badge>
                      <Badge variant="outline">
                        <Users className="h-3 w-3 mr-1" />
                        {role.userCount} users
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingRole(role)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    {!role.isSystem && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteRole(role.id, role.name)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
                {role.description && (
                  <p className="text-gray-600 mt-2">{role.description}</p>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">Permissions:</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    {role.permissions.map((permission) => (
                      <div key={permission.module} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="font-medium">{permission.module}</span>
                        <div className="flex items-center space-x-2">
                          {Object.entries(permission.actions).map(([action, hasPermission]) => (
                            <div 
                              key={action}
                              className={`flex items-center space-x-1 ${getActionColor(action, hasPermission)}`}
                              title={action.charAt(0).toUpperCase() + action.slice(1)}
                            >
                              {getPermissionIcon(action)}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Admin Note */}
        <Card className="mt-8 border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center">
              <Shield className="h-5 w-5 text-red-600 mr-2" />
              <p className="text-sm text-red-800">
                <strong>Admin Only:</strong> Role and permission management is restricted to system administrators only.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}