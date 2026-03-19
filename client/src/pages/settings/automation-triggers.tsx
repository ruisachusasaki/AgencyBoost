import { useState, useEffect } from "react";
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
import { Plus, Edit, Trash2, Settings, Zap, AlertTriangle, RefreshCw, ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "wouter";

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

interface AutomationAction {
  id: string;
  name: string;
  type: string;
  description: string | null;
  category: string;
  configSchema: any;
  isActive: boolean;
  createdAt: string;
}

const ITEMS_PER_PAGE = 10;

export default function AutomationTriggers() {
  const [activeTab, setActiveTab] = useState("triggers");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTrigger, setEditingTrigger] = useState<AutomationTrigger | null>(null);
  const [deletingTrigger, setDeletingTrigger] = useState<AutomationTrigger | null>(null);
  const [editingAction, setEditingAction] = useState<AutomationAction | null>(null);
  const [deletingAction, setDeletingAction] = useState<AutomationAction | null>(null);
  const [triggersPage, setTriggersPage] = useState(1);
  const [actionsPage, setActionsPage] = useState(1);
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

  // Fetch automation actions
  const { data: actions = [], isLoading: isLoadingActions } = useQuery<AutomationAction[]>({
    queryKey: ["/api/automation-actions"],
  });

  // Clamp pagination when data changes
  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(triggers.length / ITEMS_PER_PAGE));
    if (triggersPage > maxPage) {
      setTriggersPage(maxPage);
    }
  }, [triggers.length, triggersPage]);

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(actions.length / ITEMS_PER_PAGE));
    if (actionsPage > maxPage) {
      setActionsPage(maxPage);
    }
  }, [actions.length, actionsPage]);

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
        variant: "default",
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
        variant: "default",
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
        variant: "default",
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

  // Create action mutation
  const createActionMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/automation-actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create action");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/automation-actions"] });
      setIsCreateDialogOpen(false);
      resetForm();
      toast({
        title: "Success",
        variant: "default",
        description: "Automation action created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create action",
        variant: "destructive",
      });
    },
  });

  // Update action mutation
  const updateActionMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await fetch(`/api/automation-actions/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update action");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/automation-actions"] });
      setEditingAction(null);
      resetForm();
      toast({
        title: "Success",
        variant: "default",
        description: "Automation action updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update action",
        variant: "destructive",
      });
    },
  });

  // Delete action mutation
  const deleteActionMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/automation-actions/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete action");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/automation-actions"] });
      setDeletingAction(null);
      toast({
        title: "Success",
        variant: "default",
        description: "Automation action deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete action",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      type: "",
      description: "",
      category: activeTab === "triggers" ? "contact_management" : "communication",
      configSchema: {},
      isActive: true
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === "triggers") {
      if (editingTrigger) {
        updateTriggerMutation.mutate({ id: editingTrigger.id, data: formData });
      } else {
        createTriggerMutation.mutate(formData);
      }
    } else {
      if (editingAction) {
        updateActionMutation.mutate({ id: editingAction.id, data: formData });
      } else {
        createActionMutation.mutate(formData);
      }
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

  const openEditActionDialog = (action: AutomationAction) => {
    setEditingAction(action);
    setFormData({
      name: action.name,
      type: action.type,
      description: action.description || "",
      category: action.category,
      configSchema: action.configSchema || {},
      isActive: action.isActive
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
      project_management: "bg-indigo-100 text-indigo-800", 
      task_management: "bg-orange-100 text-orange-800",
      lead_management: "bg-yellow-100 text-yellow-800",
      campaign_management: "bg-purple-100 text-purple-800",
      financial_management: "bg-emerald-100 text-emerald-800",
      email_marketing: "bg-pink-100 text-pink-800",
      time_based: "bg-cyan-100 text-cyan-800",
      "Sales": "bg-emerald-100 text-emerald-800",
      "Client Management": "bg-teal-100 text-teal-800",
    };
    return colors[category] || "bg-gray-100 text-gray-800";
  };

  if (isLoading || isLoadingActions) {
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
          <Zap className="h-6 w-6 text-primary" />
          <h2 className="text-3xl font-bold tracking-tight">Automation Management</h2>
        </div>
        <p className="text-muted-foreground">
          Manage triggers and actions for workflow automation
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: "triggers", name: "Triggers", icon: Zap, count: triggers.length },
            { id: "actions", name: "Actions", icon: Settings, count: actions.length }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.name} ({tab.count})
              </button>
            );
          })}
        </nav>
      </div>
        
        {/* Triggers Tab */}
        {activeTab === "triggers" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Automation Triggers</h2>
              <p className="text-sm text-gray-600">Define events that start automated workflows</p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/automation-triggers"] })} 
                data-testid="button-refresh-triggers"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button 
                onClick={() => {
                  setActiveTab("triggers");
                  resetForm();
                  setIsCreateDialogOpen(true);
                }} 
                data-testid="button-create-trigger"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Trigger
              </Button>
            </div>
          </div>

          <div className="grid gap-4">
            {triggers
              .slice((triggersPage - 1) * ITEMS_PER_PAGE, triggersPage * ITEMS_PER_PAGE)
              .map((trigger) => (
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

          {/* Triggers Pagination */}
          {triggers.length > ITEMS_PER_PAGE && (
            <div className="flex items-center justify-between border-t pt-4">
              <p className="text-sm text-muted-foreground">
                Showing {((triggersPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(triggersPage * ITEMS_PER_PAGE, triggers.length)} of {triggers.length} triggers
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setTriggersPage(p => Math.max(1, p - 1))}
                  disabled={triggersPage === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <span className="text-sm px-2">
                  Page {triggersPage} of {Math.ceil(triggers.length / ITEMS_PER_PAGE)}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setTriggersPage(p => Math.min(Math.ceil(triggers.length / ITEMS_PER_PAGE), p + 1))}
                  disabled={triggersPage >= Math.ceil(triggers.length / ITEMS_PER_PAGE)}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
        )}

        {/* Actions Tab */}
        {activeTab === "actions" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Automation Actions</h2>
              <p className="text-sm text-gray-600">Define actions that can be executed in workflows</p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/automation-actions"] })} 
                data-testid="button-refresh-actions"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button 
                onClick={() => {
                  setActiveTab("actions");
                  resetForm();
                  setIsCreateDialogOpen(true);
                }} 
                data-testid="button-create-action"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Action
              </Button>
            </div>
          </div>

          <div className="grid gap-4">
            {actions
              .slice((actionsPage - 1) * ITEMS_PER_PAGE, actionsPage * ITEMS_PER_PAGE)
              .map((action) => (
              <Card key={action.id} className="relative" data-testid={`card-action-${action.id}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5 text-green-600" />
                        {action.name}
                        <Badge 
                          className={getCategoryBadgeColor(action.category)}
                          data-testid={`badge-category-${action.category}`}
                        >
                          {action.category.replace(/_/g, ' ')}
                        </Badge>
                      </CardTitle>
                      <CardDescription className="text-sm text-gray-600 mt-1">
                        Type: <code className="bg-gray-100 px-1 rounded text-xs">{action.type}</code>
                        {action.description && (
                          <span className="block mt-1">{action.description}</span>
                        )}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={action.isActive}
                        onCheckedChange={() => updateActionMutation.mutate({
                          id: action.id,
                          data: { isActive: !action.isActive }
                        })}
                        data-testid={`switch-active-${action.id}`}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditActionDialog(action)}
                        data-testid={`button-edit-${action.id}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeletingAction(action)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        data-testid={`button-delete-${action.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}

            {actions.length === 0 && (
              <Card className="text-center py-8">
                <CardContent>
                  <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No actions found</h3>
                  <p className="text-gray-600 mb-4">Get started by creating your first automation action.</p>
                  <Button onClick={() => {
                    setActiveTab("actions");
                    resetForm();
                    setIsCreateDialogOpen(true);
                  }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Action
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Actions Pagination */}
          {actions.length > ITEMS_PER_PAGE && (
            <div className="flex items-center justify-between border-t pt-4">
              <p className="text-sm text-muted-foreground">
                Showing {((actionsPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(actionsPage * ITEMS_PER_PAGE, actions.length)} of {actions.length} actions
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActionsPage(p => Math.max(1, p - 1))}
                  disabled={actionsPage === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <span className="text-sm px-2">
                  Page {actionsPage} of {Math.ceil(actions.length / ITEMS_PER_PAGE)}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActionsPage(p => Math.min(Math.ceil(actions.length / ITEMS_PER_PAGE), p + 1))}
                  disabled={actionsPage >= Math.ceil(actions.length / ITEMS_PER_PAGE)}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
        )}

      {/* Create/Edit Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-md" data-testid="dialog-trigger-form">
          <DialogHeader>
            <DialogTitle>
              {activeTab === "triggers" ? 
                (editingTrigger ? "Edit Trigger" : "Create New Trigger") :
                (editingAction ? "Edit Action" : "Create New Action")
              }
            </DialogTitle>
            <DialogDescription>
              {activeTab === "triggers" ? 
                (editingTrigger ? "Update the trigger definition" : "Define a new automation trigger") :
                (editingAction ? "Update the action definition" : "Define a new automation action")
              }
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
                  {activeTab === "triggers" ? (
                    <>
                      <SelectItem value="contact_management">Contact Management</SelectItem>
                      <SelectItem value="form_management">Form Management</SelectItem>
                      <SelectItem value="project_management">Project Management</SelectItem>
                      <SelectItem value="task_management">Task Management</SelectItem>
                      <SelectItem value="lead_management">Lead Management</SelectItem>
                      <SelectItem value="campaign_management">Campaign Management</SelectItem>
                      <SelectItem value="financial_management">Financial Management</SelectItem>
                      <SelectItem value="email_marketing">Email Marketing</SelectItem>
                      <SelectItem value="time_based">Time Based</SelectItem>
                      <SelectItem value="Sales">Sales</SelectItem>
                      <SelectItem value="Client Management">Client Management</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="communication">Communication</SelectItem>
                      <SelectItem value="data_management">Data Management</SelectItem>
                      <SelectItem value="assignment">Assignment</SelectItem>
                      <SelectItem value="status_progress">Status & Progress</SelectItem>
                      <SelectItem value="financial_billing">Financial & Billing</SelectItem>
                      <SelectItem value="calendar_scheduling">Calendar & Scheduling</SelectItem>
                      <SelectItem value="knowledge_training">Knowledge & Training</SelectItem>
                      <SelectItem value="notification_alert">Notification & Alert</SelectItem>
                      <SelectItem value="internal">Internal Control</SelectItem>
                    </>
                  )}
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
            <div>
              <Label htmlFor="configSchema">Configuration Schema (JSON)</Label>
              <Textarea
                id="configSchema"
                value={JSON.stringify(formData.configSchema, null, 2)}
                onChange={(e) => {
                  try {
                    const parsed = JSON.parse(e.target.value);
                    setFormData({ ...formData, configSchema: parsed });
                  } catch (err) {
                    // Invalid JSON, keep the string value for now
                  }
                }}
                placeholder='{"fields": [{"name": "fieldName", "label": "Field Label", "type": "text", "required": false}]}'
                className="font-mono text-sm"
                rows={6}
                data-testid="textarea-config-schema"
              />
              <p className="text-xs text-gray-500 mt-1">
                Define configuration fields that users can set when using this trigger in workflows
              </p>
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
                  setEditingAction(null);
                  resetForm();
                }}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={activeTab === "triggers" ? 
                  (createTriggerMutation.isPending || updateTriggerMutation.isPending) :
                  (createActionMutation.isPending || updateActionMutation.isPending)
                }
                data-testid={activeTab === "triggers" ? "button-save-trigger" : "button-save-action"}
              >
                {activeTab === "triggers" ? 
                  (editingTrigger ? "Update" : "Create") + " Trigger" :
                  (editingAction ? "Update" : "Create") + " Action"
                }
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog for Triggers */}
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

      {/* Delete Confirmation Dialog for Actions */}
      <AlertDialog open={!!deletingAction} onOpenChange={() => setDeletingAction(null)}>
        <AlertDialogContent data-testid="dialog-delete-action-confirmation">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Delete Automation Action
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the action "{deletingAction?.name}"? 
              This action cannot be undone and may affect existing workflows.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-action">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingAction && deleteActionMutation.mutate(deletingAction.id)}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteActionMutation.isPending}
              data-testid="button-confirm-delete-action"
            >
              Delete Action
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}