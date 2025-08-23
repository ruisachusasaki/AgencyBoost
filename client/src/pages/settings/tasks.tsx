import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Edit, Trash2, GripVertical, Eye, EyeOff, Settings, Flag, Layers, Folder } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { IconPicker } from "@/components/ui/icon-picker";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertTaskStatusSchema, insertTaskPrioritySchema, insertTaskCategorySchema } from "@shared/schema";
import { z } from "zod";

// Color options for task statuses and priorities
const colorOptions = [
  { value: "#ef4444", label: "Red", class: "bg-red-500" },
  { value: "#f97316", label: "Orange", class: "bg-orange-500" },
  { value: "#eab308", label: "Yellow", class: "bg-yellow-500" },
  { value: "#22c55e", label: "Green", class: "bg-green-500" },
  { value: "#3b82f6", label: "Blue", class: "bg-blue-500" },
  { value: "#8b5cf6", label: "Purple", class: "bg-purple-500" },
  { value: "#ec4899", label: "Pink", class: "bg-pink-500" },
  { value: "#6b7280", label: "Gray", class: "bg-gray-500" },
];

// Icon options for priorities
const iconOptions = [
  { value: "flag", label: "Flag" },
  { value: "alert-triangle", label: "Alert Triangle" },
  { value: "zap", label: "Zap" },
  { value: "star", label: "Star" },
  { value: "clock", label: "Clock" },
  { value: "shield", label: "Shield" },
];

type TaskStatus = {
  id: string;
  name: string;
  value: string;
  color: string;
  description?: string;
  sortOrder: number;
  isDefault: boolean;
  isActive: boolean;
  isSystemStatus: boolean;
  createdAt: string;
  updatedAt: string;
};

type TaskPriority = {
  id: string;
  name: string;
  value: string;
  color: string;
  icon: string;
  description?: string;
  sortOrder: number;
  isDefault: boolean;
  isActive: boolean;
  isSystemPriority: boolean;
  createdAt: string;
  updatedAt: string;
};

type TaskCategory = {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  isDefault: boolean;
  createdAt: string;
};

type TaskStatusFormData = z.infer<typeof insertTaskStatusSchema>;
type TaskPriorityFormData = z.infer<typeof insertTaskPrioritySchema>;
type TaskCategoryFormData = z.infer<typeof insertTaskCategorySchema>;

