import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
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
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertTagSchema, type Tag, type InsertTag } from "@shared/schema";
import { Link } from "wouter";
import { ArrowLeft, Tag as TagIcon, Edit, Trash2, Plus, Search, Pencil, ChevronUp, ChevronDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

type SortField = 'name' | 'createdAt' | 'updatedAt';
type SortOrder = 'asc' | 'desc';

export default function TagsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [deletingTag, setDeletingTag] = useState<Tag | null>(null);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Handle sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Fetch tags
  const { data: tags = [], isLoading } = useQuery({
    queryKey: ['/api/tags'],
    queryFn: async () => {
      const response = await fetch('/api/tags');
      if (!response.ok) throw new Error('Failed to fetch tags');
      return response.json();
    },
  });

  // Create tag mutation
  const createTagMutation = useMutation({
    mutationFn: async (data: InsertTag) => {
      const response = await fetch('/api/tags', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Failed to create tag');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tags'] });
      setShowAddDialog(false);
      toast({
        title: "Success",
        description: "Tag created successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create tag. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Update tag mutation
  const updateTagMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertTag> }) => {
      const response = await fetch(`/api/tags/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Failed to update tag');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tags'] });
      setEditingTag(null);
      toast({
        title: "Success",
        description: "Tag updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update tag. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Delete tag mutation
  const deleteTagMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/tags/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete tag');
      // 204 No Content response has no body, so don't try to parse JSON
      return null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tags'] });
      setDeletingTag(null);
      toast({
        title: "Success",
        description: "Tag deleted successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete tag. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Add tag form
  const addForm = useForm<InsertTag>({
    resolver: zodResolver(insertTagSchema),
    defaultValues: {
      name: "",
      color: "#00C9C6",
      description: "",
    },
  });

  // Edit tag form  
  const editForm = useForm<InsertTag>({
    resolver: zodResolver(insertTagSchema),
    defaultValues: {
      name: "",
      color: "#00C9C6",
      description: "",
    },
  });

  // Update edit form when editing tag changes
  useEffect(() => {
    if (editingTag) {
      editForm.reset({
        name: editingTag.name,
        color: editingTag.color || "#00C9C6",
        description: editingTag.description || "",
      });
    }
  }, [editingTag, editForm]);

  // Handle form submissions
  const handleAddSubmit = (data: InsertTag) => {
    createTagMutation.mutate(data);
  };

  const handleEditSubmit = (data: InsertTag) => {
    if (editingTag) {
      updateTagMutation.mutate({ id: editingTag.id, data });
    }
  };

  // Handle add dialog close
  const handleAddDialogClose = (open: boolean) => {
    setShowAddDialog(open);
    if (!open) {
      addForm.reset();
    }
  };

  // Handle edit dialog close
  const handleEditDialogClose = (open: boolean) => {
    if (!open) {
      setEditingTag(null);
      editForm.reset();
    }
  };

  // Filter and sort tags
  const filteredTags = tags.filter((tag: Tag) =>
    tag.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (tag.description && tag.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const sortedTags = [...filteredTags].sort((a, b) => {
    let aValue = '';
    let bValue = '';

    switch (sortField) {
      case 'name':
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
      case 'createdAt':
        aValue = a.createdAt ? new Date(a.createdAt).toISOString() : '';
        bValue = b.createdAt ? new Date(b.createdAt).toISOString() : '';
        break;
      case 'updatedAt':
        aValue = a.updatedAt ? new Date(a.updatedAt).toISOString() : '';
        bValue = b.updatedAt ? new Date(b.updatedAt).toISOString() : '';
        break;
    }

    if (sortOrder === 'asc') {
      return aValue.localeCompare(bValue);
    } else {
      return bValue.localeCompare(aValue);
    }
  });

  const SortableHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <TableHead 
      className="cursor-pointer hover:bg-muted/50 transition-colors"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center justify-between">
        {children}
        <div className="flex flex-col ml-2">
          <ChevronUp 
            className={`h-3 w-3 ${
              sortField === field && sortOrder === 'asc' 
                ? 'text-primary' 
                : 'text-muted-foreground/40'
            }`} 
          />
          <ChevronDown 
            className={`h-3 w-3 -mt-1 ${
              sortField === field && sortOrder === 'desc' 
                ? 'text-primary' 
                : 'text-muted-foreground/40'
            }`} 
          />
        </div>
      </div>
    </TableHead>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading tags...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back to Settings */}
      <div className="mb-4">
        <Link href="/settings">
          <Button variant="outline" size="sm" className="flex items-center space-x-2">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Settings</span>
          </Button>
        </Link>
      </div>

      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <TagIcon className="h-6 w-6 text-primary" />
          <h2 className="text-3xl font-bold tracking-tight">Tags</h2>
        </div>
        <p className="text-muted-foreground">
          Organize and categorize your clients with custom tags
        </p>
      </div>

      {/* Add Tag Button */}
      <div className="flex justify-end">
        <Dialog open={showAddDialog} onOpenChange={handleAddDialogClose}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              Add Tag
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Tag</DialogTitle>
              <DialogDescription>
                Create a new tag to organize your clients.
              </DialogDescription>
            </DialogHeader>
            <Form {...addForm}>
              <form onSubmit={addForm.handleSubmit(handleAddSubmit)} className="space-y-4">
                <FormField
                  control={addForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tag Name *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter tag name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={addForm.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Color</FormLabel>
                      <FormControl>
                        <div className="flex items-center space-x-2">
                          <Input
                            type="color"
                            {...field}
                            value={field.value || "#00C9C6"}
                            className="w-12 h-10 p-1 border rounded cursor-pointer"
                          />
                          <Input
                            {...field}
                            value={field.value || "#00C9C6"}
                            placeholder="#00C9C6"
                            className="flex-1"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={addForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field}
                          value={field.value || ""}
                          placeholder="Optional description for this tag"
                          rows={3}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => handleAddDialogClose(false)}>
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createTagMutation.isPending}
                    className="bg-primary hover:bg-primary/90"
                  >
                    {createTagMutation.isPending ? "Creating..." : "Create Tag"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tags Table */}
      <Card>
        <CardHeader>
          <CardTitle>Tag Directory</CardTitle>
          <CardDescription>
            Search and manage all tags for client organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableHeader field="name">Tag</SortableHeader>
                  <SortableHeader field="createdAt">Created On</SortableHeader>
                  <SortableHeader field="updatedAt">Updated On</SortableHeader>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedTags.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-6">
                      <div className="flex flex-col items-center space-y-2">
                        <TagIcon className="h-8 w-8 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          {searchQuery ? "No tags found matching your search." : "No tags created yet"}
                        </p>
                        {!searchQuery && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowAddDialog(true)}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add First Tag
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedTags.map((tag: Tag) => (
                    <TableRow key={tag.id}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-4 h-4 rounded-full border" 
                            style={{ backgroundColor: tag.color || "#00C9C6" }}
                          />
                          <div>
                            <div className="font-medium">{tag.name}</div>
                            {tag.description && (
                              <div className="text-sm text-muted-foreground mt-1">
                                {tag.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {tag.createdAt ? format(new Date(tag.createdAt), "MMM d, yyyy 'at' h:mm a") : "N/A"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {tag.updatedAt ? format(new Date(tag.updatedAt), "MMM d, yyyy 'at' h:mm a") : "N/A"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingTag(tag)}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeletingTag(tag)}
                            className="text-muted-foreground hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Tag Dialog */}
      <Dialog open={!!editingTag} onOpenChange={handleEditDialogClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Tag</DialogTitle>
            <DialogDescription>
              Update the tag information.
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tag Name *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter tag name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Color</FormLabel>
                    <FormControl>
                      <div className="flex items-center space-x-2">
                        <Input
                          type="color"
                          {...field}
                          value={field.value || "#00C9C6"}
                          className="w-12 h-10 p-1 border rounded cursor-pointer"
                        />
                        <Input
                          {...field}
                          value={field.value || "#00C9C6"}
                          placeholder="#00C9C6"
                          className="flex-1"
                        />
                      </div>
                    </FormControl>
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
                        {...field}
                        value={field.value || ""}
                        placeholder="Optional description for this tag"
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => handleEditDialogClose(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateTagMutation.isPending}
                  className="bg-primary hover:bg-primary/90"
                >
                  {updateTagMutation.isPending ? "Updating..." : "Update Tag"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingTag} onOpenChange={() => setDeletingTag(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Tag</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the tag "{deletingTag?.name}"? 
              This action cannot be undone and will remove this tag from all clients.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingTag) {
                  deleteTagMutation.mutate(deletingTag.id);
                }
              }}
              disabled={deleteTagMutation.isPending}
              className="bg-red-600 hover:bg-red-600/90"
            >
              {deleteTagMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}