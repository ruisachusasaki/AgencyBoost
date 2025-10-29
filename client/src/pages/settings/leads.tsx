import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertLeadSourceSchema, type LeadSource, type InsertLeadSource } from "@shared/schema";
import { Link } from "wouter";
import { ArrowLeft, Plus, Edit, Trash2, ChevronUp, ChevronDown, Target } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function LeadsSettingsPage() {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingSource, setEditingSource] = useState<LeadSource | null>(null);
  const [deletingSource, setDeletingSource] = useState<LeadSource | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch lead sources
  const { data: sources = [], isLoading } = useQuery({
    queryKey: ['/api/lead-sources'],
    queryFn: async () => {
      const response = await fetch('/api/lead-sources');
      if (!response.ok) throw new Error('Failed to fetch lead sources');
      return response.json();
    },
  });

  // Create source mutation
  const createSourceMutation = useMutation({
    mutationFn: async (data: InsertLeadSource) => {
      const response = await fetch('/api/lead-sources', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Failed to create lead source');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/lead-sources'] });
      setShowAddDialog(false);
      toast({
        title: "Success",
        description: "Lead source created successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create lead source. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Update source mutation
  const updateSourceMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertLeadSource> }) => {
      const response = await fetch(`/api/lead-sources/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Failed to update lead source');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/lead-sources'] });
      setEditingSource(null);
      toast({
        title: "Success",
        description: "Lead source updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update lead source. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Delete source mutation
  const deleteSourceMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/lead-sources/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete lead source');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/lead-sources'] });
      setDeletingSource(null);
      toast({
        title: "Success",
        description: "Lead source deleted successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete lead source. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Reorder mutation
  const reorderMutation = useMutation({
    mutationFn: async (sourceIds: string[]) => {
      const response = await fetch('/api/lead-sources/reorder', {
        method: 'PUT',
        body: JSON.stringify({ sourceIds }),
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Failed to reorder lead sources');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/lead-sources'] });
      toast({
        title: "Success",
        description: "Lead sources reordered successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to reorder lead sources. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Add source form
  const addForm = useForm<InsertLeadSource>({
    resolver: zodResolver(insertLeadSourceSchema),
    defaultValues: {
      name: "",
      isActive: true,
      order: sources.length,
    },
  });

  // Edit source form
  const editForm = useForm<InsertLeadSource>({
    resolver: zodResolver(insertLeadSourceSchema),
    defaultValues: {
      name: "",
      isActive: true,
      order: 0,
    },
  });

  const handleAdd = (data: InsertLeadSource) => {
    createSourceMutation.mutate(data);
  };

  const handleEdit = (data: InsertLeadSource) => {
    if (editingSource) {
      updateSourceMutation.mutate({ id: editingSource.id, data });
    }
  };

  const handleDelete = () => {
    if (deletingSource) {
      deleteSourceMutation.mutate(deletingSource.id);
    }
  };

  const openEditDialog = (source: LeadSource) => {
    setEditingSource(source);
    editForm.reset({
      name: source.name,
      isActive: source.isActive,
      order: source.order,
    });
  };

  const moveSource = (index: number, direction: 'up' | 'down') => {
    const newSources = [...sources];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= newSources.length) return;
    
    [newSources[index], newSources[targetIndex]] = [newSources[targetIndex], newSources[index]];
    
    const sourceIds = newSources.map(s => s.id);
    reorderMutation.mutate(sourceIds);
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Link to="/settings">
            <Button variant="outline" size="sm" data-testid="button-back-to-settings">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Settings
            </Button>
          </Link>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Target className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold" data-testid="text-page-title">Lead Sources</h1>
              <p className="text-muted-foreground" data-testid="text-page-description">
                Manage customizable source options for tracking where leads come from
              </p>
            </div>
          </div>
          <Button 
            onClick={() => setShowAddDialog(true)}
            className="bg-primary hover:bg-primary/90"
            data-testid="button-add-source"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Source
          </Button>
        </div>
      </div>

      {/* Lead Sources List */}
      <Card>
        <CardHeader>
          <CardTitle data-testid="text-card-title">Lead Sources</CardTitle>
          <CardDescription data-testid="text-card-description">
            Configure the source options that appear in the lead creation form
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground" data-testid="text-loading">
              Loading lead sources...
            </div>
          ) : sources.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground" data-testid="text-empty-state">
              No lead sources found. Create one to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead data-testid="text-header-order">Order</TableHead>
                  <TableHead data-testid="text-header-name">Name</TableHead>
                  <TableHead data-testid="text-header-status">Status</TableHead>
                  <TableHead className="text-right" data-testid="text-header-actions">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sources.map((source, index) => (
                  <TableRow key={source.id} data-testid={`row-source-${source.id}`}>
                    <TableCell data-testid={`text-order-${source.id}`}>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => moveSource(index, 'up')}
                          disabled={index === 0}
                          data-testid={`button-move-up-${source.id}`}
                        >
                          <ChevronUp className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => moveSource(index, 'down')}
                          disabled={index === sources.length - 1}
                          data-testid={`button-move-down-${source.id}`}
                        >
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium" data-testid={`text-name-${source.id}`}>
                      {source.name}
                    </TableCell>
                    <TableCell data-testid={`text-status-${source.id}`}>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        source.isActive 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                      }`}>
                        {source.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(source)}
                          data-testid={`button-edit-${source.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeletingSource(source)}
                          data-testid={`button-delete-${source.id}`}
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

      {/* Add Source Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent data-testid="dialog-add-source">
          <DialogHeader>
            <DialogTitle data-testid="text-dialog-title">Add Lead Source</DialogTitle>
            <DialogDescription data-testid="text-dialog-description">
              Create a new source option for tracking lead origins
            </DialogDescription>
          </DialogHeader>
          <Form {...addForm}>
            <form onSubmit={addForm.handleSubmit(handleAdd)} className="space-y-4">
              <FormField
                control={addForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel data-testid="text-label-name">Name</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., Website, Referral, Social Media" 
                        {...field} 
                        data-testid="input-name"
                      />
                    </FormControl>
                    <FormMessage data-testid="text-error-name" />
                  </FormItem>
                )}
              />
              <FormField
                control={addForm.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <FormLabel data-testid="text-label-active">Active</FormLabel>
                      <p className="text-sm text-muted-foreground" data-testid="text-description-active">
                        Make this source available in lead forms
                      </p>
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
                  onClick={() => setShowAddDialog(false)}
                  data-testid="button-cancel-add"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createSourceMutation.isPending}
                  className="bg-primary hover:bg-primary/90"
                  data-testid="button-submit-add"
                >
                  {createSourceMutation.isPending ? "Creating..." : "Create Source"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Source Dialog */}
      <Dialog open={!!editingSource} onOpenChange={(open) => !open && setEditingSource(null)}>
        <DialogContent data-testid="dialog-edit-source">
          <DialogHeader>
            <DialogTitle data-testid="text-dialog-edit-title">Edit Lead Source</DialogTitle>
            <DialogDescription data-testid="text-dialog-edit-description">
              Update the lead source details
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleEdit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel data-testid="text-edit-label-name">Name</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., Website, Referral, Social Media" 
                        {...field} 
                        data-testid="input-edit-name"
                      />
                    </FormControl>
                    <FormMessage data-testid="text-edit-error-name" />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <FormLabel data-testid="text-edit-label-active">Active</FormLabel>
                      <p className="text-sm text-muted-foreground" data-testid="text-edit-description-active">
                        Make this source available in lead forms
                      </p>
                    </div>
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
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setEditingSource(null)}
                  data-testid="button-cancel-edit"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateSourceMutation.isPending}
                  className="bg-primary hover:bg-primary/90"
                  data-testid="button-submit-edit"
                >
                  {updateSourceMutation.isPending ? "Updating..." : "Update Source"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingSource} onOpenChange={(open) => !open && setDeletingSource(null)}>
        <AlertDialogContent data-testid="dialog-delete-source">
          <AlertDialogHeader>
            <AlertDialogTitle data-testid="text-delete-title">Delete Lead Source</AlertDialogTitle>
            <AlertDialogDescription data-testid="text-delete-description">
              Are you sure you want to delete "{deletingSource?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteSourceMutation.isPending}
              className="bg-destructive hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              {deleteSourceMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
