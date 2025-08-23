import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRoute, Link } from "wouter";
import { ArrowLeft, Users, MapPin, Phone, Mail, Edit, Trash2, Plus, Briefcase } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { FormLabelWithTooltip } from "@/components/ui/form-label-with-tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import type { Department, Staff, Position, InsertPosition } from "@shared/schema";

const positionFormSchema = z.object({
  name: z.string().min(1, "Position name is required"),
  description: z.string().optional(),
});

const editTeamFormSchema = z.object({
  name: z.string().min(1, "Team name is required"),
  description: z.string().optional(),
});

type PositionFormData = z.infer<typeof positionFormSchema>;
type EditTeamFormData = z.infer<typeof editTeamFormSchema>;

export default function TeamDetail() {
  const { toast } = useToast();
  const [, params] = useRoute("/settings/teams/:id");
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddPositionDialogOpen, setIsAddPositionDialogOpen] = useState(false);
  const [isEditTeamDialogOpen, setIsEditTeamDialogOpen] = useState(false);
  const [isEditPositionDialogOpen, setIsEditPositionDialogOpen] = useState(false);
  const [editingPosition, setEditingPosition] = useState<Position | null>(null);
  const teamId = params?.id;

  const positionForm = useForm<PositionFormData>({
    resolver: zodResolver(positionFormSchema),
    defaultValues: {
      name: "",
      description: "",
    }
  });

  const editTeamForm = useForm<EditTeamFormData>({
    resolver: zodResolver(editTeamFormSchema),
    defaultValues: {
      name: "",
      description: "",
    }
  });

  const editPositionForm = useForm<PositionFormData>({
    resolver: zodResolver(positionFormSchema),
    defaultValues: {
      name: "",
      description: "",
    }
  });

  // Fetch team details
  const { data: team, isLoading: teamLoading } = useQuery<Department>({
    queryKey: ["/api/departments", teamId],
    queryFn: () => fetch(`/api/departments/${teamId}`).then(res => res.json()),
    enabled: !!teamId,
  });

  // Fetch team members (staff assigned to this department)
  const { data: staff = [], isLoading: staffLoading } = useQuery<Staff[]>({
    queryKey: ["/api/staff", "by-department", teamId, searchTerm],
    queryFn: async () => {
      let url = `/api/staff?departmentId=${teamId}`;
      if (searchTerm) {
        url += `&search=${encodeURIComponent(searchTerm)}`;
      }
      const response = await fetch(url);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!teamId,
  });

  // Fetch positions for this team
  const { data: positions = [], isLoading: positionsLoading } = useQuery<Position[]>({
    queryKey: ["/api/departments", teamId, "positions"],
    queryFn: () => fetch(`/api/departments/${teamId}/positions`).then(res => res.json()),
    enabled: !!teamId,
  });

  // Fetch current user to check admin permissions
  const { data: currentUser } = useQuery({
    queryKey: ['/api/auth/current-user'],
    queryFn: async () => {
      const response = await fetch('/api/auth/current-user');
      if (!response.ok) throw new Error('Failed to fetch current user');
      return response.json();
    },
  });

  // Create position mutation
  const createPositionMutation = useMutation({
    mutationFn: async (data: PositionFormData) => {
      return apiRequest("POST", "/api/positions", { ...data, departmentId: teamId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/departments", teamId, "positions"] });
      setIsAddPositionDialogOpen(false);
      positionForm.reset();
      toast({
        title: "Success",
        description: "Position created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create position"
      });
    }
  });

  // Delete team mutation (Admin only)
  const deleteTeamMutation = useMutation({
    mutationFn: async (teamId: string) => {
      const response = await fetch(`/api/departments/${teamId}`, { method: "DELETE" });
      if (!response.ok) {
        throw new Error('Failed to delete team');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Team deleted successfully",
      });
      // Redirect to teams list after successful deletion
      window.location.href = '/settings/staff';
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete team"
      });
    }
  });

  // Delete position mutation
  const deletePositionMutation = useMutation({
    mutationFn: async (positionId: string) => {
      return apiRequest("DELETE", `/api/positions/${positionId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/departments", teamId, "positions"] });
      toast({
        title: "Success",
        description: "Position deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete position"
      });
    }
  });

  const onPositionSubmit = (data: PositionFormData) => {
    createPositionMutation.mutate(data);
  };

  // Update team mutation
  const updateTeamMutation = useMutation({
    mutationFn: async (data: EditTeamFormData) => {
      return apiRequest("PUT", `/api/departments/${teamId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/departments", teamId] });
      queryClient.invalidateQueries({ queryKey: ["/api/departments"] });
      setIsEditTeamDialogOpen(false);
      toast({
        title: "Success",
        description: "Team updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update team"
      });
    }
  });

  // Update position mutation
  const updatePositionMutation = useMutation({
    mutationFn: async (data: PositionFormData) => {
      if (!editingPosition) throw new Error("No position selected for editing");
      return apiRequest("PUT", `/api/positions/${editingPosition.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/departments", teamId, "positions"] });
      setIsEditPositionDialogOpen(false);
      setEditingPosition(null);
      editPositionForm.reset();
      toast({
        title: "Success",
        description: "Position updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update position"
      });
    }
  });

  const onTeamSubmit = (data: EditTeamFormData) => {
    updateTeamMutation.mutate(data);
  };

  const onPositionUpdateSubmit = (data: PositionFormData) => {
    updatePositionMutation.mutate(data);
  };

  const handleDeletePosition = (positionId: string, positionName: string) => {
    if (!confirm(`Are you sure you want to delete the position "${positionName}"?`)) return;
    deletePositionMutation.mutate(positionId);
  };

  const handleDeleteTeam = () => {
    if (!team || !teamId) return;
    if (window.confirm(`Are you sure you want to delete the team "${team.name}"? This action cannot be undone and will remove all associated positions.`)) {
      deleteTeamMutation.mutate(teamId);
    }
  };

  const handleEditTeam = () => {
    if (team) {
      editTeamForm.reset({
        name: team.name,
        description: team.description || "",
      });
      setIsEditTeamDialogOpen(true);
    }
  };

  const handleEditPosition = (position: Position) => {
    setEditingPosition(position);
    editPositionForm.reset({
      name: position.name,
      description: position.description || "",
    });
    setIsEditPositionDialogOpen(true);
  };

  if (teamLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-8 h-8 bg-gray-200 rounded animate-pulse" />
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="space-y-4">
          <div className="h-32 bg-gray-200 rounded animate-pulse" />
          <div className="h-64 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/settings/staff">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Teams
            </Button>
          </Link>
        </div>
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Team Not Found</h2>
          <p className="text-gray-600">The requested team could not be found.</p>
        </div>
      </div>
    );
  }

  const filteredStaff = staff.filter(member => {
    if (!searchTerm) return true;
    const fullName = `${member.firstName} ${member.lastName}`.toLowerCase();
    const email = member.email?.toLowerCase() || '';
    return fullName.includes(searchTerm.toLowerCase()) || 
           email.includes(searchTerm.toLowerCase());
  });

  const getRoleBadgeColor = (roleId: string) => {
    // Simple role color mapping - you may want to fetch actual role names
    const roleColors: { [key: string]: string } = {
      'admin': 'bg-red-100 text-red-800',
      'manager': 'bg-blue-100 text-blue-800',
      'user': 'bg-green-100 text-green-800',
      'accounting': 'bg-purple-100 text-purple-800',
    };
    return roleColors[roleId] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/settings/staff">
            <Button variant="ghost" size="sm" data-testid="button-back-to-teams">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Teams
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900" data-testid="text-team-name">
              {team.name}
            </h1>
            {team.description && (
              <p className="text-gray-600 mt-1" data-testid="text-team-description">
                {team.description}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleEditTeam} data-testid="button-edit-team">
            <Edit className="h-4 w-4 mr-2" />
            Edit Team
          </Button>
          {currentUser?.role === 'Admin' && (
            <Button 
              variant="outline" 
              size="sm" 
              className="text-red-600 hover:text-red-700 hover:bg-red-50" 
              onClick={() => {
                if (window.confirm(`Are you sure you want to delete the team "${team.name}"? This action cannot be undone and will remove all associated positions.`)) {
                  deleteTeamMutation.mutate(teamId!);
                }
              }}
              disabled={deleteTeamMutation.isPending}
              data-testid="button-delete-team"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {deleteTeamMutation.isPending ? "Deleting..." : "Delete Team"}
            </Button>
          )}
          <Button size="sm" data-testid="button-add-member">
            <Plus className="h-4 w-4 mr-2" />
            Add Member
          </Button>
        </div>
      </div>

      {/* Team Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-member-count">
              {staff.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Active team members
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Positions</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-position-count">
              {positions.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Available positions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={team.isActive ? "default" : "secondary"} data-testid="badge-team-status">
              {team.isActive ? "Active" : "Inactive"}
            </Badge>
            <p className="text-xs text-muted-foreground mt-2">
              Current status
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Members and Positions */}
      <Tabs defaultValue="members" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="members" data-testid="tab-members">Members</TabsTrigger>
          <TabsTrigger value="positions" data-testid="tab-positions">Positions</TabsTrigger>
        </TabsList>

        {/* Members Tab */}
        <TabsContent value="members">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Team Members</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    Manage members assigned to this team
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Input
                      placeholder="Search members..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-64"
                      data-testid="input-search-members"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
        <CardContent>
          {staffLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-1/4" />
                    <div className="h-3 bg-gray-200 rounded animate-pulse w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredStaff.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? "No members found" : "No members assigned"}
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm 
                  ? "Try adjusting your search terms"
                  : "Start by adding team members to this team"
                }
              </p>
              {!searchTerm && (
                <Button data-testid="button-add-first-member">
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Member
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStaff.map((member) => {
                  const position = positions.find(p => p.id === member.position);
                  return (
                    <TableRow key={member.id} data-testid={`row-member-${member.id}`}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={member.profileImagePath || undefined} />
                            <AvatarFallback>
                              {member.firstName?.[0]}{member.lastName?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium" data-testid={`text-member-name-${member.id}`}>
                              {member.firstName} {member.lastName}
                            </div>
                            <div className="text-sm text-gray-600" data-testid={`text-member-email-${member.id}`}>
                              {member.email}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm" data-testid={`text-member-position-${member.id}`}>
                          {position?.name || (member.position ? member.position : "No position")}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          className={getRoleBadgeColor(member.roleId || "")} 
                          data-testid={`badge-member-role-${member.id}`}
                        >
                          {member.roleId || "No role"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {member.phone && (
                            <div className="flex items-center text-sm text-gray-600">
                              <Phone className="h-3 w-3 mr-1" />
                              {member.phone}
                            </div>
                          )}
                          <div className="flex items-center text-sm text-gray-600">
                            <Mail className="h-3 w-3 mr-1" />
                            {member.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            data-testid={`button-edit-member-${member.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-red-600 hover:text-red-700"
                            data-testid={`button-remove-member-${member.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Positions Tab */}
        <TabsContent value="positions">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Team Positions</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    Manage available positions for this team
                  </p>
                </div>
                <Dialog open={isAddPositionDialogOpen} onOpenChange={setIsAddPositionDialogOpen}>
                  <DialogTrigger asChild>
                    <Button data-testid="button-add-position">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Position
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Create New Position</DialogTitle>
                      <DialogDescription>
                        Add a new position for the {team?.name} team
                      </DialogDescription>
                    </DialogHeader>
                    <Form {...positionForm}>
                      <form onSubmit={positionForm.handleSubmit(onPositionSubmit)} className="space-y-4">
                        <FormField
                          control={positionForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Position Name</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g. Marketing Manager, Sales Rep" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={positionForm.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Position Job Description</FormLabel>
                              <FormControl>
                                <div className="min-h-[300px]">
                                  <ReactQuill
                                    theme="snow"
                                    value={field.value || ""}
                                    onChange={field.onChange}
                                    placeholder="Detailed description of this position, responsibilities, requirements, etc."
                                    style={{ height: "250px" }}
                                    modules={{
                                      toolbar: [
                                        [{ 'header': [1, 2, false] }],
                                        ['bold', 'italic', 'underline'],
                                        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                                        ['clean']
                                      ],
                                    }}
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <DialogFooter>
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => setIsAddPositionDialogOpen(false)}
                          >
                            Cancel
                          </Button>
                          <Button type="submit" disabled={createPositionMutation.isPending}>
                            {createPositionMutation.isPending ? "Creating..." : "Create Position"}
                          </Button>
                        </DialogFooter>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {positionsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-32" />
                        <div className="h-3 bg-gray-200 rounded animate-pulse w-48" />
                      </div>
                      <div className="flex space-x-2">
                        <div className="w-8 h-8 bg-gray-200 rounded animate-pulse" />
                        <div className="w-8 h-8 bg-gray-200 rounded animate-pulse" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : positions.length === 0 ? (
                <div className="text-center py-12">
                  <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No positions defined</h3>
                  <p className="text-gray-600 mb-4">
                    Start by creating positions for this team to organize your staff better
                  </p>
                  <Button onClick={() => setIsAddPositionDialogOpen(true)} data-testid="button-add-first-position">
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Position
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {positions.map((position) => (
                    <div key={position.id} className="flex items-center justify-between p-4 border rounded-lg hover:shadow-sm transition-shadow" data-testid={`position-card-${position.id}`}>
                      <div>
                        <h4 className="font-medium text-gray-900" data-testid={`text-position-name-${position.id}`}>
                          {position.name}
                        </h4>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleEditPosition(position)}
                          data-testid={`button-edit-position-${position.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleDeletePosition(position.id, position.name)}
                          data-testid={`button-delete-position-${position.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Team Dialog */}
      <Dialog open={isEditTeamDialogOpen} onOpenChange={setIsEditTeamDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Team</DialogTitle>
            <DialogDescription>
              Update the team information
            </DialogDescription>
          </DialogHeader>
          <Form {...editTeamForm}>
            <form onSubmit={editTeamForm.handleSubmit(onTeamSubmit)} className="space-y-4">
              <FormField
                control={editTeamForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabelWithTooltip tooltip="The official name of this team or department">
                      Team Name
                    </FormLabelWithTooltip>
                    <FormControl>
                      <Input placeholder="e.g. Marketing, Sales, Development" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editTeamForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabelWithTooltip tooltip="A brief description explaining this team's purpose and responsibilities">
                      Description
                    </FormLabelWithTooltip>
                    <FormControl>
                      <Input placeholder="Brief description of this team" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsEditTeamDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={updateTeamMutation.isPending}>
                  {updateTeamMutation.isPending ? "Updating..." : "Update Team"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Position Dialog */}
      <Dialog open={isEditPositionDialogOpen} onOpenChange={setIsEditPositionDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Position</DialogTitle>
            <DialogDescription>
              Update the position details for {editingPosition?.name}
            </DialogDescription>
          </DialogHeader>
          <Form {...editPositionForm}>
            <form onSubmit={editPositionForm.handleSubmit(onPositionUpdateSubmit)} className="space-y-4">
              <FormField
                control={editPositionForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabelWithTooltip tooltip="The official title for this position within the team">
                      Position Title
                    </FormLabelWithTooltip>
                    <FormControl>
                      <Input placeholder="e.g. Marketing Manager, Sales Rep" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editPositionForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Position Job Description</FormLabel>
                    <FormControl>
                      <div className="min-h-[300px]">
                        <ReactQuill
                          theme="snow"
                          value={field.value || ""}
                          onChange={field.onChange}
                          placeholder="Detailed description of this position, responsibilities, requirements, etc."
                          style={{ height: "250px" }}
                          modules={{
                            toolbar: [
                              [{ 'header': [1, 2, false] }],
                              ['bold', 'italic', 'underline'],
                              [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                              ['clean']
                            ],
                          }}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsEditPositionDialogOpen(false);
                    setEditingPosition(null);
                    editPositionForm.reset();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={updatePositionMutation.isPending}>
                  {updatePositionMutation.isPending ? "Updating..." : "Update Position"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}