import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { insertLeadNoteTemplateSchema, type LeadNoteTemplate, type InsertLeadNoteTemplate } from "@shared/schema";
import { Plus, Edit, Trash2, GripVertical, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function NoteTemplatesSection() {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<LeadNoteTemplate | null>(null);
  const [deletingTemplate, setDeletingTemplate] = useState<LeadNoteTemplate | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['/api/lead-note-templates'],
    queryFn: async () => {
      const response = await fetch('/api/lead-note-templates');
      if (!response.ok) throw new Error('Failed to fetch note templates');
      return response.json();
    },
  });

  const createTemplateMutation = useMutation({
    mutationFn: async (data: InsertLeadNoteTemplate) => {
      const response = await fetch('/api/lead-note-templates', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Failed to create note template');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/lead-note-templates'] });
      setShowAddDialog(false);
      addForm.reset();
      toast({
        title: "Success",
        variant: "default",
        description: "Note template created successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create note template. Please try again.",
        variant: "destructive",
      });
    }
  });

  const updateTemplateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertLeadNoteTemplate> }) => {
      const response = await fetch(`/api/lead-note-templates/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Failed to update note template');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/lead-note-templates'] });
      setEditingTemplate(null);
      toast({
        title: "Success",
        variant: "default",
        description: "Note template updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update note template. Please try again.",
        variant: "destructive",
      });
    }
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/lead-note-templates/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete note template');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/lead-note-templates'] });
      setDeletingTemplate(null);
      toast({
        title: "Success",
        variant: "default",
        description: "Note template deleted successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete note template. Please try again.",
        variant: "destructive",
      });
    }
  });

  const reorderMutation = useMutation({
    mutationFn: async (templateIds: string[]) => {
      const response = await fetch('/api/lead-note-templates/reorder', {
        method: 'PUT',
        body: JSON.stringify({ templateIds }),
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Failed to reorder note templates');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/lead-note-templates'] });
      toast({
        title: "Success",
        variant: "default",
        description: "Note templates reordered successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to reorder note templates. Please try again.",
        variant: "destructive",
      });
    }
  });

  const addForm = useForm<InsertLeadNoteTemplate>({
    resolver: zodResolver(insertLeadNoteTemplateSchema),
    defaultValues: {
      name: "",
      content: "",
      isActive: true,
      order: templates.length,
    },
  });

  const editForm = useForm<InsertLeadNoteTemplate>({
    resolver: zodResolver(insertLeadNoteTemplateSchema),
    defaultValues: {
      name: "",
      content: "",
      isActive: true,
      order: 0,
    },
  });

  const handleAdd = (data: InsertLeadNoteTemplate) => {
    createTemplateMutation.mutate(data);
  };

  const handleEdit = (data: InsertLeadNoteTemplate) => {
    if (editingTemplate) {
      updateTemplateMutation.mutate({ id: editingTemplate.id, data });
    }
  };

  const handleDelete = () => {
    if (deletingTemplate) {
      deleteTemplateMutation.mutate(deletingTemplate.id);
    }
  };

  const openEditDialog = (template: LeadNoteTemplate) => {
    setEditingTemplate(template);
    editForm.reset({
      name: template.name,
      content: template.content,
      isActive: template.isActive ?? true,
      order: template.order,
    });
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    if (result.source.index === result.destination.index) return;

    const items = Array.from(templates);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const templateIds = items.map((t: LeadNoteTemplate) => t.id);
    reorderMutation.mutate(templateIds);
  };

  return (
    <>
      <Card className="mt-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="h-6 w-6 text-primary" />
              <div>
                <CardTitle data-testid="text-note-templates-title">Note Templates</CardTitle>
                <CardDescription data-testid="text-note-templates-description">
                  Pre-built note templates for sales reps to use when adding notes to leads
                </CardDescription>
              </div>
            </div>
            <Button 
              onClick={() => setShowAddDialog(true)}
              className="bg-primary hover:bg-primary/90"
              data-testid="button-add-template"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Template
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground" data-testid="text-loading-templates">
              Loading note templates...
            </div>
          ) : templates.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground" data-testid="text-empty-templates">
              No note templates found. Create one to help your sales team save time.
            </div>
          ) : (
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="note-templates">
                {(provided) => (
                  <div 
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="space-y-2"
                  >
                    {templates.map((template: LeadNoteTemplate, index: number) => (
                      <Draggable 
                        key={template.id} 
                        draggableId={template.id} 
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`flex items-center justify-between p-3 border rounded-lg transition-colors ${
                              snapshot.isDragging 
                                ? 'bg-primary/10 border-primary shadow-lg' 
                                : 'bg-muted/30 hover:bg-muted/50'
                            }`}
                            data-testid={`row-template-${template.id}`}
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div 
                                {...provided.dragHandleProps}
                                className="cursor-move text-muted-foreground hover:text-foreground flex-shrink-0"
                              >
                                <GripVertical className="h-4 w-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium" data-testid={`text-template-name-${template.id}`}>
                                  {template.name}
                                </div>
                                <div className="text-sm text-muted-foreground truncate" data-testid={`text-template-preview-${template.id}`}>
                                  {template.content.substring(0, 80)}{template.content.length > 80 ? '...' : ''}
                                </div>
                              </div>
                              <span 
                                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
                                  template.isActive 
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                                    : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                                }`}
                                data-testid={`text-template-status-${template.id}`}
                              >
                                {template.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEditDialog(template)}
                                data-testid={`button-edit-template-${template.id}`}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setDeletingTemplate(template)}
                                data-testid={`button-delete-template-${template.id}`}
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
          )}
        </CardContent>
      </Card>

      {/* Add Template Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl" data-testid="dialog-add-template">
          <DialogHeader>
            <DialogTitle data-testid="text-dialog-add-template-title">Add Note Template</DialogTitle>
            <DialogDescription data-testid="text-dialog-add-template-description">
              Create a pre-built note template for your sales team to use when adding notes to leads
            </DialogDescription>
          </DialogHeader>
          <Form {...addForm}>
            <form onSubmit={addForm.handleSubmit(handleAdd)} className="space-y-4">
              <FormField
                control={addForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel data-testid="text-label-template-name">Template Name</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., Discovery Call, Follow-Up, Proposal Review" 
                        {...field} 
                        data-testid="input-template-name"
                      />
                    </FormControl>
                    <FormMessage data-testid="text-error-template-name" />
                  </FormItem>
                )}
              />
              <FormField
                control={addForm.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel data-testid="text-label-template-content">Template Content</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter the template content that will be pre-filled when this template is selected..."
                        rows={10}
                        {...field} 
                        data-testid="input-template-content"
                      />
                    </FormControl>
                    <FormMessage data-testid="text-error-template-content" />
                  </FormItem>
                )}
              />
              <FormField
                control={addForm.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <FormLabel data-testid="text-label-template-active">Active</FormLabel>
                      <p className="text-sm text-muted-foreground" data-testid="text-description-template-active">
                        Make this template available for use
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="switch-template-active"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setShowAddDialog(false);
                    addForm.reset();
                  }}
                  data-testid="button-cancel-add-template"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createTemplateMutation.isPending}
                  className="bg-primary hover:bg-primary/90"
                  data-testid="button-submit-add-template"
                >
                  {createTemplateMutation.isPending ? "Creating..." : "Create Template"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Template Dialog */}
      <Dialog open={!!editingTemplate} onOpenChange={(open) => !open && setEditingTemplate(null)}>
        <DialogContent className="max-w-2xl" data-testid="dialog-edit-template">
          <DialogHeader>
            <DialogTitle data-testid="text-dialog-edit-template-title">Edit Note Template</DialogTitle>
            <DialogDescription data-testid="text-dialog-edit-template-description">
              Update the note template details
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleEdit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel data-testid="text-edit-label-template-name">Template Name</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., Discovery Call, Follow-Up, Proposal Review" 
                        {...field} 
                        data-testid="input-edit-template-name"
                      />
                    </FormControl>
                    <FormMessage data-testid="text-edit-error-template-name" />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel data-testid="text-edit-label-template-content">Template Content</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter the template content..."
                        rows={10}
                        {...field} 
                        data-testid="input-edit-template-content"
                      />
                    </FormControl>
                    <FormMessage data-testid="text-edit-error-template-content" />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <FormLabel data-testid="text-edit-label-template-active">Active</FormLabel>
                      <p className="text-sm text-muted-foreground" data-testid="text-edit-description-template-active">
                        Make this template available for use
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="switch-edit-template-active"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setEditingTemplate(null)}
                  data-testid="button-cancel-edit-template"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateTemplateMutation.isPending}
                  className="bg-primary hover:bg-primary/90"
                  data-testid="button-submit-edit-template"
                >
                  {updateTemplateMutation.isPending ? "Updating..." : "Update Template"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingTemplate} onOpenChange={(open) => !open && setDeletingTemplate(null)}>
        <AlertDialogContent data-testid="dialog-delete-template">
          <AlertDialogHeader>
            <AlertDialogTitle data-testid="text-delete-template-title">Delete Note Template</AlertDialogTitle>
            <AlertDialogDescription data-testid="text-delete-template-description">
              Are you sure you want to delete "{deletingTemplate?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-template">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteTemplateMutation.isPending}
              className="bg-destructive hover:bg-destructive/90"
              data-testid="button-confirm-delete-template"
            >
              {deleteTemplateMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
