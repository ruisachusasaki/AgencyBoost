import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Edit, Trash2, GripVertical, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertTaskStatusSchema } from "@shared/schema";
import { z } from "zod";

// Color options for task statuses
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

type TaskStatusFormData = z.infer<typeof insertTaskStatusSchema>;

export default function TaskStatusesPage() {
  const [editingStatus, setEditingStatus] = useState<TaskStatus | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [statusToDelete, setStatusToDelete] = useState<TaskStatus | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch task statuses
  const { data: statuses = [], isLoading } = useQuery<TaskStatus[]>({
    queryKey: ["/api/task-statuses"],
  });

  // Form for creating/editing statuses
  const form = useForm<TaskStatusFormData>({
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

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: TaskStatusFormData) => apiRequest("/api/task-statuses", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/task-statuses"] });
      toast({
        title: "Success",
        description: "Task status created successfully",
      });
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create task status",
        variant: "destructive",
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TaskStatusFormData> }) =>
      apiRequest(`/api/task-statuses/${id}`, "PUT", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/task-statuses"] });
      toast({
        title: "Success",
        description: "Task status updated successfully",
      });
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update task status",
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/task-statuses/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/task-statuses"] });
      toast({
        title: "Success",
        description: "Task status deleted successfully",
      });
      setIsDeleteDialogOpen(false);
      setStatusToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete task status",
        variant: "destructive",
      });
    },
  });

  const handleOpenDialog = (status?: TaskStatus) => {
    if (status) {
      setEditingStatus(status);
      form.reset({
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
      setEditingStatus(null);
      form.reset({
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
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingStatus(null);
    form.reset();
  };

  const handleSubmit = (data: TaskStatusFormData) => {
    // Auto-generate value from name if not provided
    if (!data.value) {
      data.value = data.name.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
    }

    if (editingStatus) {
      updateMutation.mutate({ id: editingStatus.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (status: TaskStatus) => {
    setStatusToDelete(status);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (statusToDelete) {
      deleteMutation.mutate(statusToDelete.id);
    }
  };

  // Generate status value from name
  const generateValue = (name: string) => {
    return name.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
  };

  const watchedName = form.watch("name");
  
  // Auto-update value when name changes
  const handleNameChange = (value: string) => {
    form.setValue("name", value);
    if (!editingStatus) {
      form.setValue("value", generateValue(value));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="text-muted-foreground">Loading task statuses...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Task Statuses</h1>
          <p className="text-muted-foreground mt-2">
            Manage custom status options for tasks. Create statuses that match your workflow.
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()} data-testid="button-add-status">
          <Plus className="h-4 w-4 mr-2" />
          Add Status
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Current Task Statuses</CardTitle>
        </CardHeader>
        <CardContent>
          {statuses.length === 0 ? (
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
                            onClick={() => handleOpenDialog(status)}
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

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingStatus ? "Edit Task Status" : "Create Task Status"}
            </DialogTitle>
            <DialogDescription>
              {editingStatus
                ? "Update the task status details."
                : "Create a new status option for tasks."}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., In Progress"
                        {...field}
                        onChange={(e) => handleNameChange(e.target.value)}
                        data-testid="input-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
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
                control={form.control}
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
                control={form.control}
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
                  control={form.control}
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
                    control={form.control}
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
                    control={form.control}
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
                  disabled={createMutation.isPending || updateMutation.isPending}
                  data-testid="button-save"
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? "Saving..."
                    : editingStatus
                    ? "Update"
                    : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Task Status</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{statusToDelete?.name}"? This action will
              deactivate the status and it won't be available for new tasks.
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
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}