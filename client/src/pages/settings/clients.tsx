import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { 
  Contact, ArrowLeft, Settings, FileText, Plus, Edit2, Trash2, GripVertical, 
  Eye, EyeOff, Users, Target, Briefcase, Building, ShoppingBag, TrendingUp,
  Monitor, FileX, User, Clock, Mail, Phone, Globe, MapPin, Calendar,
  PenTool, Palette, Hash, Heart, Star, Zap, Coffee, Lightbulb, Rocket,
  Shield, ShieldCheck, ExternalLink
} from "lucide-react";
import { format } from "date-fns";
import { Link } from "wouter";

// Icon mapping for client brief sections
const iconMap = {
  Users, Target, Briefcase, Building, ShoppingBag, TrendingUp, Monitor, FileX,
  User, Clock, Mail, Phone, Globe, MapPin, Calendar, PenTool, Palette, Hash,
  Heart, Star, Zap, Coffee, Lightbulb, Rocket, FileText, Contact, Settings
};

const iconOptions = Object.keys(iconMap);

// Client Brief Section Schema
const clientBriefSectionSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title must be under 100 characters"),
  key: z.string().min(1, "Key is required").max(50, "Key must be under 50 characters").regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, "Key must start with letter and contain only letters, numbers, underscore"),
  placeholder: z.string().max(200, "Placeholder must be under 200 characters").optional(),
  icon: z.string().min(1, "Icon is required"),
  type: z.enum(["text", "rich_text"]),
  isEnabled: z.boolean()
});

type ClientBriefSectionForm = z.infer<typeof clientBriefSectionSchema>;

interface ClientBriefSection {
  id: string;
  key: string;
  title: string;
  placeholder?: string;
  icon: string;
  displayOrder: number;
  isEnabled: boolean;
  scope: 'core' | 'custom';
  type: 'text' | 'rich_text';
  createdAt: string;
  updatedAt: string;
}

