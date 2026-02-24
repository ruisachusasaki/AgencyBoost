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
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Globe, Lock, Users, User, Plus, X } from "lucide-react";

interface TrainingCoursePermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseId: string;
  courseTitle: string;
}

interface Permission {
  id?: string;
  accessType: 'team' | 'user';
  accessId: string;
}

export function TrainingCoursePermissionsModal({ 
  isOpen, 
  onClose, 
  courseId, 
  courseTitle 
}: TrainingCoursePermissionsModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isRestricted, setIsRestricted] = useState(false);
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

  const { data: currentPermissions, isLoading } = useQuery({
    queryKey: ['/api/training/courses', courseId, 'permissions'],
    enabled: isOpen && !!courseId
  });

  const updatePermissionsMutation = useMutation({
    mutationFn: async (data: { isRestricted: boolean; permissions: Permission[] }) => {
      const response = await apiRequest("PUT", `/api/training/courses/${courseId}/permissions`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        variant: "default",
        description: "Course permissions updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/training/courses', courseId, 'permissions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/training/courses'] });
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

  useEffect(() => {
    if (isOpen && currentPermissions) {
      setIsRestricted(currentPermissions.isRestricted);
      setPermissions(currentPermissions.permissions || []);
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
        description: "Permission already exists for this user/team",
        variant: "destructive",
      });
      return;
    }

    const newPermission: Permission = {
      accessType: newPermissionType,
      accessId: newPermissionAccess,
    };

    setPermissions([...permissions, newPermission]);
    setNewPermissionAccess('');
  };

  const handleRemovePermission = (index: number) => {
    setPermissions(permissions.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    updatePermissionsMutation.mutate({
      isRestricted,
      permissions,
    });
  };

  const getDisplayName = (permission: Permission) => {
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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Course Permissions
          </DialogTitle>
          <DialogDescription>
            Manage who can access "{courseTitle}"
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="text-center py-8">Loading permissions...</div>
        ) : (
          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  {!isRestricted ? <Globe className="w-5 h-5 text-green-600" /> : <Lock className="w-5 h-5 text-amber-600" />}
                  Visibility
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-sm font-medium">
                      {!isRestricted ? "Available to Everyone" : "Restricted Access"}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {!isRestricted 
                        ? "All staff members can access this training course" 
                        : "Only selected users or teams can access this course"
                      }
                    </p>
                  </div>
                  <Switch
                    checked={isRestricted}
                    onCheckedChange={setIsRestricted}
                    data-testid="switch-restricted"
                  />
                </div>
              </CardContent>
            </Card>

            {isRestricted && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Access Control
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="border rounded-lg p-4 bg-muted/50">
                    <Label className="text-sm font-medium mb-3 block">Add Access</Label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <Select value={newPermissionType} onValueChange={(value: 'team' | 'user') => {
                        setNewPermissionType(value);
                        setNewPermissionAccess('');
                      }}>
                        <SelectTrigger data-testid="select-permission-type">
                          <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="team">Department</SelectItem>
                          <SelectItem value="user">User</SelectItem>
                        </SelectContent>
                      </Select>

                      <Select value={newPermissionAccess} onValueChange={setNewPermissionAccess}>
                        <SelectTrigger data-testid="select-permission-access">
                          <SelectValue placeholder={newPermissionType === 'team' ? "Select department" : "Select user"} />
                        </SelectTrigger>
                        <SelectContent>
                          {newPermissionType === 'team' ? (
                            availableTeamsFiltered.length > 0 ? (
                              availableTeamsFiltered.map((team: any) => (
                                <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                              ))
                            ) : (
                              <SelectItem value="" disabled>No departments available</SelectItem>
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

                      <Button
                        onClick={handleAddPermission}
                        size="sm"
                        data-testid="button-add-permission"
                        disabled={!newPermissionAccess}
                        className="bg-[#00C9C6] hover:bg-[#00b3b0] text-white"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add
                      </Button>
                    </div>
                  </div>

                  {permissions.length > 0 && (
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Current Access</Label>
                      {permissions.map((permission, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            {permission.accessType === 'team' ? (
                              <Users className="w-4 h-4 text-blue-600" />
                            ) : (
                              <User className="w-4 h-4 text-green-600" />
                            )}
                            <div>
                              <div className="font-medium">{getDisplayName(permission)}</div>
                              <div className="text-xs text-muted-foreground">
                                {permission.accessType === 'team' ? 'Department' : 'User'}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              Can Access
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
                      <p className="text-sm">No access permissions set</p>
                      <p className="text-xs">Add users or departments to allow access</p>
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
