import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Settings, Zap, AlertTriangle } from "lucide-react";

interface AutomationTrigger {
  id: string;
  name: string;
  type: string;
  description: string | null;
  category: string;
  configSchema: any;
  isActive: boolean;
  createdAt: string;
}

export default function AutomationTriggers() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTrigger, setEditingTrigger] = useState<AutomationTrigger | null>(null);
  const [deletingTrigger, setDeletingTrigger] = useState<AutomationTrigger | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    type: "",
    description: "",
    category: "contact_management",
    configSchema: {},
    isActive: true
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch automation triggers
  const { data: triggers = [], isLoading } = useQuery<AutomationTrigger[]>({
    queryKey: ["/api/automation-triggers"],
  });

  // Create trigger mutation
  const createTriggerMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/automation-triggers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create trigger");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/automation-triggers"] });
      setIsCreateDialogOpen(false);
      resetForm();
      toast({
        title: "Success",
        description: "Automation trigger created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create trigger",
        variant: "destructive",
      });
    },
  });

  // Update trigger mutation
  const updateTriggerMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await fetch(`/api/automation-triggers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update trigger");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/automation-triggers"] });
      setEditingTrigger(null);
      resetForm();
      toast({
        title: "Success",
        description: "Automation trigger updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update trigger",
        variant: "destructive",
      });
    },
  });

  // Delete trigger mutation
  const deleteTriggerMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/automation-triggers/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete trigger");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/automation-triggers"] });
      setDeletingTrigger(null);
      toast({
        title: "Success",
        description: "Automation trigger deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete trigger",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      type: "",
      description: "",
      category: "contact_management",
      configSchema: {},
      isActive: true
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTrigger) {
      updateTriggerMutation.mutate({ id: editingTrigger.id, data: formData });
    } else {
      createTriggerMutation.mutate(formData);
    }
  };

  const openEditDialog = (trigger: AutomationTrigger) => {
    setEditingTrigger(trigger);
    setFormData({
      name: trigger.name,
      type: trigger.type,
      description: trigger.description || "",
      category: trigger.category,
      configSchema: trigger.configSchema || {},
      isActive: trigger.isActive
    });
    setIsCreateDialogOpen(true);
  };

  const toggleTriggerStatus = (trigger: AutomationTrigger) => {
    updateTriggerMutation.mutate({
      id: trigger.id,
      data: { isActive: !trigger.isActive }
    });
  };

  const getCategoryBadgeColor = (category: string) => {
    const colors: { [key: string]: string } = {
      contact_management: "bg-blue-100 text-blue-800",
      form_management: "bg-green-100 text-green-800",
      email_marketing: "bg-purple-100 text-purple-800",
      task_automation: "bg-orange-100 text-orange-800",
      time_based: "bg-cyan-100 text-cyan-800"
    };
    return colors[category] || "bg-gray-100 text-gray-800";
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Automation Triggers</h1>
          <p className="text-muted-foreground">
            Manage available trigger definitions for workflow automation
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} data-testid="button-create-trigger">
          <Plus className="h-4 w-4 mr-2" />
          Create Trigger
        </Button>
      </div>

      <div className="grid gap-4">
        {triggers.map((trigger) => (
          <Card key={trigger.id} className="relative" data-testid={`card-trigger-${trigger.id}`}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-blue-600" />
                    {trigger.name}
                    <Badge 
                      className={getCategoryBadgeColor(trigger.category)}
                      data-testid={`badge-category-${trigger.category}`}
                    >
                      {trigger.category.replace(/_/g, ' ')}
                    </Badge>
                  </CardTitle>
                  <CardDescription className="text-sm text-gray-600 mt-1">
                    Type: <code className="bg-gray-100 px-1 rounded text-xs">{trigger.type}</code>
                    {trigger.description && (
                      <span className="block mt-1">{trigger.description}</span>
                    )}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={trigger.isActive}
                    onCheckedChange={() => toggleTriggerStatus(trigger)}
                    data-testid={`switch-active-${trigger.id}`}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(trigger)}
                    data-testid={`button-edit-${trigger.id}`}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeletingTrigger(trigger)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    data-testid={`button-delete-${trigger.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            {trigger.configSchema && Object.keys(trigger.configSchema).length > 0 && (
              <CardContent className="pt-0">
                <div className="bg-gray-50 rounded p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Settings className="h-4 w-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">Configuration Schema</span>
                  </div>
                  <pre className="text-xs text-gray-600 overflow-x-auto">
                    {JSON.stringify(trigger.configSchema, null, 2)}
                  </pre>
                </div>
              </CardContent>
            )}
          </Card>
        ))}

        {triggers.length === 0 && (
          <Card className="text-center py-8">
            <CardContent>
              <Zap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No triggers found</h3>
              <p className="text-gray-600 mb-4">Get started by creating your first automation trigger.</p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Trigger
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-md" data-testid="dialog-trigger-form">
          <DialogHeader>
            <DialogTitle>
              {editingTrigger ? "Edit Trigger" : "Create New Trigger"}
            </DialogTitle>
            <DialogDescription>
              {editingTrigger ? "Update the trigger definition" : "Define a new automation trigger"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., New Contact Created"
                required
                data-testid="input-trigger-name"
              />
            </div>
            <div>
              <Label htmlFor="type">Type</Label>
              <Input
                id="type"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                placeholder="e.g., contact_created"
                required
                data-testid="input-trigger-type"
              />
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger data-testid="select-trigger-category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="contact_management">Contact Management</SelectItem>
                  <SelectItem value="form_management">Form Management</SelectItem>
                  <SelectItem value="email_marketing">Email Marketing</SelectItem>
                  <SelectItem value="task_automation">Task Automation</SelectItem>
                  <SelectItem value="time_based">Time Based</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe when this trigger should fire..."
                data-testid="textarea-trigger-description"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                data-testid="switch-trigger-active"
              />
              <Label htmlFor="isActive">Active</Label>
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsCreateDialogOpen(false);
                  setEditingTrigger(null);
                  resetForm();
                }}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createTriggerMutation.isPending || updateTriggerMutation.isPending}
                data-testid="button-save-trigger"
              >
                {editingTrigger ? "Update" : "Create"} Trigger
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingTrigger} onOpenChange={() => setDeletingTrigger(null)}>
        <AlertDialogContent data-testid="dialog-delete-confirmation">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Delete Automation Trigger
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the trigger "{deletingTrigger?.name}"? 
              This action cannot be undone and may affect existing workflows.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingTrigger && deleteTriggerMutation.mutate(deletingTrigger.id)}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteTriggerMutation.isPending}
              data-testid="button-confirm-delete"
            >
              Delete Trigger
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}