// Portal Access Management Component
function PortalAccessManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedClient, setSelectedClient] = useState<string>("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);

  // Portal user creation/edit form schema
  const portalUserSchema = z.object({
    clientId: z.string().min(1, "Client selection is required"),
    email: z.string().email("Valid email is required"),
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    password: z.string().min(6, "Password must be at least 6 characters").optional(),
    isActive: z.boolean()
  });

  const form = useForm<z.infer<typeof portalUserSchema>>({
    resolver: zodResolver(portalUserSchema),
    defaultValues: {
      clientId: "",
      email: "",
      firstName: "",
      lastName: "",
      password: "",
      isActive: true
    }
  });

  // Fetch clients for selection
  const { data: clients = [] } = useQuery({
    queryKey: ["/api/clients"],
    select: (data: any) => data.clients || []
  });

  // Fetch all portal users
  const { data: portalUsers = [], isLoading: portalUsersLoading } = useQuery({
    queryKey: ["/api/client-portal-users"]
  });

  // Create portal user mutation
  const createMutation = useMutation({
    mutationFn: (userData: z.infer<typeof portalUserSchema>) => 
      apiRequest("POST", "/api/client-portal-users", userData),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Portal user created successfully"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/client-portal-users"] });
      setIsCreateDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create portal user",
        variant: "destructive"
      });
    }
  });

  // Update portal user mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, ...userData }: { id: string } & Partial<z.infer<typeof portalUserSchema>>) => 
      apiRequest("PUT", `/api/client-portal-users/${id}`, userData),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Portal user updated successfully"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/client-portal-users"] });
      setEditingUser(null);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update portal user",
        variant: "destructive"
      });
    }
  });

  // Deactivate portal user mutation
  const deactivateMutation = useMutation({
    mutationFn: (id: string) => 
      apiRequest("DELETE", `/api/client-portal-users/${id}`),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Portal user deactivated successfully"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/client-portal-users"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to deactivate portal user",
        variant: "destructive"
      });
    }
  });

  const handleSubmit = (data: z.infer<typeof portalUserSchema>) => {
    if (editingUser) {
      // Update existing user (exclude password if empty)
      const updateData = { ...data };
      if (!updateData.password) {
        delete updateData.password;
      }
      updateMutation.mutate({ id: editingUser.id, ...updateData });
    } else {
      // Create new user
      createMutation.mutate(data);
    }
  };

  const handleEdit = (user: any) => {
    setEditingUser(user);
    form.reset({
      clientId: user.clientId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      password: "", // Don't pre-fill password
      isActive: user.isActive
    });
    setIsCreateDialogOpen(true);
  };

  const handleDeactivate = (user: any) => {
    if (confirm(`Are you sure you want to deactivate portal access for ${user.firstName} ${user.lastName}?`)) {
      deactivateMutation.mutate(user.id);
    }
  };

  // Filter users by selected client
  const filteredUsers = (selectedClient && selectedClient !== "all")
    ? portalUsers.filter((user: any) => user.clientId === selectedClient)
    : portalUsers;

  const getClientName = (clientId: string) => {
    const client = clients.find((c: any) => c.id === clientId);
    return client?.name || "Unknown Client";
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Client Portal Access Management</CardTitle>
          <p className="text-sm text-gray-600 mt-2">
            Manage client portal access for all your clients. Create login credentials for clients to view their project progress and tasks.
          </p>
        </CardHeader>
        <CardContent>
          {/* Portal Info Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <ExternalLink className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-blue-900 mb-1">
                  Client Portal Available
                </h3>
                <p className="text-sm text-blue-700 mb-2">
                  Your client portal is live at <code className="bg-blue-100 px-1 rounded">/client-portal</code>
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => window.open("/client-portal/login", "_blank")}
                  data-testid="button-view-portal"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Client Portal
                </Button>
              </div>
            </div>
          </div>

          {/* Filters and Actions */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-4">
              <div className="min-w-0 flex-1">
                <Label htmlFor="client-filter">Filter by Client</Label>
                <Select value={selectedClient} onValueChange={setSelectedClient}>
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="All clients" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All clients</SelectItem>
                    {clients.map((client: any) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button 
              onClick={() => {
                setEditingUser(null);
                form.reset();
                setIsCreateDialogOpen(true);
              }}
              data-testid="button-add-portal-user"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Portal User
            </Button>
          </div>

          {/* Portal Users Table */}
          {portalUsersLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
              <p className="text-gray-500 mt-2">Loading portal users...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {(selectedClient && selectedClient !== "all") ? "No portal users for this client" : "No portal users yet"}
              </h3>
              <p className="text-gray-500 mb-4">
                {(selectedClient && selectedClient !== "all")
                  ? "This client doesn't have any portal users yet." 
                  : "Get started by creating portal access for your clients."
                }
              </p>
              <Button 
                onClick={() => {
                  setEditingUser(null);
                  form.reset({ clientId: selectedClient });
                  setIsCreateDialogOpen(true);
                }}
                data-testid="button-add-first-user"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add First Portal User
              </Button>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-4 font-medium text-gray-900">User</th>
                    <th className="text-left p-4 font-medium text-gray-900">Client</th>
                    <th className="text-left p-4 font-medium text-gray-900">Email</th>
                    <th className="text-left p-4 font-medium text-gray-900">Status</th>
                    <th className="text-left p-4 font-medium text-gray-900">Last Login</th>
                    <th className="text-left p-4 font-medium text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredUsers.map((user: any) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="p-4">
                        <div className="flex items-center">
                          <div className="h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                            <User className="h-4 w-4 text-gray-600" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              {user.firstName} {user.lastName}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-gray-900">
                        {user.clientName || getClientName(user.clientId)}
                      </td>
                      <td className="p-4 text-gray-600">
                        {user.email}
                      </td>
                      <td className="p-4">
                        <Badge variant={user.isActive ? "default" : "secondary"}>
                          {user.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="p-4 text-gray-600">
                        {user.lastLogin 
                          ? format(new Date(user.lastLogin), "MMM d, yyyy") 
                          : "Never"
                        }
                      </td>
                      <td className="p-4">
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(user)}
                            data-testid={`button-edit-user-${user.id}`}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          {user.isActive && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeactivate(user)}
                              className="text-red-600 hover:text-red-700"
                              data-testid={`button-deactivate-user-${user.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Portal User Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-md" data-testid="dialog-portal-user">
          <DialogHeader>
            <DialogTitle>
              {editingUser ? "Edit Portal User" : "Add Portal User"}
            </DialogTitle>
            <DialogDescription>
              {editingUser 
                ? "Update portal user information and access settings."
                : "Create portal access credentials for a client."
              }
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="clientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-client">
                          <SelectValue placeholder="Select client" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {clients.map((client: any) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name *</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-first-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name *</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-last-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email *</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" data-testid="input-email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Password {editingUser ? "(leave blank to keep current)" : "*"}
                    </FormLabel>
                    <FormControl>
                      <Input {...field} type="password" data-testid="input-password" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Active Status</FormLabel>
                      <div className="text-sm text-gray-600">
                        Allow this user to access the client portal
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="switch-active"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsCreateDialogOpen(false)}
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createMutation.isPending || updateMutation.isPending}
                  data-testid="button-save-user"
                >
                  {createMutation.isPending || updateMutation.isPending ? "Saving..." : (editingUser ? "Update User" : "Create User")}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Team Assignments Management Component
function TeamAssignmentsManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingPosition, setEditingPosition] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Team position creation/edit form schema
  const teamPositionSchema = z.object({
    key: z.string().min(1, "Key is required").max(50, "Key must be under 50 characters").regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, "Key must start with letter and contain only letters, numbers, underscore"),
    label: z.string().min(1, "Label is required").max(100, "Label must be under 100 characters"),
    description: z.string().max(500, "Description must be under 500 characters").optional(),
    order: z.coerce.number().min(0, "Order must be non-negative").optional(),
    isActive: z.boolean().default(true)
  });

  type TeamPositionForm = z.infer<typeof teamPositionSchema>;

  // Fetch team positions
  const { data: positions, isLoading: positionsLoading } = useQuery({
    queryKey: ['/api/team-positions'],
    enabled: true
  });

  // Create team position form
  const createForm = useForm<TeamPositionForm>({
    resolver: zodResolver(teamPositionSchema),
    defaultValues: {
      key: "",
      label: "",
      description: "",
      order: 0,
      isActive: true
    }
  });

  // Edit team position form
  const editForm = useForm<TeamPositionForm>({
    resolver: zodResolver(teamPositionSchema)
  });

  // Create team position mutation
  const createPositionMutation = useMutation({
    mutationFn: async (data: TeamPositionForm) => {
      const response = await apiRequest('POST', '/api/team-positions', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/team-positions'] });
      toast({
        title: "Success",
        description: "Team position created successfully"
      });
      createForm.reset();
      setIsCreateDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to create team position",
        variant: "destructive"
      });
    }
  });

  // Update team position mutation
  const updatePositionMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: TeamPositionForm }) => {
      const response = await apiRequest('PUT', `/api/team-positions/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/team-positions'] });
      toast({
        title: "Success",
        description: "Team position updated successfully"
      });
      setEditingPosition(null);
      setIsEditDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to update team position",
        variant: "destructive"
      });
    }
  });

  // Delete team position mutation
  const deletePositionMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('DELETE', `/api/team-positions/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/team-positions'] });
      toast({
        title: "Success",
        description: "Team position deleted successfully"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to delete team position",
        variant: "destructive"
      });
    }
  });

  // Reorder positions mutation
  const reorderMutation = useMutation({
    mutationFn: async (positions: Array<{ id: string; order: number }>) => {
      const response = await apiRequest('PATCH', '/api/team-positions/reorder', { positions });
      return response.json();
    },
    onError: (error: any) => {
      // Rollback on error
      queryClient.invalidateQueries({ queryKey: ['/api/team-positions'] });
      toast({
        title: "Error",
        description: error?.message || "Failed to reorder positions",
        variant: "destructive"
      });
      setIsSaving(false);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Positions reordered successfully"
      });
      setIsSaving(false);
    }
  });

  const onCreateSubmit = (data: TeamPositionForm) => {
    createPositionMutation.mutate(data);
  };

  const onEditSubmit = (data: TeamPositionForm) => {
    if (editingPosition) {
      updatePositionMutation.mutate({ id: editingPosition.id, data });
    }
  };

  const handleEdit = (position: any) => {
    setEditingPosition(position);
    editForm.reset({
      key: position.key,
      label: position.label,
      description: position.description || "",
      order: position.order || 0,
      isActive: position.isActive
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this team position? This action cannot be undone.")) {
      deletePositionMutation.mutate(id);
    }
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination || !positions) return;
    
    // Don't do anything if dropped in the same position
    if (result.source.index === result.destination.index) return;
    
    const items = Array.from(positions);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    // Resequence all positions with new order values
    const updatedPositions = items.map((item: any, index) => ({
      id: item.id,
      order: index
    }));
    
    // Optimistically update the cache
    queryClient.setQueryData(['/api/team-positions'], items.map((item: any, index) => ({
      ...item,
      order: index
    })));
    
    setIsSaving(true);
    reorderMutation.mutate(updatedPositions);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Team Positions
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Configure available positions that can be assigned to clients
            </p>
          </div>
          <Button 
            onClick={() => setIsCreateDialogOpen(true)}
            className="flex items-center gap-2"
            data-testid="button-create-position"
          >
            <Plus className="h-4 w-4" />
            Add Position
          </Button>
        </CardHeader>
        <CardContent>
          {positionsLoading ? (
            <div className="text-center py-8 text-gray-500">Loading positions...</div>
          ) : positions && positions.length > 0 ? (
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="positions-list">
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="space-y-4"
                  >
                    {positions.map((position: any, index: number) => (
                      <Draggable
                        key={position.id}
                        draggableId={position.id}
                        index={index}
                        isDragDisabled={isSaving || positionsLoading}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-white transition-shadow ${
                              snapshot.isDragging ? 'shadow-lg' : ''
                            }`}
                            data-testid={`position-item-${position.key}`}
                          >
                            <div className="flex items-center gap-3 flex-1">
                              <div
                                {...provided.dragHandleProps}
                                className="cursor-grab active:cursor-grabbing"
                                data-testid={`drag-handle-${position.key}`}
                              >
                                <GripVertical className="h-5 w-5 text-gray-400" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-3">
                                  <div>
                                    <h4 className="font-medium" data-testid="text-position-label">
                                      {position.label}
                                    </h4>
                                    <p className="text-sm text-gray-500" data-testid="text-position-key">
                                      Key: {position.key}
                                    </p>
                                    {position.description && (
                                      <p className="text-sm text-gray-600 mt-1" data-testid="text-position-description">
                                        {position.description}
                                      </p>
                                    )}
                                  </div>
                                  <div className="ml-auto flex items-center gap-2">
                                    <Badge variant={position.isActive ? "default" : "secondary"}>
                                      {position.isActive ? "Active" : "Inactive"}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 ml-4">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEdit(position)}
                                disabled={isSaving}
                                data-testid={`button-edit-${position.key}`}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDelete(position.id)}
                                disabled={deletePositionMutation.isPending || isSaving}
                                data-testid={`button-delete-${position.key}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No team positions configured yet. Click "Add Position" to create your first position.
            </div>
          )}
          {isSaving && (
            <div className="text-center py-2 text-sm text-gray-500">
              Saving new order...
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Position Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-md" data-testid="dialog-create-position">
          <DialogHeader>
            <DialogTitle>Create Team Position</DialogTitle>
            <DialogDescription>
              Add a new team position that can be assigned to clients.
            </DialogDescription>
          </DialogHeader>
          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
              <FormField
                control={createForm.control}
                name="label"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Label *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., Account Manager" 
                        {...field} 
                        data-testid="input-create-label"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={createForm.control}
                name="key"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Key *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., account_manager" 
                        {...field} 
                        data-testid="input-create-key"
                      />
                    </FormControl>
                    <p className="text-xs text-gray-500">
                      Unique identifier (letters, numbers, underscore only)
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={createForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Brief description of this position..."
                        {...field} 
                        data-testid="input-create-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={createForm.control}
                  name="order"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Display Order</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0"
                          {...field} 
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          data-testid="input-create-order"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Active</FormLabel>
                      <FormControl>
                        <Switch 
                          checked={field.value} 
                          onCheckedChange={field.onChange}
                          data-testid="switch-create-active"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsCreateDialogOpen(false)}
                  data-testid="button-create-cancel"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createPositionMutation.isPending}
                  data-testid="button-create-submit"
                >
                  {createPositionMutation.isPending ? "Creating..." : "Create Position"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Position Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md" data-testid="dialog-edit-position">
          <DialogHeader>
            <DialogTitle>Edit Team Position</DialogTitle>
            <DialogDescription>
              Update the team position details.
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="label"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Label *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., Account Manager" 
                        {...field} 
                        data-testid="input-edit-label"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="key"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Key *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., account_manager" 
                        {...field} 
                        data-testid="input-edit-key"
                      />
                    </FormControl>
                    <p className="text-xs text-gray-500">
                      Unique identifier (letters, numbers, underscore only)
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Brief description of this position..."
                        {...field} 
                        data-testid="input-edit-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="order"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Display Order</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0"
                          {...field} 
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          data-testid="input-edit-order"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Active</FormLabel>
                      <FormControl>
                        <Switch 
                          checked={field.value} 
                          onCheckedChange={field.onChange}
                          data-testid="switch-edit-active"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsEditDialogOpen(false)}
                  data-testid="button-edit-cancel"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={updatePositionMutation.isPending}
                  data-testid="button-edit-submit"
                >
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

export default function ClientsSettings() {
  const [activeTab, setActiveTab] = useState<"overview" | "clientBrief" | "portalAccess" | "teamAssignments">("overview");
  const [editingSection, setEditingSection] = useState<ClientBriefSection | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [sectionToDelete, setSectionToDelete] = useState<ClientBriefSection | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query for fetching brief sections
  const { data: briefSections = [], isLoading: isLoadingSections } = useQuery<ClientBriefSection[]>({
    queryKey: ['/api/client-brief-sections'],
    enabled: activeTab === 'clientBrief'
  });

  // Create section mutation
  const createSectionMutation = useMutation({
    mutationFn: (data: ClientBriefSectionForm) => 
      apiRequest('POST', '/api/client-brief-sections', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/client-brief-sections'] });
      // Also invalidate client brief data
      queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey[0]?.toString() || '';
          return key.includes('/api/clients/') && key.includes('/brief');
        }
      });
      setIsCreateDialogOpen(false);
      toast({ title: "Section created successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to create section", description: error.message, variant: "destructive" });
    }
  });

  // Update section mutation
  const updateSectionMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ClientBriefSectionForm> }) => 
      apiRequest('PUT', `/api/client-brief-sections/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/client-brief-sections'] });
      // Also invalidate all client brief data to update icons on client detail pages  
      queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey[0]?.toString() || '';
          return key.includes('/api/clients/') && key.includes('/brief');
        }
      });
      setIsEditDialogOpen(false);
      setEditingSection(null);
      toast({ title: "Section updated successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to update section", description: error.message, variant: "destructive" });
    }
  });

  // Delete section mutation
  const deleteSectionMutation = useMutation({
    mutationFn: (id: string) => 
      apiRequest('DELETE', `/api/client-brief-sections/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/client-brief-sections'] });
      // Also invalidate client brief data
      queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey[0]?.toString() || '';
          return key.includes('/api/clients/') && key.includes('/brief');
        }
      });
      setIsDeleteDialogOpen(false);
      setSectionToDelete(null);
      toast({ title: "Section deleted successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to delete section", description: error.message, variant: "destructive" });
    }
  });

  // Reorder sections mutation
  const reorderSectionsMutation = useMutation({
    mutationFn: (sectionIds: string[]) => 
      apiRequest('PUT', '/api/client-brief-sections/reorder', { sectionIds }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/client-brief-sections'] });
      // Also invalidate client brief data
      queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey[0]?.toString() || '';
          return key.includes('/api/clients/') && key.includes('/brief');
        }
      });
      toast({ title: "Sections reordered successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to reorder sections", description: error.message, variant: "destructive" });
    }
  });

  // Form for creating/editing sections
  const form = useForm<ClientBriefSectionForm>({
    resolver: zodResolver(clientBriefSectionSchema),
    defaultValues: {
      title: "",
      key: "",
      placeholder: "",
      icon: "FileText",
      type: "text",
      isEnabled: true
    }
  });

  // Handle form submission
  const onSubmit = (data: ClientBriefSectionForm) => {
    if (editingSection) {
      updateSectionMutation.mutate({ id: editingSection.id, data });
    } else {
      createSectionMutation.mutate(data);
    }
  };

  // Handle drag end for reordering
  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const reorderedSections = Array.from(briefSections);
    const [reorderedItem] = reorderedSections.splice(result.source.index, 1);
    reorderedSections.splice(result.destination.index, 0, reorderedItem);

    const sectionIds = reorderedSections.map(section => section.id);
    reorderSectionsMutation.mutate(sectionIds);
  };

  // Handle edit section
  const handleEditSection = (section: ClientBriefSection) => {
    setEditingSection(section);
    form.reset({
      title: section.title,
      key: section.key,
      placeholder: section.placeholder || "",
      icon: section.icon,
      type: section.type,
      isEnabled: section.isEnabled
    });
    setIsEditDialogOpen(true);
  };

  // Handle delete section
  const handleDeleteSection = (section: ClientBriefSection) => {
    setSectionToDelete(section);
    setIsDeleteDialogOpen(true);
  };

  // Handle new section
  const handleNewSection = () => {
    setEditingSection(null);
    form.reset({
      title: "",
      key: "",
      placeholder: "",
      icon: "FileText",
      type: "text",
      isEnabled: true
    });
    setIsCreateDialogOpen(true);
  };

  // Icon picker component
  const IconPicker = ({ value, onChange }: { value: string; onChange: (value: string) => void }) => {
    const [isOpen, setIsOpen] = useState(false);
    const IconComponent = iconMap[value as keyof typeof iconMap] || FileText;

    return (
      <div className="space-y-2">
        <Label>Icon</Label>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsOpen(!isOpen)}
            className="h-10 w-16 p-0"
            data-testid="button-icon-picker"
          >
            <IconComponent className="h-4 w-4" />
          </Button>
          <span className="text-sm text-gray-600">{value}</span>
        </div>
        {isOpen && (
          <div className="grid grid-cols-8 gap-2 p-4 border rounded-lg bg-white max-h-48 overflow-y-auto">
            {iconOptions.map((iconName) => {
              const Icon = iconMap[iconName as keyof typeof iconMap];
              return (
                <Button
                  key={iconName}
                  type="button"
                  variant={value === iconName ? "default" : "outline"}
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => {
                    onChange(iconName);
                    setIsOpen(false);
                  }}
                  data-testid={`icon-option-${iconName}`}
                >
                  <Icon className="h-4 w-4" />
                </Button>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="container mx-auto p-6">
      {/* Back to Settings */}
      <div className="mb-4">
        <Link href="/settings">
          <Button variant="outline" size="sm" className="flex items-center space-x-2">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Settings</span>
          </Button>
        </Link>
      </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Contact className="h-8 w-8 text-primary" />
            Client Settings
          </h1>
          <p className="text-gray-600 mt-2">Configure client management settings and options</p>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab("overview")}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === "overview"
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              data-testid="tab-overview"
            >
              <Settings className="h-4 w-4" />
              Overview
            </button>
            <button
              onClick={() => setActiveTab("clientBrief")}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === "clientBrief"
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              data-testid="tab-client-brief"
            >
              <FileText className="h-4 w-4" />
              Client Brief
            </button>
            <button
              onClick={() => setActiveTab("portalAccess")}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === "portalAccess"
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              data-testid="tab-portal-access"
            >
              <Users className="h-4 w-4" />
              Portal Access
            </button>
            <button
              onClick={() => setActiveTab("teamAssignments")}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === "teamAssignments"
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              data-testid="tab-team-assignments"
            >
              <ShieldCheck className="h-4 w-4" />
              Team Assignments
            </button>
          </nav>
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Client Settings Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <h3 className="font-medium mb-2">Coming Soon</h3>
                      <p className="text-sm text-gray-600">
                        Additional client management settings and configuration options will be added here.
                      </p>
                      <Badge variant="secondary" className="mt-2">
                        In Development
                      </Badge>
                    </div>
                    
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <h3 className="font-medium mb-2">Sub-tabs Ready</h3>
                      <p className="text-sm text-gray-600">
                        This section is prepared for additional sub-tabs and functionality as requested.
                      </p>
                      <Badge variant="outline" className="mt-2">
                        Ready for Configuration
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Client Brief Tab */}
        {activeTab === "clientBrief" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Client Brief Sections</CardTitle>
                  <Button onClick={handleNewSection} data-testid="button-create-section">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Section
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingSections ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-gray-500">Loading sections...</div>
                  </div>
                ) : briefSections.length === 0 ? (
                  <div className="text-center py-8">
                    <FileX className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No sections found</h3>
                    <p className="text-gray-500 mb-4">Get started by creating your first client brief section.</p>
                    <Button onClick={handleNewSection} data-testid="button-create-first-section">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Section
                    </Button>
                  </div>
                ) : (
                  <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId="brief-sections">
                      {(provided) => (
                        <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                          {briefSections.map((section, index) => {
                            const IconComponent = iconMap[section.icon as keyof typeof iconMap] || FileText;
                            return (
                              <Draggable key={section.id} draggableId={section.id} index={index}>
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    className={`flex items-center justify-between p-4 border rounded-lg bg-white ${
                                      snapshot.isDragging ? 'shadow-lg' : ''
                                    }`}
                                    data-testid={`section-item-${section.id}`}
                                  >
                                    <div className="flex items-center space-x-4">
                                      <div
                                        {...provided.dragHandleProps}
                                        className="cursor-grab active:cursor-grabbing"
                                        data-testid="drag-handle"
                                      >
                                        <GripVertical className="h-5 w-5 text-gray-400" />
                                      </div>
                                      <IconComponent className="h-5 w-5 text-gray-600" />
                                      <div>
                                        <div className="flex items-center gap-2">
                                          <h3 className="font-medium" data-testid={`text-title-${section.id}`}>
                                            {section.title}
                                          </h3>
                                          {!section.isEnabled && (
                                            <Badge variant="outline">Disabled</Badge>
                                          )}
                                        </div>
                                        <p className="text-sm text-gray-500" data-testid={`text-key-${section.id}`}>
                                          Key: {section.key} • Type: {section.type}
                                        </p>
                                        {section.placeholder && (
                                          <p className="text-sm text-gray-400" data-testid={`text-placeholder-${section.id}`}>
                                            Placeholder: {section.placeholder}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <Switch
                                        checked={section.isEnabled}
                                        onCheckedChange={(checked) => {
                                          updateSectionMutation.mutate({
                                            id: section.id,
                                            data: { isEnabled: checked }
                                          });
                                        }}
                                        data-testid={`switch-enabled-${section.id}`}
                                      />
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleEditSection(section)}
                                        data-testid={`button-edit-${section.id}`}
                                      >
                                        <Edit2 className="h-4 w-4" />
                                      </Button>
                                      {section.scope === 'custom' && (
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => handleDeleteSection(section)}
                                          data-testid={`button-delete-${section.id}`}
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </Draggable>
                            );
                          })}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </DragDropContext>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Portal Access Tab */}
        {activeTab === "portalAccess" && (
          <PortalAccessManagement />
        )}

        {/* Team Assignments Tab */}
        {activeTab === "teamAssignments" && (
          <TeamAssignmentsManagement />
        )}

        {/* Create Section Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-md" data-testid="dialog-create-section">
            <DialogHeader>
              <DialogTitle>Create New Section</DialogTitle>
              <DialogDescription>
                Add a new client brief section that will appear in all client profiles.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Section title" {...field} data-testid="input-title" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="key"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Key</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="section_key" 
                          {...field} 
                          onChange={(e) => {
                            const value = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_');
                            field.onChange(value);
                          }}
                          data-testid="input-key"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="placeholder"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Placeholder (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter placeholder text..." {...field} data-testid="input-placeholder" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="icon"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <IconPicker value={field.value} onChange={field.onChange} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-type">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="text">Text</SelectItem>
                          <SelectItem value="rich_text">Rich Text</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="isEnabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Enabled</FormLabel>
                        <div className="text-sm text-gray-500">
                          Show this section in client profiles
                        </div>
                      </div>
                      <FormControl>
                        <Switch 
                          checked={field.value} 
                          onCheckedChange={field.onChange}
                          data-testid="switch-enabled"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsCreateDialogOpen(false)}
                    data-testid="button-cancel"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createSectionMutation.isPending}
                    data-testid="button-create"
                  >
                    {createSectionMutation.isPending ? "Creating..." : "Create Section"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Edit Section Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-md" data-testid="dialog-edit-section">
            <DialogHeader>
              <DialogTitle>Edit Section</DialogTitle>
              <DialogDescription>
                Update the section details.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Section title" {...field} data-testid="input-edit-title" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {editingSection?.scope === 'custom' && (
                  <FormField
                    control={form.control}
                    name="key"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Key</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="section_key" 
                            {...field}
                            onChange={(e) => {
                              const value = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_');
                              field.onChange(value);
                            }}
                            data-testid="input-edit-key"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                <FormField
                  control={form.control}
                  name="placeholder"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Placeholder (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter placeholder text..." {...field} data-testid="input-edit-placeholder" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="icon"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <IconPicker value={field.value} onChange={field.onChange} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-edit-type">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="text">Text</SelectItem>
                          <SelectItem value="rich_text">Rich Text</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="isEnabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Enabled</FormLabel>
                        <div className="text-sm text-gray-500">
                          Show this section in client profiles
                        </div>
                      </div>
                      <FormControl>
                        <Switch 
                          checked={field.value} 
                          onCheckedChange={field.onChange}
                          data-testid="switch-edit-enabled"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsEditDialogOpen(false)}
                    data-testid="button-edit-cancel"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={updateSectionMutation.isPending}
                    data-testid="button-update"
                  >
                    {updateSectionMutation.isPending ? "Updating..." : "Update Section"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Delete Section Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent data-testid="dialog-delete-section">
            <DialogHeader>
              <DialogTitle>Delete Section</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this section? This action cannot be undone and will remove all client data for this section.
              </DialogDescription>
            </DialogHeader>
            {sectionToDelete && (
              <div className="py-4">
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  {(() => {
                    const IconComponent = iconMap[sectionToDelete.icon as keyof typeof iconMap] || FileText;
                    return <IconComponent className="h-5 w-5 text-gray-600" />;
                  })()}
                  <div>
                    <p className="font-medium" data-testid="text-delete-title">{sectionToDelete.title}</p>
                    <p className="text-sm text-gray-500" data-testid="text-delete-key">Key: {sectionToDelete.key}</p>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setIsDeleteDialogOpen(false)}
                data-testid="button-delete-cancel"
              >
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => sectionToDelete && deleteSectionMutation.mutate(sectionToDelete.id)}
                disabled={deleteSectionMutation.isPending}
                data-testid="button-confirm-delete"
              >
                {deleteSectionMutation.isPending ? "Deleting..." : "Delete Section"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
    </div>
  );
}