export default function TasksSettingsPage() {
  const [activeTab, setActiveTab] = useState("statuses");
  const [editingItem, setEditingItem] = useState<TaskStatus | TaskPriority | TaskCategory | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<TaskStatus | TaskPriority | TaskCategory | null>(null);
  const [editType, setEditType] = useState<'status' | 'priority' | 'category'>('status');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch task statuses
  const { data: statuses = [], isLoading: loadingStatuses } = useQuery<TaskStatus[]>({
    queryKey: ["/api/task-statuses"],
  });

  // Fetch task priorities
  const { data: priorities = [], isLoading: loadingPriorities } = useQuery<TaskPriority[]>({
    queryKey: ["/api/task-priorities"],
  });

  // Fetch task categories
  const { data: categories = [], isLoading: loadingCategories } = useQuery<TaskCategory[]>({
    queryKey: ["/api/task-categories"],
  });

  // Form for creating/editing statuses
  const statusForm = useForm<TaskStatusFormData>({
    resolver: zodResolver(insertTaskStatusSchema),
    defaultValues: {
      name: "",
      value: "",
      color: "#6b7280",
      description: "",
      sortOrder: 0,
      isDefault: false,
      isActive: true,
      isSystemStatus: false,
    },
  });

  // Form for creating/editing priorities
  const priorityForm = useForm<TaskPriorityFormData>({
    resolver: zodResolver(insertTaskPrioritySchema),
    defaultValues: {
      name: "",
      value: "",
      color: "#6b7280",
      icon: "flag",
      description: "",
      sortOrder: 0,
      isDefault: false,
      isActive: true,
      isSystemPriority: false,
    },
  });

  // Form for creating/editing categories
  const categoryForm = useForm<TaskCategoryFormData>({
    resolver: zodResolver(insertTaskCategorySchema),
    defaultValues: {
      name: "",
      description: "",
      color: "#6b7280",
      icon: "folder",
      isDefault: false,
    },
  });

  // Status mutations
  const createStatusMutation = useMutation({
    mutationFn: (data: TaskStatusFormData) => apiRequest("/api/task-statuses", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/task-statuses"] });
      toast({ title: "Success", description: "Task status created successfully" });
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to create task status", variant: "destructive" });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TaskStatusFormData> }) =>
      apiRequest(`/api/task-statuses/${id}`, "PUT", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/task-statuses"] });
      toast({ title: "Success", description: "Task status updated successfully" });
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to update task status", variant: "destructive" });
    },
  });

  const deleteStatusMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/task-statuses/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/task-statuses"] });
      toast({ title: "Success", description: "Task status deleted successfully" });
      setIsDeleteDialogOpen(false);
      setItemToDelete(null);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to delete task status", variant: "destructive" });
    },
  });

  // Priority mutations
  const createPriorityMutation = useMutation({
    mutationFn: (data: TaskPriorityFormData) => apiRequest("/api/task-priorities", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/task-priorities"] });
      toast({ title: "Success", description: "Task priority created successfully" });
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to create task priority", variant: "destructive" });
    },
  });

  const updatePriorityMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TaskPriorityFormData> }) =>
      apiRequest(`/api/task-priorities/${id}`, "PUT", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/task-priorities"] });
      toast({ title: "Success", description: "Task priority updated successfully" });
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to update task priority", variant: "destructive" });
    },
  });

  const deletePriorityMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/task-priorities/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/task-priorities"] });
      toast({ title: "Success", description: "Task priority deleted successfully" });
      setIsDeleteDialogOpen(false);
      setItemToDelete(null);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to delete task priority", variant: "destructive" });
    },
  });

  // Category mutations
  const createCategoryMutation = useMutation({
    mutationFn: (data: TaskCategoryFormData) => apiRequest("POST", "/api/task-categories", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/task-categories"] });
      toast({ title: "Success", description: "Task category created successfully" });
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to create task category", variant: "destructive" });
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TaskCategoryFormData> }) =>
      apiRequest("PUT", `/api/task-categories/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/task-categories"] });
      toast({ title: "Success", description: "Task category updated successfully" });
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to update task category", variant: "destructive" });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/task-categories/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/task-categories"] });
      toast({ title: "Success", description: "Task category deleted successfully" });
      setIsDeleteDialogOpen(false);
      setItemToDelete(null);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to delete task category", variant: "destructive" });
    },
  });

  const handleOpenDialog = (type: 'status' | 'priority' | 'category', item?: TaskStatus | TaskPriority | TaskCategory) => {
    setEditType(type);
    
    if (type === 'status') {
      const status = item as TaskStatus;
      if (status) {
        setEditingItem(status);
        statusForm.reset({
          name: status.name,
          value: status.value,
          color: status.color,
          description: status.description || "",
          sortOrder: status.sortOrder,
          isDefault: status.isDefault,
          isActive: status.isActive,
          isSystemStatus: status.isSystemStatus,
        });
      } else {
        setEditingItem(null);
        statusForm.reset({
          name: "",
          value: "",
          color: "#6b7280",
          description: "",
          sortOrder: Math.max(...statuses.map(s => s.sortOrder || 0), 0) + 1,
          isDefault: false,
          isActive: true,
          isSystemStatus: false,
        });
      }
    } else if (type === 'priority') {
      const priority = item as TaskPriority;
      if (priority) {
        setEditingItem(priority);
        priorityForm.reset({
          name: priority.name,
          value: priority.value,
          color: priority.color,
          icon: priority.icon,
          description: priority.description || "",
          sortOrder: priority.sortOrder,
          isDefault: priority.isDefault,
          isActive: priority.isActive,
          isSystemPriority: priority.isSystemPriority,
        });
      } else {
        setEditingItem(null);
        priorityForm.reset({
          name: "",
          value: "",
          color: "#6b7280",
          icon: "flag",
          description: "",
          sortOrder: Math.max(...priorities.map(p => p.sortOrder || 0), 0) + 1,
          isDefault: false,
          isActive: true,
          isSystemPriority: false,
        });
      }
    } else {
      const category = item as TaskCategory;
      if (category) {
        setEditingItem(category);
        categoryForm.reset({
          name: category.name,
          description: category.description || "",
          color: category.color,
          icon: category.icon || "folder",
          isDefault: category.isDefault,
        });
      } else {
        setEditingItem(null);
        categoryForm.reset({
          name: "",
          description: "",
          color: "#6b7280",
          icon: "folder",
          isDefault: false,
        });
      }
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingItem(null);
    statusForm.reset();
    priorityForm.reset();
    categoryForm.reset();
  };

  const handleSubmit = (data: TaskStatusFormData | TaskPriorityFormData | TaskCategoryFormData) => {
    // Auto-generate value from name if not provided for statuses and priorities
    if ('value' in data && !data.value) {
      data.value = data.name.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
    }

    if (editType === 'status') {
      if (editingItem) {
        updateStatusMutation.mutate({ id: editingItem.id, data: data as TaskStatusFormData });
      } else {
        createStatusMutation.mutate(data as TaskStatusFormData);
      }
    } else if (editType === 'priority') {
      if (editingItem) {
        updatePriorityMutation.mutate({ id: editingItem.id, data: data as TaskPriorityFormData });
      } else {
        createPriorityMutation.mutate(data as TaskPriorityFormData);
      }
    } else {
      if (editingItem) {
        updateCategoryMutation.mutate({ id: editingItem.id, data: data as TaskCategoryFormData });
      } else {
        createCategoryMutation.mutate(data as TaskCategoryFormData);
      }
    }
  };

  const handleDelete = (item: TaskStatus | TaskPriority | TaskCategory) => {
    setItemToDelete(item);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      if ('isSystemStatus' in itemToDelete) {
        deleteStatusMutation.mutate(itemToDelete.id);
      } else if ('isSystemPriority' in itemToDelete) {
        deletePriorityMutation.mutate(itemToDelete.id);
      } else {
        deleteCategoryMutation.mutate(itemToDelete.id);
      }
    }
  };

  const generateValue = (name: string) => {
    return name.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
  };

  const getCurrentForm = () => {
    if (editType === 'status') return statusForm;
    if (editType === 'priority') return priorityForm;
    return categoryForm;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Task Settings</h1>
          <p className="text-muted-foreground mt-2">
            Configure task statuses, priorities, categories, and other task management options.
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="statuses" className="flex items-center gap-2">
            <Layers className="h-4 w-4" />
            Statuses
          </TabsTrigger>
          <TabsTrigger value="priorities" className="flex items-center gap-2">
            <Flag className="h-4 w-4" />
            Priorities
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <Folder className="h-4 w-4" />
            Categories
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* Task Statuses Tab */}
        <TabsContent value="statuses" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium">Task Statuses</h3>
              <p className="text-muted-foreground">
                Manage custom status options for tasks. Create statuses that match your workflow.
              </p>
            </div>
            <Button onClick={() => handleOpenDialog('status')} data-testid="button-add-status">
              <Plus className="h-4 w-4 mr-2" />
              Add Status
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              {loadingStatuses ? (
                <div className="flex items-center justify-center h-48">
                  <div className="text-muted-foreground">Loading task statuses...</div>
                </div>
              ) : statuses.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No task statuses configured. Create your first status to get started.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">Order</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Color</TableHead>
                      <TableHead>Default</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>System</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {statuses
                      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
                      .map((status) => (
                        <TableRow key={status.id}>
                          <TableCell>
                            <div className="flex items-center">
                              <GripVertical className="h-4 w-4 text-muted-foreground" />
                              <span className="ml-2 text-sm text-muted-foreground">
                                {status.sortOrder}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{status.name}</div>
                            {status.description && (
                              <div className="text-sm text-muted-foreground">
                                {status.description}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <code className="text-xs bg-muted px-2 py-1 rounded">
                              {status.value}
                            </code>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              style={{ backgroundColor: status.color }} 
                              className="text-white"
                            >
                              {status.name}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {status.isDefault && (
                              <Badge variant="secondary">Default</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              {status.isActive ? (
                                <Eye className="h-4 w-4 text-green-600" />
                              ) : (
                                <EyeOff className="h-4 w-4 text-muted-foreground" />
                              )}
                              <span className="ml-2 text-sm">
                                {status.isActive ? "Active" : "Inactive"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {status.isSystemStatus && (
                              <Badge variant="outline">System</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenDialog('status', status)}
                                data-testid={`button-edit-${status.id}`}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              {!status.isSystemStatus && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(status)}
                                  data-testid={`button-delete-${status.id}`}
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Task Priorities Tab */}
        <TabsContent value="priorities" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium">Task Priorities</h3>
              <p className="text-muted-foreground">
                Manage priority levels for tasks. Higher sort order values indicate higher priority.
              </p>
            </div>
            <Button onClick={() => handleOpenDialog('priority')} data-testid="button-add-priority">
              <Plus className="h-4 w-4 mr-2" />
              Add Priority
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              {loadingPriorities ? (
                <div className="flex items-center justify-center h-48">
                  <div className="text-muted-foreground">Loading task priorities...</div>
                </div>
              ) : priorities.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No task priorities configured. Create your first priority to get started.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">Order</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Color</TableHead>
                      <TableHead>Icon</TableHead>
                      <TableHead>Default</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>System</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {priorities
                      .sort((a, b) => (b.sortOrder || 0) - (a.sortOrder || 0))
                      .map((priority) => (
                        <TableRow key={priority.id}>
                          <TableCell>
                            <div className="flex items-center">
                              <GripVertical className="h-4 w-4 text-muted-foreground" />
                              <span className="ml-2 text-sm text-muted-foreground">
                                {priority.sortOrder}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{priority.name}</div>
                            {priority.description && (
                              <div className="text-sm text-muted-foreground">
                                {priority.description}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <code className="text-xs bg-muted px-2 py-1 rounded">
                              {priority.value}
                            </code>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              style={{ backgroundColor: priority.color }} 
                              className="text-white"
                            >
                              {priority.name}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Flag className="h-4 w-4" />
                              <span className="ml-2 text-sm">{priority.icon}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {priority.isDefault && (
                              <Badge variant="secondary">Default</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              {priority.isActive ? (
                                <Eye className="h-4 w-4 text-green-600" />
                              ) : (
                                <EyeOff className="h-4 w-4 text-muted-foreground" />
                              )}
                              <span className="ml-2 text-sm">
                                {priority.isActive ? "Active" : "Inactive"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {priority.isSystemPriority && (
                              <Badge variant="outline">System</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenDialog('priority', priority)}
                                data-testid={`button-edit-${priority.id}`}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              {!priority.isSystemPriority && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(priority)}
                                  data-testid={`button-delete-${priority.id}`}
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Task Categories Tab */}
        <TabsContent value="categories" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium">Task Categories</h3>
              <p className="text-muted-foreground">
                Organize tasks into categories for better management and filtering.
              </p>
            </div>
            <Button onClick={() => handleOpenDialog('category')} data-testid="button-add-category">
              <Plus className="h-4 w-4 mr-2" />
              Add Category
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              {loadingCategories ? (
                <div className="flex items-center justify-center h-48">
                  <div className="text-muted-foreground">Loading task categories...</div>
                </div>
              ) : categories.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No task categories configured. Create your first category to get started.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Color</TableHead>
                      <TableHead>Icon</TableHead>
                      <TableHead>Default</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.map((category) => (
                      <TableRow key={category.id}>
                        <TableCell>
                          <div className="font-medium">{category.name}</div>
                          {category.description && (
                            <div className="text-sm text-muted-foreground">
                              {category.description}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            style={{ backgroundColor: category.color }} 
                            className="text-white"
                          >
                            {category.name}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            {(() => {
                              const iconName = category.icon || 'folder';
                              const IconComponent = (LucideIcons as any)[iconName] || (LucideIcons as any)[iconName.charAt(0).toUpperCase() + iconName.slice(1)] || Folder;
                              return <IconComponent className="h-4 w-4 mr-2" />;
                            })()}
                            <span className="text-sm">{category.icon || 'folder'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {category.isDefault && (
                            <Badge variant="secondary">Default</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {new Date(category.createdAt).toLocaleDateString()}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenDialog('category', category)}
                              data-testid={`button-edit-${category.id}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(category)}
                              data-testid={`button-delete-${category.id}`}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Task Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium">Global Task Settings</h3>
              <p className="text-muted-foreground">
                Configure system-wide task behavior and defaults.
              </p>
            </div>
          </div>

          <Card>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Global task settings coming soon. This will include default assignees, auto-due dates, time tracking requirements, etc.
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingItem 
                ? `Edit Task ${editType === 'status' ? 'Status' : 'Priority'}` 
                : `Create Task ${editType === 'status' ? 'Status' : 'Priority'}`}
            </DialogTitle>
            <DialogDescription>
              {editingItem
                ? `Update the task ${editType} details.`
                : `Create a new ${editType} option for tasks.`}
            </DialogDescription>
          </DialogHeader>

          {editType === 'status' && (
            <Form {...statusForm}>
              <form onSubmit={statusForm.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                  control={statusForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., In Progress"
                          {...field}
                          onChange={(e) => {
                            field.onChange(e.target.value);
                            if (!editingItem) {
                              statusForm.setValue("value", generateValue(e.target.value));
                            }
                          }}
                          data-testid="input-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={statusForm.control}
                  name="value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status Value (Code)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., in_progress"
                          {...field}
                          data-testid="input-value"
                        />
                      </FormControl>
                      <FormMessage />
                      <p className="text-xs text-muted-foreground">
                        Used internally in the system. Auto-generated from name if left empty.
                      </p>
                    </FormItem>
                  )}
                />

                <FormField
                  control={statusForm.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Color</FormLabel>
                      <FormControl>
                        <div className="flex items-center space-x-2">
                          <Input
                            type="color"
                            {...field}
                            className="w-16 h-10 p-1 border rounded"
                            data-testid="input-color"
                          />
                          <div className="flex space-x-1">
                            {colorOptions.map((color) => (
                              <button
                                key={color.value}
                                type="button"
                                className={`w-6 h-6 rounded-full border-2 ${color.class} ${
                                  field.value === color.value
                                    ? "border-foreground"
                                    : "border-transparent"
                                }`}
                                onClick={() => field.onChange(color.value)}
                                title={color.label}
                              />
                            ))}
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={statusForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Brief description of when this status should be used"
                          {...field}
                          value={field.value || ""}
                          data-testid="input-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={statusForm.control}
                    name="sortOrder"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sort Order</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0"
                            {...field}
                            value={field.value || 0}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            data-testid="input-sort-order"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-4">
                    <FormField
                      control={statusForm.control}
                      name="isDefault"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between">
                          <FormLabel>Default Status</FormLabel>
                          <FormControl>
                            <Switch
                              checked={field.value || false}
                              onCheckedChange={field.onChange}
                              data-testid="switch-default"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={statusForm.control}
                      name="isActive"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between">
                          <FormLabel>Active</FormLabel>
                          <FormControl>
                            <Switch
                              checked={field.value || false}
                              onCheckedChange={field.onChange}
                              data-testid="switch-active"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCloseDialog}
                    data-testid="button-cancel"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createStatusMutation.isPending || updateStatusMutation.isPending}
                    data-testid="button-save"
                  >
                    {createStatusMutation.isPending || updateStatusMutation.isPending
                      ? "Saving..."
                      : editingItem
                      ? "Update"
                      : "Create"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          )}

          {editType === 'priority' && (
            <Form {...priorityForm}>
              <form onSubmit={priorityForm.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                  control={priorityForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., High Priority"
                          {...field}
                          onChange={(e) => {
                            field.onChange(e.target.value);
                            if (!editingItem) {
                              priorityForm.setValue("value", generateValue(e.target.value));
                            }
                          }}
                          data-testid="input-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={priorityForm.control}
                  name="value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority Value (Code)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., high"
                          {...field}
                          data-testid="input-value"
                        />
                      </FormControl>
                      <FormMessage />
                      <p className="text-xs text-muted-foreground">
                        Used internally in the system. Auto-generated from name if left empty.
                      </p>
                    </FormItem>
                  )}
                />

                <FormField
                  control={priorityForm.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Color</FormLabel>
                      <FormControl>
                        <div className="flex items-center space-x-2">
                          <Input
                            type="color"
                            {...field}
                            className="w-16 h-10 p-1 border rounded"
                            data-testid="input-color"
                          />
                          <div className="flex space-x-1">
                            {colorOptions.map((color) => (
                              <button
                                key={color.value}
                                type="button"
                                className={`w-6 h-6 rounded-full border-2 ${color.class} ${
                                  field.value === color.value
                                    ? "border-foreground"
                                    : "border-transparent"
                                }`}
                                onClick={() => field.onChange(color.value)}
                                title={color.label}
                              />
                            ))}
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={priorityForm.control}
                  name="icon"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Icon</FormLabel>
                      <FormControl>
                        <select 
                          {...field}
                          value={field.value || ""}
                          className="w-full p-2 border rounded"
                          data-testid="select-icon"
                        >
                          {iconOptions.map((icon) => (
                            <option key={icon.value} value={icon.value}>
                              {icon.label}
                            </option>
                          ))}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={priorityForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Brief description of when this priority should be used"
                          {...field}
                          value={field.value || ""}
                          data-testid="input-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={priorityForm.control}
                    name="sortOrder"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sort Order</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0"
                            {...field}
                            value={field.value || 0}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            data-testid="input-sort-order"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-4">
                    <FormField
                      control={priorityForm.control}
                      name="isDefault"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between">
                          <FormLabel>Default Priority</FormLabel>
                          <FormControl>
                            <Switch
                              checked={field.value || false}
                              onCheckedChange={field.onChange}
                              data-testid="switch-default"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={priorityForm.control}
                      name="isActive"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between">
                          <FormLabel>Active</FormLabel>
                          <FormControl>
                            <Switch
                              checked={field.value || false}
                              onCheckedChange={field.onChange}
                              data-testid="switch-active"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCloseDialog}
                    data-testid="button-cancel"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createPriorityMutation.isPending || updatePriorityMutation.isPending}
                    data-testid="button-save"
                  >
                    {createPriorityMutation.isPending || updatePriorityMutation.isPending
                      ? "Saving..."
                      : editingItem
                      ? "Update"
                      : "Create"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          )}

          {editType === 'category' && (
            <Form {...categoryForm}>
              <form onSubmit={categoryForm.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                  control={categoryForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Development"
                          {...field}
                          data-testid="input-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={categoryForm.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Color</FormLabel>
                      <FormControl>
                        <div className="flex items-center space-x-2">
                          <Input
                            type="color"
                            {...field}
                            className="w-16 h-10 p-1 border rounded"
                            data-testid="input-color"
                          />
                          <div className="flex space-x-1">
                            {colorOptions.map((color) => (
                              <button
                                key={color.value}
                                type="button"
                                className={`w-6 h-6 rounded-full border-2 ${color.class} ${
                                  field.value === color.value
                                    ? "border-foreground"
                                    : "border-transparent"
                                }`}
                                onClick={() => field.onChange(color.value)}
                                title={color.label}
                              />
                            ))}
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={categoryForm.control}
                  name="icon"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Icon</FormLabel>
                      <FormControl>
                        <IconPicker
                          value={field.value || ""}
                          onChange={field.onChange}
                          placeholder="Type icon name (e.g., folder, star, tag)"
                          data-testid="picker-icon"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={categoryForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Brief description of this category"
                          {...field}
                          value={field.value || ""}
                          data-testid="input-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={categoryForm.control}
                  name="isDefault"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <FormLabel>Default Category</FormLabel>
                      <FormControl>
                        <Switch
                          checked={field.value || false}
                          onCheckedChange={field.onChange}
                          data-testid="switch-default"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCloseDialog}
                    data-testid="button-cancel"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createCategoryMutation.isPending || updateCategoryMutation.isPending}
                    data-testid="button-save"
                  >
                    {createCategoryMutation.isPending || updateCategoryMutation.isPending
                      ? "Saving..."
                      : editingItem
                      ? "Update"
                      : "Create"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Task {
              itemToDelete && 'isSystemStatus' in itemToDelete ? 'Status' : 
              itemToDelete && 'isSystemPriority' in itemToDelete ? 'Priority' : 'Category'
            }</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{itemToDelete?.name}"? This action will
              deactivate the {
                itemToDelete && 'isSystemStatus' in itemToDelete ? 'status' : 
                itemToDelete && 'isSystemPriority' in itemToDelete ? 'priority' : 'category'
              } and it won't be available for new tasks.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              data-testid="button-cancel-delete"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteStatusMutation.isPending || deletePriorityMutation.isPending || deleteCategoryMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteStatusMutation.isPending || deletePriorityMutation.isPending || deleteCategoryMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}