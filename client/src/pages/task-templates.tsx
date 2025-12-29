import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Trash2, FileText, Clock, ArrowLeft, AlertCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { TaskTemplate, TaskCategory } from "@shared/schema";
import { format } from "date-fns";

export default function TaskTemplatesPage() {
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TaskTemplate | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    priority: "medium",
    estimatedDuration: "",
    instructions: "",
    categoryId: "__none__"
  });

  const { data: templates = [], isLoading } = useQuery<TaskTemplate[]>({
    queryKey: ["/api/task-templates"],
  });

  const { data: categories = [] } = useQuery<TaskCategory[]>({
    queryKey: ["/api/task-categories"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/task-templates", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/task-templates"] });
      toast({ title: "Template created", description: "Task template created successfully", variant: "success" });
      resetForm();
      setIsCreateOpen(false);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create template", variant: "destructive" });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return apiRequest("PUT", `/api/task-templates/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/task-templates"] });
      toast({ title: "Template updated", description: "Task template updated successfully", variant: "success" });
      resetForm();
      setEditingTemplate(null);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update template", variant: "destructive" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/task-templates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/task-templates"] });
      toast({ title: "Template deleted", description: "Task template deleted successfully", variant: "success" });
      setDeleteConfirmId(null);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete template", variant: "destructive" });
    }
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      priority: "medium",
      estimatedDuration: "",
      instructions: "",
      categoryId: "__none__"
    });
  };

  const handleCreate = () => {
    resetForm();
    setIsCreateOpen(true);
  };

  const handleEdit = (template: TaskTemplate) => {
    setFormData({
      name: template.name,
      description: template.description || "",
      priority: template.priority || "medium",
      estimatedDuration: template.estimatedDuration?.toString() || "",
      instructions: template.instructions || "",
      categoryId: template.categoryId || "__none__"
    });
    setEditingTemplate(template);
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast({ title: "Error", description: "Template name is required", variant: "destructive" });
      return;
    }

    const payload = {
      name: formData.name.trim(),
      description: formData.description.trim() || null,
      priority: formData.priority,
      estimatedDuration: formData.estimatedDuration ? parseInt(formData.estimatedDuration) : null,
      instructions: formData.instructions.trim() || null,
      categoryId: formData.categoryId === "__none__" ? null : formData.categoryId
    };

    if (editingTemplate) {
      updateMutation.mutate({ id: editingTemplate.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return "-";
    const category = categories.find((c) => c.id === categoryId);
    return category?.name || "-";
  };

  const getPriorityColor = (priority: string | null) => {
    switch (priority) {
      case "urgent": return "bg-red-100 text-red-800";
      case "high": return "bg-orange-100 text-orange-800";
      case "medium": return "bg-yellow-100 text-yellow-800";
      case "low": return "bg-green-100 text-green-800";
      default: return "bg-slate-100 text-slate-800";
    }
  };

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return "-";
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/tasks">
            <Button variant="ghost" size="sm" data-testid="button-back-to-tasks">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Tasks
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Task Templates</h1>
            <p className="text-sm text-slate-500">
              Create and manage reusable task templates to speed up task creation.
            </p>
          </div>
        </div>
        <Button onClick={handleCreate} data-testid="button-create-template">
          <Plus className="h-4 w-4 mr-2" />
          New Template
        </Button>
      </div>

      {templates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <FileText className="h-16 w-16 text-slate-300 mb-4" />
            <h3 className="font-medium text-slate-900 text-lg mb-2">No templates yet</h3>
            <p className="text-sm text-slate-500 mb-6 max-w-md">
              Create your first task template to streamline recurring workflows. Templates save time by pre-filling task details.
            </p>
            <Button onClick={handleCreate} data-testid="button-create-template-empty">
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Template
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All Templates</CardTitle>
            <CardDescription>
              {templates.length} template{templates.length !== 1 ? "s" : ""} available
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((template) => (
                  <TableRow key={template.id} data-testid={`row-template-${template.id}`}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{template.name}</div>
                        {template.description && (
                          <div className="text-sm text-slate-500 truncate max-w-xs">
                            {template.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getCategoryName(template.categoryId)}</TableCell>
                    <TableCell>
                      <Badge className={getPriorityColor(template.priority)}>
                        {template.priority || "medium"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-slate-600">
                        <Clock className="h-3 w-3" />
                        {formatDuration(template.estimatedDuration)}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-slate-500">
                      {template.createdAt ? format(new Date(template.createdAt), "MMM d, yyyy") : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(template)}
                          data-testid={`button-edit-template-${template.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteConfirmId(template.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          data-testid={`button-delete-template-${template.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Template Dialog */}
      <Dialog open={isCreateOpen || !!editingTemplate} onOpenChange={(open) => {
        if (!open) {
          setIsCreateOpen(false);
          setEditingTemplate(null);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? "Edit Template" : "Create Template"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Template Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Weekly Report"
                data-testid="input-template-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of this template"
                rows={2}
                data-testid="input-template-description"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData({ ...formData, priority: value })}
                >
                  <SelectTrigger data-testid="select-template-priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={formData.categoryId}
                  onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
                >
                  <SelectTrigger data-testid="select-template-category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">No category</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="estimatedDuration">Estimated Duration (minutes)</Label>
              <Input
                id="estimatedDuration"
                type="number"
                value={formData.estimatedDuration}
                onChange={(e) => setFormData({ ...formData, estimatedDuration: e.target.value })}
                placeholder="e.g., 60"
                min="1"
                data-testid="input-template-duration"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="instructions">Instructions</Label>
              <Textarea
                id="instructions"
                value={formData.instructions}
                onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                placeholder="Step-by-step instructions for completing this task"
                rows={3}
                data-testid="input-template-instructions"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateOpen(false);
                setEditingTemplate(null);
                resetForm();
              }}
              data-testid="button-cancel-template"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
              data-testid="button-save-template"
            >
              {(createMutation.isPending || updateMutation.isPending) ? "Saving..." : "Save Template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Delete Template
            </DialogTitle>
          </DialogHeader>
          <p className="text-slate-600">
            Are you sure you want to delete this template? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)} data-testid="button-cancel-delete-template">
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirmId && deleteMutation.mutate(deleteConfirmId)}
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete-template"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
