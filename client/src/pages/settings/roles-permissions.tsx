import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { Shield, Plus, Edit, Trash2, Users, Eye, Settings, ArrowLeft, AlertTriangle, Lock, ChevronDown, ChevronRight, Download, Upload, FileSpreadsheet, Check, X, AlertCircle } from "lucide-react";
import { Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Role, Permission, InsertRole, GranularPermission } from "@shared/schema";
import { PERMISSION_TEMPLATES, type PermissionModule, type SubPermission } from "@shared/permission-templates";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface RoleWithPermissions extends Role {
  userCount: number;
  permissions: Permission[];
  granularPermissions?: GranularPermission[];
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

interface GranularPermissionState {
  [module: string]: {
    enabled: boolean;
    subPermissions: {
      [key: string]: boolean;
    };
  };
}

// Helper component for granular permissions editing
const GranularPermissionsEditor = ({ 
  granularPermissions,
  setGranularPermissions 
}: { 
  granularPermissions: GranularPermissionState;
  setGranularPermissions: (perms: GranularPermissionState) => void;
}) => {
  const [expandedModules, setExpandedModules] = useState<string[]>([]);

  const toggleModule = (module: string, enabled: boolean) => {
    const existingModule = granularPermissions[module];
    const moduleTemplate = PERMISSION_TEMPLATES.find(t => t.module === module);
    
    // Preserve existing sub-permissions or initialize all to false if this is the first time
    const subPermissions = existingModule?.subPermissions 
      ? existingModule.subPermissions
      : moduleTemplate?.subPermissions.reduce((acc, sp) => ({
          ...acc,
          [sp.key]: false,
        }), {}) || {};
    
    setGranularPermissions({
      ...granularPermissions,
      [module]: {
        enabled,
        subPermissions,
      },
    });
  };

  const toggleSubPermission = (module: string, permissionKey: string, enabled: boolean) => {
    const modulePerms = granularPermissions[module] || { enabled: false, subPermissions: {} };
    setGranularPermissions({
      ...granularPermissions,
      [module]: {
        ...modulePerms,
        subPermissions: {
          ...modulePerms.subPermissions,
          [permissionKey]: enabled,
        },
      },
    });
  };

  const selectAll = () => {
    const allPermissions: GranularPermissionState = {};
    
    PERMISSION_TEMPLATES.forEach((moduleTemplate) => {
      const subPermissions: { [key: string]: boolean } = {};
      moduleTemplate.subPermissions.forEach((subPerm) => {
        subPermissions[subPerm.key] = true;
      });
      
      allPermissions[moduleTemplate.module] = {
        enabled: true,
        subPermissions,
      };
    });
    
    setGranularPermissions(allPermissions);
  };

  const deselectAll = () => {
    const allPermissions: GranularPermissionState = {};
    
    PERMISSION_TEMPLATES.forEach((moduleTemplate) => {
      const subPermissions: { [key: string]: boolean } = {};
      moduleTemplate.subPermissions.forEach((subPerm) => {
        subPermissions[subPerm.key] = false;
      });
      
      allPermissions[moduleTemplate.module] = {
        enabled: false,
        subPermissions,
      };
    });
    
    setGranularPermissions(allPermissions);
  };

  const areAllSelected = () => {
    return PERMISSION_TEMPLATES.every((moduleTemplate) => {
      const moduleState = granularPermissions[moduleTemplate.module];
      if (!moduleState?.enabled) return false;
      
      return moduleTemplate.subPermissions.every((subPerm) => 
        moduleState.subPermissions[subPerm.key] === true
      );
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">Granular Permissions</h4>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={deselectAll}
            data-testid="button-deselect-all-permissions"
          >
            Deselect All
          </Button>
          <Button
            type="button"
            variant={areAllSelected() ? "secondary" : "default"}
            size="sm"
            onClick={selectAll}
            data-testid="button-select-all-permissions"
          >
            Select All
          </Button>
        </div>
      </div>
      
      <div className="border rounded-lg divide-y">
        {PERMISSION_TEMPLATES.map((moduleTemplate) => {
          const moduleState = granularPermissions[moduleTemplate.module] || { enabled: false, subPermissions: {} };
          const isExpanded = expandedModules.includes(moduleTemplate.module);
          const enabledSubPermissions = Object.values(moduleState.subPermissions).filter(Boolean).length;
          const totalSubPermissions = moduleTemplate.subPermissions.length;

          return (
            <div key={moduleTemplate.module} className="p-3">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1">
                  <Switch
                    checked={moduleState.enabled}
                    onCheckedChange={(checked) => toggleModule(moduleTemplate.module, checked)}
                    data-testid={`toggle-module-${moduleTemplate.module}`}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{moduleTemplate.label}</span>
                      {enabledSubPermissions > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {enabledSubPermissions}/{totalSubPermissions}
                        </Badge>
                      )}
                    </div>
                    {moduleTemplate.description && (
                      <p className="text-xs text-muted-foreground">{moduleTemplate.description}</p>
                    )}
                  </div>
                </div>
                
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (isExpanded) {
                      setExpandedModules(expandedModules.filter(m => m !== moduleTemplate.module));
                    } else {
                      setExpandedModules([...expandedModules, moduleTemplate.module]);
                    }
                  }}
                  data-testid={`expand-module-${moduleTemplate.module}`}
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {isExpanded && (
                <div className="mt-3 pl-11 space-y-2 border-l-2 border-muted ml-2">
                  {moduleTemplate.subPermissions.map((subPerm) => (
                    <div key={subPerm.key} className="flex items-start gap-3 py-1.5">
                      <Checkbox
                        id={subPerm.key}
                        checked={moduleState.subPermissions[subPerm.key] || false}
                        onCheckedChange={(checked) => toggleSubPermission(moduleTemplate.module, subPerm.key, checked as boolean)}
                        disabled={!moduleState.enabled}
                        data-testid={`checkbox-${subPerm.key}`}
                      />
                      <Label
                        htmlFor={subPerm.key}
                        className={`text-sm cursor-pointer flex-1 ${!moduleState.enabled ? 'opacity-50' : ''}`}
                      >
                        {subPerm.label}
                        {subPerm.description && (
                          <span className="block text-xs text-muted-foreground font-normal mt-0.5">
                            {subPerm.description}
                          </span>
                        )}
                      </Label>
                      <Badge 
                        variant={
                          subPerm.type === 'delete' ? 'destructive' :
                          subPerm.type === 'view_manage' ? 'default' :
                          'secondary'
                        }
                        className="text-xs"
                      >
                        {subPerm.type.replace('_', ' ')}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Helper component for role form
const RoleForm = ({ 
  role, 
  isEdit = false, 
  onSubmit, 
  onCancel 
}: { 
  role: { name: string; description: string; permissions?: PermissionFormData[]; granularPermissions?: GranularPermissionState },
  isEdit?: boolean,
  onSubmit: (e: React.FormEvent, roleData: { name: string; description: string; permissions?: PermissionFormData[]; granularPermissions?: GranularPermissionState }) => void,
  onCancel: () => void 
}) => {
  const [localRole, setLocalRole] = useState(role);

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
            data-testid="input-role-name"
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
            data-testid="input-role-description"
          />
        </div>
      </div>

      <GranularPermissionsEditor
        granularPermissions={localRole.granularPermissions || {}}
        setGranularPermissions={(perms) => setLocalRole(prev => ({ ...prev, granularPermissions: perms }))}
      />

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} data-testid="button-cancel">
          Cancel
        </Button>
        <Button 
          type="submit" 
          data-testid="button-submit"
        >
          {isEdit ? 'Update Role' : 'Create Role'}
        </Button>
      </div>
    </form>
  );
};

export default function RolesPermissions() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddRoleDialogOpen, setIsAddRoleDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<(Omit<RoleWithPermissions, 'permissions'> & { permissions: EditablePermission[]; granularPermissions?: GranularPermission[] }) | null>(null);
  const [newRole, setNewRole] = useState({
    name: "",
    description: "",
    permissions: [] as PermissionFormData[],
    granularPermissions: {} as GranularPermissionState,
  });
  const [useGranularPermissions, setUseGranularPermissions] = useState(true);
  
  // CSV Import/Export state
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importPreview, setImportPreview] = useState<{
    newRoles: string[];
    existingRoles: string[];
    warnings: string[];
    totalRoles: number;
    totalPermissions: number;
    roles: Array<{ roleName: string; permissions: { [key: string]: boolean } }>;
  } | null>(null);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

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

  // Fetch roles - only if user is admin
  const { data: roles = [], isLoading } = useQuery<RoleWithPermissions[]>({
    queryKey: ["/api/roles"],
    enabled: isAdmin, // Only fetch if user is admin
    retry: false,
  });

  // Create role mutation
  const createRoleMutation = useMutation({
    mutationFn: async (roleData: InsertRole & { permissions?: PermissionFormData[]; granularPermissions?: GranularPermissionState }) => {
      const response = await apiRequest("POST", "/api/roles", roleData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/roles"] });
      toast({
        title: "Success",
        variant: "success",
        description: "Role created successfully.",
      });
      setIsAddRoleDialogOpen(false);
      setNewRole({ name: "", description: "", permissions: [], granularPermissions: {} });
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
    mutationFn: async ({ id, ...roleData }: { id: string } & InsertRole & { permissions?: PermissionFormData[]; granularPermissions?: GranularPermissionState }) => {
      const response = await apiRequest("PUT", `/api/roles/${id}`, roleData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/roles"] });
      toast({
        title: "Success",
        variant: "success",
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
        variant: "success",
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

  const handleAddRole = (e: React.FormEvent, roleData: { name: string; description: string; permissions?: PermissionFormData[]; granularPermissions?: GranularPermissionState }) => {
    e.preventDefault();
    createRoleMutation.mutate(roleData);
  };

  const handleUpdateRole = (e: React.FormEvent, roleData: { name: string; description: string; permissions?: PermissionFormData[]; granularPermissions?: GranularPermissionState }) => {
    e.preventDefault();
    if (editingRole) {
      const { id } = editingRole;
      updateRoleMutation.mutate({ 
        id, 
        name: roleData.name,
        description: roleData.description,
        permissions: roleData.permissions,
        granularPermissions: roleData.granularPermissions,
      });
    }
  };

  const handleDeleteRole = (roleId: string, roleName: string) => {
    if (!confirm(`Are you sure you want to delete the "${roleName}" role? This will affect all users assigned to this role.`)) return;
    deleteRoleMutation.mutate(roleId);
  };

  // CSV Export handler
  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      // Use native fetch with credentials since we need binary response
      const response = await fetch('/api/roles-permissions/export', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'text/csv',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to export roles and permissions');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'roles-permissions.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Export Successful",
        variant: "success",
        description: "Roles and permissions exported to CSV file.",
      });
    } catch (error: any) {
      toast({
        title: "Export Failed",
        description: error.message || "Failed to export roles and permissions.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  // CSV Import handler - parses and shows preview
  const handleCSVFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setIsImporting(true);
    setImportErrors([]);
    setImportPreview(null);
    
    try {
      const csvContent = await file.text();
      
      // Send CSV content as JSON payload
      const response = await fetch('/api/roles-permissions/import', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ csvContent }),
      });
      
      const result = await response.json();
      
      if (!response.ok || !result.success) {
        setImportErrors(result.errors || [result.message || 'Unknown error parsing CSV']);
      } else {
        // Store the complete preview with roles data
        setImportPreview({
          newRoles: result.preview?.newRoles || [],
          existingRoles: result.preview?.existingRoles || [],
          warnings: result.preview?.warnings || [],
          totalRoles: result.preview?.totalRoles || 0,
          totalPermissions: result.preview?.totalPermissions || 0,
          roles: result.roles || [],
        });
      }
      
      setIsImportDialogOpen(true);
    } catch (error: any) {
      setImportErrors([error.message || 'Failed to parse CSV file']);
      setIsImportDialogOpen(true);
    } finally {
      setIsImporting(false);
      // Reset file input
      event.target.value = '';
    }
  };

  // Apply CSV import
  const handleApplyImport = async () => {
    if (!importPreview?.roles) return;
    
    setIsImporting(true);
    try {
      const response = await fetch('/api/roles-permissions/apply', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ roles: importPreview.roles }),
      });
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Import Successful",
          variant: "success",
          description: `Created ${result.results.created.length} new roles, updated ${result.results.updated.length} existing roles.`,
        });
        queryClient.invalidateQueries({ queryKey: ["/api/roles"] });
        setIsImportDialogOpen(false);
        setImportPreview(null);
      } else {
        toast({
          title: "Import Partially Failed",
          description: `Some roles failed to update: ${result.results.errors.join(', ')}`,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Import Failed",
        description: error.message || "Failed to apply role changes.",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const formatModuleName = (module: string) => {
    const moduleTemplate = PERMISSION_TEMPLATES.find(t => t.module === module);
    return moduleTemplate?.label || module.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  // Show loading state while checking authentication
  if (loadingUser) {
    return (
      <div className="space-y-6">
        <Link to="/settings">
          <Button variant="outline" size="sm" data-testid="button-back">
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
          <Button variant="outline" size="sm" data-testid="button-back">
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
          <Button variant="outline" size="sm" data-testid="button-back">
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
          <Button variant="outline" size="sm" data-testid="button-back">
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
          <Button variant="outline" size="sm" data-testid="button-back">
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
                Manage user roles with granular permissions
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Export CSV Button */}
            <Button 
              variant="outline" 
              onClick={handleExportCSV}
              disabled={isExporting}
              data-testid="button-export-csv"
            >
              <Download className="h-4 w-4 mr-2" />
              {isExporting ? 'Exporting...' : 'Export CSV'}
            </Button>

            {/* Import CSV Button */}
            <Button 
              variant="outline" 
              onClick={() => document.getElementById('csv-file-input')?.click()}
              disabled={isImporting}
              data-testid="button-import-csv"
            >
              <Upload className="h-4 w-4 mr-2" />
              {isImporting ? 'Processing...' : 'Import CSV'}
            </Button>
            <input
              type="file"
              id="csv-file-input"
              accept=".csv"
              onChange={handleCSVFileUpload}
              className="hidden"
            />

            {/* Add Role Button */}
            <Dialog open={isAddRoleDialogOpen} onOpenChange={setIsAddRoleDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-add-role">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Role
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Role</DialogTitle>
                  <DialogDescription>
                    Create a new role with granular permissions for different modules and features.
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
      </div>

      {/* CSV Import Preview Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Import Roles & Permissions
            </DialogTitle>
            <DialogDescription>
              Review the changes that will be applied from your CSV file.
            </DialogDescription>
          </DialogHeader>
          
          {importErrors.length > 0 ? (
            <div className="space-y-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Validation Errors</AlertTitle>
                <AlertDescription>
                  The CSV file has errors that need to be fixed:
                </AlertDescription>
              </Alert>
              <div className="max-h-60 overflow-y-auto space-y-2">
                {importErrors.map((error, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-sm text-destructive">
                    <X className="h-4 w-4 mt-0.5 shrink-0" />
                    <span>{error}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setIsImportDialogOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          ) : importPreview ? (
            <div className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-2xl font-bold">{importPreview.totalRoles}</div>
                    <div className="text-sm text-muted-foreground">Total Roles</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-2xl font-bold">{importPreview.totalPermissions}</div>
                    <div className="text-sm text-muted-foreground">Permissions per Role</div>
                  </CardContent>
                </Card>
              </div>

              {/* New Roles */}
              {importPreview.newRoles.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-green-600">
                    <Plus className="h-4 w-4" />
                    New Roles to Create ({importPreview.newRoles.length})
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {importPreview.newRoles.map(role => (
                      <Badge key={role} variant="outline" className="border-green-500 text-green-600">
                        {role}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Existing Roles */}
              {importPreview.existingRoles.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-blue-600">
                    <Edit className="h-4 w-4" />
                    Existing Roles to Update ({importPreview.existingRoles.length})
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {importPreview.existingRoles.map(role => (
                      <Badge key={role} variant="outline" className="border-blue-500 text-blue-600">
                        {role}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Warnings */}
              {importPreview.warnings.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-yellow-600">
                    <AlertTriangle className="h-4 w-4" />
                    Warnings ({importPreview.warnings.length})
                  </div>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {importPreview.warnings.map((warning, idx) => (
                      <div key={idx} className="text-xs text-yellow-600">
                        {warning}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsImportDialogOpen(false);
                    setImportPreview(null);
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleApplyImport}
                  disabled={isImporting}
                  data-testid="button-apply-import"
                >
                  <Check className="h-4 w-4 mr-2" />
                  {isImporting ? 'Applying...' : 'Apply Changes'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Processing CSV file...
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Roles Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {roles.map((role) => {
          // Count enabled modules and sub-permissions
          const granularPerms = role.granularPermissions || [];
          const enabledModules = new Set(granularPerms.map(gp => gp.module)).size;
          const enabledSubPermissions = granularPerms.filter(gp => gp.enabled).length;

          return (
          <Card key={role.id} className="relative" data-testid={`card-role-${role.id}`}>
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
                        setEditingRole({
                          ...role,
                          permissions: [],
                          granularPermissions: role.granularPermissions || [],
                        });
                      } else {
                        setEditingRole(null);
                      }
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm" data-testid={`button-edit-${role.id}`}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Edit Role: {role.name}</DialogTitle>
                        <DialogDescription>
                          Modify the role name, description, and granular permissions.
                        </DialogDescription>
                      </DialogHeader>
                      {editingRole && (
                        <RoleForm
                          role={{
                            name: editingRole.name,
                            description: editingRole.description || "",
                            granularPermissions: (editingRole.granularPermissions || []).reduce((acc, gp) => {
                              if (!acc[gp.module]) {
                                acc[gp.module] = { enabled: true, subPermissions: {} };
                              }
                              acc[gp.module].subPermissions[gp.permissionKey] = gp.enabled;
                              return acc;
                            }, {} as GranularPermissionState),
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
                      data-testid={`button-delete-${role.id}`}
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
                <div className="space-y-1.5">
                  {enabledModules > 0 ? (
                    <>
                      <div className="flex items-center gap-2 text-xs">
                        <Badge variant="outline">{enabledModules} modules</Badge>
                        <Badge variant="outline">{enabledSubPermissions} permissions</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {Array.from(new Set(granularPerms.map(gp => gp.module)))
                          .slice(0, 5)
                          .map(module => formatModuleName(module))
                          .join(', ')}
                        {enabledModules > 5 && `, +${enabledModules - 5} more`}
                      </div>
                    </>
                  ) : (
                    <p className="text-xs text-muted-foreground">No permissions configured</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )})}
      </div>
    </div>
  );
}
